const pages = [...document.querySelectorAll('[data-page]')];
const navLinks = [...document.querySelectorAll('[data-nav]')];
const titles = { home: 'HELI · How should money begin?', allocation: 'Claim your free share · HELI', transparency: 'Transparency · HELI' };
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
checks.addEventListener('input', calculate);
calculate();

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
  yearSlider.setAttribute('aria-valuetext', `Year ${year}: ${supply.toFixed(2)} million HELI, conditional no-burn ceiling`);
}
yearSlider.addEventListener('input', exploreSupply);
exploreSupply();

const allocationDetails = {
  human: { kicker: 'MONTHLY MARKET SUPPLY', title: 'Market Release Reserve', amount: '70M', share: '77.78%', copy: 'This locked reserve releases tokens into sale inventory after each month ends. Only the separate initial 1 million allocation is free; buyers purchase these monthly tokens on the market.', rule: 'The monthly cap is approximately 0.402247% of released, unburned supply, starting from a 5 million base. First cap: about 20,112 HELI. Management shares the same cap. Unsold inventory waits for buyers, with no monthly burn.' },
  treasury: { kicker: 'SALES & LIQUIDITY', title: 'Management Treasury', amount: '15M', share: '16.67%', copy: 'One manager can sell released treasury tokens and place funded buy and sell orders to provide liquidity. Sale proceeds remain in the project reserve.', rule: 'New treasury releases are locked for the first 12 months. Sales and new liquidity inventory then share one capped release budget.' },
  market: { kicker: 'INITIAL MARKET INVENTORY', title: 'Initial market', amount: '4M', share: '4.44%', copy: 'Allocated to market purchases at launch. Funded auction bids establish the opening price; matching buy and sell orders determine subsequent prices.', rule: 'There is no HELI purchase limit per buyer. Unsold inventory waits for buyers; an allocation does not mean it has already been sold.' },
  free: { kicker: 'EQUAL INITIAL ENTITLEMENT', title: 'Initial free allocation', amount: '1M', share: '1.11%', copy: 'Up to 1,000 verified people can each receive 1,000 HELI once. This is the only free token allocation; monthly market releases are sold to buyers.', rule: 'After six months, unassigned tokens move to sale inventory to await buyers. Earned but unclaimed entitlements remain protected.' }
};
function selectAllocation(key) {
  const item = allocationDetails[key];
  if (!item) return;
  for (const control of document.querySelectorAll('[data-allocation]')) control.setAttribute('aria-pressed', String(control.dataset.allocation === key));
  for (const field of ['kicker', 'title', 'amount', 'share', 'copy', 'rule']) document.getElementById(`allocation-detail-${field}`).textContent = item[field];
  document.getElementById('treasury-composition').hidden = key !== 'treasury';
}
for (const control of document.querySelectorAll('[data-allocation]')) {
  control.addEventListener('click', () => selectAllocation(control.dataset.allocation));
  if (control.tagName.toLowerCase() === 'g') control.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectAllocation(control.dataset.allocation); }
  });
}
