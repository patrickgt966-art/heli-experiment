// Living background shared by every page: slow light clouds in the Charta and Solana colours drift behind a ruled
// dot grid (the published rule), the grid lights up around the pointer, and short light trails run along its lines
// like transactions settling on the chain. One fixed canvas, paused when the tab is hidden; with reduced motion a
// single still frame is drawn.
(() => {
  const canvas = document.createElement('canvas');
  canvas.className = 'bg-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GAP = 30, LIGHT = 190;
  let w = 0, h = 0, dpr = 1, raf = 0, last = 0;
  const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
  const clouds = [
    { c: [163, 237, 207], a: 0.10, r: 0.55, fx: 0.00007, fy: 0.00005, px: 0.25, py: 0.18, ox: 0.8, oy: 0.5 },
    { c: [153, 69, 255], a: 0.075, r: 0.5, fx: 0.00005, fy: 0.00008, px: 0.8, py: 0.35, ox: 2.1, oy: 1.3 },
    { c: [20, 241, 149], a: 0.05, r: 0.42, fx: 0.00009, fy: 0.00004, px: 0.55, py: 0.85, ox: 4.0, oy: 2.2 },
    { c: [242, 197, 138], a: 0.045, r: 0.38, fx: 0.00006, fy: 0.00007, px: 0.1, py: 0.7, ox: 5.5, oy: 3.9 },
  ];
  const trails = [];

  function resize() {
    dpr = Math.min(1.5, window.devicePixelRatio || 1); w = innerWidth; h = innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduce) draw(0);
  }
  function spawn(t) {
    const horizontal = Math.random() < 0.6, line = Math.floor(Math.random() * ((horizontal ? h : w) / GAP)) * GAP + GAP / 2;
    const dir = Math.random() < 0.5 ? 1 : -1, length = 80 + Math.random() * 160, speed = 0.12 + Math.random() * 0.18;
    const span = horizontal ? w : h;
    trails.push({ horizontal, line, dir, length, speed, start: dir > 0 ? -length : span + length, t0: t, span,
      color: Math.random() < 0.5 ? '163,237,207' : Math.random() < 0.6 ? '153,69,255' : '242,197,138' });
  }
  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    // Light clouds
    ctx.globalCompositeOperation = 'lighter';
    const m = Math.max(w, h);
    for (const c of clouds) {
      const x = (c.px + 0.18 * Math.sin(t * c.fx + c.ox)) * w, y = (c.py + 0.16 * Math.cos(t * c.fy + c.oy)) * h, r = c.r * m;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${c.c},${c.a})`); g.addColorStop(1, `rgba(${c.c},0)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = 'source-over';
    // Dot grid, brighter near the pointer
    pointer.x += (pointer.tx - pointer.x) * 0.12; pointer.y += (pointer.ty - pointer.y) * 0.12;
    const ox = (GAP / 2), oy = (GAP / 2) - (scrollY * 0.15) % GAP;
    for (let y = oy; y < h; y += GAP) for (let x = ox; x < w; x += GAP) {
      const d = Math.hypot(x - pointer.x, y - pointer.y), k = d < LIGHT ? 1 - d / LIGHT : 0;
      ctx.fillStyle = `rgba(190,235,218,${0.07 + 0.38 * k * k})`;
      ctx.fillRect(x - 0.7 - k, y - 0.7 - k, 1.4 + 2 * k, 1.4 + 2 * k);
    }
    // Light trails along the grid lines
    for (let i = trails.length - 1; i >= 0; i--) {
      const s = trails[i], head = s.start + s.dir * (t - s.t0) * s.speed;
      if ((s.dir > 0 && head - s.length > s.span) || (s.dir < 0 && head + s.length < 0)) { trails.splice(i, 1); continue; }
      const tail = head - s.dir * s.length;
      const [x1, y1, x2, y2] = s.horizontal ? [tail, s.line + oy - GAP / 2, head, s.line + oy - GAP / 2] : [s.line, tail, s.line, head];
      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, `rgba(${s.color},0)`); g.addColorStop(1, `rgba(${s.color},0.55)`);
      ctx.strokeStyle = g; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.fillStyle = `rgba(${s.color},0.9)`; ctx.beginPath(); ctx.arc(x2, y2, 1.8, 0, Math.PI * 2); ctx.fill();
    }
  }
  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (t - last < 33) return; // about 30 frames a second is plenty for a background
    if (trails.length < 5 && Math.random() < 0.02) spawn(t);
    last = t; draw(t);
  }
  addEventListener('resize', resize);
  addEventListener('pointermove', e => { pointer.tx = e.clientX; pointer.ty = e.clientY; }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.tx = pointer.ty = -9999; });
  resize();
  if (reduce) return;
  document.addEventListener('visibilitychange', () => { cancelAnimationFrame(raf); if (!document.hidden) raf = requestAnimationFrame(loop); });
  raf = requestAnimationFrame(loop);
})();
