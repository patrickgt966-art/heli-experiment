import * as core from './auction-core.js';
const web3 = window.solanaWeb3, cfg = window.CHARTA_CONFIG ?? {};
const $ = id => document.getElementById(id);
const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { maximumFractionDigits: d });
const short = k => { const s = k.toBase58(); return s.slice(0, 4) + '…' + s.slice(-4); };
let conn, A, config, auction, decimals = 6, bids = [], wallet = null, provider = null, busy = false;
const usd = atoms => Number(atoms) / 10 ** decimals;

function notLive(text) { const n = $('not-live'); n.textContent = text; n.hidden = false; $('phase-label').textContent = 'NOT OPEN YET'; $('live-pill').textContent = 'Waiting'; }

async function load() {
  await core.ready();
  if (!cfg.programId) { notLive('The auction has not opened yet. Its address, dates and minimum price (planned: 0.0002 USDC per CHTA) will be published here before it starts.'); return false; }
  conn = new web3.Connection(cfg.rpcUrl, 'confirmed');
  A = core.addresses(web3, cfg.programId);
  const [c] = await conn.getMultipleAccountsInfo([A.config]);
  if (!c) { notLive('The program has not been set up on this network yet.'); return false; }
  config = core.decodeConfig(c.data);
  A = core.addresses(web3, cfg.programId, new web3.PublicKey(config.mint), new web3.PublicKey(config.quoteMint));
  const mint = await conn.getAccountInfo(A.quoteMint); decimals = mint ? mint.data[44] : 6;
  return true;
}

async function refresh() {
  const [a] = await conn.getMultipleAccountsInfo([A.auction]);
  if (!a) { notLive('The opening auction has not been opened yet.'); return; }
  auction = core.decodeAuction(a.data);
  const accounts = await conn.getProgramAccounts(A.program, { filters: [{ dataSize: 52 }] });
  bids = accounts.map(x => ({ address: x.pubkey, ...core.decodeBid(x.account.data) })).filter(b => b.owner);
  render();
}

function render() {
  const now = Math.floor(Date.now() / 1000), est = core.estimate(auction), phase = core.phase(auction, config, now);
  const shown = auction.finalized ? { ...est, price: auction.clearingPrice, tick: auction.clearingTick } : est;
  $('phase-label').textContent = { open: 'BIDDING OPEN', frozen: 'FINAL 5 MINUTES · NO CHANGES', ended: 'ENDED · AWAITING FINALIZATION', finalized: 'FINALIZED', paused: 'PAUSED' }[phase];
  $('est-price').innerHTML = `${usd(shown.price).toFixed(6).replace(/0+$/, '').replace(/\.$/, '')}<small> USDC</small>`;
  if (auction.finalized && auction.sold === 0n) $('est-price').textContent = '–';
  $('est-note').textContent = auction.finalized && auction.sold === 0n ? 'No bids were placed, so nothing was sold in the auction.' : auction.finalized ? 'Final clearing price. Everyone pays this price.' : est.full ? 'Estimated clearing price if the auction ended now (bids reach 5,000,000 CHTA).' : 'Bids are below 5,000,000 CHTA: everyone would pay the minimum price.';
  const left = Math.max(0, auction.end - FREEZE() - now);
  $('countdown').textContent = phase === 'open' ? `${Math.floor(left / 86400)}d ${Math.floor(left % 86400 / 3600)}h ${Math.floor(left % 3600 / 60)}m` : 'closed';
  const active = bids.filter(b => b.active);
  $('sum-demand').textContent = `${fmt(est.total)} CHTA`;
  $('sum-wallets').textContent = fmt(active.length);
  $('sum-floor').textContent = `${usd(auction.floor)} USDC`;
  $('sum-locked').textContent = `${fmt(usd(active.reduce((s, b) => s + b.quantity * core.priceAt(auction, b.tick), 0n)), 2)} USDC`;
  // Demand by level, highest first.
  let cum = 0n; const rows = [];
  for (let i = core.LEVELS - 1; i >= 0; i--) {
    const d = auction.demand[i]; if (!d) continue; cum += d;
    rows.push(`<tr${i === shown.tick && (est.full || auction.finalized) ? ' class="clearing-row"' : ''}><td>${usd(core.priceAt(auction, i))}</td><td>${fmt(d)}</td><td>${fmt(cum)}${cum >= core.OFFER && cum - d < core.OFFER ? ' ◂ 5M reached' : ''}</td></tr>`);
  }
  $('demand-table').tBodies[0].innerHTML = rows.join('') || '<tr><td colspan="3">No bids yet.</td></tr>';
  const sorted = [...bids].sort((x, y) => y.tick - x.tick || (y.quantity > x.quantity ? 1 : -1));
  $('bids-table').tBodies[0].innerHTML = sorted.map(b => {
    const owner = new web3.PublicKey(b.owner), mine = wallet && owner.equals(wallet);
    const status = core.bidStatus(auction, est, b);
    return `<tr${mine ? ' class="mine"' : ''}><td>${short(owner)}${mine ? ' (you)' : ''}</td><td>${b.active || b.claimed ? fmt(b.quantity) : '–'}</td><td>${usd(core.priceAt(auction, b.tick))}</td><td>${status}</td></tr>`;
  }).join('') || '<tr><td colspan="4">No bids yet.</td></tr>';
  $('updated').textContent = `Updated ${new Date().toLocaleTimeString()}`;
  renderWallet(phase, est);
}
const FREEZE = () => core.FREEZE_SECONDS;

