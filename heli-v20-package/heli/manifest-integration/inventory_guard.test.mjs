import test from 'node:test';
import assert from 'node:assert/strict';
import { HELI_UNIT, planUnusedFreeRelease, planProjectAsk } from './inventory_guard.mjs';

const U = HELI_UNIT;
const pair = { marketAddress: 'M', configuredMarketAddress: 'M', heliMint: 'H',
  configuredHeliMint: 'H', quoteMint: 'Q', configuredQuoteMint: 'Q' };

test('auction buyer claim is reserved before withdrawal; no double sale', () => {
  const auction = { finalized: true, soldHeli: 3_000_000n,
    bids: [{ allocatedHeli: 3_000_000n, claimed: false }] };
  const before = { ...pair, marketInventoryAtoms: 4_000_000n * U,
    marketRemainingAtoms: 4_000_000n * U, auction };
  assert.equal(planProjectAsk({ ...before, requestedAtoms: 1_000_000n * U }).availableAtoms, 1_000_000n * U);
  assert.throws(() => planProjectAsk({ ...before, requestedAtoms: 1_000_001n * U }), /exceeds/);
  const afterClaim = { ...before, marketInventoryAtoms: 1_000_000n * U,
    marketRemainingAtoms: 1_000_000n * U,
    auction: { ...auction, bids: [{ allocatedHeli: 3_000_000n, claimed: true }] } };
  assert.equal(planProjectAsk({ ...afterClaim, requestedAtoms: 1_000_000n * U }).availableAtoms, 1_000_000n * U);
});

test('an empty auction permits all 4m but never a second offer beyond the vault', () => {
  const input = { ...pair, marketInventoryAtoms: 4_000_000n * U,
    marketRemainingAtoms: 4_000_000n * U,
    auction: { finalized: true, soldHeli: 0n, bids: [] } };
  assert.equal(planProjectAsk({ ...input, requestedAtoms: 4_000_000n * U }).askAtoms, 4_000_000n * U);
  assert.throws(() => planProjectAsk({ ...input, marketInventoryAtoms: 0n,
    marketRemainingAtoms: 0n, requestedAtoms: 1n }), /exceeds/);
});

test('wrong market and inconsistent auction accounting fail closed', () => {
  const input = { ...pair, marketInventoryAtoms: 4_000_000n * U,
    marketRemainingAtoms: 4_000_000n * U,
    auction: { finalized: true, soldHeli: 1n, bids: [{ allocatedHeli: 1n, claimed: false }] },
    requestedAtoms: U };
  assert.throws(() => planProjectAsk({ ...input, marketAddress: 'X' }), /Wrong/);
  assert.throws(() => planProjectAsk({ ...input, marketRemainingAtoms: 3_000_000n * U }), /mismatch/);
  assert.throws(() => planProjectAsk({ ...input, auction: { ...input.auction, soldHeli: 2n } }), /mismatch/);
});

test('only unclaimed free entitlement stays reserved at month six', () => {
  const out = planUnusedFreeRelease({ launchRemainingAtoms: 900_000n * U,
    launchVaultAtoms: 900_000n * U, people: 300, claimed: 100, finalized: false });
  assert.equal(out.reservedForPeopleAtoms, 200_000n * U);
  assert.equal(out.releasableAtoms, 700_000n * U);
  assert.throws(() => planUnusedFreeRelease({ launchRemainingAtoms: 900_000n * U,
    launchVaultAtoms: 900_000n * U, people: 300, claimed: 301, finalized: false }), /integer|mismatch/);
  assert.throws(() => planUnusedFreeRelease({ launchRemainingAtoms: 900_000n * U,
    launchVaultAtoms: 900_000n * U, people: 300, claimed: 100, finalized: true }), /already finalized/);
});
