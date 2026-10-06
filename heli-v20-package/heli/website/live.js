import * as D from './dashboard-core.js';
const web3 = window.solanaWeb3, cfg = window.CHARTA_CONFIG ?? {};
const $ = id => document.getElementById(id);
const UNIT = 1_000_000n, TOKEN = new web3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), ATA = new web3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { maximumFractionDigits: d });
const tok = a => `${fmt(Number(a) / 1e6, 2)} CHTA`;
let conn, idl, program, decimals = 6, wallet = null, state = null;
const usdc = a => `${fmt(Number(a) / 10 ** decimals, 2)} USDC`;
const key = b => new web3.PublicKey(b);
const short = k => { const s = (k instanceof web3.PublicKey ? k : key(k)).toBase58(); return s.slice(0, 4) + '…' + s.slice(-4); };
const pda = (...seeds) => web3.PublicKey.findProgramAddressSync(seeds.map(s => typeof s === 'string' ? new TextEncoder().encode(s) : s), program)[0];
const ata = (owner, mint) => web3.PublicKey.findProgramAddressSync([owner.toBytes(), TOKEN.toBytes(), mint.toBytes()], ATA)[0];
const tokenAmount = info => info ? new DataView(info.data.buffer, info.data.byteOffset).getBigUint64(64, true) : null;
const date = t => new Date(Number(t) * 1000).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
function set(id, text) { $(id).textContent = text; }
function notLive(text) { const n = $('not-live'); n.textContent = text; n.hidden = false; }

async function refresh() {
  const now = Math.floor(Date.now() / 1000);
  const config = pda('config'), mintKey = pda('mint');
  const names = { config, mint: mintKey, vault0: pda('vault', new Uint8Array([0])), vault3: pda('vault', new Uint8Array([3])), inventory: pda('market-inventory'),
    reserve: pda('auction-proceeds'), feeQuote: pda('fee-quote'), operations: pda('operations'), policy: pda('release-policy'), governance: pda('governance'), auction: pda('opening-auction') };
  const infos = await conn.getMultipleAccountsInfo(Object.values(names)); const acc = Object.fromEntries(Object.keys(names).map((k, i) => [k, infos[i]]));
  if (!acc.config) { notLive('The program has not been set up on this network yet.'); return; }
  const c = await D.decode(idl, 'Config', acc.config.data);
  const quote = await conn.getAccountInfo(key(c.quoteMint)); decimals = quote ? quote.data[44] : 6;
  const supply = acc.mint ? new DataView(acc.mint.data.buffer, acc.mint.data.byteOffset).getBigUint64(36, true) : 0n;
  const mintAuthority = acc.mint && acc.mint.data[0] === 1;
  const circulating = supply - c.stocks[0] - c.stocks[3] - c.marketRemaining;
  const month = c.lastSettledEpoch; const epochKey = n => pda('epoch', new Uint8Array([n & 255, n >> 8]));
  // A month's cap is fixed when it settles (market_release.rs), so show the last settled month; the open one reads 0.
  const [ep] = month > 0 ? await conn.getMultipleAccountsInfo([epochKey(month)]) : [null]; const epoch = ep ? await D.decode(idl, 'Epoch', ep.data) : null;
  set('s-supply', tok(supply)); set('s-reserve', tok(c.stocks[0])); set('s-mgmt', tok(c.stocks[3])); set('s-inventory', tok(c.marketRemaining));
  set('s-circ', tok(circulating)); set('s-mint', mintAuthority ? 'Present (before genesis)' : 'Revoked: no one can mint'); set('month-pill', `Month ${month} of 720`);
  set('s-next', c.closed ? 'Closed after 60 years' : date(D.boundary(Number(c.start), month + 1)));
  set('s-cap', epoch ? `${tok(epoch.capacity)} cap; ${tok(epoch.humanBudget)} released for sale` : 'Set when the first month closes');
  set('pause-pill', c.paused ? 'Paused' : 'Active');
  const reserve = tokenAmount(acc.reserve) ?? 0n;
  set('t-reserve', usdc(reserve)); set('t-floor', c.projectFloor ? usdc(c.projectFloor) : 'Set after the auction');
  set('t-donations', acc.feeQuote ? usdc(tokenAmount(acc.feeQuote)) : 'Not set up yet');
  if (acc.operations) {
    const o = await D.decode(idl, 'Operations', acc.operations.data);
    const t = D.treasury({ reserve, revenueTotal: c.revenueTotal, revenueSpent: o.revenueSpent, outDays: o.outDays, fixDays: o.fixDays, outDay: o.outDay, decimals, now });
    set('t-revenue', usdc(t.unspent)); set('t-share', `${usdc(t.shareUsed)} of ${usdc(t.shareLimit)}`); set('t-fixed', `${usdc(t.fixedUsed)} of ${usdc(t.fixedLimit)}`);
  } else { set('t-revenue', usdc(c.revenueTotal)); set('t-share', 'Not set up yet'); set('t-fixed', 'Not set up yet'); }
  // Expenses: every Expense account of the program (8 + 123 bytes).
  const expenses = (await conn.getProgramAccounts(program, { filters: [{ dataSize: 131 }] }));
  const rows = [];
  for (const e of expenses) { try { rows.push(await D.decode(idl, 'Expense', e.account.data)); } catch {} }
  rows.sort((a, b) => Number(b.nonce - a.nonce));
  $('exp-table').tBodies[0].innerHTML = rows.map(e => `<tr><td>${e.nonce}</td><td>${e.fixed ? 'Fixed technical cost' : 'Other'}</td><td>${usdc(e.amount)}</td><td>${short(e.destination)}</td><td>${e.paid ? 'Paid' : e.cancelled ? 'Cancelled' : now >= Number(e.readyAt) ? 'Ready to pay' : `Waiting until ${date(e.readyAt)}`}</td></tr>`).join('') || '<tr><td colspan="5">No expenses yet.</td></tr>';
  if (acc.policy) {
    const p = await D.decode(idl, 'ReleasePolicy', acc.policy.data), ref = D.reference(p, now);
    set('k-ref', ref === null ? 'Not available (needs 24 hourly samples of outside bids)' : `${usdc(ref)} per CHTA`);
    set('k-last', p.lastReference ? `${usdc(p.lastReference)} at ${date(p.lastReferenceTime)}` : 'None yet'); set('k-depth', usdc(p.minimumQuoteDepth));
  }
  set('k-market', c.manifestBound ? key(c.manifestMarket).toBase58() : 'Not bound yet');
  set('g-admin', key(c.admin).toBase58()); set('g-program', program.toBase58());
  if (acc.governance) {
    const g = await D.decode(idl, 'Governance', acc.governance.data), none = k => k.every(x => x === 0);
    set('g-recovery', key(g.recovery).toBase58());
    set('g-pending', !none(g.pendingAdmin) ? `New administrator ${short(g.pendingAdmin)} from ${date(g.readyAt)}` : !none(g.pendingRecovery) ? `New recovery key ${short(g.pendingRecovery)} from ${date(g.recoveryReadyAt)}` : 'None');
  } else { set('g-recovery', 'Not set yet'); set('g-pending', '–'); }
  state = { mint: mintKey, circulating, auction: acc.auction };
  set('updated', `Updated ${new Date().toLocaleTimeString()} · ${cfg.cluster}`);
  await mine();
}

