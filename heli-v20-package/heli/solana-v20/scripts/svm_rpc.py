"""Time-machine local chain for rehearsals: a Solana JSON-RPC + websocket endpoint on 127.0.0.1 backed by LiteSVM,
with the compiled Charta ELF, the vendored Manifest ELF and the local Token Metadata test build loaded.

Unlike solana-test-validator, its clock can be moved forward (custom method charta_warp), so a whole launch (a
seven-day auction, monthly boundaries, seven-day expense waits) can be rehearsed in minutes with the unchanged
setup runner, keeper and website. Local use only: it binds to 127.0.0.1, holds synthetic keys and never touches a
public network. Requires the `websockets` package next to solders.

  python scripts/svm_rpc.py --upgrade-authority <ADMIN_PUBKEY> [--port 8899] [--pretend-devnet]

Implemented: the RPC methods used by @solana/web3.js in this repository (accounts, program accounts with filters,
token balances, blockhash, send/simulate, signature statuses and history, parsed transactions with token balances,
airdrop) and signatureSubscribe over the websocket on port+1.
"""
import argparse,asyncio,base64,hashlib,json,re,struct,threading,time
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from solders.litesvm import LiteSVM
from solders.pubkey import Pubkey
from solders.account import Account
from solders.transaction import VersionedTransaction
from solders.transaction_metadata import FailedTransactionMetadata
import websockets

