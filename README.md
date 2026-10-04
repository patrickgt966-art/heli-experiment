# HELI — Solana monetary experiment

HELI is an experimental token design exploring a rule-based alternative monetary system on Solana. This repository holds the program source, tests, operating tools and review records. **Nothing is deployed to Devnet or mainnet, and the code has not had an independent security audit.**

Website: https://heli-experiment.pages.dev · Full rules: [`heli-v20-package/heli/website/heli-rules.txt`](heli-v20-package/heli/website/heli-rules.txt)

## Rules (V22 design)

**Supply**
- Initial mint: 100 million HELI. Initial burn: 10 million. Maximum remaining supply: 90 million.
- Initial release base: 5 million — 1 million for a free initial allocation, 4 million for the market (opening auction).
- Locked: Monthly Market Release Reserve 70 million; HELI Management Treasury 15 million (former founder, market-support and staking allocations combined).
- Shared monthly release cap: about 0.402247% of the supply already released and not burned (first month: 20,112.368685 HELI), over 720 months. This is an upper path, not a promise.
- Staking is cancelled. There is no monthly free dividend.
- At the 60-year close, only still-locked stock is burned; unsold released inventory is protected.

**Free initial allocation**
- Up to 1,000 verified people, 1,000 HELI each, one allocation per person, during the first six months.
- Identity checks use a third-party provider (Didit). A seven-day waiting period follows registration; a registration can be disputed only in that window and appealed within six months.

**Management Treasury and market**
- No new treasury releases in the first 12 months. Afterward the treasury shares the monthly cap: at most 20% of monthly capacity and one quarter of releases outside the treasury.
- All treasury releases in a month together may not exceed 2% of resting outside bid depth.
- Prices come from a 24-hour reference built only from **outside** bids that rested at least an hour; the project's own orders never count. A reference needs at least 1,000 quote units of outside bids (the exact minimum is fixed at launch).
- Sales: at least 95% of the reference (without a reference: at least the opening auction price). Reserve-funded bids: at most 105% of the reference. Orders expire after about 24 hours.
- Crash exception: if outside buyers disappear, the reserve may still buy, at most at 95% of the last outside reference (or of the auction price if that reference is older than 30 days), and at most 10% of the reserve per month.

**Treasury and keys**
- Sale revenue returns to the project reserve. Expenses wait seven days, can be cancelled, and can never be paid back into project accounts. After the 60-year close, revenue can still pay expenses under the same limits.
- An administrative pause halts sales, treasury operations and expenses, but never the monthly release rule.
- An offline recovery key can replace a lost administrator key after seven days.

A project reserve is not a guaranteed redemption backing. HELI makes no claim of guaranteed price, returns or liquidity.

## Status — 4 October 2026

| Area | Status |
|---|---|
| Program (V22) | Built reproducibly (Agave 2.1.21). ELF SHA-256 `d35b5917198c043184f67befcd702a7806d39a3de331e30aed62fc6132d09c40`. |
| Local tests | All 720 monthly periods and treasury, price, governance, expense and entitlement controls pass in a local Solana simulator (LiteSVM) with the real program and Manifest binaries; Node suite 107/107. Counts are overlapping local checks, not an audit. |
| Identity pilot | Live tests with real documents by the project owner: duplicate person caught, manual review, lost-link recovery and phone wallet-to-browser handoff passed. Identity only; no tokens distributed. |
| Website | Published on Cloudflare Pages with the V22 rules. |

Details: [`heli-v20-package/V22_DURUM.md`](heli-v20-package/V22_DURUM.md), [`reviews/v22/V22_DUZELTME_2026-10-04.md`](reviews/v22/V22_DUZELTME_2026-10-04.md), [`reviews/KIMLIK_CANLI_TEST_LISTESI.md`](reviews/KIMLIK_CANLI_TEST_LISTESI.md).

## Remaining work

- Devnet deployment with a real Manifest market and the keeper, then continuous-operation tests.
- Verifiable build (`solana-verify`) and an independent security audit before any mainnet decision.
- Permanent hosting and own domain for the website and identity service.
- Legal and privacy review for the chosen jurisdiction.

No wallet secrets or personal identity data are included in this repository.

## Türkçe

HELI, Solana üzerinde kurallı para arzını ve insanlara dağıtımı araştıran bir deneydir. Güncel tasarım V22'dir: yerel Solana testlerinden ve canlı kimlik pilot testlerinden geçti. Devnet veya ana ağda yayınlanmış değildir ve bağımsız güvenlik denetiminden geçmemiştir. Ayrıntılı durum: `heli-v20-package/V22_DURUM.md`.
