// Holder map on the home page: one bubble per CHTA owner, read from the chain and redrawn as new buyers arrive.
// Before the program is deployed it shows a clearly labelled example instead.
import * as H from './holders-core.js';

const cfg = window.CHARTA_CONFIG ?? {};
const $ = id => document.getElementById(id);
const svg = $('holder-map');
const W = 900, HGT = 600, NS = 'http://www.w3.org/2000/svg', UNIT = 1e6;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { maximumFractionDigits: d });
const chta = a => Number(a) / UNIT;
const compact = a => { const v = chta(a); return v >= 1e6 ? `${fmt(v / 1e6, 2)}M` : v >= 1e3 ? `${fmt(v / 1e3, 1)}k` : fmt(v); };
const short = s => `${s.slice(0, 4)}…${s.slice(-4)}`;
const pct = (a, total) => total > 0n ? `${(Number(a) * 100 / Number(total)).toFixed(Number(a) * 100 / Number(total) < 0.1 ? 3 : 2)}%` : '–';

const texts = {
  reserve: { kicker: 'MONTHLY MARKET SUPPLY', copy: 'This locked reserve releases tokens into sale inventory after each month ends. No tokens are given away; buyers purchase these monthly tokens on the market.', rule: 'The monthly cap is approximately 0.402247% of released, unburned supply, starting from a 5 million base. First cap: about 20,112 CHTA. Management shares the same cap. Unsold inventory waits for buyers, with no monthly burn.' },
  treasury: { kicker: 'SALES & LIQUIDITY', copy: 'One manager can sell released treasury tokens and place funded buy and sell orders within a price band: sales at no less than 95% and reserve-funded bids at no more than 105% of the 24-hour market reference; orders expire after about 24 hours. Reserve-funded bids are capped at 10% of the reserve over any rolling 30 days. Sale proceeds return to the project reserve.', rule: 'New treasury releases are locked for the first 12 months. Sales and new liquidity inventory then share one capped release budget, at most 2% of resting bid depth per month.' },
  inventory: { kicker: 'OPENING AUCTION AND MARKET', copy: 'What is left of the 5 million launch base. Auction winners claim from here; the rest waits for buyers on the market. There is no free allocation, presale or private round.', rule: 'In the opening auction one wallet may bid for at most 250,000 CHTA (5% of the offer). Unsold inventory waits for buyers; it is not burned.' },
  project: { kicker: 'PROJECT ACCOUNT', copy: 'A token account controlled by the Charta program itself, not by a person.', rule: 'Program accounts move tokens only under the published rules.' },
  program: { kicker: 'HELD BY A PROGRAM', copy: 'Tokens held by another on-chain program, typically CHTA resting in sell orders on the order book.', rule: 'These tokens belong to the traders whose orders they back.' },
};

let links = [], linkCtx = null, linksAt = 0, mode = 'example', bubbles = [], total = H.TOTAL, nodes = [], selected = null, walletsOnly = false, partial = false, fresh = new Set(), frame = 0;

function el(name, attrs = {}, parent) { const e = document.createElementNS(NS, name); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); parent?.append(e); return e; }
function hue(id) { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 5; }
function nameOf(b) { return b.label ?? (b.kind === 'program' ? `Program ${short(b.owner)}` : `Wallet ${short(b.owner)}`); }

function draw() {
  svg.querySelector('.links')?.remove(); svg.querySelector('.bubbles')?.remove();
  const shownIds = new Set(nodes.map(n => n.id)), lg = el('g', { class: 'links' }, svg);
  for (const l of links) if (shownIds.has(l.a) && shownIds.has(l.b)) el('line', { 'data-a': l.a, 'data-b': l.b, class: 'link' }, lg).append(Object.assign(document.createElementNS(NS, 'title'), { textContent: `Direct transfers: ${l.count} · ${fmt(chta(l.amount))} CHTA` }));
  const g = el('g', { class: 'bubbles' }, svg);
  for (const n of nodes) {
    const cls = `hb kind-${n.kind}${n.kind === 'wallet' ? ` tone-${hue(n.owner)}` : ''}${fresh.has(n.id) ? ' is-new' : ''}${n.fresh && frame > 0 ? ' pop' : ''}${selected === n.id ? ' is-selected' : ''}`;
    const b = el('g', { class: cls, transform: `translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`, 'data-id': n.id }, g);
    el('title', {}, b).textContent = `${nameOf(n)} · ${fmt(chta(n.amount))} CHTA · ${pct(n.amount, total)}`;
    if (fresh.has(n.id)) el('circle', { r: (n.r + 5).toFixed(1), class: 'ring' }, b);
    el('circle', { r: n.r.toFixed(1) }, b);
    if (n.r >= 24) {
      const name = n.label ?? short(n.owner), value = `${compact(n.amount)} · ${pct(n.amount, total)}`;
      const nameSize = Math.min(24, n.r * 1.7 / (name.length * 0.56)), valueSize = Math.min(17, n.r * 1.7 / (value.length * 0.62));
      if (nameSize >= 8) el('text', { y: (-nameSize * 0.25).toFixed(1), class: 'hb-name', 'font-size': nameSize.toFixed(1) }, b).textContent = name;
      if (valueSize >= 7) el('text', { y: (valueSize * 1.15).toFixed(1), class: 'hb-value', 'font-size': valueSize.toFixed(1) }, b).textContent = value;
    }
    b.addEventListener('click', () => select(n.id));
  }
}

