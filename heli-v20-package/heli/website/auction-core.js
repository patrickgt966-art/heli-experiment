// Charta opening auction: account decoding, clearing estimate and instruction encoding.
// Pure functions (no DOM); the page passes in the @solana/web3.js namespace so this file also runs under Node tests.
// Mirrors heli/solana-v20/src/auction.rs: 256 price levels, uniform clearing price, 5,000,000 CHTA offered,
// at most 250,000 CHTA per wallet, no new bids or cancellations in the last 300 seconds.
export const OFFER = 5_000_000n;
export const WALLET_CAP = 250_000n;
export const LEVELS = 256;
export const FREEZE_SECONDS = 300;
export const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const ATA_PROGRAM = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
export const SYSTEM_PROGRAM = '11111111111111111111111111111111';

const utf8 = new TextEncoder();
async function discriminator(kind, name) {
  const hash = await globalThis.crypto.subtle.digest('SHA-256', utf8.encode(`${kind}:${name}`));
  return new Uint8Array(hash).slice(0, 8);
}
const same = (a, b) => a.length >= b.length && b.every((x, i) => a[i] === x);
const view = d => new DataView(d.buffer, d.byteOffset, d.byteLength);
const u64 = (d, o) => view(d).getBigUint64(o, true);
const i64 = (d, o) => view(d).getBigInt64(o, true);
const le64 = n => { const b = new Uint8Array(8); new DataView(b.buffer).setBigUint64(0, BigInt(n), true); return b; };
const le16 = n => { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, n, true); return b; };
const concat = (...parts) => { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out; };

export const DISC = {};
export async function ready() {
  if (DISC.ready) return;
  for (const [key, kind, name] of [['config', 'account', 'Config'], ['auction', 'account', 'OpeningAuction'], ['bid', 'account', 'OpeningBid'],
    ['create', 'global', 'create_auction_bid'], ['place', 'global', 'place_auction_bid'], ['cancel', 'global', 'cancel_auction_bid'], ['claim', 'global', 'claim_auction_bid']])
    DISC[key] = await discriminator(kind, name);
  DISC.ready = true;
}

// Config: admin, mint, quote_mint, start, stocks[4], bump, vault_mask, live, closed, paused, ...
export function decodeConfig(d) {
  if (!same(d, DISC.config)) throw Error('Not a Charta config account');
  return { mint: d.slice(40, 72), quoteMint: d.slice(72, 104), start: Number(i64(d, 104)), live: d[146] === 1, closed: d[147] === 1, paused: d[148] === 1 };
}
// OpeningAuction: floor, tick_size, end, clearing_price, sold_heli, finalized, demand: Vec<u64>, active_bids, pending_claims,
// reserved_atoms, clearing_tick, marginal_atoms, marginal_demand.
export function decodeAuction(d) {
  if (!same(d, DISC.auction)) throw Error('Not an opening auction account');
  const floor = u64(d, 8), tickSize = u64(d, 16), end = Number(i64(d, 24)), clearingPrice = u64(d, 32), sold = u64(d, 40), finalized = d[48] === 1;
  const n = view(d).getUint32(49, true); const demand = []; let o = 53;
  for (let i = 0; i < n; i++, o += 8) demand.push(u64(d, o));
  return { floor, tickSize, end, clearingPrice, sold, finalized, demand, activeBids: u64(d, o), pendingClaims: u64(d, o + 8), clearingTick: view(d).getUint16(o + 24, true),
    marginalAtoms: u64(d, o + 26), marginalDemand: u64(d, o + 34) };
}
// OpeningBid: owner, quantity_heli, tick, active, claimed (8 + 44 bytes).
export function decodeBid(d) {
  if (d.length !== 52 || !same(d, DISC.bid)) return null;
  return { owner: d.slice(8, 40), quantity: u64(d, 40), tick: view(d).getUint16(48, true), active: d[50] === 1, claimed: d[51] === 1 };
}

