/**
 * HELI's user-owned secondary trading route through an existing Manifest market.
 * This module builds instructions only. The user's wallet signs and submits them.
 * It does not control the HELI mint, the launch vault, or any private key.
 */

function address(value) {
  if (value && typeof value.toBase58 === 'function') return value.toBase58();
  if (typeof value === 'string') return value;
  throw new TypeError('Expected a Solana public key');
}

function positiveFinite(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number`);
  }
}

export async function loadHeliMarket({ connection, marketAddress, heliMint, quoteMint, Market }) {
  if (!connection || !marketAddress || !heliMint || !quoteMint || !Market) {
    throw new TypeError('Connection, market, HELI mint, quote mint, and SDK Market are required');
  }
  const market = await Market.loadFromAddress({ connection, address: marketAddress });
  if (address(market.baseMint()) !== address(heliMint) ||
      address(market.quoteMint()) !== address(quoteMint)) {
    throw new Error('Market token pair does not match the announced HELI/quote pair');
  }
  return market;
}

export function orderBook(market) {
  return {
    bids: market.bids(),
    asks: market.asks(),
    bestBid: market.bestBidPrice(),
    bestAsk: market.bestAskPrice(),
  };
}

export async function prepareWallet({ connection, marketAddress, walletPublicKey, ManifestClient }) {
  if (!walletPublicKey) throw new TypeError('Wallet public key is required');
  // The caller submits these setup instructions with the user's wallet. It must
  // also partial-sign with wrapperKeypair when the SDK returns one.
  return ManifestClient.getSetupIxs(connection, marketAddress, walletPublicKey);
}

export async function connectTrader({ connection, marketAddress, walletPublicKey, ManifestClient }) {
  if (!walletPublicKey) throw new TypeError('Wallet public key is required');
  return ManifestClient.getClientForMarketNoPrivateKey(
    connection, marketAddress, walletPublicKey,
  );
}

export async function limitOrderInstructions({ client, OrderType, side, quantityHeli, priceQuotePerHeli, orderId }) {
  if (side !== 'buy' && side !== 'sell') throw new RangeError('side must be buy or sell');
  positiveFinite(quantityHeli, 'quantityHeli');
  positiveFinite(priceQuotePerHeli, 'priceQuotePerHeli');
  if (!Number.isSafeInteger(orderId) || orderId < 0) {
    throw new RangeError('orderId must be a nonnegative safe integer');
  }
  if (!OrderType || OrderType.Limit === undefined) throw new TypeError('SDK OrderType.Limit is required');
  return client.placeOrderWithRequiredDepositIxs({
    numBaseTokens: quantityHeli,
    tokenPrice: priceQuotePerHeli,
    isBid: side === 'buy',
    lastValidSlot: 0,
    orderType: OrderType.Limit,
    clientOrderId: orderId,
  });
}

export function cancelOrderInstruction(client, orderId) {
  if (!Number.isSafeInteger(orderId) || orderId < 0) {
    throw new RangeError('orderId must be a nonnegative safe integer');
  }
  return client.cancelOrderIx(orderId);
}

export function withdrawAllInstructions(client) {
  return client.withdrawAllIx();
}
