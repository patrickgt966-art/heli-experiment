// Charta live dashboard: generic Borsh account decoding from the program IDL, the monthly calendar and the
// treasury figures shown on live.html. Pure functions (no DOM), also used by the Node tests.
const utf8 = new TextEncoder();
const camel = s => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

export async function accountDiscriminator(name) {
  const hash = await globalThis.crypto.subtle.digest('SHA-256', utf8.encode(`account:${name}`));
  return new Uint8Array(hash).slice(0, 8);
}
// Decodes an Anchor account with the field list of the IDL (u8..u64, i64, bool, publicKey, arrays, vectors).
export async function decode(idl, name, bytes) {
  const type = [...(idl.accounts ?? []), ...(idl.types ?? [])].find(x => x.name === name)?.type;
  if (!type) throw Error(`IDL has no account ${name}`);
  const disc = await accountDiscriminator(name);
  if (bytes.length < 8 || !disc.every((x, i) => bytes[i] === x)) throw Error(`Not a ${name} account`);
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); let o = 8;
  const read = t => {
    if (t === 'bool') return bytes[o++] === 1;
    if (t === 'u8') return bytes[o++];
    if (t === 'u16') { const x = v.getUint16(o, true); o += 2; return x; }
    if (t === 'u32') { const x = v.getUint32(o, true); o += 4; return x; }
    if (t === 'u64') { const x = v.getBigUint64(o, true); o += 8; return x; }
    if (t === 'i64') { const x = v.getBigInt64(o, true); o += 8; return x; }
    if (t === 'publicKey') { const x = bytes.slice(o, o + 32); o += 32; return x; }
    if (t.array) return Array.from({ length: t.array[1] }, () => read(t.array[0]));
    if (t.vec) { const n = v.getUint32(o, true); o += 4; return Array.from({ length: n }, () => read(t.vec)); }
    throw Error(`Unsupported IDL type ${JSON.stringify(t)}`);
  };
  const out = {}; for (const f of type.fields) out[camel(f.name)] = read(f.type); return out;
}

// Monthly boundary n months after start: same day of month (clamped to the month length), same time of day (UTC),
// exactly like calendar.rs.
export function boundary(start, n) {
  const DAY = 86400, d = new Date(Math.floor(start / DAY) * DAY * 1000);
  const k = d.getUTCFullYear() * 12 + d.getUTCMonth() + n, y = Math.floor(k / 12), m = k % 12;
  const max = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return Date.UTC(y, m, Math.min(d.getUTCDate(), max)) / 1000 + ((start % DAY) + DAY) % DAY;
}

// Sum of a 31-slot daily ring (today and the 30 days before) as the program counts it at `now`.
export function windowSum(slots, lastDay, now) {
  const today = Math.floor(now / 86400), last = Number(lastDay);
  if (today - last >= 31) return 0n;
  let sum = 0n;
  for (let i = 0; i < 31; i++) { const day = last - i; if (today - day <= 30) sum += slots[((day % 31) + 31) % 31]; }
  return sum;
}

// Reserve spending room over the rolling 30 days (owner rules of 4-5 Oct 2026): other expenses up to 25%/12 of the
// reserve excluding unspent revenue, and a separate fixed technical cost allowance of 12 quote units.
export function treasury({ reserve, revenueTotal, revenueSpent, outDays, fixDays, outDay, decimals, now }) {
  const unspent = revenueTotal > revenueSpent ? revenueTotal - revenueSpent : 0n;
  const base = reserve > unspent ? reserve - unspent : 0n;
  const shareLimit = base * 25n / 1200n, fixedLimit = 12n * 10n ** BigInt(decimals);
  return { unspent, shareLimit, shareUsed: windowSum(outDays, outDay, now), fixedLimit, fixedUsed: windowSum(fixDays, outDay, now) };
}

// Reference price: time-weighted mean of 24 hourly samples (release.rs reference_price), or null when not current.
export function reference(policy, now) {
  if (policy.count !== 24) return null;
  const first = policy.next, last = (first + 23) % 24, t = policy.times.map(Number);
  if (now < t[last] || now - t[last] > 3600 || t[last] - t[first] < 23 * 3600) return null;
  let weighted = 0n, duration = 0n;
  for (let k = 0; k < 23; k++) { const i = (first + k) % 24, j = (i + 1) % 24, dt = t[j] - t[i]; if (dt < 3600 || dt > 7200) return null; weighted += policy.prices[i] * BigInt(dt); duration += BigInt(dt); }
  return weighted / duration;
}
