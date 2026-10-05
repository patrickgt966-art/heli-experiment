// Devnet setup runner for the Charta program (DEPLOYMENT.md "Kurulum sırası" steps 2-14).
// Usage: node scripts/devnet_setup.mjs <setup.json> pre|post [--send]
//   pre : before the auction ends   (initialize ... open_auction, governance, Manifest market)
//   post: after the auction end time (finalize_auction, fee vaults, release seat, management)
// Without --send it only prints the plan. Every step is skipped when its account already exists, so a run that
// stopped halfway can simply be started again. Refuses any cluster other than Devnet or a local test validator.
// Program deployment itself (solana program deploy) and the upgrade-authority transfer stay manual (printed).
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {web3,spl} from '../../mobile/deps.mjs';
import {heliInstruction,decodeAccount} from '../../mobile/solana.mjs';

const DEVNET='EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
const LOADER=new web3.PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
const MANIFEST=new web3.PublicKey('MNFSTqtC93rEfYHB6hF82sKdZpUDFWkViLByLd1k1Ms');
const TOKEN_METADATA=new web3.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const TOKEN=spl.TOKEN_PROGRAM_ID;
const TOKEN22=new web3.PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
const [file,phase,...flags]=process.argv.slice(2);
if(!file||!['pre','post'].includes(phase))throw Error('usage: node scripts/devnet_setup.mjs <setup.json> pre|post [--send]');
const send=flags.includes('--send');
const cfg=JSON.parse(readFileSync(file,'utf8'));
const idl=JSON.parse(readFileSync(new URL('../idl.json',import.meta.url)));
const elf=readFileSync(new URL('../heli_core_v20.so',import.meta.url));
const compiled=JSON.parse(readFileSync(new URL('../compiled-source.json',import.meta.url)));
if(createHash('sha256').update(elf).digest('hex')!==compiled.binary_sha256)throw Error('Local ELF does not match compiled-source.json');
const keypair=path=>web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path,'utf8'))));
const conn=new web3.Connection(cfg.rpcUrl,'confirmed');
const genesis=await conn.getGenesisHash();
if(genesis!==DEVNET&&!cfg.localValidator)throw Error('Refusing: not Devnet (genesis '+genesis+'). Set "localValidator": true only for a local test validator.');
if(cfg.localValidator&&!/^http:\/\/(127\.0\.0\.1|localhost)/.test(cfg.rpcUrl))throw Error('"localValidator" is only allowed with a localhost RPC URL');
const admin=keypair(cfg.adminKeyFile);
const program=new web3.PublicKey(cfg.program);const quoteMint=new web3.PublicKey(cfg.quoteMint);
const pda=(...s)=>web3.PublicKey.findProgramAddressSync(s.map(x=>typeof x==='string'?Buffer.from(x):x),program)[0];
const exists=async k=>Boolean(await conn.getAccountInfo(k,'confirmed'));
const read=async(k,type)=>{const a=await conn.getAccountInfo(k,'confirmed');return a?decodeAccount(idl,type,a.data):null;};
const mint=pda('mint'),config=pda('config');
const A={program,program_data:web3.PublicKey.findProgramAddressSync([program.toBuffer()],LOADER)[0],config,mint,quote_mint:quoteMint,admin:admin.publicKey,payer:admin.publicKey,
 token_program:TOKEN,system_program:web3.SystemProgram.programId,rent:web3.SYSVAR_RENT_PUBKEY,market_inventory:pda('market-inventory'),policy:pda('release-policy'),
 human:pda('vault',Buffer.from([0])),founder:pda('vault',Buffer.from([3])),metadata:web3.PublicKey.findProgramAddressSync([Buffer.from('metadata'),TOKEN_METADATA.toBuffer(),mint.toBuffer()],TOKEN_METADATA)[0],
 token_metadata_program:TOKEN_METADATA,quote_escrow:pda('auction-quote'),sale_proceeds:pda('auction-proceeds'),auction:pda('opening-auction'),governance:pda('governance'),
 manifest_program:MANIFEST,manifest_base:pda('manifest-heli'),manifest_quote:pda('manifest-quote'),fee_base:pda('fee-base'),fee_quote:pda('fee-quote'),operations:pda('operations'),
 management_book:pda('management-book'),management_trader:pda('management-trader'),management_base:pda('management-base'),management_quote:pda('management-quote')};
