// Creates the Devnet test quote token for the Charta Devnet test: a 6-decimal SPL token whose on-chain name says it is a
// worthless test token ("TEST-USDC Devnet test, no value", at most 32 bytes for Metaplex), so no wallet or explorer can show it as USDC.
// Refuses any cluster other than Devnet or a local test chain. The authority key file stays outside the repository.
//   node scripts/devnet_test_quote.mjs <authority.json> [--rpc <URL>] [--send]
import { readFileSync } from 'node:fs';
import { web3, spl } from '../../mobile/deps.mjs';

const args = process.argv.slice(2), file = args.find(a => a.endsWith('.json')), send = args.includes('--send');
const rpc = args[args.indexOf('--rpc') + 1] && args.includes('--rpc') ? args[args.indexOf('--rpc') + 1] : 'https://api.devnet.solana.com';
if (!file) throw Error('usage: node scripts/devnet_test_quote.mjs <authority.json> [--rpc <URL>] [--send]');
const DEVNET = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG', METADATA = new web3.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
export const NAME = 'TEST-USDC Devnet test, no value', SYMBOL = 'TUSDC', URI = '';
const conn = new web3.Connection(rpc, 'confirmed');
const genesis = await conn.getGenesisHash();
if (genesis !== DEVNET && !/^http:\/\/(127\.0\.0\.1|localhost)/.test(rpc)) throw Error(`Refusing: not Devnet (genesis ${genesis})`);
const authority = web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(file, 'utf8'))));

// Metaplex CreateMetadataAccountV3 (instruction 33): DataV2 without creators, collection or uses; immutable.
const str = s => { const b = Buffer.from(s, 'utf8'), l = Buffer.alloc(4); l.writeUInt32LE(b.length); return Buffer.concat([l, b]); };
export function metadataIx(mint, auth, payer) {
  const metadata = web3.PublicKey.findProgramAddressSync([Buffer.from('metadata'), METADATA.toBuffer(), mint.toBuffer()], METADATA)[0];
  const data = Buffer.concat([Buffer.from([33]), str(NAME), str(SYMBOL), str(URI), Buffer.from([0, 0]), Buffer.from([0, 0, 0]), Buffer.from([0]), Buffer.from([0])]);
  return { metadata, ix: new web3.TransactionInstruction({ programId: METADATA, data, keys: [
    { pubkey: metadata, isSigner: false, isWritable: true }, { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: auth, isSigner: true, isWritable: false }, { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: auth, isSigner: true, isWritable: false }, { pubkey: web3.SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: web3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }] }) };
}

console.log(`cluster ${genesis === DEVNET ? 'devnet' : 'local test chain'}; authority ${authority.publicKey.toBase58()} (${(await conn.getBalance(authority.publicKey)) / 1e9} SOL)`);
console.log(`token: "${NAME}" / ${SYMBOL}, 6 decimals, metadata immutable`);
if (!send) { console.log('plan only; add --send to create it'); process.exit(0); }
const mint = await spl.createMint(conn, authority, authority.publicKey, null, 6);
const { metadata, ix } = metadataIx(mint, authority.publicKey, authority.publicKey);
const sig = await web3.sendAndConfirmTransaction(conn, new web3.Transaction().add(ix), [authority], { commitment: 'confirmed' });
console.log(JSON.stringify({ mint: mint.toBase58(), metadata: metadata.toBase58(), name: NAME, symbol: SYMBOL, decimals: 6, metadataSignature: sig }));
