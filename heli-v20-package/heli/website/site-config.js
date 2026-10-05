// Network settings for the live pages. "programId" stays null until the program is deployed; the auction page then
// explains that the auction has not opened yet instead of reading the chain.
window.CHARTA_CONFIG = {
  cluster: 'devnet',
  rpcUrl: 'https://api.devnet.solana.com',
  programId: null,
  // Published with the deployment: SHA-256 and byte length of the deployed ELF (the program address is compiled in,
  // so it differs from the local V23 build). The Verify page compares the code on chain with it.
  expectedProgram: null,
  refreshSeconds: 10
};
