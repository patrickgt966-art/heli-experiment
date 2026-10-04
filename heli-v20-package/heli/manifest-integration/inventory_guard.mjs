/**
 * Exact-atom accounting for the proposed HELI project-owned market inventory.
 * This is a local guard/model, not a Solana transaction or a Manifest CPI.
 */
export const HELI_UNIT = 1_000_000n;
export const FREE_CAP = 1_000_000n * HELI_UNIT;
export const FREE_PER_PERSON = 1_000n * HELI_UNIT;

function atoms(value, name) {
  if (typeof value !== 'bigint' || value < 0n || value > 18_446_744_073_709_551_615n) {
    throw new RangeError(`${name} must be nonnegative u64 atoms`);
  }
  return value;
}

function count(value, name) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 1_000) {
    throw new RangeError(`${name} must be an integer from 0 to 1000`);
  }
  return value;
}

export function planUnusedFreeRelease({ launchRemainingAtoms, launchVaultAtoms, people, claimed, finalized }) {
  if (finalized) throw new Error('Free remainder already finalized');
  const remaining = atoms(launchRemainingAtoms, 'launchRemainingAtoms');
  const vault = atoms(launchVaultAtoms, 'launchVaultAtoms');
  const enrolled = count(people, 'people');
  const paid = count(claimed, 'claimed');
  if (paid > enrolled || vault !== remaining) throw new Error('Free vault accounting mismatch');
  const outstanding = BigInt(enrolled - paid) * FREE_PER_PERSON;
  const expectedRemaining = FREE_CAP - BigInt(paid) * FREE_PER_PERSON;
  if (remaining !== expectedRemaining || remaining < outstanding) {
    throw new Error('Free entitlement accounting mismatch');
  }
  return Object.freeze({ reservedForPeopleAtoms: outstanding, releasableAtoms: remaining - outstanding });
}

export function planProjectAsk({
  marketInventoryAtoms, marketRemainingAtoms, auction, requestedAtoms,
  marketAddress, configuredMarketAddress, heliMint, configuredHeliMint,
  quoteMint, configuredQuoteMint,
}) {
  const inventory = atoms(marketInventoryAtoms, 'marketInventoryAtoms');
  const remaining = atoms(marketRemainingAtoms, 'marketRemainingAtoms');
  const requested = atoms(requestedAtoms, 'requestedAtoms');
  if (inventory !== remaining) throw new Error('Market inventory accounting mismatch');
  if (!auction?.finalized || !Array.isArray(auction.bids)) throw new Error('Opening auction must be finalized');
  if (!marketAddress || marketAddress !== configuredMarketAddress ||
      !heliMint || heliMint !== configuredHeliMint ||
      !quoteMint || quoteMint !== configuredQuoteMint) {
    throw new Error('Wrong HELI market or mint');
  }
  let allocated = 0n;
  let outstanding = 0n;
  for (const bid of auction.bids) {
    const allotment = atoms(bid.allocatedHeli, 'allocatedHeli') * HELI_UNIT;
    allocated += allotment;
    if (typeof bid.claimed !== 'boolean') throw new Error('Invalid auction claim status');
    if (!bid.claimed) outstanding += allotment;
  }
  if (allocated !== atoms(auction.soldHeli, 'soldHeli') * HELI_UNIT || outstanding > inventory) {
    throw new Error('Auction entitlement accounting mismatch');
  }
  const available = inventory - outstanding;
  if (requested === 0n || requested > available) throw new Error('Ask exceeds unreserved project inventory');
  return Object.freeze({ availableAtoms: available, reservedForAuctionAtoms: outstanding,
    askAtoms: requested, marketAddress });
}
