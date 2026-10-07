import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../check-core.js';

const K = n => new Uint8Array(32).fill(n);           // a synthetic public key
const k58 = n => C.base58(K(n));
function mint({ mintAuth, freeze, supply = 1_000_000n, decimals = 6, ext = [] } = {}) {
  const base = new Uint8Array(82), v = new DataView(base.buffer);
  if (mintAuth) { v.setUint32(0, 1, true); base.set(K(mintAuth), 4); }
  v.setBigUint64(36, supply, true); base[44] = decimals; base[45] = 1;
  if (freeze) { v.setUint32(46, 1, true); base.set(K(freeze), 50); }
  if (!ext.length) return base;
  const tlv = ext.map(([type, body]) => { const b = new Uint8Array(4 + body.length), w = new DataView(b.buffer); w.setUint16(0, type, true); w.setUint16(2, body.length, true); b.set(body, 4); return b; });
  const out = new Uint8Array(166 + tlv.reduce((a, b) => a + b.length, 0)); out.set(base); out[165] = 1;
  let o = 166; for (const b of tlv) { out.set(b, o); o += b.length; } return out;
}
function fee(authority, bps) {
  const b = new Uint8Array(108), v = new DataView(b.buffer); if (authority) b.set(K(authority), 0);
  v.setUint16(72 + 16, bps, true); v.setUint16(90 + 16, bps, true); return b;
}
const str = s => { const e = new TextEncoder().encode(s), b = new Uint8Array(4 + e.length); new DataView(b.buffer).setUint32(0, e.length, true); b.set(e, 4); return b; };
const cat = (...p) => { const o = new Uint8Array(p.reduce((a, b) => a + b.length, 0)); let i = 0; for (const x of p) { o.set(x, i); i += x.length; } return o; };
const rowsOf = rows => Object.fromEntries(rows.map(r => [r.q, r]));

