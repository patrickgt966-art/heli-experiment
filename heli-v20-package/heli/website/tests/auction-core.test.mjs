// The auction page's instruction encoding must match the IDL encoder used by the setup runner and keeper, and its
// clearing estimate must follow finalize() in auction.rs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {web3} from '../../mobile/deps.mjs';
import {heliInstruction} from '../../mobile/solana.mjs';
import * as core from '../auction-core.js';

const idl=JSON.parse(readFileSync(new URL('../../solana-v20/idl.json',import.meta.url)));
const PROGRAM='DZbsSEnZxsfQf1HejcLk63BEDNqzAMXPgVxTq97Bd2zG';
const mint=web3.Keypair.generate().publicKey,quote=web3.Keypair.generate().publicKey,bidder=web3.Keypair.generate().publicKey;
await core.ready();
const A=core.addresses(web3,PROGRAM,mint,quote,bidder);
const idlAccounts={config:A.config,auction:A.auction,bid:A.bid,bidder,account_payer:bidder,system_program:web3.SystemProgram.programId,quote_escrow:A.quoteEscrow,
 bidder_quote:A.bidderQuote,token_program:new web3.PublicKey(core.TOKEN_PROGRAM),market_inventory:A.marketInventory,sale_proceeds:A.saleProceeds,bidder_heli:A.bidderToken};
const same=(a,b)=>{assert.deepEqual(Buffer.from(a.data),Buffer.from(b.data));assert.equal(a.programId.toBase58(),b.programId.toBase58());
 assert.deepEqual(a.keys.map(k=>[k.pubkey.toBase58(),k.isWritable,k.isSigner]),b.keys.map(k=>[k.pubkey.toBase58(),k.isWritable,k.isSigner]));};

test('page addresses match the program PDAs and associated token accounts',()=>{
 const pda=s=>web3.PublicKey.findProgramAddressSync([Buffer.from(s)],new web3.PublicKey(PROGRAM))[0].toBase58();
 assert.equal(A.config.toBase58(),pda('config'));assert.equal(A.auction.toBase58(),pda('opening-auction'));assert.equal(A.quoteEscrow.toBase58(),pda('auction-quote'));
 assert.equal(A.bid.toBase58(),web3.PublicKey.findProgramAddressSync([Buffer.from('auction-bid'),bidder.toBuffer()],new web3.PublicKey(PROGRAM))[0].toBase58());
 const ata=web3.PublicKey.findProgramAddressSync([bidder.toBuffer(),new web3.PublicKey(core.TOKEN_PROGRAM).toBuffer(),quote.toBuffer()],new web3.PublicKey(core.ATA_PROGRAM))[0];
 assert.equal(A.bidderQuote.toBase58(),ata.toBase58());
});
test('create, place, cancel and claim encode exactly like the IDL encoder',()=>{
 same(core.createBidIx(web3,A),heliInstruction(idl,PROGRAM,'create_auction_bid',{},idlAccounts));
 same(core.placeBidIx(web3,A,250_000n,37),heliInstruction(idl,PROGRAM,'place_auction_bid',{quantity_heli:250000,tick:37},idlAccounts));
 same(core.cancelBidIx(web3,A),heliInstruction(idl,PROGRAM,'cancel_auction_bid',{},idlAccounts));
 same(core.claimIx(web3,A),heliInstruction(idl,PROGRAM,'claim_auction_bid',{},idlAccounts));
});
test('the page refuses quantities over the wallet cap and price levels out of range',()=>{
 assert.throws(()=>core.placeBidIx(web3,A,250_001n,0));assert.throws(()=>core.placeBidIx(web3,A,0n,0));assert.throws(()=>core.placeBidIx(web3,A,1n,256));
});