ROOT=Path(__file__).resolve().parents[1]
CHARTA=Pubkey.from_string('DZbsSEnZxsfQf1HejcLk63BEDNqzAMXPgVxTq97Bd2zG')
MANIFEST=Pubkey.from_string('MNFSTqtC93rEfYHB6hF82sKdZpUDFWkViLByLd1k1Ms')
METADATA=Pubkey.from_string('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
TOKEN=Pubkey.from_string('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');TOKEN_2022=Pubkey.from_string('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')
GENESIS='CHArTAReHeArSaL1111111111111111111111111111'  # not Devnet: the setup runner then requires localValidator
DEVNET='EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG'

p=argparse.ArgumentParser();p.add_argument('--upgrade-authority',required=True);p.add_argument('--port',type=int,default=8899)
p.add_argument('--start',type=int,default=int(time.time()))
# The keeper pilot only runs against Devnet's genesis hash; a rehearsal can present it to run the keeper unchanged.
p.add_argument('--pretend-devnet',action='store_true')
# By default any blockhash stays valid (clients cache them across warps). With a validity in slots, an older
# blockhash is refused like on a real cluster, so expired-transaction handling can be tested.
p.add_argument('--blockhash-validity',type=int,default=0);args=p.parse_args()
if args.pretend_devnet:GENESIS=DEVNET

elf=(ROOT/'heli_core_v20.so').read_bytes()
assert hashlib.sha256(elf).hexdigest()==json.loads((ROOT/'compiled-source.json').read_text())['binary_sha256'],'ELF does not match compiled-source.json'
lock=threading.RLock()
# Blockhashes rotate after every transaction (clients cache them, as with a real cluster) but any recent one is
# accepted: a warp must not invalidate the blockhash a client fetched a moment before.
svm=LiteSVM().with_blockhash_check(False)
svm.add_program_from_file(CHARTA,ROOT/'heli_core_v20.so')
svm.add_program_from_file(MANIFEST,ROOT.parent/'manifest-integration/vendor-manifest/manifest-release-v3.0.24.so')
svm.add_program_from_file(METADATA,ROOT/'test-programs/mpl_token_metadata-1.14.0-353d01b-local.so')
PROGRAM_DATA=Pubkey.from_bytes(bytes(svm.get_account(CHARTA).data[4:36]))
a=svm.get_account(PROGRAM_DATA);d=bytearray(a.data);d[12]=1;d[13:45]=bytes(Pubkey.from_string(args.upgrade_authority))
svm.set_account(PROGRAM_DATA,Account(a.lamports,bytes(d),a.owner,a.executable,a.rent_epoch))
c=svm.get_clock();c.unix_timestamp=args.start;svm.set_clock(c)

issued={}       # blockhash -> slot it was issued at (for --blockhash-validity)
history={}      # signature -> record (slot, time, err, logs, tx, token balances)
by_address={}   # address -> [signatures], newest last
pending={}      # signature -> [(websocket, subscription id)]
loop=None

def now_slot():return svm.get_clock().slot
def rotate():svm.expire_blockhash();issued[str(svm.latest_blockhash())]=now_slot()
def advance(slots=1,seconds=0):
 c=svm.get_clock();svm.warp_to_slot(c.slot+slots);c=svm.get_clock();c.unix_timestamp+=seconds;svm.set_clock(c)
def ctx(v):return {'context':{'slot':now_slot()},'value':v}
def acct(a,data_slice=None):
 if a is None:return None
 data=bytes(a.data)
 if data_slice:data=data[data_slice['offset']:data_slice['offset']+data_slice['length']]
 return {'data':[base64.b64encode(data).decode(),'base64'],'executable':a.executable,'lamports':a.lamports,'owner':str(a.owner),'rentEpoch':0,'space':len(a.data)}
def b58(b):
 A='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';n=int.from_bytes(b,'big');s=''
 while n:n,r=divmod(n,58);s=A[r]+s
 return '1'*(len(b)-len(b.lstrip(b'\0')))+s
def unb58(s):
 A='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';n=0
 for ch in s:n=n*58+A.index(ch)
 raw=n.to_bytes((n.bit_length()+7)//8,'big') if n else b''
 return b'\0'*(len(s)-len(s.lstrip('1')))+raw
def err_json(e):
 r=repr(e);m=re.search(r'InstructionError\(\s*\(\s*(\d+),\s*Tagged\(\s*InstructionErrorCustom\(\s*(\d+)',r)
 if m:return {'InstructionError':[int(m[1]),{'Custom':int(m[2])}]}
 m=re.search(r'InstructionError\(\s*\(\s*(\d+),\s*(?:InstructionErrorFieldless\.)?(\w+)',r)
 if m:return {'InstructionError':[int(m[1]),m[2]]}
 return {'Other':r[:200]}
def token_balances(keys):
 out=[]
 for i,k in enumerate(keys):
  a=svm.get_account(k)
  if a is None or a.owner!=TOKEN or len(a.data)!=165:continue
  d=bytes(a.data);mint=Pubkey.from_bytes(d[:32]);m=svm.get_account(mint);dec=m.data[44] if m else 0;amt=struct.unpack_from('<Q',d,64)[0]
  out.append({'accountIndex':i,'mint':str(mint),'owner':str(Pubkey.from_bytes(d[32:64])),'programId':str(TOKEN),
   'uiTokenAmount':{'amount':str(amt),'decimals':dec,'uiAmount':amt/10**dec,'uiAmountString':str(amt/10**dec)}})
 return out
def record(sig,tx,err,logs,pre,post,keys):
 history[sig]={'slot':now_slot(),'time':svm.get_clock().unix_timestamp,'err':err,'logs':logs,'tx':tx,'pre':pre,'post':post}
 for k in keys:by_address.setdefault(str(k),[]).append(sig)
 for ws,sub in pending.pop(sig,[]):notify(ws,sub,sig)
def notify(ws,sub,sig):
 msg=json.dumps({'jsonrpc':'2.0','method':'signatureNotification','params':{'result':{'context':{'slot':history[sig]['slot']},'value':{'err':history[sig]['err']}},'subscription':sub}})
 asyncio.run_coroutine_threadsafe(ws.send(msg),loop)

def send(raw,opts):
 tx=VersionedTransaction.from_bytes(raw);sig=str(tx.signatures[0]);keys=list(tx.message.account_keys)
 bh=str(tx.message.recent_blockhash)
 if args.blockhash_validity and (bh not in issued or now_slot()-issued[bh]>args.blockhash_validity):
  raise RpcError(-32002,'Transaction simulation failed: Blockhash not found',{'err':'BlockhashNotFound','logs':[]})
 if sig in history:raise RpcError(-32002,'Transaction simulation failed: This transaction has already been processed',{'err':'AlreadyProcessed','logs':[]})
 if not opts.get('skipPreflight'):
  sim=svm.simulate_transaction(tx)
  if isinstance(sim,FailedTransactionMetadata):
   e=err_json(sim.err());logs=list(sim.meta().logs())
   raise RpcError(-32002,f'Transaction simulation failed: {json.dumps(e)}',{'err':e,'logs':logs,'accounts':None,'unitsConsumed':0})
 pre=token_balances(keys);r=svm.send_transaction(tx);failed=isinstance(r,FailedTransactionMetadata)
 err=err_json(r.err()) if failed else None;logs=list(r.meta().logs() if failed else r.logs())
 record(sig,tx,err,logs,pre,token_balances(keys),keys);advance(1);rotate()
 return sig

class RpcError(Exception):
 def __init__(s,code,message,data=None):s.code,s.message,s.data=code,message,data

def tx_json(rec,parsed):
 tx=rec['tx'];msg=tx.message;keys=[str(k) for k in msg.account_keys];h=msg.header
 n_sig,ro_s,ro_u=h.num_required_signatures,h.num_readonly_signed_accounts,h.num_readonly_unsigned_accounts
 def writable(i):return i<n_sig-ro_s if i<n_sig else i<len(keys)-ro_u
 if parsed:
  account_keys=[{'pubkey':k,'signer':i<n_sig,'writable':writable(i),'source':'transaction'} for i,k in enumerate(keys)]
  ins=[{'programId':keys[x.program_id_index],'accounts':[keys[j] for j in bytes(x.accounts)],'data':b58(bytes(x.data))} for x in msg.instructions]
 else:
  account_keys=keys;ins=[{'programIdIndex':x.program_id_index,'accounts':list(bytes(x.accounts)),'data':b58(bytes(x.data))} for x in msg.instructions]
 return {'slot':rec['slot'],'blockTime':rec['time'],'version':'legacy',
  'transaction':{'signatures':[str(s) for s in tx.signatures],'message':{'accountKeys':account_keys,'instructions':ins,'recentBlockhash':str(msg.recent_blockhash),'header':{'numRequiredSignatures':n_sig,'numReadonlySignedAccounts':ro_s,'numReadonlyUnsignedAccounts':ro_u}}},
  'meta':{'err':rec['err'],'status':{'Err':rec['err']} if rec['err'] else {'Ok':None},'fee':5000,'preBalances':[0]*len(keys),'postBalances':[0]*len(keys),
   'preTokenBalances':rec['pre'],'postTokenBalances':rec['post'],'logMessages':rec['logs'],'innerInstructions':[],'rewards':[],'loadedAddresses':{'writable':[],'readonly':[]},'computeUnitsConsumed':0}}

def matches(a,filters):
 d=bytes(a.data)
 for f in filters or []:
  if 'dataSize' in f and len(d)!=f['dataSize']:return False
  if 'memcmp' in f:
   m=f['memcmp'];want=base64.b64decode(m['bytes']) if m.get('encoding')=='base64' else unb58(m['bytes'])
   if d[m['offset']:m['offset']+len(want)]!=want:return False
 return True

def call(method,params):
 P=params or []
 if method=='getGenesisHash':return GENESIS
 if method=='getHealth':return 'ok'
 if method=='getVersion':return {'solana-core':'2.1.0-charta-rehearsal','feature-set':0}
 if method in('getSlot','getBlockHeight'):return now_slot()
 if method=='getEpochInfo':s=now_slot();return {'absoluteSlot':s,'blockHeight':s,'epoch':0,'slotIndex':s,'slotsInEpoch':432000,'transactionCount':len(history)}
 if method=='getLatestBlockhash':
  rotate()  # a real cluster has a new blockhash every slot; clients that want a fresh one must get one
  return ctx({'blockhash':str(svm.latest_blockhash()),'lastValidBlockHeight':issued.get(str(svm.latest_blockhash()),now_slot())+args.blockhash_validity if args.blockhash_validity else now_slot()+10**9})
 if method=='isBlockhashValid':return ctx(P[0]==str(svm.latest_blockhash()))
 if method=='getFeeForMessage':return ctx(5000)
 if method=='getMinimumBalanceForRentExemption':return svm.minimum_balance_for_rent_exemption(int(P[0]))
 if method=='getBalance':return ctx(svm.get_balance(Pubkey.from_string(P[0])) or 0)
 if method=='getAccountInfo':return ctx(acct(svm.get_account(Pubkey.from_string(P[0])),(P[1] if len(P)>1 else {}).get('dataSlice')))
 if method=='getMultipleAccounts':o=P[1] if len(P)>1 else {};return ctx([acct(svm.get_account(Pubkey.from_string(k)),o.get('dataSlice')) for k in P[0]])
 if method=='getProgramAccounts':
  o=P[1] if len(P)>1 else {};rows=[{'pubkey':str(k),'account':acct(a,o.get('dataSlice'))} for k,a in svm.get_program_accounts(Pubkey.from_string(P[0])) if matches(a,o.get('filters'))]
  return ctx(rows) if o.get('withContext') else rows
 if method=='getTokenAccountBalance':
  a=svm.get_account(Pubkey.from_string(P[0]))
  if a is None:raise RpcError(-32602,'Invalid param: could not find account')
  d=bytes(a.data);dec=svm.get_account(Pubkey.from_bytes(d[:32])).data[44];amt=struct.unpack_from('<Q',d,64)[0]
  return ctx({'amount':str(amt),'decimals':dec,'uiAmount':amt/10**dec,'uiAmountString':str(amt/10**dec)})
 if method=='getTokenLargestAccounts':
  mint=Pubkey.from_string(P[0]);dec=svm.get_account(mint).data[44];rows=[]
  # Token-2022 holdings are 165 bytes plus extensions (account type 2 at byte 165).
  for k,a in [*svm.get_program_accounts(TOKEN),*svm.get_program_accounts(TOKEN_2022)]:
   d=bytes(a.data)
   if (len(d)==165 or len(d)>165 and d[165]==2) and d[:32]==bytes(mint):amt=struct.unpack_from('<Q',d,64)[0];rows.append({'address':str(k),'amount':str(amt),'decimals':dec,'uiAmount':amt/10**dec,'uiAmountString':str(amt/10**dec)})
  return ctx(sorted(rows,key=lambda r:-int(r['amount']))[:20])
 if method=='requestAirdrop':
  r=svm.airdrop(Pubkey.from_string(P[0]),int(P[1]));sig=str(r.signature()) if not isinstance(r,FailedTransactionMetadata) else 'airdrop'+str(time.time())
  history[sig]={'slot':now_slot(),'time':svm.get_clock().unix_timestamp,'err':None,'logs':[],'tx':None,'pre':[],'post':[]};advance(1);return sig
 if method=='sendTransaction':
  o=P[1] if len(P)>1 else {};raw=base64.b64decode(P[0]) if o.get('encoding','base58')=='base64' else unb58(P[0]);return send(raw,o)
 if method=='simulateTransaction':
  # Like a real RPC: signatures are only checked when asked (sigVerify), so a client may simulate a transaction
  # whose blockhash it has just replaced.
  o=P[1] if len(P)>1 else {};tx=VersionedTransaction.from_bytes(base64.b64decode(P[0]) if o.get('encoding')=='base64' else unb58(P[0]))
  svm.with_sigverify(bool(o.get('sigVerify')))
  try:r=svm.simulate_transaction(tx)
  finally:svm.with_sigverify(True)
  failed=isinstance(r,FailedTransactionMetadata);m=r.meta() if failed else r.meta()
  return ctx({'err':err_json(r.err()) if failed else None,'logs':list(m.logs()),'accounts':None,'unitsConsumed':m.compute_units_consumed(),'returnData':None})
 if method=='getSignatureStatuses':
  return ctx([({'slot':history[s]['slot'],'confirmations':None,'err':history[s]['err'],'status':{'Err':history[s]['err']} if history[s]['err'] else {'Ok':None},'confirmationStatus':'finalized'} if s in history else None) for s in P[0]])
 if method=='getSignaturesForAddress':
  o=P[1] if len(P)>1 else {};sigs=list(reversed(by_address.get(P[0],[])))
  if o.get('before') in sigs:sigs=sigs[sigs.index(o['before'])+1:]
  return [{'signature':s,'slot':history[s]['slot'],'err':history[s]['err'],'memo':None,'blockTime':history[s]['time'],'confirmationStatus':'finalized'} for s in sigs[:o.get('limit',1000)]]
 if method=='getTransaction':
  rec=history.get(P[0]);o=P[1] if len(P)>1 and isinstance(P[1],dict) else {}
  return None if rec is None or rec['tx'] is None else tx_json(rec,o.get('encoding')=='jsonParsed')
 # Rehearsal controls (not part of the Solana API).
 if method=='charta_warp':
  t=int(P[0]);c=svm.get_clock()
  if t<c.unix_timestamp:raise RpcError(-32602,'the clock only moves forward')
  advance(max(1,(t-c.unix_timestamp)*5//2),t-c.unix_timestamp);rotate();return {'unixTimestamp':svm.get_clock().unix_timestamp,'slot':now_slot()}
 if method=='charta_clock':c=svm.get_clock();return {'unixTimestamp':c.unix_timestamp,'slot':c.slot}
 raise RpcError(-32601,f'Method not found: {method}')

def handle(req):
 try:
  with lock:return {'jsonrpc':'2.0','id':req.get('id'),'result':call(req.get('method'),req.get('params'))}
 except RpcError as e:
  out={'code':e.code,'message':e.message}
  if e.data is not None:out['data']=e.data
  return {'jsonrpc':'2.0','id':req.get('id'),'error':out}
 except Exception as e:
  return {'jsonrpc':'2.0','id':req.get('id'),'error':{'code':-32603,'message':f'{type(e).__name__}: {e}'}}

class Http(BaseHTTPRequestHandler):
 def cors(s):s.send_header('Access-Control-Allow-Origin','*');s.send_header('Access-Control-Allow-Headers','content-type, solana-client');s.send_header('Access-Control-Allow-Methods','POST, OPTIONS')
 def do_OPTIONS(s):s.send_response(204);s.cors();s.end_headers()
 def do_POST(s):
  body=json.loads(s.rfile.read(int(s.headers.get('content-length',0))) or b'{}')
  out=json.dumps([handle(r) for r in body] if isinstance(body,list) else handle(body)).encode()
  s.send_response(200);s.cors();s.send_header('Content-Type','application/json');s.send_header('Content-Length',str(len(out)));s.end_headers();s.wfile.write(out)
 def log_message(s,*a):pass

async def ws_handler(ws):
 try:await ws_loop(ws)
 except websockets.exceptions.ConnectionClosed:pass  # a client that exits without closing
async def ws_loop(ws):
 subs=0
 async for raw in ws:
  m=json.loads(raw);method=m.get('method','');subs+=1
  if method=='signatureSubscribe':
   await ws.send(json.dumps({'jsonrpc':'2.0','result':subs,'id':m.get('id')}))
   sig=m['params'][0]
   with lock:
    if sig in history:notify(ws,subs,sig)
    else:pending.setdefault(sig,[]).append((ws,subs))
  elif method.endswith('Unsubscribe'):await ws.send(json.dumps({'jsonrpc':'2.0','result':True,'id':m.get('id')}))
  else:await ws.send(json.dumps({'jsonrpc':'2.0','result':subs,'id':m.get('id')}))

async def main():
 global loop;loop=asyncio.get_running_loop()
 issued[str(svm.latest_blockhash())]=now_slot()
 threading.Thread(target=ThreadingHTTPServer(('127.0.0.1',args.port),Http).serve_forever,daemon=True).start()
 async with websockets.serve(ws_handler,'127.0.0.1',args.port+1):
  print(f'Charta rehearsal chain on http://127.0.0.1:{args.port} (ws {args.port+1}); clock {args.start}',flush=True)
  await asyncio.Future()
asyncio.run(main())