test('addresses only: names and malformed text are refused before anything is read', () => {
  assert.ok(C.isAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'));
  assert.ok(C.isAddress('11111111111111111111111111111111'));
  for (const s of ['Auton', 'USDC', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v0', 'O0Il' + 'a'.repeat(40)]) assert.ok(!C.isAddress(s), s);
  assert.equal(C.base58(new Uint8Array(32)), '11111111111111111111111111111111');
});

test('not a mint: wallets, other programs and token holdings are explained, not read as tokens', () => {
  assert.match(C.parseMint(new Uint8Array(82), '11111111111111111111111111111111').why, /not a token/);
  assert.match(C.parseMint(new Uint8Array(82), C.TOKEN).why, /not an initialised/);
  const holding = mint({ ext: [[1, fee(0, 0)]] }); holding[165] = 2;
  assert.match(C.parseMint(holding, C.TOKEN_2022).why, /token holding/);
});

test('a classic token with mint and freeze authority: both reported as open powers', () => {
  const m = C.parseMint(mint({ mintAuth: 7, freeze: 8 }), C.TOKEN);
  assert.equal(m.program, 'token'); assert.equal(m.mintAuthority, k58(7)); assert.equal(m.freezeAuthority, k58(8));
  const r = rowsOf(C.card(m, null, [600_000n, 100_000n], undefined));
  assert.equal(r['Can anyone mint more?'].level, 'bad'); assert.match(r['Can anyone mint more?'].a, /^Yes\. The address /);
  assert.equal(r['Can anyone freeze or take your tokens?'].level, 'bad');
  assert.equal(r['Fees or extra rules on transfers?'].level, 'ok');
  assert.equal(r['Can the rules change?'].level, 'ok');
  assert.match(r['Who holds the supply?'].a, /70% sits in the 10 largest holdings; the largest single holding is 60%/);
  assert.equal(r['Who holds the supply?'].level, 'warn');
});

test('a fixed classic token: everything closed, locked Metaplex metadata', () => {
  const m = C.parseMint(mint({ supply: 10n ** 12n }), C.TOKEN);
  const md = cat(new Uint8Array([4]), K(3), K(9), str('Example\0\0\0'), str('EXM'), str('https://x'), new Uint8Array([0, 0]), new Uint8Array([1]), (() => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, 1, true); return b; })(), new Uint8Array(34), new Uint8Array([1]), new Uint8Array([0]));
  const meta = C.parseMetaplex(md);
  assert.deepEqual(meta, { name: 'Example', symbol: 'EXM', updateAuthority: k58(3), mutable: false });
  const r = rowsOf(C.card(m, meta, [10n ** 10n], undefined));
  for (const q of ['Can anyone mint more?', 'Can anyone freeze or take your tokens?', 'Fees or extra rules on transfers?', 'Can the rules change?', 'Can the name and logo change?']) assert.equal(r[q].level, 'ok', q);
  assert.equal(r['Who holds the supply?'].level, 'info');
  assert.equal(C.parseMetaplex(md.slice(0, 40)), null);
  assert.equal(rowsOf(C.card(m, { ...meta, mutable: true }, null))['Can the name and logo change?'].level, 'warn');
  assert.match(rowsOf(C.card(m, meta, null))['Who holds the supply?'].a, /could not be read/);
  // An empty answer is "unknown", never "0%" (found by the browser drill on a Token-2022 mint).
  assert.match(rowsOf(C.card(m, meta, []))['Who holds the supply?'].a, /could not be read/);
});

test('Token-2022: changeable transfer fee, permanent delegate, frozen default and a transfer hook', () => {
  const hook = cat(K(5), K(6)), delegate = K(4);
  const m = C.parseMint(mint({ ext: [[1, fee(2, 500)], [6, new Uint8Array([2])], [12, delegate], [14, hook], [99, new Uint8Array(3)]] }), C.TOKEN_2022);
  assert.equal(m.program, 'token-2022'); assert.equal(m.ext.transferFee.authority, k58(2)); assert.equal(m.ext.transferFee.newer.bps, 500);
  assert.equal(m.ext.defaultFrozen, true); assert.equal(m.ext.permanentDelegate, k58(4)); assert.equal(m.ext.transferHook.program, k58(6)); assert.deepEqual(m.unknownExt, [99]);
  let r = rowsOf(C.card(m, null, null, k58(7)));
  assert.match(r['Can anyone freeze or take your tokens?'].a, /start frozen/); assert.match(r['Can anyone freeze or take your tokens?'].a, /move or burn tokens from any wallet/);
  assert.match(r['Fees or extra rules on transfers?'].a, /a 5% fee .* can change it; every transfer also runs the program/);
  assert.equal(r['Fees or extra rules on transfers?'].level, 'bad');
  assert.match(r['Can the rules change?'].a, /can change the hook program/);
  r = rowsOf(C.card(m, null, null, null)); assert.equal(r['Can the rules change?'].level, 'warn'); assert.match(r['Can the rules change?'].a, /can no longer be changed/);
});

test('Token-2022: a fixed fee with no authority is a warning; built-in metadata with an update authority', () => {
  const md = cat(K(3), K(9), str('Built In'), str('BIN'), str('u'), new Uint8Array(4));
  const m = C.parseMint(mint({ ext: [[1, fee(0, 100)], [18, cat(new Uint8Array(32), K(9))], [19, md]] }), C.TOKEN_2022);
  const r = rowsOf(C.card(m, null, null));
  assert.equal(r['Fees or extra rules on transfers?'].level, 'warn'); assert.match(r['Fees or extra rules on transfers?'].a, /a 1% fee is taken on every transfer\./);
  assert.equal(r['Can the rules change?'].level, 'ok');
  assert.deepEqual([m.ext.metadata.name, m.ext.metadata.symbol, m.ext.metadata.updateAuthority], ['Built In', 'BIN', k58(3)]);
  assert.equal(r['Can the name and logo change?'].level, 'warn');
});

test('upgrade authority of a hook program: present, removed or not a program', () => {
  const pd = new Uint8Array(45); new DataView(pd.buffer).setUint32(0, 3, true); pd[12] = 1; pd.set(K(7), 13);
  assert.equal(C.programAuthority(pd), k58(7)); pd[12] = 0; assert.equal(C.programAuthority(pd), null);
  assert.equal(C.programAuthority(new Uint8Array(45)), undefined);
});
