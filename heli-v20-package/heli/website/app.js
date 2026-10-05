const pages = [...document.querySelectorAll('[data-page]')];
const navLinks = [...document.querySelectorAll('[data-nav]')];
const titles = { home: 'Charta · Money that follows its rule', allocation: 'Initial distribution · Charta', transparency: 'Transparency · Charta' };
const legacy = { ana: 'home', basvuru: 'allocation', seffaflik: 'transparency' };
function route() {
  const raw = window.location.hash.slice(1);
  if (raw === 'content' || raw === 'icerik') return;
  const candidate = legacy[raw] || raw;
  const anchor = document.getElementById(candidate);
  const current = Object.hasOwn(titles, candidate) ? candidate : 'home';
  for (const page of pages) page.hidden = page.dataset.page !== current;
  for (const link of navLinks) {
    if (link.dataset.nav === current) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  document.title = titles[current];
  if (anchor && !anchor.matches('[data-page]') && anchor.closest('[data-page="home"]')) anchor.scrollIntoView({ behavior: 'instant', block: 'start' });
  else window.scrollTo({ top: 0, behavior: 'instant' });
}
window.addEventListener('hashchange', route);
route();
const checks = document.getElementById('checks');
const output = document.getElementById('cost');
const note = document.getElementById('cost-note');
function calculate() {
  const number = checks.valueAsNumber;
  if (!Number.isFinite(number) || !Number.isInteger(number) || number < 0 || number > 1000000) {
    output.textContent = 'Enter a valid number';
    note.textContent = 'Use a whole number between 0 and 1,000,000.';
    checks.setAttribute('aria-invalid', 'true');
    return;
  }
  checks.removeAttribute('aria-invalid');
  const cents = Math.max(0, number - 500) * 33;
  output.textContent = (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';
  note.textContent = 'Assuming the full free allowance is available for each check.';
}
if (checks) checks.addEventListener('input', calculate);
if (checks) calculate();

const yearSlider = document.getElementById('supply-year');
const point = year => ({x: 20 + year / 60 * 560, y: 215 - (5 * 18 ** (year / 60)) / 90 * 195});
const points = Array.from({length: 121}, (_, i) => point(i / 2));
const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
document.getElementById('supply-line').setAttribute('d', line);
document.getElementById('supply-area').setAttribute('d', `${line} L580 215 L20 215 Z`);
function exploreSupply() {
  const year = Number(yearSlider.value);
  const supply = (5 * 18 ** (year / 60));
  const selected = point(year);
  document.getElementById('supply-value').textContent = `${supply.toFixed(2)}M`;
  document.getElementById('year-value').textContent = year;
  document.getElementById('slider-year').textContent = year;
  document.getElementById('supply-marker').setAttribute('cx', selected.x.toFixed(2));
  document.getElementById('supply-marker').setAttribute('cy', selected.y.toFixed(2));
  yearSlider.setAttribute('aria-valuetext', `Year ${year}: ${supply.toFixed(2)} million CHTA, conditional no-burn ceiling`);
}
yearSlider.addEventListener('input', exploreSupply);
exploreSupply();