async function renderWallet(phase, est) {
  if (!wallet) return;
  const mine = bids.find(b => new web3.PublicKey(b.owner).equals(wallet));
  $('w-address').textContent = short(wallet);
  $('w-bid').textContent = mine?.active ? `${fmt(mine.quantity)} CHTA at up to ${usd(core.priceAt(auction, mine.tick))} USDC` : mine?.claimed ? 'Claimed' : 'None';
  $('w-alloc').textContent = mine?.active ? `${fmt(core.allocation(auction.finalized ? { ...est, tick: auction.clearingTick, full: est.full, marginalAtoms: auction.marginalAtoms / 1_000_000n, marginalDemand: auction.marginalDemand } : est, mine), 2)} CHTA` : '–';
  const open = phase === 'open';
  $('bid-form').hidden = !open; $('place').textContent = mine?.active ? 'Replace my bid' : 'Place bid';
  $('cancel').hidden = !(open && mine?.active);
  $('claim').hidden = !(auction.finalized && mine?.active && !mine.claimed);
  if (!$('price').value) $('price').value = usd(auction.floor);
  preview();
  try { const b = await conn.getTokenAccountBalance(core.addresses(web3, cfg.programId, A.mint, A.quoteMint, wallet).bidderQuote); $('w-usdc').textContent = `${b.value.uiAmountString} USDC`; }
  catch { $('w-usdc').textContent = '0 USDC (no USDC account)'; }
}

function chosen() {
  const qty = BigInt(Math.floor(Number($('qty').value) || 0));
  const atoms = BigInt(Math.round(Number($('price').value) * 10 ** decimals));
  const tick = core.tickFor(auction, atoms);
  return { qty, tick };
}
function preview() {
  if (!auction) return;
  const { qty, tick } = chosen();
  if (tick === null) { $('bid-preview').textContent = `The minimum price is ${usd(auction.floor)} USDC.`; return; }
  const p = core.priceAt(auction, tick);
  $('bid-preview').textContent = qty > core.WALLET_CAP ? 'At most 250,000 CHTA per wallet.' : `Price level ${tick}: ${usd(p)} USDC (rounded down to a level). ${fmt(usd(qty * p), 2)} USDC will be locked until the end; you pay only the clearing price.`;
}

async function send(label, instructions) {
  if (busy) return; busy = true; const s = $('tx-status'); s.hidden = false; s.textContent = `${label}: confirm in your wallet…`;
  try {
    const tx = new web3.Transaction().add(...instructions); tx.feePayer = wallet;
    tx.recentBlockhash = (await conn.getLatestBlockhash('confirmed')).blockhash;
    const signed = await provider.signTransaction(tx);
    const sig = await conn.sendRawTransaction(signed.serialize());
    s.textContent = `${label}: sent, waiting for confirmation…`;
    await core.confirmOrThrow(conn, sig);
    s.textContent = `${label}: done. Transaction ${sig.slice(0, 8)}…`;
    await refresh();
  } catch (e) { s.textContent = `${label} failed: ${e?.onChain ? e.message : core.errorText(e)}`; refresh().catch(() => {}); }
  finally { busy = false; }
}
const mineNow = () => bids.find(b => new web3.PublicKey(b.owner).equals(wallet));
async function place(ev) {
  ev.preventDefault();
  const { qty, tick } = chosen();
  if (qty <= 0n || qty > core.WALLET_CAP || tick === null) { preview(); return; }
  const W = core.addresses(web3, cfg.programId, A.mint, A.quoteMint, wallet), mine = mineNow(), ixs = [];
  if (!mine) ixs.push(core.createBidIx(web3, W));
  if (mine?.active) ixs.push(core.cancelBidIx(web3, W));
  ixs.push(core.placeBidIx(web3, W, qty, tick));
  await send(mine?.active ? 'Replace bid' : 'Place bid', ixs);
}
async function cancel() { await send('Cancel bid', [core.cancelBidIx(web3, core.addresses(web3, cfg.programId, A.mint, A.quoteMint, wallet))]); }
async function claim() {
  const W = core.addresses(web3, cfg.programId, A.mint, A.quoteMint, wallet);
  await send('Claim', [core.createAtaIdempotentIx(web3, wallet, W.bidderToken, wallet, W.mint), core.claimIx(web3, W)]);
}
async function connect() {
  provider = window.phantom?.solana ?? window.solflare ?? window.solana;
  if (!provider) { $('wallet-hint').textContent = 'No Solana wallet found in this browser. Install Phantom or Solflare, or open this page in the wallet app.'; return; }
  try { const r = await provider.connect(); wallet = new web3.PublicKey((r?.publicKey ?? provider.publicKey).toString()); }
  catch (e) { $('wallet-hint').textContent = core.errorText(e); return; }
  $('connect').hidden = true; $('wallet-info').hidden = false; $('wallet-pill').textContent = 'Connected';
  if (auction) render();
}

(async () => {
  $('connect').addEventListener('click', connect); $('bid-form').addEventListener('submit', place);
  $('qty').addEventListener('input', preview); $('price').addEventListener('input', preview);
  $('cancel').addEventListener('click', cancel); $('claim').addEventListener('click', claim);
  try {
    if (!(await load())) { $('connect').disabled = true; return; }
    await refresh();
    setInterval(() => refresh().catch(() => { $('live-pill').textContent = 'Reconnecting'; }), (cfg.refreshSeconds ?? 10) * 1000);
    setInterval(() => auction && render(), 30_000);
  } catch (e) { notLive(`Could not read the chain: ${core.errorText(e)}`); }
})();
