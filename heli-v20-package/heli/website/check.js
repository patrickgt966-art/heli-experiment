// check.html: reads a token's mint, metadata and largest holdings from Solana mainnet and shows the rule card.
// Read-only: no wallet, no signature. Text from the chain (names, symbols) is only ever set as textContent.
import * as C from './check-core.js';
import { readProgram } from './verify-core.js';

const web3 = window.solanaWeb3, $ = id => document.getElementById(id);
// Mainnet through a provider that accepts browser requests, with the public endpoint as a fallback (it often refuses
// browsers with 403 or rate limits). A local test chain only when the page itself is served from this computer.
const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname), testRpc = local && new URLSearchParams(location.search).get('rpc');
const RPCS = testRpc ? [testRpc] : ['https://solana-rpc.publicnode.com', 'https://api.mainnet-beta.solana.com'];
const connections = RPCS.map(url => new web3.Connection(url, { commitment: 'confirmed', disableRetryOnRateLimit: true }));
const within = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(Error('timeout')), ms))]);
let conn = connections[0];
// Uses the first endpoint that answers, and keeps it for the following requests.
async function first(call) {
  let last;
  for (const c of [conn, ...connections.filter(x => x !== conn)]) {
    try { const r = await within(call(c), 12000); conn = c; return r; } catch (e) { last = e; }
  }
  throw last;
}
const ICON = { ok: '✓', warn: '~', bad: '!', info: 'i' };
// Charta has not launched yet: its card comes from the published program, not from a mint on mainnet.
const CHARTA = [
  { q: 'Can anyone mint more?', level: 'ok', a: 'No. The program switches minting off at launch, after the single genesis mint.', why: 'New supply only reaches the market through the published monthly rule, from tokens minted at launch.' },
  { q: 'Can anyone freeze or take your tokens?', level: 'ok', a: 'No. Charta has no freeze authority and no permanent delegate.', why: 'Your tokens move only when you sign.' },
  { q: 'Fees or extra rules on transfers?', level: 'ok', a: 'None. Charta uses the original token program, with no extensions.', why: 'Transfers work like any standard token.' },
  { q: 'Can the rules change?', level: 'warn', a: 'Until the independent audit, one offline upgrade key can still change Charta\'s program. After the audit it will be removed for good.', why: 'The upgrade key is separate from the administrator and the recovery key. Check it any time on the Verify page.' },
  { q: 'Can the name and logo change?', level: 'ok', a: 'No. The name, symbol and logo are written once and locked.', why: 'A locked name cannot be switched to imitate another project later.' },
  { q: 'Who holds the supply?', level: 'info', a: 'At launch: 5M through the public auction, 70M locked for the monthly rule, 15M locked for management, 10M burned.', why: 'The locked parts sit in program vaults, released only by the published rule. Live figures: Live data page.' },
];
const COMPARE = ['Can anyone mint more?', 'Can anyone freeze or take your tokens?', 'Fees or extra rules on transfers?', 'Can the rules change?'];
const LABEL = { 'Can anyone mint more?': 'Anyone can mint more', 'Can anyone freeze or take your tokens?': 'Anyone can freeze or take', 'Fees or extra rules on transfers?': 'Transfer fees or hooks', 'Can the rules change?': 'Rules can change' };
const WORD = { ok: 'No', warn: 'Partly', bad: 'Yes', info: '–' };

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
function message(text) { const m = $('check-msg'); m.textContent = text; m.hidden = !text; }

