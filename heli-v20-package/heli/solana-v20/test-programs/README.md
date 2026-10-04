# Test-only programs

`mpl_token_metadata-1.14.0-353d01b-local.so` — Metaplex Token Metadata, built locally **for LiteSVM tests only**.

- Source: https://github.com/metaplex-foundation/mpl-token-metadata, commit `353d01b` (program version 1.14.0)
- Toolchain: Agave 2.1.21 `cargo-build-sbf` (platform-tools v1.43); `ahash` pinned to 0.7.8 / 0.8.11 in the lockfile so it compiles
- SHA-256: `03661ba5245d3183fffd1c692c217cd1fb9c20ee23c69afc169335841a86818f`

This is **not** the binary deployed on mainnet at `metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s`; the mainnet
program could not be downloaded from this environment. It is used to exercise HELI's `create_token_metadata`
CPI (CreateMetadataAccountV3). The CPI must be re-checked against the deployed Metaplex program on Devnet.
