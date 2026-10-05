// Read-only Devnet readiness check. No key files, airdrops or transactions; it only reads public accounts.
// Usage: node scripts/devnet_readiness.mjs <payer-public-key> [quote-mint] [--local]
//   --local checks a local test validator at http://127.0.0.1:8899 instead of Devnet (rehearsal only).
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {web3} from '../../mobile/deps.mjs';

const DEVNET='EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
const LOADER=new web3.PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
const MANIFEST=new web3.PublicKey('MNFSTqtC93rEfYHB6hF82sKdZpUDFWkViLByLd1k1Ms');
const TOKEN_METADATA=new web3.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const PROGRAM=new web3.PublicKey('HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv');
const args=process.argv.slice(2);const local=args.includes('--local');const [payerArg,quoteArg]=args.filter(a=>!a.startsWith('--'));
if(!payerArg)throw Error('usage: node scripts/devnet_readiness.mjs <payer-public-key> [quote-mint] [--local]');
const c=new web3.Connection(local?'http://127.0.0.1:8899':'https://api.devnet.solana.com','confirmed');
const genesis=await c.getGenesisHash();if(!local&&genesis!==DEVNET)throw Error('Not Devnet');
const sha=b=>createHash('sha256').update(b).digest('hex');
const elf=readFileSync(new URL('../heli_core_v20.so',import.meta.url));
const vendored=readFileSync(new URL('../../manifest-integration/vendor-manifest/manifest-release-v3.0.24.so',import.meta.url));
const payer=new web3.PublicKey(payerArg);
// Upgradeable program: program account -> program data (u32 3, u64 slot, option authority, ELF bytes).
async function programInfo(id){
 const p=await c.getAccountInfo(id);if(!p)return {present:false};
 const out={present:true,executable:p.executable,loader:p.owner.toBase58()};
 if(!p.owner.equals(LOADER))return out;
 const dataAddress=new web3.PublicKey(p.data.subarray(4,36));const d=(await c.getAccountInfo(dataAddress))?.data;if(!d)return {...out,programData:'missing'};
 const bytes=d.subarray(45);let end=bytes.length;while(end>0&&bytes[end-1]===0)end--;
 return {...out,lastDeploySlot:Number(d.readBigUInt64LE(4)),upgradeAuthority:d[12]===1?new web3.PublicKey(d.subarray(13,45)).toBase58():null,
  elfBytesWithoutPadding:end,sbpfFlags:bytes.length>=52?bytes.readUInt32LE(48):null,sha256OfFirstVendoredLength:sha(bytes.subarray(0,vendored.length))};
}
const [balance,heli,manifest,metaplex,bufferRent,programDataRent,programRent,quote]=await Promise.all([
 c.getBalance(payer),c.getAccountInfo(PROGRAM),programInfo(MANIFEST),programInfo(TOKEN_METADATA),
 c.getMinimumBalanceForRentExemption(elf.length+37),c.getMinimumBalanceForRentExemption(elf.length+45),c.getMinimumBalanceForRentExemption(36),
 quoteArg?c.getParsedAccountInfo(new web3.PublicKey(quoteArg)):null]);
const peak=(bufferRent+programDataRent+programRent)/1e9;
const manifestMatches=manifest.present&&manifest.sha256OfFirstVendoredLength===sha(vendored);
const report={checkedAt:new Date().toISOString(),cluster:local?'local test validator':'devnet',payer:payer.toBase58(),payerBalanceSol:balance/1e9,
 program:PROGRAM.toBase58(),programAlreadyDeployed:Boolean(heli?.executable),elfBytes:elf.length,elfSha256:sha(elf),
 minimumProgramRentSol:(programDataRent+programRent)/1e9,conservativePeakUploadAndDeploySol:peak,enoughSolForUpload:balance/1e9>=peak+1,
 manifest:{...manifest,vendoredSha256:sha(vendored),vendoredBytes:vendored.length,vendoredSbpfFlags:vendored.readUInt32LE(48),sameAsTestedBinary:manifestMatches},
 metaplex,quoteMint:quoteArg?{address:quoteArg,present:Boolean(quote?.value),decimals:quote?.value?.data?.parsed?.info?.decimals??null}:'not given',
 note:'Read-only. The upload estimate excludes fees and state setup (a few SOL). The Manifest binary used in all local tests is the vendored v3.0.24 build; if sameAsTestedBinary is false, the deployed Manifest differs and the layout dependency (review M4) must be re-checked before relying on Devnet results.'};
report.ready=report.enoughSolForUpload&&manifest.executable===true&&metaplex.executable===true&&manifestMatches&&(!quoteArg||(report.quoteMint.present&&report.quoteMint.decimals===6));
writeFileSync(new URL('../devnet-readiness.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