async function mine() {
  if (!wallet || !state) return;
  $('mine').hidden = false; set('m-wallet', wallet.toBase58());
  const info = await conn.getAccountInfo(ata(wallet, state.mint)); const bal = tokenAmount(info) ?? 0n;
  set('m-balance', tok(bal));
  set('m-share', state.circulating > 0n ? `${(Number(bal) / Number(state.circulating) * 100).toFixed(4)} %` : '–');
  const bid = await conn.getAccountInfo(pda('auction-bid', wallet.toBytes()));
  if (!bid) set('m-auction', 'No bid'); else { const b = await D.decode(idl, 'OpeningBid', bid.data); set('m-auction', b.claimed ? 'Bid claimed' : b.active ? `Active bid: ${fmt(b.quantityHeli)} CHTA (see the auction page)` : 'Cancelled'); }
}

async function connect() {
  const provider = window.phantom?.solana ?? window.solflare ?? window.solana;
  if (!provider) { set('wallet-hint', 'No Solana wallet found in this browser.'); return; }
  try { const r = await provider.connect(); wallet = new web3.PublicKey((r?.publicKey ?? provider.publicKey).toString()); } catch (e) { set('wallet-hint', String(e?.message ?? e)); return; }
  $('connect').hidden = true; set('wallet-pill', 'Connected'); await mine();
}

(async () => {
  $('connect').addEventListener('click', connect);
  if (!cfg.programId) { notLive('Live data starts when the program is deployed. Until then this page shows nothing, by design: no figure here comes from anywhere but the chain.'); $('connect').disabled = true; return; }
  try {
    idl = await (await fetch('idl.json')).json(); program = new web3.PublicKey(cfg.programId); conn = new web3.Connection(cfg.rpcUrl, 'confirmed');
    await refresh(); setInterval(() => refresh().catch(() => set('updated', 'Reconnecting…')), (cfg.refreshSeconds ?? 10) * 1000);
  } catch (e) { notLive(`Could not read the chain: ${e?.message ?? e}`); }
})();