// Synthetic OpeningAuction account bytes in the program's Borsh layout.
function auctionBytes({floor=200n,tick=10n,end=1_800_000_000n,demand={},finalized=false}){
 const b=Buffer.alloc(8+8*5+1+4+256*8+8*3+2+16);core.DISC.auction.forEach((x,i)=>b[i]=x);
 b.writeBigUInt64LE(floor,8);b.writeBigUInt64LE(tick,16);b.writeBigInt64LE(end,24);b[48]=finalized?1:0;b.writeUInt32LE(256,49);
 for(const [t,q] of Object.entries(demand))b.writeBigUInt64LE(BigInt(q),53+8*Number(t));return b;
}
test('decode reads floor, tick, end and the 256 demand levels',()=>{
 const a=core.decodeAuction(auctionBytes({demand:{0:7,255:9}}));
 assert.equal(a.floor,200n);assert.equal(a.tickSize,10n);assert.equal(a.end,1_800_000_000);assert.equal(a.demand.length,256);assert.equal(a.demand[0],7n);assert.equal(a.demand[255],9n);
 assert.equal(core.priceAt(a,10),300n);assert.equal(core.tickFor(a,305n),10);assert.equal(core.tickFor(a,199n),null);
});
test('below 5M of bids everyone pays the minimum price',()=>{
 const e=core.estimate(core.decodeAuction(auctionBytes({demand:{0:1_000_000,20:2_750_000}})));
 assert.equal(e.tick,0);assert.equal(e.price,200n);assert.equal(e.full,false);assert.equal(e.total,3_750_000n);
});
test('the explained example: 2.5M at 0.0004, 2.5M at 0.0003, 2.5M at 0.00025 clears at 0.0003',()=>{
 const a=core.decodeAuction(auctionBytes({demand:{20:2_500_000,10:2_500_000,5:2_500_000}}));const e=core.estimate(a);
 assert.equal(e.tick,10);assert.equal(e.price,300n);assert.equal(e.full,true);
 assert.equal(core.allocation(e,{active:true,tick:20,quantity:250_000n}),250_000);assert.equal(core.allocation(e,{active:true,tick:5,quantity:250_000n}),0);
});
test('the marginal level is shared pro rata like the program (3M bid for the last 2.5M)',()=>{
 const a=core.decodeAuction(auctionBytes({demand:{20:2_500_000,10:3_000_000}}));const e=core.estimate(a);
 assert.equal(e.tick,10);assert.equal(e.marginalAtoms,2_500_000n);
 assert.equal(Math.floor(core.allocation(e,{active:true,tick:10,quantity:250_000n})),208_333);
});
test('phases: open, final five minutes, ended, finalized',()=>{
 const a=core.decodeAuction(auctionBytes({end:10_000n}));
 assert.equal(core.phase(a,{},9_699),'open');assert.equal(core.phase(a,{},9_700),'frozen');assert.equal(core.phase(a,{},10_000),'ended');
 assert.equal(core.phase(core.decodeAuction(auctionBytes({finalized:true})),{},0),'finalized');
});
test('bid status follows the program: an undersubscribed final auction fills every active bid (Codex finding)',()=>{
 const a=core.decodeAuction(auctionBytes({demand:{0:1_000_000,7:500_000}}));const est=core.estimate(a);
 const fin={...a,finalized:true,sold:1_500_000n,clearingTick:0,marginalAtoms:1_000_000n*1_000_000n,marginalDemand:1_000_000n};
 assert.equal(core.bidStatus(fin,est,{active:true,tick:0,quantity:250_000n}),'filled');
 assert.equal(core.bidStatus(fin,est,{active:true,tick:7,quantity:250_000n}),'filled');
 assert.equal(core.bidStatus(a,est,{active:true,tick:0,quantity:250_000n}),'filled at minimum');
 const b=core.decodeAuction(auctionBytes({demand:{20:2_500_000,10:3_000_000}}));const e2=core.estimate(b);
 const fin2={...b,finalized:true,sold:5_000_000n,clearingTick:10,marginalAtoms:2_500_000n*1_000_000n,marginalDemand:3_000_000n};
 assert.equal(core.bidStatus(fin2,e2,{active:true,tick:10,quantity:1n}),'partly filled');assert.equal(core.bidStatus(fin2,e2,{active:true,tick:20,quantity:1n}),'filled');
 assert.equal(core.bidStatus(fin2,e2,{active:true,tick:9,quantity:1n}),'outbid');
 assert.equal(core.bidStatus(fin2,e2,{active:false,claimed:true}),'claimed');assert.equal(core.bidStatus(fin2,e2,{active:false}),'cancelled');
 const exact={...fin2,marginalAtoms:3_000_000n*1_000_000n};assert.equal(core.bidStatus(exact,e2,{active:true,tick:10,quantity:1n}),'filled');
});
test('a transaction that landed but failed is reported as failed, not done (Codex finding, seen on a local validator)',async()=>{
 await assert.rejects(core.confirmOrThrow({confirmTransaction:async()=>({value:{err:{InstructionError:[0,{Custom:1}]}}})},'sig'),/failed on chain/);
 assert.equal(await core.confirmOrThrow({confirmTransaction:async()=>({value:{err:null}})},'sig'),'sig');
});
