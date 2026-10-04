// Read-only public Devnet check. No key files, airdrops or transactions.
import {Connection,PublicKey} from '../../solana/node_modules/@solana/web3.js/lib/index.cjs.js';
import {stat,writeFile} from 'node:fs/promises';
const c=new Connection('https://api.devnet.solana.com','confirmed');
const wallet=new PublicKey('5rYen19dNmVAPf4664KhxWdLNEc4ZncScYFhe3V2ngYq');
const program=new PublicKey('HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv');
const genesis=await c.getGenesisHash();if(genesis!=='EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG')throw Error('Not Devnet');
const bytes=(await stat(new URL('../heli_core_v20.so',import.meta.url))).size;
const [balance,account,bufferRent,programDataRent,programRent]=await Promise.all([c.getBalance(wallet),c.getAccountInfo(program),c.getMinimumBalanceForRentExemption(bytes+37),c.getMinimumBalanceForRentExemption(bytes+45),c.getMinimumBalanceForRentExemption(36)]);
const report={checkedAt:new Date().toISOString(),cluster:'devnet',wallet:wallet.toBase58(),balanceSol:balance/1e9,program:program.toBase58(),programExecutable:account?.executable??false,binaryBytes:bytes,bufferRentSol:bufferRent/1e9,programDataRentSol:programDataRent/1e9,programAccountRentSol:programRent/1e9,minimumProgramRentSol:(programDataRent+programRent)/1e9,conservativePeakUploadAndDeploySol:(bufferRent+programDataRent+programRent)/1e9,note:'Exact-length upgradeable loader estimate; excludes transaction fees, state setup and additional allocation. Deposit is test SOL.'};
await writeFile(new URL('../devnet-readiness.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