function move() {
  const byId = new Map(nodes.map(n => [n.id, n]));
  for (const g of svg.querySelectorAll('.hb')) { const n = byId.get(g.dataset.id); if (n) g.setAttribute('transform', `translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`); }
  for (const line of svg.querySelectorAll('.link')) { const a = byId.get(line.dataset.a), b = byId.get(line.dataset.b); if (!a || !b) continue;
    line.setAttribute('x1', a.x.toFixed(1)); line.setAttribute('y1', a.y.toFixed(1)); line.setAttribute('x2', b.x.toFixed(1)); line.setAttribute('y2', b.y.toFixed(1)); }
}

function fit() {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const n of nodes) { x0 = Math.min(x0, n.x - n.r); y0 = Math.min(y0, n.y - n.r); x1 = Math.max(x1, n.x + n.r); y1 = Math.max(y1, n.y + n.r); }
  if (!nodes.length) return;
  const pad = 14; svg.setAttribute('viewBox', `${(x0 - pad).toFixed(1)} ${(y0 - pad).toFixed(1)} ${(x1 - x0 + 2 * pad).toFixed(1)} ${(y1 - y0 + 2 * pad).toFixed(1)}`);
}

// Settle the final layout first (so the map can be framed), then glide every bubble from where it was.
function layout(animate) {
  const shown = walletsOnly ? bubbles.filter(b => !H.isVault(b) && b.kind !== 'program') : bubbles;
  const prev = new Map(nodes.map(n => [n.id, n]));
  nodes = H.initialNodes(shown.slice(0, 400), W, HGT, walletsOnly === layout.lastZoom ? prev : new Map());
  layout.lastZoom = walletsOnly;
  const start = nodes.map(n => [n.x, n.y]);
  H.settle(nodes, W, HGT, links); fit();
  if (!animate || reduce) { draw(); move(); return; }
  const end = nodes.map(n => [n.x, n.y]);
  nodes.forEach((n, i) => { [n.x, n.y] = start[i]; }); draw(); move();
  const t0 = performance.now(), tick = t => {
    const k = Math.min(1, (t - t0) / 1200), e = 1 - (1 - k) ** 3;
    nodes.forEach((n, i) => { n.x = start[i][0] + (end[i][0] - start[i][0]) * e; n.y = start[i][1] + (end[i][1] - start[i][1]) * e; });
    move(); if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function select(id) {
  selected = id;
  for (const g of svg.querySelectorAll('.hb')) g.classList.toggle('is-selected', g.dataset.id === id);
  for (const line of svg.querySelectorAll('.link')) line.classList.toggle('is-lit', line.dataset.a === id || line.dataset.b === id);
  for (const li of $('holder-list').querySelectorAll('button')) li.setAttribute('aria-pressed', String(li.dataset.id === id));
  const b = bubbles.find(x => x.id === id); if (!b) return;
  const t = texts[b.kind];
  $('allocation-detail-kicker').textContent = t ? t.kicker : `WALLET #${b.rank}`;
  $('allocation-detail-title').textContent = nameOf(b);
  $('allocation-detail-amount').textContent = compact(b.amount);
  $('allocation-detail-share').textContent = pct(b.amount, total);
  $('allocation-detail-copy').textContent = t ? t.copy : `Holds ${fmt(chta(b.amount))} CHTA, ${pct(b.amount, H.stats(bubbles).inWallets)} of all CHTA held in wallets. Rank ${b.rank} of ${H.stats(bubbles).wallets}.${linkText(b.id)}`;
  $('allocation-detail-rule').textContent = t ? t.rule : mode === 'example' ? 'Example wallet: a made-up address, shown before launch.' : 'Every wallet is public on the chain; this one is not identified with any person by the project.';
  $('treasury-composition').hidden = b.kind !== 'treasury';
  const link = $('holder-explorer');
  if (mode === 'live') { link.href = `https://explorer.solana.com/address/${b.kind === 'wallet' ? b.owner : b.address}${cfg.cluster === 'mainnet-beta' ? '' : `?cluster=${cfg.cluster ?? 'devnet'}`}`; link.hidden = false; } else link.hidden = true;
}

function linkText(id) {
  const mine = links.filter(l => l.a === id || l.b === id);
  return mine.length ? ` Linked by direct transfers to ${mine.length} other wallet${mine.length > 1 ? 's' : ''} (lines on the map).` : '';
}

function renderList() {
  const s = H.stats(bubbles);
  $('hs-wallets').textContent = fmt(s.wallets);
  $('hs-held').textContent = `${compact(s.inWallets)} CHTA`;
  $('hs-largest').textContent = s.wallets ? pct(s.largest, total) : '–';
  $('holder-zoom').disabled = s.wallets === 0;
  $('hs-new').textContent = mode === 'live' && renderList.hadHistory ? `+${fresh.size}` : '–';
  const top = bubbles.filter(b => b.kind === 'wallet').slice(0, 10);
  $('holder-list').replaceChildren(...top.map(b => {
    const li = document.createElement('li'), btn = document.createElement('button');
    btn.type = 'button'; btn.dataset.id = b.id; btn.setAttribute('aria-pressed', String(selected === b.id));
    const name = document.createElement('span'); name.textContent = `#${b.rank} ${short(b.owner)}`;
    const amt = document.createElement('b'); amt.textContent = `${compact(b.amount)} · ${pct(b.amount, total)}`;
    btn.append(name, amt); btn.addEventListener('click', () => select(b.id)); li.append(btn); return li;
  }));
  if (!top.length) { const li = document.createElement('li'); li.className = 'small'; li.textContent = 'No wallets hold CHTA yet. The first buyers appear here.'; $('holder-list').append(li); }
}

function remember() {
  if (mode !== 'live') return;
  try {
    const key = `charta-holders:${cfg.cluster}:${cfg.programId}`, now = bubbles.filter(b => b.kind === 'wallet').map(b => b.id);
    const old = JSON.parse(localStorage.getItem(key) ?? 'null');
    renderList.hadHistory = Array.isArray(old);
    if (renderList.hadHistory && !remember.done) { const seen = new Set(old); fresh = new Set(now.filter(id => !seen.has(id))); }
    if (!remember.done) localStorage.setItem(key, JSON.stringify(now.slice(0, 3000)));
    remember.done = true;
  } catch { renderList.hadHistory = false; }
}

function loadWeb3() {
  if (window.solanaWeb3) return Promise.resolve();
  return new Promise((ok, fail) => { const s = document.createElement('script'); s.src = 'vendor/solana-web3.iife.min.js'; s.onload = ok; s.onerror = () => fail(Error('could not load the Solana library')); document.head.append(s); });
}

async function liveAccounts() {
  await loadWeb3();
  const web3 = window.solanaWeb3, program = new web3.PublicKey(cfg.programId), conn = new web3.Connection(cfg.rpcUrl, 'confirmed');
  const TOKEN = new web3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  const pda = (...seeds) => web3.PublicKey.findProgramAddressSync(seeds.map(s => typeof s === 'string' ? new TextEncoder().encode(s) : s), program)[0].toBase58();
  const mint = new web3.PublicKey(pda('mint')), config = pda('config');
  if (!await conn.getAccountInfo(mint)) return null;
  let accounts;
  try {
    const res = await conn.getProgramAccounts(TOKEN, { filters: [{ dataSize: 165 }, { memcmp: { offset: 0, bytes: mint.toBase58() } }], dataSlice: { offset: 32, length: 40 } });
    accounts = res.map(({ pubkey, account }) => { const t = H.readTokenAccount(account.data, true); return { address: pubkey.toBase58(), owner: new web3.PublicKey(t.owner).toBase58(), amount: t.amount }; });
    partial = false;
  } catch {
    // Public RPC endpoints may refuse full scans; the 20 largest accounts still give a useful map.
    const top = (await conn.getTokenLargestAccounts(mint)).value, infos = await conn.getMultipleAccountsInfo(top.map(v => v.address));
    accounts = top.flatMap((v, i) => infos[i] ? [{ address: v.address.toBase58(), owner: new web3.PublicKey(H.readTokenAccount(infos[i].data).owner).toBase58(), amount: BigInt(v.amount) }] : []);
    partial = true;
  }
  const known = {
    byAddress: { [pda('vault', new Uint8Array([0]))]: { kind: 'reserve', label: 'Market release reserve' }, [pda('vault', new Uint8Array([3]))]: { kind: 'treasury', label: 'Management Treasury' }, [pda('market-inventory')]: { kind: 'inventory', label: 'Unsold launch inventory' } },
    byOwner: { [config]: { kind: 'project', label: 'Project account' } },
    isProgramOwned: o => { try { return !web3.PublicKey.isOnCurve(new web3.PublicKey(o).toBytes()); } catch { return false; } },
  };
  linkCtx = { conn, mint: mint.toBase58(), web3 };
  return { accounts, known };
}

// Direct transfers between the 30 largest wallets, from their 15 latest transactions each (at most 150
// transactions, cached for ten minutes per browser). Trades through the order book do not create lines.
async function loadLinks() {
  if (!linkCtx || Date.now() - linksAt < 600_000) return false;
  linksAt = Date.now();
  const key = `charta-links:${cfg.cluster}:${cfg.programId}`;
  try { const c = JSON.parse(localStorage.getItem(key) ?? 'null'); if (c && Date.now() - c.t < 600_000) { links = c.links.map(l => ({ ...l, amount: BigInt(l.amount) })); return true; } } catch {}
  const { conn, mint, web3 } = linkCtx, all = bubbles.filter(b => b.kind === 'wallet'), sigs = new Set();
  for (const w of all.slice(0, 30)) {
    try { for (const s of await conn.getSignaturesForAddress(new web3.PublicKey(w.address), { limit: 15 })) if (!s.err) sigs.add(s.signature); } catch {}
    if (sigs.size >= 150) break;
  }
  const list = [...sigs].slice(0, 150), txs = [];
  for (let i = 0; i < list.length; i += 4) txs.push(...await Promise.all(list.slice(i, i + 4).map(s => conn.getParsedTransaction(s, { maxSupportedTransactionVersion: 0 }).catch(() => null))));
  links = H.linksFromTransactions(txs, mint, new Set(all.map(b => b.owner)));
  try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), links: links.map(l => ({ ...l, amount: String(l.amount) })) })); } catch {}
  return true;
}

