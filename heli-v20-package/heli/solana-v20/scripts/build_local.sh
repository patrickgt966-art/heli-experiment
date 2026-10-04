#!/usr/bin/env bash
# Local, reproducible build of heli_core_v20 with a pinned public toolchain (no Solana Playground).
# Verified 2026-10-04: identical ELF hash on clean rebuilds in the review environment.
#   Toolchain: Agave v2.1.21 release (solana-cargo-build-sbf 2.1.21, platform-tools v1.43)
#   Download:  https://github.com/anza-xyz/agave/releases/download/v2.1.21/solana-release-x86_64-unknown-linux-gnu.tar.bz2
#   Lockfile:  Cargo.lock is format version 3 (platform-tools cargo 1.75 cannot read v4; blake3 pinned to 1.5.5).
#              Newer host cargo may rewrite it to v4 when Cargo.toml changes; reset with:
#              sed -i 's/^version = 4$/version = 3/' Cargo.lock
# Older toolchains (Solana 1.18.26 / platform-tools v1.41) and the original single-instruction
# setup accounts produce >4 KB stack frames that crash at runtime; see reviews/ for details.
set -euo pipefail
cd "$(dirname "$0")/.."
cargo-build-sbf --version | grep -q 'solana-cargo-build-sbf 2.1.21' || { echo 'Use Agave 2.1.21 cargo-build-sbf for a reproducible ELF'; exit 1; }
cargo-build-sbf
sed -i 's/^version = 4$/version = 3/' Cargo.lock
cp target/deploy/heli_core_v20.so heli_core_v20.so
python3 - <<'PY'
import hashlib,json
from pathlib import Path
names=['lib.rs','accounts.rs','calendar.rs','economics.rs','auction.rs','manifest_bridge.rs','identity.rs','release.rs','management.rs','market_release.rs']
src=hashlib.sha256(b''.join((Path('src')/n).read_bytes() for n in names)).hexdigest()
b=hashlib.sha256(Path('heli_core_v20.so').read_bytes()).hexdigest()
Path('compiled-source.json').write_text(json.dumps({'source_sha256':src,'binary_sha256':b,'toolchain':'agave-2.1.21/platform-tools-v1.43'},indent=2)+'\n')
print(src,b)
PY
