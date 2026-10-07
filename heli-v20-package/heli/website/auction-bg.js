// Auction hint layer (mockup): without a word, the background tells that an auction is running. A faint demand ladder
// rises from the bottom, single bids drop onto its steps, a glowing clearing line settles where demand meets supply
// and the bids above it light up; behind the headline a thin clock ring slowly runs down.
(() => {
  const canvas = document.createElement('canvas');
  canvas.className = 'bg-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const O = '255,154,60', S = '242,197,138';
  let w = 0, h = 0, dpr = 1, bars = [], bids = [], last = 0, t0 = performance.now();

  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1); w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.max(14, Math.round(w / 46)), bw = w / n;
    // Demand grows toward lower prices: a staircase rising to the right, with some noise.
    bars = Array.from({ length: n }, (_, i) => ({ x: i * bw, w: bw - 6, target: h * (0.03 + 0.13 * Math.pow(i / (n - 1), 1.6)) * (0.85 + 0.3 * Math.random()), v: 0 }));
    bars.forEach(b => b.v = b.target * 0.55);
  }

  function spawn() {
    const i = Math.floor(Math.pow(Math.random(), 0.7) * bars.length);
    bids.push({ i, x: bars[i].x + bars[i].w / 2 + (Math.random() - 0.5) * 10, y: h * (0.62 + Math.random() * 0.12), vy: 0.6 + Math.random() * 0.6, size: 1.6 + Math.random() * 1.8, life: 0 });
  }

  function draw(now) {
    const t = (now - t0) / 1000;
    ctx.clearRect(0, 0, w, h);
    // Clearing line: drifts, then settles near 64% of the ladder height.
    const clear = h - h * (0.095 + 0.015 * Math.sin(t * 0.35) * Math.exp(-t * 0.05));
    for (const b of bars) {
      b.v += (b.target - b.v) * 0.004;
      const top = h - b.v, above = top < clear;
      const g = ctx.createLinearGradient(0, top, 0, h);
      g.addColorStop(0, `rgba(${above ? O : S},${above ? 0.16 : 0.06})`); g.addColorStop(1, `rgba(${O},0)`);
      ctx.fillStyle = g; ctx.fillRect(b.x + 3, top, b.w, b.v);
      ctx.fillStyle = `rgba(${above ? O : S},${above ? 0.38 : 0.12})`; ctx.fillRect(b.x + 3, top, b.w, 1.5);
    }
    // The clearing line itself: dashed, with a soft glow.
    ctx.save(); ctx.setLineDash([10, 8]); ctx.lineDashOffset = -t * 18;
    ctx.strokeStyle = `rgba(${O},0.32)`; ctx.lineWidth = 1; ctx.shadowColor = `rgba(${O},0.6)`; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(0, clear); ctx.lineTo(w, clear); ctx.stroke(); ctx.restore();
    // Bids falling onto their step; each landing nudges the step up.
    for (let k = bids.length - 1; k >= 0; k--) {
      const d = bids[k], b = bars[d.i]; d.vy += 0.035; d.y += d.vy; d.life++;
      if (d.y >= h - b.v) { b.target = Math.min(h * 0.2, b.target + 1.2); b.v += 1.5; bids.splice(k, 1);
        ctx.fillStyle = `rgba(${O},0.35)`; ctx.beginPath(); ctx.arc(d.x, h - b.v, 6, 0, Math.PI * 2); ctx.fill(); continue; }
      ctx.fillStyle = `rgba(${O},0.6)`; ctx.beginPath(); ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2); ctx.fill();
      const tr = ctx.createLinearGradient(d.x, d.y - 26, d.x, d.y); tr.addColorStop(0, `rgba(${O},0)`); tr.addColorStop(1, `rgba(${O},0.35)`);
      ctx.strokeStyle = tr; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(d.x, d.y - 26); ctx.lineTo(d.x, d.y); ctx.stroke();
    }
    // Clock ring behind the headline: ticks and an arc that slowly runs down.
    const cx = w / 2, cy = Math.min(h * 0.4, 360), r = Math.min(w * 0.46, 560);
    ctx.save(); ctx.translate(cx, cy);
    for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, long = i % 5 === 0;
      ctx.strokeStyle = `rgba(${S},${long ? 0.08 : 0.035})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Math.sin(a) * (r - (long ? 12 : 6)), -Math.cos(a) * (r - (long ? 12 : 6))); ctx.lineTo(Math.sin(a) * r, -Math.cos(a) * r); ctx.stroke(); }
    const left = 0.72 - (t * 0.004) % 0.72, end = -Math.PI / 2 + left * Math.PI * 2;
    ctx.strokeStyle = `rgba(${O},0.16)`; ctx.lineWidth = 1.5; ctx.shadowColor = `rgba(${O},0.5)`; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(0, 0, r + 6, -Math.PI / 2, end); ctx.stroke();
    ctx.fillStyle = `rgba(${O},0.55)`; ctx.beginPath(); ctx.arc(Math.cos(end) * (r + 6), Math.sin(end) * (r + 6), 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function loop(now) {
    requestAnimationFrame(loop);
    if (now - last < 33) return; last = now;
    if (bids.length < 10 && Math.random() < 0.12) spawn();
    draw(now);
  }
  addEventListener('resize', resize); resize();
  if (reduce) { draw(performance.now()); return; }
  requestAnimationFrame(loop);
})();
