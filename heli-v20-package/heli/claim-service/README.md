# HELI V20 wallet → identity → initial entitlement → claim

> **Archived (4 October 2026).** The free initial allocation was removed by owner decision and its instructions
> (`issue_credential`, `enroll_launch`, `claim_launch`, …) were deleted from the program to shrink the ELF.
> This service is not used at launch. It keeps a frozen copy of the last IDL that had those instructions
> (`archived-idl.json`) so its offline tests still run; against the current program every registration
> is refused because the instruction no longer exists.

## October 3 update: identity-only connection before Devnet

`HELI_MODE=identity` runs real Didit verification without a Solana connection,
token registration, sponsor or token delivery. HTTPS is mandatory. Enrollment
and claim controls are hidden, simulated approval endpoints are disabled, and
the API refuses transaction preparation/submission. A temporary HTTPS tunnel
is a pilot only: its hostname changes on restart and access ends when stopped.

`start-identity.mjs HTTPS_ORIGIN` reads approved credentials from `.private/`,
which is excluded from source uploads. The stable person HMAC secret is generated
once; retain its private backup. The launcher also requires a verified workflow
policy record. Actual chain verifier and sponsor keys are not generated for this
identity-only test. The server listens locally on port 8782.

Live webhooks now enqueue only authenticated routing metadata in SQLite before
acknowledging receipt. Provider decisions are retrieved by a single background
worker, retried with capped exponential backoff, and deduplicated by event ID.
Raw webhook identity decisions, document numbers and images are not queued.
Both `status.updated` and `data.updated` refresh the provider decision. Existing
attestation checks still re-fetch the current decision before chain delivery.

`node --test heli/claim-service/tests/claim.test.mjs heli/claim-service/tests/identity.test.mjs`:
20 tests passed, including durable queue retries, authenticated transport-test
acknowledgement without admission, and identity-only restrictions.
Live connection checks on October 3 passed: public HTTPS config reports identity
mode with chain delivery disabled; Didit's console test received HTTP 200;
an existing approved decision was read with matching workflow; one disposable
wallet signed the application challenge and created one live, unverified session.
No identity document or face was submitted in that new session. The remaining
end-to-end check is a real applicant completing phone verification and receiving
the wallet-bound result. Coin registration/delivery and Devnet remain closed.

The workflow editor route uses group ID `2856c2d4-eac4-45a9-b13d-09ebe05481f7`;
the Workflows table exposes published API ID
`a8a9365f-3306-4f9f-849a-4a565580f35d`. Use the published API ID for session
creation and decision binding. The group/editor ID is not accepted there.

Implemented October 2, 2026. English phone interface, Didit Sessions v3 adapter,
authenticated result handling, persistent SQLite state, V20 sponsored registration
and claim transactions. This directory is separate from the public static site.

## Run the safe local demonstration

`node heli/claim-service/server.mjs`

Open http://127.0.0.1:8781/. Use the temporary test wallet and a fictional person
code. The time-advance and simulated-approval buttons exist only in demo mode.
No real provider session or token transfer occurs in this browser demonstration.

## Verification completed

- 17 automated service tests passed: wallet ownership, result binding, duplicate
  reservations, warnings/review rejection, webhook HMAC and timestamps, repeated
  events, status revocation, private state persistence, foreign origins, account
  decoding and early/repeated claim rejection.
- One additional acceptance test executed the existing compiled V20 program in
  LiteSVM. The new JavaScript transaction builder supplied the real serialized
  transactions. Native Ed25519 credential verification and sponsored registration
  succeeded for a zero-SOL applicant. An early claim failed; after seven simulated
  days, exactly 1,000 HELI reached the wallet-owned associated token account.
  A second claim and reuse by another wallet failed. The applicant still had zero
  SOL. The provider response was synthetic; this is not a real Didit/Devnet test.
- Browser demonstration completed all four steps, with no real document input.

Commands: `node --test heli/claim-service/tests/claim.test.mjs` and
`node --test heli/claim-service/tests/v20-svm.test.mjs`. The latter requires the
existing workspace's Python/Solders dependency access. No compiler upload was
needed because V20's on-chain code did not change.

## Live Devnet configuration still needed