function render(rows, head) {
  $('r-avatar').textContent = (head.symbol || head.name || '?').slice(0, 2).toUpperCase();
  $('r-name').textContent = head.name || 'Unnamed token';
  $('r-addr').textContent = head.addr;
  $('r-tag').textContent = head.tag ?? '';
  const box = $('r-rows'); box.replaceChildren();
  for (const r of rows) {
    const row = el('div', 'check-q'), body = el('div');
    row.append(el('div', `check-ic ${r.level}`, ICON[r.level]), body);
    body.append(el('h3', null, r.q), el('p', 'check-ans', r.a));
    if (r.top10 !== undefined) {
      const bar = el('div', 'check-bar'), a = el('i', 'b1'), b = el('i', 'b2');
      a.style.width = `${Math.min(100, r.top1)}%`; b.style.width = `${Math.max(0, Math.min(100, r.top10) - Math.min(100, r.top1))}%`;
      bar.append(a, b); body.append(bar);
    }
    body.append(el('p', 'check-why', r.why)); box.append(row);
  }
  const cmp = $('r-compare'); cmp.replaceChildren(el('span'), el('span', 'h', (head.symbol || 'This').slice(0, 8)), el('span', 'h', 'CHTA'));
  for (const q of COMPARE) {
    const mine = rows.find(r => r.q === q), ours = CHARTA.find(r => r.q === q);
    cmp.append(el('span', null, LABEL[q]), el('b', mine?.level ?? 'info', WORD[mine?.level ?? 'info']), el('b', ours.level, WORD[ours.level]));
  }
  $('r-meta').textContent = head.meta ?? '';
  $('check-result').hidden = false; $('check-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function check(mint) {
  message('Reading from the chain…');
  try {
    const key = new web3.PublicKey(mint);
    const info = await first(c => c.getAccountInfo(key));
    if (!info) { message('Nothing exists at this address on Solana mainnet. Check that you copied the whole address.'); return; }
    const m = C.parseMint(info.data, info.owner.toBase58());
    if (!m.ok) { message(m.why); return; }
    const metaKey = web3.PublicKey.findProgramAddressSync([new TextEncoder().encode('metadata'), new web3.PublicKey(C.METADATA).toBytes(), key.toBytes()], new web3.PublicKey(C.METADATA))[0];
    const [metaInfo, largest, slot] = await Promise.all([
      within(conn.getAccountInfo(metaKey), 12000).catch(() => null),
      within(conn.getTokenLargestAccounts(key), 15000).then(r => r.value.map(v => BigInt(v.amount))).catch(() => null),
      within(conn.getSlot(), 8000).catch(() => null)]);
    let hook;
    if (m.ext.transferHook?.program) {
      const p = await conn.getAccountInfo(new web3.PublicKey(m.ext.transferHook.program)).catch(() => null);
      const P = p && readProgram({ ...p, ownerBase58: p.owner.toBase58() });
      hook = P?.ok ? C.programAuthority((await conn.getAccountInfo(new web3.PublicKey(P.programData)))?.data) : undefined;
    }
    const meta = m.ext.metadata ?? C.parseMetaplex(metaInfo?.data);
    message('');
    render(C.card(m, meta, largest, hook), { name: meta?.name, symbol: meta?.symbol, addr: mint, tag: m.program === 'token-2022' ? 'Token-2022' : 'SPL token',
      meta: `Read from Solana mainnet${slot ? ` · slot ${slot.toLocaleString('en-US')}` : ''}. Every line can be checked on any explorer.` });
    history.replaceState(null, '', `?token=${mint}`);
  } catch (e) {
    message('Solana did not answer just now (the free public connection is busy or refused the request). Please try again in a moment.');
  }
}

$('check-form').addEventListener('submit', e => {
  e.preventDefault(); const v = $('check-input').value.trim();
  if (!v) return;
  if (!C.isAddress(v)) { message('Paste the token\'s address, not its name. Anyone can give a token any name, so names are never searched here; copy the address from the project\'s own site.'); return; }
  check(v);
});
function showCharta(e) {
  e?.preventDefault(); message('');
  render(CHARTA, { name: 'Charta', symbol: 'CHTA', addr: 'Not launched yet · from the published program', tag: 'Preview', meta: 'Charta is not on mainnet yet; this card follows its published code. After launch it is read from the chain like any other token.' });
}
for (const b of document.querySelectorAll('.check-try .chip')) b.addEventListener('click', () => {
  if (b.dataset.charta) return showCharta();
  $('check-input').value = b.dataset.mint; check(b.dataset.mint);
});
$('charta-card').addEventListener('click', showCharta);
$('r-copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(location.href); $('r-copy').textContent = 'Link copied'; } catch {} });
const start = new URLSearchParams(location.search).get('token');
if (start && C.isAddress(start)) { $('check-input').value = start; check(start); }