const manifestTrader=pda('manifest-trader'),releaseTrader=pda('release-trader',Buffer.from([3]));
let steps=0;
async function run(name,{args={},accounts={},done,extra=[],signers=[]}={}){
 steps++;
 if(await done()){console.log(`  ✓ ${name} (already done)`);return;}
 const ix=heliInstruction(idl,program,name,args,{...A,...accounts});
 if(!send){console.log(`  → ${name} ${JSON.stringify(args,(k,v)=>typeof v==='bigint'?v.toString():v)}`);return 'planned';}
 const tx=new web3.Transaction().add(web3.ComputeBudgetProgram.setComputeUnitLimit({units:1_400_000}),...extra,ix);
 const sig=await web3.sendAndConfirmTransaction(conn,tx,[admin,...signers],{commitment:'confirmed'});
 console.log(`  ✔ ${name} ${sig}`);
}
const cfgNow=()=>read(config,'Config');
console.log(`Charta setup, phase ${phase}, ${send?'SENDING':'dry run (add --send to submit)'}; cluster ${genesis===DEVNET?'devnet':'local test validator'}`);
console.log(`program ${program.toBase58()}  admin ${admin.publicKey.toBase58()}  ELF ${compiled.binary_sha256.slice(0,12)}…`);
if(phase==='pre'){
 const now=Math.floor(Date.now()/1000);
 if(!(await exists(config))&&!(cfg.start>=now+7*86400&&cfg.start<=now+30*86400))throw Error('"start" must be 7-30 days from now (unix seconds)');
 await run('initialize',{args:{start:cfg.start},done:()=>exists(config)});
 await run('create_market_inventory',{done:()=>exists(A.market_inventory)});
 await run('initialize_release_policy',{args:{minimum_quote_depth:cfg.minimumQuoteDepth},done:()=>exists(A.policy)});
 await run('create_vault',{args:{kind:0},accounts:{vault:A.human},done:()=>exists(A.human)});
 await run('create_vault',{args:{kind:3},accounts:{vault:A.founder},done:()=>exists(A.founder)});
 await run('create_token_metadata',{args:cfg.metadata,done:()=>exists(A.metadata)});
 await run('genesis',{done:async()=>Boolean((await cfgNow())?.live)});
 await run('prepare_auction_quote',{done:()=>exists(A.quote_escrow)});
 await run('prepare_auction_proceeds',{done:()=>exists(A.sale_proceeds)});
 await run('open_auction',{args:{floor_quote_atoms_per_heli:cfg.auction.floor,tick_size:cfg.auction.tick},done:()=>exists(A.auction)});
 await run('initialize_governance',{args:{recovery:cfg.recovery},done:()=>exists(A.governance)});
 // Manifest market: a fresh 256-byte account owned by Manifest, initialised by Manifest's CreateMarket.
 const marketFile=cfg.marketKeyFile;
 if(!existsSync(marketFile)){if(!send){console.log(`  → (would create the Manifest market key file ${marketFile})`);for(const n of ['Manifest CreateMarket','create_manifest_base','create_manifest_quote','bind_manifest_market'])console.log(`  → ${n}`);steps+=4;}else writeFileSync(marketFile,JSON.stringify([...web3.Keypair.generate().secretKey]),{mode:0o600});}
 if(existsSync(marketFile)){
  const market=keypair(marketFile).publicKey;
  const bv=web3.PublicKey.findProgramAddressSync([Buffer.from('vault'),market.toBuffer(),mint.toBuffer()],MANIFEST)[0];
  const qv=web3.PublicKey.findProgramAddressSync([Buffer.from('vault'),market.toBuffer(),quoteMint.toBuffer()],MANIFEST)[0];
  steps++;
  if(await exists(market))console.log(`  ✓ Manifest market ${market.toBase58()} (already created)`);
  else if(!send)console.log(`  → Manifest CreateMarket ${market.toBase58()}`);
  else{
   const rent=await conn.getMinimumBalanceForRentExemption(256);
   const create=web3.SystemProgram.createAccount({fromPubkey:admin.publicKey,newAccountPubkey:market,lamports:rent,space:256,programId:MANIFEST});
   const init=new web3.TransactionInstruction({programId:MANIFEST,data:Buffer.from([0]),keys:[[admin.publicKey,1,1],[market,1,0],[web3.SystemProgram.programId,0,0],[mint,0,0],[quoteMint,0,0],[bv,1,0],[qv,1,0],[TOKEN,0,0],[TOKEN22,0,0]].map(([pubkey,w,s])=>({pubkey,isWritable:!!w,isSigner:!!s}))});
   const sig=await web3.sendAndConfirmTransaction(conn,new web3.Transaction().add(create,init),[admin,keypair(marketFile)],{commitment:'confirmed'});
   console.log(`  ✔ Manifest CreateMarket ${market.toBase58()} ${sig}`);
  }
  await run('create_manifest_base',{accounts:{trader:manifestTrader},done:()=>exists(A.manifest_base)});
  await run('create_manifest_quote',{accounts:{trader:manifestTrader},done:()=>exists(A.manifest_quote)});
  await run('bind_manifest_market',{args:{market_rent_lamports:cfg.marketRentLamports},accounts:{trader:manifestTrader,manifest_market:market},done:async()=>Boolean((await cfgNow())?.manifest_bound)});
 }
 console.log(`\nNext: wait until the auction ends (start ${new Date(cfg.start*1000).toISOString()}), then run phase "post".`);
}else{
 const c=await cfgNow();if(!c?.manifest_bound)throw Error('Run phase "pre" first');
 const market=new web3.PublicKey(c.manifest_market);
 if(Math.floor(Date.now()/1000)<Number(c.start)&&!cfg.localValidator)throw Error('The auction has not ended yet');
 await run('finalize_auction',{done:async()=>Boolean((await read(A.auction,'OpeningAuction'))?.finalized)});
 await run('create_fee_base',{done:()=>exists(A.fee_base)});
 await run('create_fee_quote',{done:()=>exists(A.fee_quote)});
 await run('initialize_fee_vaults',{args:{monthly_cap:cfg.feeVaults.monthlyCap,reserve:cfg.feeVaults.reserve,project_floor:cfg.feeVaults.projectFloor},done:()=>exists(A.operations)});
 await run('create_release_base',{args:{kind:3},accounts:{trader:releaseTrader,base:pda('release-base',Buffer.from([3]))},done:()=>exists(pda('release-base',Buffer.from([3])))});
 await run('create_release_quote',{args:{kind:3},accounts:{trader:releaseTrader,quote:pda('release-quote',Buffer.from([3]))},done:()=>exists(pda('release-quote',Buffer.from([3])))});
 await run('initialize_release_seat',{args:{kind:3,rent_lamports:cfg.releaseSeatRentLamports},accounts:{trader:releaseTrader},done:()=>exists(releaseTrader)});
 await run('create_management_base',{done:()=>exists(A.management_base)});
 await run('create_management_quote',{done:()=>exists(A.management_quote)});
 await run('initialize_management',{args:{rent_lamports:cfg.managementRentLamports},accounts:{manifest_market:market},done:()=>exists(A.management_book)});
 if(cfg.keeperConfigOut){
  const readiness=existsSync(new URL('../devnet-readiness.json',import.meta.url))?JSON.parse(readFileSync(new URL('../devnet-readiness.json',import.meta.url))):{};
  const keeper={program:program.toBase58(),rpcUrl:cfg.rpcUrl,keeperKeyFile:'LOCAL_DEDICATED_KEEPER_KEY_FILE',dailyCapLamports:50_000_000,reserveLamports:5_000_000,
   trust:{admin:admin.publicKey.toBase58(),heliUpgradeAuthority:cfg.recovery,manifestUpgradeAuthority:readiness.manifest?.upgradeAuthority??'SET_FROM_devnet_readiness',
    manifestHash:readiness.manifest?.vendoredSha256??'SET_FROM_devnet_readiness',manifestLength:readiness.manifest?.vendoredBytes??335040}};
  if(send)writeFileSync(cfg.keeperConfigOut,JSON.stringify(keeper,null,1)+'\n');console.log(`  ${send?'✔ wrote':'→ would write'} keeper config ${cfg.keeperConfigOut} (heliUpgradeAuthority = recovery key, after step 15)`);
 }
 console.log(`\nManual steps left (DEPLOYMENT 15-16):\n  solana program set-upgrade-authority ${program.toBase58()} --new-upgrade-authority <RECOVERY_KEY.json> --url ${cfg.rpcUrl}\n  then start the keeper with the config above and its own funded keeper key.`);
}
console.log(`\n${steps} steps checked.`);