Use `.env.example` as a private environment template. This service does not load
or expose keys automatically. Required: deployed V20 plus initialized identity
policy, funded Devnet fee payer, an Ed25519 verifier matching that policy, a Didit
API key and webhook signing secret, confirmed published workflow settings, and
a public HTTPS reverse proxy to this loopback service. No mainnet mode exists.

Register Didit's destination as the HTTPS service's `/webhooks/didit`, with V3
status.updated deliveries. The browser callback `/` is a redirect only: callback
query parameters can never approve an application. API results are fetched
server-side and matched to the stored provider session, internal application ID
and workflow. Only an approved identity with all required checks and explicit
empty warning/match arrays can receive an attestation. In Review never grants one.
Only the application ID is sent as vendor_data; the provider receives no wallet
address from this integration.

Didit webhook verification uses the documented **X-Signature raw-body method**,
constant-time HMAC comparison and a five-minute timestamp window. Properly signed
console transport tests return 200 without enqueueing, querying or approving an
applicant; ordinary admission rejects test deliveries. It does not confuse
canonical-JSON X-Signature-V2 with a raw-body HMAC,
and it never accepts the weak envelope-only Simple signature. The decision API
is fetched by the durable queue worker before applying a result; provider
failures fail closed and retry with backoff. Event IDs and decision application
are idempotent. Network decision calls do not delay webhook acknowledgement.

## Duplicate handling and privacy

Document and available national-person identifiers are converted to secret-key
HMACs before storage. Raw provider decisions, names, document numbers, images
and face templates are not persisted or returned to the browser. The HMAC secret
must stay stable and be backed up privately: rotating it without migration loses
the deduplication mapping. These are pseudonymous personal records, not anonymous
data; access and retention policies still apply.

HMAC document keys alone do not identify every person across different documents.
Shared national identifiers catch that case when available; otherwise it depends
on Didit's configured face/document duplicate detection. Any cross-session match
or warning blocks automatic admission and goes to review. An undocumented stable
PID is not assumed. Separate family members with distinct accepted records are
allowed. Cross-document and family acceptance still need real-provider testing.

SQLite commits state durably; a file lock enforces a single writer process. This
pilot is not a multi-instance service. A crash can leave a lock file: establish
that no writer is running before removing the stale lock. Secrets and database
must be outside public uploads and restricted to the service account. Production
requires durable job processing, monitoring, rate-limit tuning and retention/
appeal policy. The sponsor is only a fee-paying service under the single operator,
not an additional human approver. It refuses arbitrary transactions, altered
messages, missing applicant signatures and spending above its daily cap.

The static Cloudflare site remains closed for real claims. Once the public HTTPS
service and Devnet test pass, its Claim HELI button can link to this service.
Never publish localhost URLs or a private one-person verification session there.

## Primary API references

- [Create session](https://docs.didit.me/sessions-api/create-session)
- [Retrieve decision](https://docs.didit.me/sessions-api/retrieve-session)
- [Webhook signatures](https://docs.didit.me/integration/webhooks)
- [V3 result models](https://docs.didit.me/reference/data-models)

## Browser transition — 2026-10-03

The application begins on this site. A mobile injected wallet completes wallet ownership, then Continue identity verification displays a browser transition panel. Open, copy or share the private application link into Safari/Chrome. Credentials travel only in the fragment, are removed with replaceState before API calls, and restore the existing application without a second Didit session. The authenticated status endpoint returns the original verification URL. Didit returns to the same origin and normal-browser storage retains the application.

Wallet browsers may keep target=_blank links inside their app; the copy/paste fallback is required. This build does not claim to force iOS to open an external browser, resolve denied OS camera permissions, or provide a Phantom mobile connect deep-link protocol. Real-device end-to-end validation is still pending. Manual provider approval does not bypass duplicate/face/document checks in admission.

23 automated tests pass, including cross-browser application recovery without creating an additional provider session.

## Visible refresh result

Refresh status now displays a loading state followed by a prominent declined/approved/review result card, the last check time, and an explicit failure card for request errors. User-triggered refresh scrolls the result into view. Requests time out after 20 seconds and overlapping status checks are suppressed. A browser workflow test verifies rejection, network failure and recovery without creating another application. 24 automated tests pass; a local declined fixture was visually checked.