export const priceAt = (a, tick) => a.floor + a.tickSize * BigInt(tick);
export function tickFor(a, priceAtoms) {
  if (priceAtoms < a.floor) return null;
  const t = (priceAtoms - a.floor) / a.tickSize;
  return t > BigInt(LEVELS - 1) ? LEVELS - 1 : Number(t);
}

// Same algorithm as finalize(): the clearing level is the highest one at which demand from that level up reaches the
// offer; if total demand is below the offer every bid is filled at the floor (level 0).
export function estimate(a) {
  const total = a.demand.reduce((s, x) => s + x, 0n);
  if (total < OFFER) return { tick: 0, price: priceAt(a, 0), total, sold: total, marginalAtoms: 0n, marginalDemand: a.demand[0] ?? 0n, full: false };
  let above = 0n;
  for (let i = LEVELS - 1; i >= 0; i--) {
    const next = above + a.demand[i];
    if (next >= OFFER) return { tick: i, price: priceAt(a, i), total, sold: OFFER, marginalAtoms: OFFER - above, marginalDemand: a.demand[i], full: true };
    above = next;
  }
}
// Whole tokens a bid would receive at the estimate (marginal level pro rata, rounded down like the program).
export function allocation(est, bid) {
  if (!bid?.active) return 0;
  if (!est.full) return Number(bid.quantity);
  if (bid.tick < est.tick) return 0;
  if (bid.tick > est.tick) return Number(bid.quantity);
  return Number(est.marginalAtoms * bid.quantity * 1_000_000n / est.marginalDemand) / 1e6;
}
export function phase(a, cfg, now) {
  if (a.finalized) return 'finalized';
  if (cfg?.paused) return 'paused';
  if (now >= a.end) return 'ended';
  if (now >= a.end - FREEZE_SECONDS) return 'frozen';
  return 'open';
}

export function addresses(web3, programId, mint, quoteMint, bidder) {
  const program = new web3.PublicKey(programId);
  const pda = (...seeds) => web3.PublicKey.findProgramAddressSync(seeds, program)[0];
  const ata = (owner, m) => web3.PublicKey.findProgramAddressSync([owner.toBytes(), new web3.PublicKey(TOKEN_PROGRAM).toBytes(), m.toBytes()], new web3.PublicKey(ATA_PROGRAM))[0];
  const out = { program, config: pda(utf8.encode('config')), auction: pda(utf8.encode('opening-auction')), marketInventory: pda(utf8.encode('market-inventory')),
    quoteEscrow: pda(utf8.encode('auction-quote')), saleProceeds: pda(utf8.encode('auction-proceeds')) };
  if (mint) out.mint = new web3.PublicKey(mint);
  if (quoteMint) out.quoteMint = new web3.PublicKey(quoteMint);
  if (bidder) {
    out.bidder = new web3.PublicKey(bidder); out.bid = pda(utf8.encode('auction-bid'), out.bidder.toBytes());
    if (out.quoteMint) out.bidderQuote = ata(out.bidder, out.quoteMint);
    if (out.mint) out.bidderToken = ata(out.bidder, out.mint);
  }
  return out;
}
const meta = (pubkey, isWritable, isSigner = false) => ({ pubkey, isWritable, isSigner });
const ix = (web3, A, data, keys) => new web3.TransactionInstruction({ programId: A.program, data: globalThis.Buffer ? globalThis.Buffer.from(data) : data, keys });

