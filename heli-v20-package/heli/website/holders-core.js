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
export function relax(nodes, width, height, iterations = 1, pad = 1.5, gravity = 0.02) {
  const cx = width / 2, cy = height / 2;
  for (let it = 0; it < iterations; it++) {
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
export function settle(nodes, width, height) { relax(nodes, width, height, 160); relax(nodes, width, height, 60, 1.5, 0.004); return relax(nodes, width, height, 200, 1.5, 0); }
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
