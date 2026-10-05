// Network settings for the live pages. "programId" stays null until the program is deployed; the auction page then
// explains that the auction has not opened yet instead of reading the chain.
window.CHARTA_CONFIG = {
  cluster: 'devnet',
  rpcUrl: 'https://api.devnet.solana.com',
  programId: null,
  refreshSeconds: 10
};
