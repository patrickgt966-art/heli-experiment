// Token rule card (check.html): reads any Solana token's own settings from its mint account and turns them into plain
// sentences. Pure functions (no DOM, no network), also used by the Node tests. No scores and no verdicts: every line
// states a fact that anyone can check on an explorer.
export const TOKEN = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const TOKEN_2022 = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
export const METADATA = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';

// Well-known tokens offered as examples. Names are never searched: anyone can give a token any name.
export const EXAMPLES = [
  { label: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
  { label: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
];

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export function base58(bytes) {
  let n = 0n; for (const b of bytes) n = n * 256n + BigInt(b);
  let s = ''; while (n > 0n) { s = ALPHABET[Number(n % 58n)] + s; n /= 58n; }
  for (const b of bytes) { if (b) break; s = '1' + s; }
  return s;
}
// A plausible address: base58, 32 bytes. Names and other text are refused before anything is read.
export function isAddress(s) {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)) return false;
  let n = 0n; for (const c of s) n = n * 58n + BigInt(ALPHABET.indexOf(c));
  let len = 0; while (n > 0n) { len++; n >>= 8n; }
  const zeros = s.match(/^1*/)[0].length;
  return len + zeros === 32;
}

const view = d => new DataView(d.buffer, d.byteOffset, d.byteLength);
const key = (d, o) => d.slice(o, o + 32);
const isZero = k => k.every(x => x === 0);
const optKey = (d, o) => isZero(key(d, o)) ? null : base58(key(d, o)); // OptionalNonZeroPubkey (Token-2022)

// SPL mint (82 bytes), plus the Token-2022 extensions that change what a holder can do.
export function parseMint(data, owner) {
  if (owner !== TOKEN && owner !== TOKEN_2022) return { ok: false, why: 'This address is not a token. Paste the token (mint) address, not a wallet or a pool.' };
  if (data.length < 82 || data[45] !== 1) return { ok: false, why: 'This account is not an initialised token mint.' };
  if (owner === TOKEN_2022 && data.length > 82 && data[165] !== 1) return { ok: false, why: 'This account is a token holding, not the token itself. Paste the token (mint) address.' };
  const v = view(data);
  const out = {
    ok: true, program: owner === TOKEN ? 'token' : 'token-2022',
    mintAuthority: v.getUint32(0, true) ? base58(key(data, 4)) : null,
    supply: v.getBigUint64(36, true), decimals: data[44],
    freezeAuthority: v.getUint32(46, true) ? base58(key(data, 50)) : null,
    ext: {}, unknownExt: [],
  };
  if (owner === TOKEN_2022 && data.length > 166) {
    for (let o = 166; o + 4 <= data.length;) {
      const type = v.getUint16(o, true), len = v.getUint16(o + 2, true), b = o + 4; o = b + len;
      if (type === 0) break;
      if (b + len > data.length) break;
      if (type === 1) {                         // TransferFeeConfig
        const fee = at => ({ epoch: v.getBigUint64(at, true), max: v.getBigUint64(at + 8, true), bps: v.getUint16(at + 16, true) });
        out.ext.transferFee = { authority: optKey(data, b), older: fee(b + 72), newer: fee(b + 90) };
      } else if (type === 3) out.ext.closeAuthority = optKey(data, b);
      else if (type === 6) out.ext.defaultFrozen = data[b] === 2;
      else if (type === 9) out.ext.nonTransferable = true;
      else if (type === 10) out.ext.interestBearing = { authority: optKey(data, b) };
      else if (type === 12) out.ext.permanentDelegate = optKey(data, b);
      else if (type === 14) out.ext.transferHook = { authority: optKey(data, b), program: optKey(data, b + 32) };
      else if (type === 18) out.ext.metadataPointer = { authority: optKey(data, b), address: optKey(data, b + 32) };
      else if (type === 19) out.ext.metadata = { updateAuthority: optKey(data, b), ...strings(data, b + 64, 2) };
      else if (![2, 4, 5, 7, 8, 11, 13, 15, 16, 17, 20, 21, 22, 23].includes(type)) out.unknownExt.push(type);
    }
  }
  return out;
}
function strings(d, o, n) {
  const v = view(d), dec = new TextDecoder(), out = [];
  for (let i = 0; i < n; i++) { const l = v.getUint32(o, true); out.push(dec.decode(d.slice(o + 4, o + 4 + l)).replace(/\0/g, '').trim()); o += 4 + l; }
  return { name: out[0], symbol: out[1] };
}

// Metaplex token metadata: name, symbol, who may change them and whether they can still change.
export function parseMetaplex(data) {
  if (!data || data.length < 70 || data[0] !== 4) return null;
  const v = view(data), dec = new TextDecoder();
  const updateAuthority = base58(key(data, 1)); let o = 65; const s = [];
  for (let i = 0; i < 3; i++) { const l = v.getUint32(o, true); s.push(dec.decode(data.slice(o + 4, o + 4 + l)).replace(/\0/g, '').trim()); o += 4 + l; }
  o += 2;                                       // seller fee
  if (data[o++] === 1) { const n = v.getUint32(o, true); o += 4 + n * 34; }
  o += 1;                                       // primary sale happened
  return { name: s[0], symbol: s[1], updateAuthority, mutable: data[o] === 1 };
}

// Upgradeable program: who can change its code (null when nobody can any more).
export function programAuthority(programData) {
  if (!programData || programData.length < 45 || view(programData).getUint32(0, true) !== 3) return undefined;
  return programData[12] === 1 ? base58(key(programData, 13)) : null;
}

