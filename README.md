# HELI — Solana monetary experiment

HELI is an experimental token design exploring a rule-based alternative monetary system on Solana. This repository holds the program source, tests, operating tools and review records. **Nothing is deployed to Devnet or mainnet, and the code has not had an independent security audit.**

Website: https://heli-experiment.pages.dev · Full rules: [`heli-v20-package/heli/website/heli-rules.txt`](heli-v20-package/heli/website/heli-rules.txt)

## Rules (V22 design)

**Supply**
- Initial mint: 100 million HELI. Initial burn: 10 million. Maximum remaining supply: 90 million.
- Initial release base: 5 million, all sold through the opening auction and the market. There is no free allocation, presale or private round.
- Locked: Monthly Market Release Reserve 70 million; HELI Management Treasury 15 million (former founder, market-support and staking allocations combined).
- Shared monthly release cap: about 0.402247% of the supply already released and not burned (first month: 20,112.368685 HELI), over 720 months. About 4.9% a year is an upper bound, not a forecast. Unsold released inventory still counts as released supply in that base.
- Staking is cancelled. There is no monthly free dividend.
- At the 60-year close, only still-locked stock is burned; unsold released inventory is protected.

**Management Treasury and market**
- No new treasury releases in the first 12 months. Afterward the treasury shares the monthly cap: at most 20% of monthly capacity and one quarter of releases outside the treasury.
- All treasury releases in a month together may not exceed 2% of outside bids that rested at least an hour, priced no lower than 98% of the reference.
- Prices come from a 24-hour reference built only from **outside** bids that rested at least an hour; the project's own orders never count. A reference needs at least 1,000 quote units of outside bids (the exact minimum is fixed at launch).
- Sales: at least 95% of the reference (without a live reference: at least 95% of the last outside reference if it is at most 30 days old, otherwise the opening auction price). Reserve-funded bids: at most 105% of the reference; without a reference only under the crash exception. Orders expire after about 24 hours.
- All reserve-funded bids together, normal and crash, may not exceed 10% of the project quote reserve over any rolling 30 days; cancelling an unfilled bid gives its share back. At least 1,000 quote units of the reserve can never be moved to market orders.
- Crash exception: if outside bids stay below the minimum depth for at least 24 hours, confirmed by observations no more than two hours apart, the reserve may still buy, at most at 95% of the last outside reference (or of the auction price if that reference is older than 30 days), within the same 10% rolling cap.

**Treasury and keys**
- Sale revenue returns to the project reserve. Expenses wait seven days, can be cancelled, and can never be paid back into project accounts. After the 60-year close, revenue can still pay expenses under the same limits, and price observations continue.
- An administrative pause halts sales, treasury operations and expenses, but never the monthly release rule.
- An offline recovery key can replace a lost administrator key after seven days.
- Until the audit the program is upgradeable. The administrator and the manager may be the same key; the pause has no time limit; auction proceeds can be moved into the expense treasury immediately (each expense still waits seven days).
- Team trading commitment: the founder and team trade HELI only from publicly declared wallets, never from undisclosed accounts. Team and any market-maker wallet addresses will be published before launch. (The program cannot tell personal wallets apart, so this is a public commitment, not a code rule.)

A project reserve is not a guaranteed redemption backing. HELI makes no claim of guaranteed price, returns or liquidity.

## Status — 4 October 2026

| Area | Status |
|---|---|
| Program (V22) | Built reproducibly (Agave 2.1.21). ELF SHA-256 `aa98f41cf446fb0ca2848601b720238f02ebd04e035fee548eed0636bd4b8072`. |
| Local tests | All 720 monthly periods and treasury, price, governance, expense and entitlement controls pass in a local Solana simulator (LiteSVM) with the real program and Manifest binaries; Node suite 113/113. Counts are overlapping local checks, not an audit. |
| Free allocation | Removed by owner decision (4 October 2026). The earlier identity-verified free allocation and its live pilot tests are archived in `reviews/`; the program rejects those instructions. |
| Website | Published on Cloudflare Pages with the V22 rules. |

Details: [`heli-v20-package/V22_DURUM.md`](heli-v20-package/V22_DURUM.md), [`reviews/v22/V22_DUZELTME_2026-10-04.md`](reviews/v22/V22_DUZELTME_2026-10-04.md), [`reviews/KIMLIK_CANLI_TEST_LISTESI.md`](reviews/KIMLIK_CANLI_TEST_LISTESI.md).

## Remaining work

- Devnet deployment with a real Manifest market and the keeper, then continuous-operation tests.
- Verifiable build (`solana-verify`) and an independent security audit before any mainnet decision.
- Permanent hosting and own domain for the website.
- Legal and privacy review for the chosen jurisdiction.

No wallet secrets or personal data are included in this repository.

## Türkçe

HELI, Solana üzerinde kurallı para arzını araştıran bir deneydir. Ücretsiz dağıtım yoktur; 5 milyon HELI açılış ihalesi ve piyasa yoluyla satılır. Güncel tasarım V22'dir: yerel Solana simülatör testlerinden geçti (eski kimlik pilotu arşivdedir). Devnet veya ana ağda yayınlanmış değildir ve bağımsız güvenlik denetiminden geçmemiştir. Ayrıntılı durum: `heli-v20-package/V22_DURUM.md`.
