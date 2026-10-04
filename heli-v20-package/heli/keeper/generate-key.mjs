import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';import {web3} from '../mobile/deps.mjs';
const directory=fileURLToPath(new URL('../solana/.keys/',import.meta.url)),path=directory+'heli-keeper-devnet.json';mkdirSync(directory,{recursive:true});
const wallet=existsSync(path)?web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path)))):web3.Keypair.generate();
if(!existsSync(path))writeFileSync(path,JSON.stringify(Array.from(wallet.secretKey)),{flag:'wx',mode:0o600});
console.log(JSON.stringify({publicKey:wallet.publicKey.toBase58(),keyFile:path,purpose:'Local Devnet maintenance fee wallet; no authority or funds assigned'}));
