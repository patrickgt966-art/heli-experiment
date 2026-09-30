# HELI — Solana monetary experiment

HELI is an experimental token design exploring a rule-based alternative monetary system on Solana. This repository introduces the project and records its development status; it does not contain a live token deployment.

## Proposed rules

- Initial mint: 100 million HELI, followed by a 10 million burn; maximum remaining supply: 90 million.
- Initial launch allocation: 5 million HELI, comprising up to 1 million for a free distribution and 4 million for market purchase.
- Human Dividend, staking, founder and liquidity allocations are subject to a common monthly release ceiling calculated from the net released token base.
- Maximum monthly growth is approximately 0.402247%, corresponding to an idealized 5 million to 90 million path over 720 months. Actual release may be lower because of burns, unused allocations and inactive periods.
- Founder sales are locked during the first 12 months and remain subject to release and market checks afterward.
- An opening auction determines initial allocation and clearing price. Subsequent trading uses an order book; demand and offers determine prices.
- Free distribution aims at one eligible real person per allocation. Real-world uniqueness depends on an identity provider and has not yet been validated in a live pilot.

## Development status — 30 September 2026

The V15 prototype has been compiled and tested locally with real Solana program binaries using LiteSVM. These are local execution tests, not Devnet deployment results.

- Three scenarios each completed 720 monthly periods, including recovery after a ten-month interruption.
- A 1,000-bidder auction regression checked proportional allocation, refunds and duplicate claim rejection.
- 33 maintenance-runner and mobile/sponsor tests passed.
- A token-donation denial-of-service issue affecting project sell orders was found, corrected and regression-tested.
- Maintenance code prepares monthly closing and price observations with a separate fee wallet, a spending ceiling and a durable transaction journal.

The hypothetical 1,000-person monthly scenario uses a synthetic registry count for accounting stress testing; it does not demonstrate verification of 1,000 real people. Test counts do not imply an independent security audit.

## Remaining work

- Public Devnet deployment and continuous-operation acceptance tests.
- Independent security review before any mainnet decision.
- Administrator/verifier key recovery and upgrade-authority policy.
- Real identity-provider integration, HTTPS hosting and mobile-wallet acceptance testing.
- Further analysis of sustained order-book manipulation and operating costs.

HELI has not launched on mainnet. This repository makes no claim of guaranteed price, returns, redemption backing or self-financing operations. No wallet secrets or personal identity data are included.

## Türkçe

HELI, Solana üzerinde kurallı para arzını ve insanlara dağıtımı araştıran bir deneydir. V15 yerel Solana testlerinden geçti; Devnet veya ana ağda yayınlanmış değildir. Bu depo proje tanıtımı ve geliştirme durumunu içerir. Bağımsız güvenlik denetimi, canlı kimlik doğrulaması ve gerçek ağ kabul testleri beklemektedir.
