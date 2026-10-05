// Charta holder map: turns CHTA token accounts into bubbles (one per owner, area proportional to the balance) and
// packs them with a small collision simulation. Pure functions (no DOM), also used by the Node tests.
export const TOTAL = 90_000_000n * 1_000_000n; // 90M CHTA in atoms (6 decimals)

// SPL token account (165 bytes) or the 40-byte slice from offset 32: owner (32 bytes) then amount (u64 LE).
export function readTokenAccount(bytes, sliced = false) {
  const o = sliced ? 0 : 32, v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { owner: bytes.slice(o, o + 32), amount: v.getBigUint64(o + 32, true) };
}

// accounts: [{ address, owner, amount }] with base58 strings. known: address -> { kind, label } for project accounts
// (reserve, treasury, inventory) and owner -> { kind, label } for owners such as the program config.
// Wallets with several token accounts become one bubble; empty accounts are dropped.
export function groupHolders(accounts, { byAddress = {}, byOwner = {}, isProgramOwned = () => false } = {}) {
  const map = new Map();
  for (const a of accounts) {
    if (a.amount <= 0n) continue;
    const known = byAddress[a.address] ?? byOwner[a.owner];
    const key = known ? `${known.kind}:${byAddress[a.address] ? a.address : a.owner}` : a.owner;
    const kind = known?.kind ?? (isProgramOwned(a.owner) ? 'program' : 'wallet');
    const prev = map.get(key);
    if (prev) prev.amount += a.amount;
    else map.set(key, { id: key, owner: a.owner, address: a.address, amount: a.amount, kind, label: known?.label ?? null });
  }
  const list = [...map.values()].sort((x, y) => (y.amount > x.amount ? 1 : y.amount < x.amount ? -1 : x.id < y.id ? -1 : 1));
  let rank = 0;
  for (const b of list) if (b.kind === 'wallet') b.rank = ++rank;
  return list;
}

export const isVault = b => b.kind === 'reserve' || b.kind === 'treasury' || b.kind === 'inventory' || b.kind === 'project';

export function stats(bubbles) {
  const wallets = bubbles.filter(b => b.kind === 'wallet');
  const inWallets = wallets.reduce((s, b) => s + b.amount, 0n);
  return { wallets: wallets.length, inWallets, largest: wallets[0]?.amount ?? 0n };
}

// Radius so that the bubbles fill about `fill` of the area; areas stay proportional, tiny ones get a visible minimum.
export function radii(bubbles, width, height, fill = 0.5, min = 2.5) {
  const total = bubbles.reduce((s, b) => s + Number(b.amount), 0);
  const k = total > 0 ? Math.sqrt(fill * width * height / (Math.PI * total)) : 0;
  return bubbles.map(b => Math.max(min, k * Math.sqrt(Number(b.amount))));
}

// Start positions on a sunflower spiral (largest in the middle), then relax overlaps while pulling towards the centre.
export function initialNodes(bubbles, width, height, previous = new Map()) {
  const r = radii(bubbles, width, height), cx = width / 2, cy = height / 2;
  return bubbles.map((b, i) => {
    const old = previous.get(b.id), angle = i * 2.39996323, dist = 6 * Math.sqrt(i) * (1 + r[0] / 60);
    return { ...b, r: r[i], x: old?.x ?? cx + Math.cos(angle) * dist, y: old?.y ?? cy + Math.sin(angle) * dist, fresh: !old };
  });
}
export function relax(nodes, width, height, iterations = 1, pad = 1.5, gravity = 0.02, links = []) {
  const cx = width / 2, cy = height / 2, at = new Map(nodes.map(n => [n.id, n]));
  const springs = links.map(l => [at.get(l.a), at.get(l.b)]).filter(([a, b]) => a && b);
  for (let it = 0; it < iterations; it++) {
    // Linked wallets attract each other so that clusters form, like on a bubble map.
    for (const [a, b] of springs) { const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, want = a.r + b.r + 28, k = (d - want) / d * 0.06 * (gravity > 0 ? 1 : 0);
      a.x += dx * k; a.y += dy * k; b.x -= dx * k; b.y -= dy * k; }
    for (const n of nodes) { n.x += (cx - n.x) * gravity; n.y += (cy - n.y) * gravity * (width / height); }
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j]; let dx = b.x - a.x, dy = b.y - a.y; const min = a.r + b.r + pad;
      let d2 = dx * dx + dy * dy; if (d2 >= min * min) continue;
      if (d2 === 0) { dx = 0.01 * (j - i); dy = 0.01; d2 = dx * dx + dy * dy; }
      const d = Math.sqrt(d2), push = (min - d) / d, wa = b.r * b.r / (a.r * a.r + b.r * b.r), wb = 1 - wa;
      a.x -= dx * push * wa; a.y -= dy * push * wa; b.x += dx * push * wb; b.y += dy * push * wb;
    }
  }
  return nodes;
}
// Animation-free layout: settle with gravity, then remove the remaining overlaps with gravity switched off.
export function settle(nodes, width, height, links = []) { relax(nodes, width, height, 160, 1.5, 0.02, links); relax(nodes, width, height, 60, 1.5, 0.004, links); relax(nodes, width, height, 200, 1.5, 0);
  // Large maps can keep a few overlaps after the fixed passes; keep separating until none are left (bounded).
  for (let k = 0; k < 40 && overlaps(nodes) > 0; k++) relax(nodes, width, height, 25, 1.5, 0);
  return nodes; }
