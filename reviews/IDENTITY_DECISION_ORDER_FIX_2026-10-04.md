# HELI identity decision ordering update

Base: `044ef8cd4165e41f4535e756e31636b906329270`, branch `claude/heli-v20-token-review-6gocpn`.

## Problem and change

A pending provider refresh could return an old Approved decision after a newer webhook had already rejected the application. The old result could overwrite the rejection and allow a new claim attestation. Manual approval had the same ordering problem.

Every applied decision now increments a persisted application revision. Provider fetches capture the revision and session ID; both are checked again at the synchronous state-write boundary. Concurrent decisions reject the pending operation with `Identity decision changed; refresh again`; clients can retry their status refresh without starting another identity session. The existing HTTP response remains a generic retry/status error. No new claim attestation is issued by a rejected refresh.

When the provider supplies `updated_at` or `updatedAt`, older decisions are rejected before changing state. Invalid timestamps are rejected. An automatic approval with the same timestamp cannot reverse a non-approved decision; a newer timestamp or an explicit fresh manual review is required. A rejection with the same timestamp can still revoke local approval. Numeric Unix seconds, milliseconds and parseable date strings are supported.

Manual overrides are installed only after freshness and identity checks pass. Existing wallet-session recovery, manual-review criteria, age checks, document/person uniqueness and audit records are retained. No token policy, Rust program, allocation or individual identity approval is changed.

## Verification

- 104 local Node test cases passed: 94 existing non-SVM cases plus 10 new decision-order regression cases.
- Negative control: the same 10 cases against the unchanged base admission code produced 8 failures and 2 passes, confirming the regression tests distinguish the vulnerable behavior.
- Synthetic keys, in-memory test storage and mocked provider decisions only. No live identity API request, deployment, fund transfer or external compilation.
- Native Rust/LiteSVM tests were not rerun for this JavaScript-only change. These results are test cases, not transactions or real users.
- Logs are retained locally under `heli/identity-update/`.

## Limits and rollout

Without a provider decision timestamp, revision checks stop in-flight races but cannot prove that a later provider response is itself fresh. Already-issued attestation revocation and multi-process storage concurrency are separate concerns; this patch does not claim to solve them. Manual review remains an authorized operator decision, not proof of unique personhood.

This is a source update for review. The running identity pilot must be separately updated and restarted before receiving the fix. No mainnet/devnet program deployment is needed for this service change.
