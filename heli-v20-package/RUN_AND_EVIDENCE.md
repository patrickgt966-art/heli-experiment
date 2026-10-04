# Reproduction and evidence

Run only in an isolated working copy. No live API keys, private wallets or real identity records are included. Do not run `start-identity.mjs`, probes, deployment or compiler-upload scripts for this review.

## Dependency setup

Node.js 24 LTS is the suggested review runtime (built-in node:sqlite and node:test). The root package.json pins the Solana JS packages used by the shared modules. `npm install` requires network; a lock file for this new review wrapper is not supplied. The original mobile pnpm-lock.yaml is provided for provenance, but its historical package also had additional features.

Python SVM tests require a compatible `solders` with LiteSVM (the original environment used 0.29.0). Rust source pins Anchor 0.29.0. A complete locally validated clean-room Solana compiler toolchain is not supplied. Do not treat a successful third-party compilation as a production audit.

## Fresh local tests — 4 October 2026

The following command passed **70 tests, 0 failures** in the existing project environment. Output is in FRESH_TEST_OUTPUT.txt. These are selected automated service/keeper/operations/adapter tests, not 70 real users or 70 public network transactions:

```sh
node --test heli/claim-service/tests/claim.test.mjs heli/claim-service/tests/identity.test.mjs heli/claim-service/tests/browser-handoff.test.mjs heli/keeper/tests/keeper.test.mjs heli/operations/tests/operations.test.mjs heli/manifest-integration/market_adapter.test.mjs heli/manifest-integration/inventory_guard.test.mjs
```

These include synthetic provider decisions, fake RPC/SDK fixtures and local HTTP fixtures. They do not prove actual phone cameras, Didit production behavior or Devnet compatibility.

## Existing local program evidence — not rerun during packaging

| Evidence | Recorded scope |
|---|---|
| solana-v20/market-release-svm-verification.json | 1,606 checks/transactions, compiled V20 + Manifest, 720 periods |
| keeper/v20-svm-verification.json | 4,348 checks/transactions, 1,442 maintenance jobs, 720 periods, local ELF execution |
| claim-service/v20-claim-svm-verification.json | JavaScript-sponsored transaction builder → V20 local ELF, synthetic provider, native Ed25519 checks, seven-day wait, single 1,000 HELI claim |
| claim-service/identity-connection-report.json | Historical live pilot connection observations; latest restart config HTTP 200, delivery disabled |
| application-entry-deployment.json | Cloudflare Success; public pages.dev accessibility not verified |

Counts overlap in scope and are not a single combined independent security score. A current clean rerun is stronger evidence than merely reading these result files.

Optional isolated SVM commands after Python dependencies are installed:

```sh
python heli/solana-v20/scripts/test_market_release_svm.py
python heli/keeper/tests/test_v20_svm.py
```

The keeper Python bridge starts `node` through PATH. The claim SVM test defaults to the original Windows Python path; set `HELI_TEST_PYTHON` to your own Python executable before:

```sh
node --test heli/claim-service/tests/v20-svm.test.mjs
```

Fixtures check the concatenated V20 source SHA-256 and ELF hash against compiled-source.json. Source order: lib.rs, accounts.rs, calendar.rs, economics.rs, auction.rs, manifest_bridge.rs, identity.rs, release.rs, management.rs, market_release.rs.

`prepare_acceptance.py` is a historical generator referencing V19; V19 is deliberately excluded. The generated V20 test and bootstrap are included, so do not run that generator. `manifest-integration/test_official_manifest_svm.py` is excluded because it uses an older fixture; current V20 tests include actual Manifest CPI execution.

## Review artifacts

FILE_MANIFEST.json contains hashes of included files (except itself and the generated chat source bundle). The actual source is preserved unchanged; this review wrapper adds documentation and dependency instructions only. External-service IDs and public/test addresses are not private keys. No assumption about current token price, guaranteed reserve coverage or legal jurisdiction is made.