export function overlaps(nodes, tolerance = 0.5) {
  let n = 0;
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const a = nodes[i], b = nodes[j];
    if (Math.hypot(b.x - a.x, b.y - a.y) < a.r + b.r - tolerance) n++;
  }
  return n;
}

// Clearly labelled example used before the program is deployed: the three planned vaults and made-up buyers.
export function exampleAccounts(seed = 7) {
  let s = seed >>> 0; const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const unit = 1_000_000n, letters = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const fake = () => Array.from({ length: 44 }, () => letters[Math.floor(rand() * letters.length)]).join('');
  const out = [], CAP = 250_000;
  let sold = 0;
  for (let i = 0; i < 72; i++) {
    const q = Math.min(CAP, Math.round(2_000 + CAP * rand() ** 3.2));
    if (sold + q > 4_900_000) break;
    sold += q; const owner = fake(); out.push({ address: fake(), owner, amount: BigInt(q) * unit });
  }
  out.push({ address: 'example-reserve', owner: 'example-config', amount: 70_000_000n * unit });
  out.push({ address: 'example-treasury', owner: 'example-config', amount: 15_000_000n * unit });
  out.push({ address: 'example-inventory', owner: 'example-config', amount: BigInt(5_000_000 - sold) * unit });
  return out;
}
export const EXAMPLE_KNOWN = {
  byAddress: { 'example-reserve': { kind: 'reserve', label: 'Market release reserve' }, 'example-treasury': { kind: 'treasury', label: 'Management Treasury' }, 'example-inventory': { kind: 'inventory', label: 'Unsold launch inventory' } },
  byOwner: { 'example-config': { kind: 'project', label: 'Project account' } },
};

// Direct CHTA transfers between wallets, from parsed transactions (meta.preTokenBalances / postTokenBalances).
// Each transaction where exactly one known wallet loses CHTA and other known wallets gain it links the sender to
// each receiver. Transactions that touch more than four owners (trades, batch payouts) are ignored.
export function linksFromTransactions(txs, mint, wallets) {
  const links = new Map();
  for (const tx of txs) {
    const meta = tx?.meta; if (!meta || meta.err) continue;
    const delta = new Map(), pre = new Map();
    for (const b of meta.preTokenBalances ?? []) if (b.mint === mint) pre.set(b.accountIndex, b);
    const seen = new Set();
    for (const b of meta.postTokenBalances ?? []) {
      if (b.mint !== mint) continue; seen.add(b.accountIndex);
      const before = BigInt(pre.get(b.accountIndex)?.uiTokenAmount?.amount ?? '0'), after = BigInt(b.uiTokenAmount?.amount ?? '0');
      delta.set(b.owner, (delta.get(b.owner) ?? 0n) + after - before);
    }
    for (const [i, b] of pre) if (!seen.has(i)) delta.set(b.owner, (delta.get(b.owner) ?? 0n) - BigInt(b.uiTokenAmount?.amount ?? '0'));
    const moved = [...delta].filter(([, d]) => d !== 0n);
    if (moved.length < 2 || moved.length > 4 || moved.some(([o]) => !wallets.has(o))) continue;
    const senders = moved.filter(([, d]) => d < 0n), receivers = moved.filter(([, d]) => d > 0n);
    if (senders.length !== 1) continue;
    const [from] = senders[0];
    for (const [to, amount] of receivers) {
      const [a, b] = from < to ? [from, to] : [to, from], key = `${a}|${b}`, l = links.get(key) ?? { a, b, amount: 0n, count: 0 };
      l.amount += amount; l.count++; links.set(key, l);
    }
  }
  return [...links.values()];
}

// Example links among the made-up wallets: a few small clusters, as a bubble map would show them.
export function exampleLinks(bubbles, seed = 11) {
  let s = seed >>> 0; const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const w = bubbles.filter(b => b.kind === 'wallet'), out = [];
  for (let c = 0; c < 6 && w.length > 12; c++) {
    const hub = w[Math.floor(rand() * w.length)], size = 2 + Math.floor(rand() * 3);
    for (let k = 0; k < size; k++) { const o = w[Math.floor(rand() * w.length)]; if (o.id !== hub.id && !out.some(l => (l.a === hub.id && l.b === o.id) || (l.a === o.id && l.b === hub.id))) out.push({ a: hub.id, b: o.id, amount: o.amount / 4n, count: 1 }); }
  }
  return out;
}