// Account order follows the IDL (CreateAuctionBid, PlaceAuctionBid, ClaimAuctionBid in auction.rs).
export function createBidIx(web3, A) {
  return ix(web3, A, DISC.create, [meta(A.config, false), meta(A.auction, false), meta(A.bid, true), meta(A.bidder, false, true), meta(A.bidder, true, true), meta(new web3.PublicKey(SYSTEM_PROGRAM), false)]);
}
const bidKeys = (web3, A) => [meta(A.config, false), meta(A.auction, true), meta(A.bid, true), meta(A.quoteEscrow, true), meta(A.bidderQuote, true), meta(A.bidder, false, true), meta(new web3.PublicKey(TOKEN_PROGRAM), false)];
export function placeBidIx(web3, A, quantity, tick) {
  if (BigInt(quantity) <= 0n || BigInt(quantity) > WALLET_CAP) throw Error('Quantity must be between 1 and 250,000 CHTA');
  if (!Number.isInteger(tick) || tick < 0 || tick >= LEVELS) throw Error('Price level out of range');
  return ix(web3, A, concat(DISC.place, le64(quantity), le16(tick)), bidKeys(web3, A));
}
export function cancelBidIx(web3, A) { return ix(web3, A, DISC.cancel, bidKeys(web3, A)); }
export function claimIx(web3, A) {
  return ix(web3, A, DISC.claim, [meta(A.config, true), meta(A.auction, true), meta(A.bid, true), meta(A.marketInventory, true), meta(A.quoteEscrow, true), meta(A.saleProceeds, true),
    meta(A.bidderToken, true), meta(A.bidderQuote, true), meta(A.bidder, false, true), meta(new web3.PublicKey(TOKEN_PROGRAM), false)]);
}
// Associated token account for the bidder (no-op if it exists), so the claim has somewhere to deliver CHTA.
export function createAtaIdempotentIx(web3, payer, ata, owner, mint) {
  return new web3.TransactionInstruction({ programId: new web3.PublicKey(ATA_PROGRAM), data: globalThis.Buffer ? globalThis.Buffer.from([1]) : new Uint8Array([1]),
    keys: [meta(payer, true, true), meta(ata, true), meta(owner, false), meta(mint, false), meta(new web3.PublicKey(SYSTEM_PROGRAM), false), meta(new web3.PublicKey(TOKEN_PROGRAM), false)] });
}

// Status of one bid as the program settles it (auction.rs finalize/allocation). Below 5M of bids everyone is filled
// at the clearing level (0); above it, bids at the clearing level share the remainder pro rata.
export function bidStatus(a, est, b) {
  if (b.claimed) return 'claimed';
  if (!b.active) return 'cancelled';
  const full = a.finalized ? a.sold >= OFFER : est.full;
  if (!full) return a.finalized ? 'filled' : 'filled at minimum';
  const tick = a.finalized ? a.clearingTick : est.tick;
  if (b.tick > tick) return 'filled';
  if (b.tick < tick) return 'outbid';
  const whole = a.finalized ? a.marginalAtoms >= a.marginalDemand * 1_000_000n : est.marginalAtoms >= est.marginalDemand;
  return whole ? 'filled' : 'partly filled';
}

// A transaction that reached the chain but failed comes back from confirmTransaction as value.err, without throwing.
export async function confirmOrThrow(conn, sig) {
  const r = await conn.confirmTransaction(sig, 'confirmed');
  if (r?.value?.err) { const e = Error(`The transaction failed on chain and changed nothing (${JSON.stringify(r.value.err)}).`); e.onChain = r.value.err; throw e; }
  return sig;
}

export function errorText(e) {
  const logs = (e?.logs ?? e?.transactionLogs ?? []).join('\n') + '\n' + String(e?.message ?? e);
  const m = logs.match(/Error Message: ([^.\n]+)/);
  const known = [[/Quota exceeded/, 'Over the limit: at most 250,000 CHTA per wallet, and the price must be one of the 256 levels.'],
    [/Invalid calendar window|Invalid state/, 'This action is not open right now (bidding closes 5 minutes before the end; claims open after finalization).'],
    [/insufficient funds|0x1\b/, 'Not enough USDC (or SOL for fees) in this wallet.'], [/User rejected|rejected the request/i, 'Cancelled in the wallet.']];
  for (const [re, text] of known) if (re.test(logs)) return text;
  return m ? m[1] : String(e?.message ?? e).slice(0, 200);
}
