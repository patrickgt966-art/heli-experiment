import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadHeliMarket, orderBook, prepareWallet, connectTrader,
  limitOrderInstructions, cancelOrderInstruction, withdrawAllInstructions,
} from './market_adapter.mjs';

const key = (value) => ({ toBase58: () => value });
const market = {
  baseMint: () => key('HELI'), quoteMint: () => key('QUOTE'),
  bids: () => [{ price: 4 }], asks: () => [{ price: 5 }],
  bestBidPrice: () => 4, bestAskPrice: () => 5,
};
const Market = { loadFromAddress: async () => market };
const params = { connection: {}, marketAddress: key('MARKET'), heliMint: key('HELI'), quoteMint: key('QUOTE'), Market };

test('uses only the exact announced HELI/quote market', async () => {
  assert.equal(await loadHeliMarket(params), market);
  await assert.rejects(loadHeliMarket({ ...params, quoteMint: key('WRONG') }), /does not match/);
});

test('reads both sides and the best prices', () => {
  assert.deepEqual(orderBook(market), {
    bids: [{ price: 4 }], asks: [{ price: 5 }], bestBid: 4, bestAsk: 5,
  });
});

test('wallet setup and client creation use a public key, never a private key', async () => {
  const seen = [];
  const ManifestClient = {
    getSetupIxs: async (...args) => { seen.push(args); return { setupNeeded: true, instructions: ['seat'] }; },
    getClientForMarketNoPrivateKey: async (...args) => { seen.push(args); return 'client'; },
  };
  const input = { connection: params.connection, marketAddress: params.marketAddress,
    walletPublicKey: key('TRADER'), ManifestClient };
  assert.deepEqual(await prepareWallet(input), { setupNeeded: true, instructions: ['seat'] });
  assert.equal(await connectTrader(input), 'client');
  assert.deepEqual(seen[0], [params.connection, params.marketAddress, input.walletPublicKey]);
  assert.deepEqual(seen[1], seen[0]);
});

test('buy and sell are routed to the exchange limit-order instructions', async () => {
  const calls = [];
  const client = { placeOrderWithRequiredDepositIxs: async (p) => { calls.push(p); return ['deposit', 'order']; } };
  const OrderType = { Limit: 'limit' };
  const common = { client, OrderType, quantityHeli: 12, priceQuotePerHeli: 0.01, orderId: 7 };
  assert.deepEqual(await limitOrderInstructions({ ...common, side: 'buy' }), ['deposit', 'order']);
  assert.deepEqual(await limitOrderInstructions({ ...common, side: 'sell' }), ['deposit', 'order']);
  assert.equal(calls[0].isBid, true);
  assert.equal(calls[1].isBid, false);
  assert.equal(calls[1].numBaseTokens, 12);
  assert.equal(calls[1].tokenPrice, 0.01);
  assert.equal(calls[1].orderType, 'limit');
});

test('invalid orders cannot reach the exchange SDK', async () => {
  const client = { placeOrderWithRequiredDepositIxs: () => { throw new Error('unexpected'); } };
  const base = { client, OrderType: { Limit: 'limit' }, side: 'sell', quantityHeli: 1, priceQuotePerHeli: 1, orderId: 1 };
  await assert.rejects(limitOrderInstructions({ ...base, side: 'other' }), /side/);
  await assert.rejects(limitOrderInstructions({ ...base, quantityHeli: 0 }), /quantity/);
  await assert.rejects(limitOrderInstructions({ ...base, priceQuotePerHeli: NaN }), /price/);
  await assert.rejects(limitOrderInstructions({ ...base, orderId: -1 }), /orderId/);
});

test('cancel and withdraw are exchange instructions', () => {
  const client = { cancelOrderIx: (id) => `cancel:${id}`, withdrawAllIx: () => ['withdraw'] };
  assert.equal(cancelOrderInstruction(client, 9), 'cancel:9');
  assert.deepEqual(withdrawAllInstructions(client), ['withdraw']);
});
