// Small motion layer shared by every page: sections fade in as they scroll into view, the hero figures count up,
// cards catch a soft light under the pointer and a thin bar shows reading progress. Nothing here changes content;
// with reduced motion (or without JavaScript) the page is simply static.
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.prepend(bar);
  const progress = () => {
    const max = root.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
  };
  addEventListener('scroll', progress, { passive: true });
  addEventListener('resize', progress);
  progress();

  const cards = '.mechanism-grid article, .progress-grid article, .panel, .supply-tool, .allocation-detail, .safety-callout';
  if (matchMedia('(hover: hover)').matches) {
    for (const card of document.querySelectorAll(cards)) {
      card.classList.add('glow');
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    }
  }
  if (reduce || !('IntersectionObserver' in window)) return;

  root.classList.add('motion');
  const targets = document.querySelectorAll([
    '.section-heading', '.story > *', '.distribution-section > *', '.mechanism-grid article', '.market-heading',
    '.market-flow article', '.guardrails > div:first-child', '.guardrail-list article', '.progress-grid article',
    '.supply-explainer', '.supply-tool', '.allocation-map-layout', '.closing > *', '.page-intro', '.safety-callout',
    '.steps li', '.example-panel', '.risk-group', '.faq', '.transparency-grid > *', '.claim-summary', '.auction-layout > *'
  ].join(','));
  const seen = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); seen.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  const groups = new Map();
  for (const el of targets) {
    const n = groups.get(el.parentElement) ?? 0; groups.set(el.parentElement, n + 1);
    el.classList.add('reveal'); el.style.setProperty('--delay', `${Math.min(n, 6) * 70}ms`);
    seen.observe(el);
  }

  // Hero figures count up once, keeping their unit (<small>) untouched.
  const counters = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      counters.unobserve(e.target);
      const node = e.target.firstChild, m = node?.nodeType === 3 && node.data.match(/^(\d+)(\D*)$/);
      if (!m) continue;
      const end = Number(m[1]), suffix = m[2], t0 = performance.now(), ms = 1400;
      const step = t => { const k = Math.min(1, (t - t0) / ms), eased = 1 - (1 - k) ** 3;
        node.data = `${Math.round(end * eased)}${suffix}`; if (k < 1) requestAnimationFrame(step); };
      node.data = `0${suffix}`; requestAnimationFrame(step);
    }
  }, { threshold: 0.6 });
  for (const s of document.querySelectorAll('.hero-metrics strong')) counters.observe(s);
})();
