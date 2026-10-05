// Pure checks behind verify.html (no DOM, no network), also used by the Node tests. Byte layouts follow the
// upgradeable BPF loader: Program = u32 tag 2 + program-data address; ProgramData = u32 tag 3 + u64 slot +
// Option<Pubkey> upgrade authority (1 + 32 bytes) + the ELF from byte 45, padded with zeros.
export const LOADER = 'BPFLoaderUpgradeab1e11111111111111111111111';
const u32 = (d, o) => new DataView(d.buffer, d.byteOffset, d.byteLength).getUint32(o, true);

export function readProgram(info) {
  if (!info) return { ok: false, why: 'No account at the program address.' };
  if (info.ownerBase58 !== LOADER) return { ok: false, why: `Owned by ${info.ownerBase58}, not the upgradeable BPF loader.` };
  if (!info.executable) return { ok: false, why: 'The account is not executable.' };
  if (info.data.length < 36 || u32(info.data, 0) !== 2) return { ok: false, why: 'Not an upgradeable program account.' };
  return { ok: true, programData: info.data.slice(4, 36) };
}

export function readProgramData(info) {
  if (!info) return { ok: false, why: 'The program-data account is missing.' };
  if (info.ownerBase58 !== LOADER) return { ok: false, why: `The program-data account is owned by ${info.ownerBase58}, not the loader.` };
  if (info.data.length < 45 || u32(info.data, 0) !== 3) return { ok: false, why: 'Not a program-data account.' };
  const opt = info.data[12];
  if (opt !== 0 && opt !== 1) return { ok: false, why: 'Malformed upgrade authority field.' };
  return { ok: true, authority: opt === 1 ? info.data.slice(13, 45) : null, code: info.data.slice(45) };
}

// Compares the code on chain with the published build: the first `length` bytes must hash to `sha256` and every byte
// after them must be zero padding. Code shorter than the published length never passes.
export async function checkCode(code, expected, digest) {
  let end = code.length; while (end > 0 && code[end - 1] === 0) end--;
  const stripped = await digest(code.slice(0, end));
  if (!expected?.sha256 || !expected?.length) return { state: 'warn', stripped };
  if (code.length < expected.length) return { state: 'bad', stripped, why: `Only ${code.length} bytes on chain; the published build has ${expected.length}.` };
  const exact = await digest(code.slice(0, expected.length));
  const padded = code.slice(expected.length).every(x => x === 0);
  return { state: exact === expected.sha256 && padded ? 'ok' : 'bad', exact, stripped, padded };
}

// A check that could not run is not a pass.
export function summarize(states) {
  const n = s => states.filter(x => x === s).length, bad = n('bad'), warn = n('warn'), none = n('none');
  if (bad) return { text: `${bad} mismatch${bad > 1 ? 'es' : ''}`, cls: 'pill bad' };
  if (none) return { text: `Incomplete · ${none} not checked`, cls: 'pill neutral' };
  return { text: warn ? `Passed · ${warn} to note` : 'All passed', cls: 'pill' };
}
