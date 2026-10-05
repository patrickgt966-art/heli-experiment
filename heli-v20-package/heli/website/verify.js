// Verify page: reads the program, its program-data account, the CHTA mint, the vaults and the governance keys
// straight from the chain and compares them with what the project publishes (site-config.js and the IDL).
import * as D from './dashboard-core.js';

const web3 = window.solanaWeb3, cfg = window.CHARTA_CONFIG ?? {};
const $ = id => document.getElementById(id);
const LOADER = 'BPFLoaderUpgradeab1e11111111111111111111111', UNIT = 1_000_000n;
const fmt = a => `${(Number(a) / 1e6).toLocaleString('en-US', { maximumFractionDigits: 6 })} CHTA`;
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const key = b => new web3.PublicKey(b).toBase58();
const zero = b => b.every(x => x === 0);

function mark(name, state, text) {
  const li = document.querySelector(`[data-check="${name}"]`);
  li.dataset.state = state; li.querySelector('.check-mark').textContent = { ok: '✓', warn: '!', bad: '✕', none: '–' }[state];
  li.querySelector('.check-detail').textContent = text;
}

async function run() {
  const conn = new web3.Connection(cfg.rpcUrl, 'confirmed'), program = new web3.PublicKey(cfg.programId);
  const pda = (...s) => web3.PublicKey.findProgramAddressSync(s.map(x => typeof x === 'string' ? new TextEncoder().encode(x) : x), program)[0];
  const idl = await (await fetch('idl.json')).json();
  const [prog, configInfo, mintInfo, reserveInfo, treasuryInfo, govInfo] = await conn.getMultipleAccountsInfo(
    [program, pda('config'), pda('mint'), pda('vault', new Uint8Array([0])), pda('vault', new Uint8Array([3])), pda('governance')]);
  const results = [];
  const put = (n, s, t) => { results.push(s); mark(n, s, t); };

  // 1. Program account
  if (!prog) { put('program', 'bad', `No account at ${program.toBase58()} on ${cfg.cluster}.`); return results; }
  const upgradeable = prog.owner.toBase58() === LOADER;
  put('program', prog.executable && upgradeable ? 'ok' : 'bad', `${program.toBase58()} is ${prog.executable ? 'executable' : 'not executable'}, owned by ${upgradeable ? 'the upgradeable BPF loader' : prog.owner.toBase58()}.`);

  // 2-3. Program data: code hash and upgrade authority
  const dataAddress = new web3.PublicKey(prog.data.slice(4, 36)), pd = await conn.getAccountInfo(dataAddress);
  if (!pd) { put('code', 'bad', 'The program-data account is missing.'); put('upgrade', 'bad', '–'); }
  else {
    const exp = cfg.expectedProgram, code = pd.data.slice(45);
    let end = code.length; while (end > 0 && code[end - 1] === 0) end--;
    const stripped = hex(await crypto.subtle.digest('SHA-256', code.slice(0, end)));
    if (exp?.sha256 && exp?.length) {
      const exact = hex(await crypto.subtle.digest('SHA-256', code.slice(0, exp.length)));
      const tail = code.slice(exp.length).every(x => x === 0);
      put('code', exact === exp.sha256 && tail ? 'ok' : 'bad', exact === exp.sha256 && tail
        ? `The ${exp.length.toLocaleString('en-US')} bytes on chain hash to ${exact}, the published build.`
        : `On-chain code hashes to ${exact} over the published length, expected ${exp.sha256}.`);
    } else put('code', 'warn', `No build hash is published for this deployment yet. On-chain code (trailing zeros removed, as solana-verify does) hashes to ${stripped}.`);
    const hasAuthority = pd.data[12] === 1;
    put('upgrade', hasAuthority ? 'warn' : 'ok', hasAuthority
      ? `An upgrade key still exists: ${key(pd.data.slice(13, 45))}. Whoever holds it can replace the program. The plan is to remove it after an independent audit.`
      : 'The upgrade key has been removed: nobody can change the program any more.');
  }

  // 4-5. Mint
  if (!mintInfo) { put('mint', 'bad', 'The CHTA mint does not exist yet.'); put('supply', 'none', '–'); }
  else {
    const m = mintInfo.data, v = new DataView(m.buffer, m.byteOffset), supply = v.getBigUint64(36, true);
    const mintAuth = v.getUint32(0, true) === 1 ? key(m.slice(4, 36)) : null, freezeAuth = v.getUint32(46, true) === 1 ? key(m.slice(50, 82)) : null;
    const config = pda('config').toBase58();
    const mintText = mintAuth === null ? 'Minting is switched off for good.' : mintAuth === config ? 'Only the program itself can mint, and it does so only once, at genesis.' : `Mint authority is ${mintAuth}, not the program.`;
    put('mint', freezeAuth ? 'bad' : mintAuth === null ? 'ok' : mintAuth === config ? 'warn' : 'bad', `${mintText} ${freezeAuth ? `Freeze authority: ${freezeAuth}.` : 'No freeze authority: no account can be frozen.'}`);
    put('supply', supply <= 90_000_000n * UNIT ? 'ok' : 'bad', `Total supply ${fmt(supply)} (limit 90,000,000 CHTA).`);
  }

  // 6. Vaults
  const bal = i => i ? new DataView(i.data.buffer, i.data.byteOffset).getBigUint64(64, true) : null;
  const r = bal(reserveInfo), t = bal(treasuryInfo);
  if (r === null || t === null) put('vaults', 'none', 'The vaults are not set up yet.');
  else put('vaults', r <= 70_000_000n * UNIT && t <= 15_000_000n * UNIT ? 'ok' : 'bad', `Market release reserve ${fmt(r)} (at most 70,000,000). Management Treasury ${fmt(t)} (at most 15,000,000).`);

  // 7. Keys
  if (!configInfo) put('keys', 'none', 'The program has not been set up yet.');
  else {
    const c = await D.decode(idl, 'Config', configInfo.data), g = govInfo ? await D.decode(idl, 'Governance', govInfo.data) : null;
    const pending = g && (!zero(g.pendingAdmin) || !zero(g.pendingRecovery));
    put('keys', c.paused || pending ? 'warn' : 'ok', `Administrator ${key(c.admin)}. Recovery key ${g ? key(g.recovery) : 'not set'}.${pending ? ' A key change is pending; see Live data.' : ''} ${c.paused ? 'The program is PAUSED: sales, treasury operations and expenses are stopped; the monthly release rule continues.' : 'Not paused.'}`);
  }
  return results;
}

async function go() {
  $('summary').textContent = 'Checking…'; $('summary').className = 'pill neutral';
  try {
    const r = await run(), bad = r.filter(s => s === 'bad').length, warn = r.filter(s => s === 'warn').length;
    $('summary').textContent = bad ? `${bad} mismatch${bad > 1 ? 'es' : ''}` : warn ? `Passed · ${warn} to note` : 'All passed';
    $('summary').className = bad ? 'pill bad' : 'pill';
    $('checked').textContent = `Checked ${new Date().toLocaleString()} on ${cfg.cluster}`;
  } catch (e) { $('summary').textContent = 'Could not read the chain'; $('checked').textContent = String(e?.message ?? e); }
}

$('run').addEventListener('click', go);
if (!cfg.programId) {
  $('run').disabled = true;
  const n = $('not-live'); n.hidden = false;
  n.textContent = 'The program is not deployed yet, so there is nothing on chain to check. At launch this page runs every check automatically; the commands below work the same way without this website.';
} else go();
