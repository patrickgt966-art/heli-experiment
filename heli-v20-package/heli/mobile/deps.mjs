import { createRequire } from 'node:module';
const local = createRequire(import.meta.url);
const pilot = createRequire(new URL('../solana/package.json', import.meta.url));
function load(name) { try { return local(name); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; return pilot(name); } }
export const web3 = load('@solana/web3.js');
export const spl = load('@solana/spl-token');
