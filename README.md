# Charta (CHTA) — Solana monetary experiment

Token name **Charta**, symbol **CHTA**. The working name was HELI; program, folder and variable names (`heli_core_v20`, `heli-v20-package`, `OFFER_HELI` …) keep it, so the code and earlier reviews stay comparable.

Charta is an experimental token design exploring a rule-based alternative monetary system on Solana. This repository holds the program source, tests, operating tools and review records. **Nothing is deployed to Devnet or mainnet, and the code has not had an independent security audit.**

Website: https://heli-experiment.pages.dev · Full rules: [`heli-v20-package/heli/website/charta-rules.txt`](heli-v20-package/heli/website/charta-rules.txt)

## Rules (V23 design)

**Supply**
- Initial mint: 100 million CHTA. Initial burn: 10 million. Maximum remaining supply: 90 million.
- Initial release base: 5 million, all sold through the opening auction and the market. There is no free allocation, presale or private round.
- Opening auction: one bid per wallet, at most 250,000 CHTA (5% of the 5 million offer). CHTA the auction does not sell stays in the project inventory and is sold only under the market sale floor.
- Locked: Monthly Market Release Reserve 70 million; Charta Management Treasury 15 million (former founder, market-support and staking allocations combined).
- Shared monthly release cap: about 0.402247% of the supply already released and not burned (first month: 20,112.368685 CHTA), over 720 months. About 4.9% a year is an upper bound, not a forecast. Unsold released inventory still counts as released supply in that base.
- Staking is cancelled. There is no monthly free dividend.
- At the 60-year close, only still-locked stock is burned; unsold released inventory is protected.

**Management Treasury and market**
- No new treasury releases in the first 12 months. Afterward the treasury shares the monthly cap: at most 20% of monthly capacity and one quarter of releases outside the treasury.
- All treasury releases in a month together may not exceed 2% of outside bids that rested at least an hour, priced no lower than 98% of the reference.
- Prices come from a 24-hour reference built only from **outside** bids that rested at least an hour; the project's own orders never count. A reference needs a minimum of outside bids that is fixed at launch (at least 25 quote units).
- Sales: at least 95% of the reference (without a live reference: at least the larger of the opening auction price and 95% of the last outside reference if it is at most 30 days old). Reserve-funded bids: at most 105% of the reference; without a reference only under the crash exception. Orders expire after about 24 hours.
- All reserve-funded bids together, normal and crash, may not exceed 10% of the project quote reserve over any rolling 30 days; cancelling an unfilled bid gives its share back. The project's own orders never trade with each other: while a reserve-funded bid may still rest (two days, and until its expiry slot on the market), project and management asks must be priced above it and direct release sales pause, and reserve-funded bids must be priced below any resting project or management ask. Each reserve-funded bid is at least 1/16 of the 30-day bid budget. A project floor, fixed after the opening auction and at least 120 quote units, can never be moved to market orders.
- Crash exception: if outside bids stay below the minimum depth for at least 24 hours, confirmed by observations no more than two hours apart, the reserve may still buy, at most at 95% of the last outside reference (or of the auction price if that reference is older than 30 days), within the same 10% rolling cap.

**Treasury and keys**
- Sale revenue returns to the project reserve. Expenses are paid straight from the project reserve when an approved expense is paid, never moved ahead of time. Sale revenue is 100% spendable; beyond it, reserve spending over any rolling 30 days is limited to 25% a year of the reserve (25%/12 per 30 days) and keeps the project floor. The fixed technical cost (server, RPC) has its own allowance of 12 quote units per rolling 30 days (10 plus a 20% margin) that neither the project floor nor other spending can block, so the system keeps running. Expenses wait seven days, can be cancelled by the administrator or the offline recovery key and can never be paid back into project accounts. After the 60-year close, revenue can still pay expenses under the same limits, and price observations continue.
- An administrative pause halts sales, treasury operations and expenses, but never the monthly release rule.
- An offline recovery key can replace a lost administrator key after seven days.
- Until the audit the program is upgradeable. The administrator and the manager may be the same key; the pause has no time limit; the administrator or the offline recovery key can cancel a pending expense.
- Team trading commitment: the founder and team trade CHTA only from publicly declared wallets, never from undisclosed accounts. Team and any market-maker wallet addresses will be published before launch. (The program cannot tell personal wallets apart, so this is a public commitment, not a code rule.)

A project reserve is not a guaranteed redemption backing. Charta makes no claim of guaranteed price, returns or liquidity.

## Status — 5 October 2026

| Area | Status |
|---|---|
| Program (V23) | Built reproducibly (Agave 2.1.21); 1.01 MB (upload rent ~7.04 SOL). ELF SHA-256 `ce1949d9b35ca102b4e1ca515d1f26c3808e4cf0880f3063ad5bb98c49cbbc43`. |
| Local tests | All 720 monthly periods and treasury, price, governance, expense and entitlement controls pass in a local Solana simulator (LiteSVM) with the real program and Manifest binaries; two red-team runs (61 attacks incl. a malicious administrator, 32 outside-only attacks) were all blocked; Node suite 114/114. Counts are overlapping local checks, not an audit. |
| Devnet | Not deployed. Setup runner, read-only readiness check and guide are ready (`heli-v20-package/heli/solana-v20/DEVNET.md`); the pre-auction setup was rehearsed on a local Agave 4.0 validator with the real Manifest and Metaplex binaries. |
| Free allocation | Removed by owner decision (4 October 2026). The earlier identity-verified free allocation and its live pilot tests are archived in `reviews/`; the program rejects those instructions. |
| Website | The repository copy is current (Charta name, V23 rules). The published Cloudflare Pages copy predates the rename and needs a new deploy. |

Details: [`heli-v20-package/V23_DURUM.md`](heli-v20-package/V23_DURUM.md), [`reviews/v23/V23_NOTLAR.md`](reviews/v23/V23_NOTLAR.md), [`reviews/v22/V22_DUZELTME_2026-10-04.md`](reviews/v22/V22_DUZELTME_2026-10-04.md), [`reviews/KIMLIK_CANLI_TEST_LISTESI.md`](reviews/KIMLIK_CANLI_TEST_LISTESI.md).

## Remaining work

- Devnet deployment with a real Manifest market and the keeper (scripts ready; needs the program key, Devnet keys, ~14 test SOL and a test USDC mint), then continuous-operation tests.
- Verifiable build (`solana-verify`) and an independent security audit before any mainnet decision.
- Permanent hosting and own domain for the website.
- Legal and privacy review for the chosen jurisdiction.

No wallet secrets or personal data are included in this repository.

## Türkçe

Charta (CHTA), Solana üzerinde kurallı para arzını araştıran bir deneydir (çalışma adı HELI idi; kod içindeki adlar değişmedi). Ücretsiz dağıtım yoktur; 5 milyon CHTA açılış ihalesi ve piyasa yoluyla satılır. İhalede bir cüzdan en fazla 250.000 CHTA (teklifin %5'i) isteyebilir. Güncel tasarım V23'dir: yerel Solana simülatör testlerinden geçti (eski kimlik pilotu arşivdedir). Devnet veya ana ağda yayınlanmış değildir ve bağımsız güvenlik denetiminden geçmemiştir. Ayrıntılı durum: `heli-v20-package/V22_DURUM.md`.
