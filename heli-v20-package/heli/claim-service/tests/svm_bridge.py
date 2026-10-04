"""Private stdio fixture: ephemeral local keys, V20 ELF, no public RPC/funds."""
import sys,json,base64,traceback
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'solana-v20/scripts'))
import svm_fixture as t
from bootstrap_v15 import bootstrap
f=bootstrap(t,with_policy=True)
print(json.dumps({'ready':True,'start':t.start,'sponsor':list(bytes(t.admin)),'verifier':list(bytes(f['verifier']))}),flush=True)
for line in sys.stdin:
 try:
  b=json.loads(line);method=b['method'];p=b.get('params',{})
  if method=='account':
   a=t.svm.get_account(t.Pubkey.from_string(p['address']))
   out=None if a is None else {'owner':str(a.owner),'data':base64.b64encode(a.data).decode(),'lamports':a.lamports,'executable':a.executable}
  elif method=='rent':out=t.svm.minimum_balance_for_rent_exemption(p['size'])
  elif method=='balance':
   a=t.svm.get_account(t.Pubkey.from_string(p['address']));out=a.lamports if a else 0
  elif method=='block':
   t.svm.expire_blockhash();out={'blockhash':str(t.svm.latest_blockhash()),'lastValidBlockHeight':999999999}
  elif method=='clock':t.clock(p['time']);out=True
  elif method=='send':
   tx=t.Transaction.from_bytes(base64.b64decode(p['transaction']));r=t.svm.send_transaction(tx)
   if isinstance(r,t.FailedTransactionMetadata):out={'failed':True,'logs':r.meta().logs()}
   else:out={'signature':str(tx.signatures[0]),'logs':r.logs()}
  elif method=='stop':break
  else:raise ValueError('Unknown fixture method')
  print(json.dumps({'result':out}),flush=True)
 except Exception:
  traceback.print_exc(file=sys.stderr);print(json.dumps({'error':'Local fixture failed'}),flush=True)