const short = k => `${k.slice(0, 4)}…${k.slice(-4)}`;
const pct = x => `${x >= 10 ? Math.round(x) : Math.round(x * 10) / 10}%`;

// The card: one row per question. level: ok | warn | bad | info. No overall score.
export function card(m, meta, holders, hook) {
  const rows = [], e = m.ext;
  rows.push(m.mintAuthority
    ? { q: 'Can anyone mint more?', level: 'bad', key: m.mintAuthority, a: `Yes. The address ${short(m.mintAuthority)} can create new tokens at any time.`, why: 'New tokens dilute every holder. A fixed supply means this power was switched off for good.' }
    : { q: 'Can anyone mint more?', level: 'ok', a: 'No. Minting was switched off permanently; the supply can only shrink.', why: 'Nobody, including the creators, can add tokens.' });
  const freeze = [];
  if (m.freezeAuthority) freeze.push(`the address ${short(m.freezeAuthority)} can freeze any holder's tokens so they cannot be sold or moved`);
  if (e.defaultFrozen) freeze.push('new holdings start frozen until someone unfreezes them');
  if (e.permanentDelegate) freeze.push(`the address ${short(e.permanentDelegate)} can move or burn tokens from any wallet`);
  rows.push(freeze.length
    ? { q: 'Can anyone freeze or take your tokens?', level: 'bad', a: `Yes: ${freeze.join('; ')}.`, why: 'Regulated stablecoins often keep a freeze power; most other tokens do not.' }
    : { q: 'Can anyone freeze or take your tokens?', level: 'ok', a: 'No. There is no freeze authority and no permanent delegate.', why: 'Your tokens move only when you sign.' });
  const transfer = [];
  if (e.transferFee) {
    const bps = Math.max(e.transferFee.older.bps, e.transferFee.newer.bps);
    transfer.push(`a ${bps / 100}% fee is taken on every transfer${e.transferFee.authority ? ` and ${short(e.transferFee.authority)} can change it` : ''}`);
  }
  if (e.transferHook?.program) transfer.push(`every transfer also runs the program ${short(e.transferHook.program)}, which can refuse it`);
  if (e.nonTransferable) transfer.push('the token cannot be transferred at all');
  if (e.interestBearing) transfer.push('the displayed balance grows or shrinks with an interest rate');
  rows.push(transfer.length
    ? { q: 'Fees or extra rules on transfers?', level: e.transferFee?.authority || e.transferHook?.program || e.nonTransferable ? 'bad' : 'warn', a: `Yes: ${transfer.join('; ')}.`, why: 'Token-2022 extensions can change what happens when you send or sell.' }
    : { q: 'Fees or extra rules on transfers?', level: 'ok', a: 'None. Transfers work like any standard token.', why: m.program === 'token' ? 'It uses the original token program, which has no extensions.' : 'No fee, hook or transfer restriction is switched on.' });
  // Code: a standard token has no code of its own; a transfer hook is code someone may still change.
  if (e.transferHook?.program) rows.push(hook === null
    ? { q: 'Can the rules change?', level: 'warn', a: `The hook program ${short(e.transferHook.program)} can no longer be changed.`, why: 'Its behaviour is fixed, but read what it does before you trust it.' }
    : { q: 'Can the rules change?', level: 'bad', a: `Yes. ${hook ? `The address ${short(hook)}` : 'Someone'} can change the hook program that every transfer runs.`, why: 'Changing that program changes what transfers are allowed.' });
  else {
    const ch = [];
    if (e.transferFee?.authority) ch.push('the transfer fee');
    if (e.metadataPointer?.authority) ch.push('where its metadata lives');
    if (e.closeAuthority) ch.push('closing the token');
    rows.push(ch.length
      ? { q: 'Can the rules change?', level: 'warn', a: `The token has no code of its own, but settings can still change: ${ch.join(', ')}.`, why: 'These are switches someone still holds; the rows above say who.' }
      : { q: 'Can the rules change?', level: 'ok', a: `No custom code. It uses Solana's standard ${m.program === 'token' ? 'token program' : 'Token-2022 program'} and none of its settings are left open.`, why: 'Tokens with a program of their own can change rules if someone holds an upgrade key.' });
  }
  const md = e.metadata ?? meta;
  if (md) rows.push(md.mutable === false || (e.metadata && !e.metadata.updateAuthority)
    ? { q: 'Can the name and logo change?', level: 'ok', a: 'No. The name, symbol and logo are locked.', why: 'A locked name cannot be switched to imitate another project later.' }
    : { q: 'Can the name and logo change?', level: 'warn', a: `Yes. ${md.updateAuthority ? `The address ${short(md.updateAuthority)}` : 'Someone'} can still change the name, symbol and logo.`, why: 'Usually harmless, but it lets the token be renamed at any time.' });
  if (holders?.length && m.supply > 0n) {
    const supply = Number(m.supply) || 1, amounts = holders.map(h => Number(h)), top1 = 100 * (amounts[0] ?? 0) / supply, top10 = 100 * amounts.slice(0, 10).reduce((a, b) => a + b, 0) / supply;
    rows.push({ q: 'Who holds the supply?', level: top10 >= 50 ? 'warn' : 'info', top1, top10,
      a: `${pct(top10)} sits in the 10 largest holdings; the largest single holding is ${pct(top1)}.`,
      why: 'Large holdings can be trading pools, exchanges or locked vaults as well as people. See who they are on an explorer.' });
  } else rows.push({ q: 'Who holds the supply?', level: 'info', a: 'The largest holdings could not be read just now.', why: 'Some networks limit this request for very large tokens. Try again later.' });
  return rows;
}
