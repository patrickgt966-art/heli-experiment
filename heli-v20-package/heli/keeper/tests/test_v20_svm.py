"""JS V20 planner AND adapter instructions against the compiled V20 ELF locally."""
import sys,json,subprocess,base64
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT.parent/'solana-v20/scripts'))
import svm_fixture as t
from bootstrap_v15 import bootstrap,epoch_accounts
bootstrap(t)
bridge=subprocess.Popen(['node',str(ROOT/'tests/v20-bridge.mjs')],stdin=subprocess.PIPE,stdout=subprocess.PIPE,text=True,encoding='utf-8')
settled=[];jobs=[]
def normalized(x):return {t.snake(k):v for k,v in x.items()}
def answer(paused=None):
 c=normalized(t.cfg());n=min(int(c['last_settled_epoch'])+1,720);ea=epoch_accounts(t,n)
 if paused is not None:c['paused']=paused
 s={'program':str(t.PROGRAM),'config':c,'now':t.svm.get_clock().unix_timestamp,'epoch':normalized(t.read(ea['epoch'],'Epoch')) if t.svm.get_account(ea['epoch']) else None,'auction':normalized(t.read(t.defaults['auction'],'OpeningAuction')),'policy':None}
 bridge.stdin.write(json.dumps(s)+'\n');bridge.stdin.flush();r=json.loads(bridge.stdout.readline());assert 'error' not in r,r
 return r
def drain():
 for _ in range(1500):
  r=answer();job=r['job']
  if not job:return
  before=t.cfg();supply=t.supply();base=t.released();inventory=t.amount(t.defaults['market_inventory'])
  ix=r['instruction'];instruction=t.Instruction(t.Pubkey.from_string(ix['program']),base64.b64decode(ix['data']),[t.meta(t.Pubkey.from_string(k['key']),k['writable'],k['signer']) for k in ix['keys']])
  t.send('JS V20 adapter '+job['key'],[instruction]);jobs.append(job)
  if job['name']=='settle':
   n=job['number'];e=t.read(epoch_accounts(t,n)['epoch'],'Epoch');cap=base*4_022_473_737_086_389//10**18
   t.check('month '+str(n)+' net release cap',e['capacity']==cap)
   t.check('month '+str(n)+' reserve to canonical market inventory',t.amount(t.defaults['market_inventory'])==inventory+e['humanBudget'] and t.cfg()['stocks'][0]==before['stocks'][0]-e['humanBudget'])
   t.check('month '+str(n)+' no mint burn staking or monthly free dividend',t.supply()==supply and not any(k in e for k in ('burned','perPerson','people','humanRemaining','staking')))
   ea=epoch_accounts(t,n);t.check('month '+str(n)+' one epoch account only',t.svm.get_account(ea['epoch']) is not None and t.svm.get_account(ea['claim_vault']) is None and t.svm.get_account(ea['reward_vault']) is None)
   if n==1:t.check('first month exactly 20112.368685 HELI',e['humanBudget']==20_112_368_685)
   settled.append(n)
 raise AssertionError('keeper did not quiesce')
try:
 t.check('pause does not change the monthly maintenance plan',answer(True)['job']==answer()['job'])
 # Lost-key scenario (owner decision H2-B): paused on chain and never unpaused for the whole horizon.
 t.ensure_governance();t.call('pause',{'paused':True})
 t.clock(t.boundary(10)+10*t.DAY);drain();t.check('ten missed months caught up sequentially',settled==list(range(1,11)))
 for n in range(11,721):
  t.clock(t.boundary(n));drain()
  if n%120==0:print('V20 keeper months:',n,flush=True)
 t.check('all 720 months settle once in order',settled==list(range(1,721)))
 t.check('constitution closed with no further automatic job',t.cfg()['closed'] and answer()['job'] is None)
 t.check('all 720 months and the final close ran while the program stayed paused',t.cfg()['paused'])
 t.check('released unsold market inventory survives closure',t.amount(t.defaults['market_inventory'])>0)
 result={'version':'v20','all_passed':True,'months':720,'jobs':len(jobs),'checks_and_transactions':len(t.checks),'source_sha256':t.actual_source,'binary_sha256':t.actual_binary,'scope':'Local LiteSVM; actual JS planner and adapter plus compiled V20 ELF; synthetic quote/identity, no public deployment'}
 (ROOT/'v20-svm-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
finally:
 bridge.stdin.close();bridge.wait(timeout=10)