function show(accounts, known, animate) {
  bubbles = H.groupHolders(accounts, known);
  if (mode === 'example') links = H.exampleLinks(bubbles);
  const sum = bubbles.reduce((s, b) => s + b.amount, 0n);
  total = partial || sum === 0n ? H.TOTAL : sum;
  if (frame === 0) { walletsOnly = H.stats(bubbles).wallets >= 5; syncZoom(); }
  remember(); renderList(); layout(animate); frame++;
  if (!selected || !bubbles.some(b => b.id === selected)) select((bubbles.find(b => b.kind === 'wallet') ?? bubbles[0])?.id);
  else select(selected);
}

async function refreshLive(first) {
  try {
    const data = await liveAccounts();
    if (!data) { if (first) startExample('The program is set up but no CHTA exist yet. Until then this map shows an example.'); return; }
    mode = 'live'; $('holder-banner').hidden = !partial;
    if (partial) $('holder-banner').textContent = 'This network only returned the 20 largest accounts; smaller wallets are not shown.';
    $('holder-mode').textContent = 'Live'; $('holder-mode').className = 'pill';
    show(data.accounts, data.known, first);
    loadLinks().then(changed => { if (changed && links.length) { layout(true); if (selected) select(selected); } }).catch(() => {});
    $('holder-updated').textContent = `Updated ${new Date().toLocaleTimeString()} · ${cfg.cluster}`;
  } catch (e) { if (first) startExample(`Could not read the chain (${e?.message ?? e}); showing the example.`); else $('holder-updated').textContent = 'Reconnecting…'; }
}

function startExample(reason) {
  mode = 'example';
  $('holder-banner').textContent = reason; $('holder-banner').hidden = false;
  $('holder-mode').textContent = 'Example'; $('holder-mode').className = 'pill neutral';
  $('holder-updated').textContent = 'Made-up wallets, not real holders';
  show(H.exampleAccounts(), H.EXAMPLE_KNOWN, true);
}

function syncZoom() { $('holder-zoom').textContent = walletsOnly ? 'Show project vaults' : 'Wallets only'; }
$('holder-zoom').addEventListener('click', () => { walletsOnly = !walletsOnly; syncZoom(); layout(true); });

if (!cfg.programId) startExample('Example: the program is not deployed yet. These wallets are made up to show how the map will look; live holders replace them at launch.');
else { refreshLive(true); setInterval(() => refreshLive(false), Math.max(15, cfg.holderRefreshSeconds ?? 30) * 1000); }
