"""Model-based random-sequence (fuzz) tests on the compiled ELF in a fresh local LiteSVM ledger (6 Oct 2026).
Synthetic keys and quote mint; nothing leaves this process.

Each seed drives two random campaigns and, after every step, compares the program with an independent Python model
of the published rules:
  A. the live opening auction: six wallets create, place, replace and cancel bids with random (often invalid)
     quantities, price levels and funds, try other wallets' bids, claims and finalization too early, the admin
     pauses and unpauses, and time jumps into the final five minutes; then finalization and claims in random order;
  B. after launch: random time jumps over many months, permissionless open_epoch/settle with right and wrong
     numbers, donations, expense proposals (fixed and other, valid and invalid) with cancellations and payments
     at random times, pauses, and outsiders trying admin instructions.
A step is a finding when the program accepts what the model forbids or refuses what it allows, or when an invariant
breaks: supply 90,000,000 CHTA, all CHTA accounts add up to the supply, vaults equal their stocks, escrow equals
the active collateral, wallet balances follow the model, monthly releases follow the cap formula, expenses wait
seven days and stay within the fixed allowance, the 25%-a-year window and the project floor.

  python scripts/test_fuzz_svm.py [seeds=20] [auction_steps=250] [launch_steps=250]
"""
import json,random,struct,subprocess,sys
from pathlib import Path

if len(sys.argv)<2 or sys.argv[1]!='--one':
 seeds=int(sys.argv[1]) if len(sys.argv)>1 else 20;a_steps=sys.argv[2] if len(sys.argv)>2 else '250';b_steps=sys.argv[3] if len(sys.argv)>3 else '250'
 runs=[]
 for s in range(1,seeds+1):
  p=subprocess.run([sys.executable,__file__,'--one',str(s),a_steps,b_steps],capture_output=True,text=True)
  try:runs.append(json.loads(p.stdout.strip().splitlines()[-1]))
  except Exception:runs.append({'seed':s,'crash':(p.stderr or p.stdout)[-800:]})
 total={k:sum(r.get(k,0) for r in runs) for k in ['steps','accepted','refused','checks']}
 findings=[f for r in runs for f in r.get('findings',[])]+[f"seed {r['seed']} crashed: {r['crash']}" for r in runs if 'crash' in r]
 compiled=json.loads((Path(__file__).resolve().parents[1]/'compiled-source.json').read_text())
 out={'source_sha256':compiled['source_sha256'],'binary_sha256':compiled['binary_sha256'],'scope':'Compiled ELF in local LiteSVM, synthetic keys and quote mint; random action sequences against an independent model of the rules. Not a deployment or audit.',
  'seeds':seeds,**total,'actions':{k:sum(r.get('actions',{}).get(k,0) for r in runs) for k in sorted({k for r in runs for k in r.get('actions',{})})},
  'months_settled':sum(r.get('months',0) for r in runs),'expenses_paid':sum(r.get('paid',0) for r in runs),'findings':findings,'all_passed':not findings}
 (Path(__file__).resolve().parents[1]/'fuzz-verification.json').write_text(json.dumps(out,indent=1)+'\n')
 print(json.dumps(out,indent=1));sys.exit(1 if findings else 0)

SEED,A_STEPS,B_STEPS=int(sys.argv[2]),int(sys.argv[3]),int(sys.argv[4])
rng=random.Random(SEED)
import svm_fixture as t
from bootstrap_v15 import bootstrap
from solders.keypair import Keypair
from solders.transaction import Transaction
from solders.transaction_metadata import FailedTransactionMetadata
from solders.compute_budget import set_compute_unit_limit

U=t.U;DAY=t.DAY;FREEZE=300;CAP=250_000;OFFER=5_000_000
findings=[];stats={'steps':0,'accepted':0,'refused':0,'checks':0,'actions':{}}
def finding(msg):
 if len(findings)<25:findings.append(f'seed {SEED}: {msg}')
def check(ok,msg):
 stats['checks']+=1
 if not ok:finding(msg)
def now():return t.svm.get_clock().unix_timestamp
def warp_to(ts):
 c=t.svm.get_clock();t.svm.warp_to_slot(c.slot+max(1,(ts-c.unix_timestamp)//2));t.clock(ts)
def attempt(kind,name,args=None,acc=None,payer=None):
 """Send one instruction without asserting; the fee payer is never the admin unless the admin acts."""
 ix=t.instruction(name,args,acc);signers=[t.KEYS[str(m.pubkey)] for m in ix.accounts if m.is_signer]
 payer=payer or (signers[0] if signers else cranker);t.svm.expire_blockhash()
 tx=Transaction.new_signed_with_payer([set_compute_unit_limit(1_400_000),ix],payer.pubkey(),list({str(k.pubkey()):k for k in [payer]+signers}.values()),t.svm.latest_blockhash())
 r=t.svm.send_transaction(tx);ok=not isinstance(r,FailedTransactionMetadata)
 stats['steps']+=1;stats['accepted' if ok else 'refused']+=1;stats['actions'][kind]=stats['actions'].get(kind,0)+1
 t.svm.warp_to_slot(t.svm.get_clock().slot+1)
 return ok,list(r.logs() if ok else r.meta().logs())
def expect(kind,allowed,ok,logs):
 if allowed and not ok:finding(f'{kind}: refused but the rules allow it ({(logs or ["?"])[-2][:110]})')
 if not allowed and ok:finding(f'{kind}: ACCEPTED although the rules forbid it')
def bal(k):a=t.svm.get_account(k);return struct.unpack_from('<Q',bytes(a.data),64)[0] if a else 0
def mint_quote(dst,n):t.send('TEST quote',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',n),[t.meta(q,True),t.meta(dst,True),t.meta(t.admin.pubkey(),False,True)])])

cranker=Keypair();t.KEYS[str(cranker.pubkey())]=cranker;t.svm.airdrop(cranker.pubkey(),10**11)
actors=[];a_phase={}
def make_actors():
 global q;q=t.defaults['quote_mint']
 for i in range(6):
  k=Keypair();t.KEYS[str(k.pubkey())]=k;t.svm.airdrop(k.pubkey(),10**10)
  qa=t.token_account(q,k.pubkey());ha=t.token_account(t.defaults['mint'],k.pubkey());usdc=rng.choice([0,rng.randint(1,50)*U,rng.randint(50,6000)*U,6000*U])
  if usdc:mint_quote(qa,usdc)
  actors.append({'key':k,'quote':qa,'heli':ha,'bid':t.pda(b'auction-bid',bytes(k.pubkey())),'usdc':usdc,'exists':False,'active':False,'qty':0,'tick':0,'claimed':False})

# ---------------- campaign A: the live auction (runs inside bootstrap, before its own finalization)
def campaign_a(alice_bid):
 make_actors();A=t.read(t.defaults['auction'],'OpeningAuction');end=A['end'];floor,ts=A['floor'],A['tickSize']
 base=list(A['demand']);paused=[False]
 price=lambda tick:floor+ts*tick
 def acc(x,bidder=None,quote=None,bid=None):return {'bidder':(bidder or x['key']).pubkey(),'bid':bid or x['bid'],'bidder_quote':quote or x['quote'],'bidder_heli':x['heli'],'account_payer':(bidder or x['key']).pubkey()}
 def open_():return now()<end-FREEZE
 for _ in range(A_STEPS):
  x=rng.choice(actors);r=rng.random()
  if r<0.10 or not x['exists'] and r<0.30:
   allowed=not x['exists'] and open_();ok,l=attempt('create bid account','create_auction_bid',acc=acc(x));expect('create bid account',allowed,ok,l);x['exists']|=ok
  elif r<0.45:
   # Mostly valid bids (so state actually moves), with every boundary and overflow case mixed in.
   qty=rng.choice([rng.randint(1,CAP)]*6+[0,1,CAP,CAP+1,rng.randint(CAP+1,10**7),2**63]);tick=rng.choice([rng.randint(0,60)]*6+[0,255,256,rng.randint(257,65535)])
   cost=qty*price(tick) if tick<256 else None
   allowed=x['exists'] and not x['active'] and not x['claimed'] and open_() and not paused[0] and 0<qty<=CAP and tick<256 and cost is not None and cost<2**64 and cost<=x['usdc']
   ok,l=attempt('place bid','place_auction_bid',{'quantity_heli':qty,'tick':tick},acc(x));expect(f'place bid qty={qty} tick={tick}',allowed,ok,l)
   if ok:x.update(active=True,qty=qty,tick=tick);x['usdc']-=cost
  elif r<0.60:
   allowed=x['exists'] and x['active'] and open_();ok,l=attempt('cancel bid','cancel_auction_bid',acc=acc(x));expect('cancel bid',allowed,ok,l)
   if ok:x['usdc']+=x['qty']*price(x['tick']);x.update(active=False,qty=0)
  elif r<0.67:  # attacks on another wallet's bid or funds
   y=rng.choice([a for a in actors if a is not x]);which=rng.random()
   if which<0.5:ok,l=attempt("cancel another wallet's bid",'cancel_auction_bid',acc=acc(y,bidder=x['key']))
   else:ok,l=attempt("bid with another wallet's USDC",'place_auction_bid',{'quantity_heli':1000,'tick':0},acc(x,quote=y['quote']))
   expect('attack on another wallet',False,ok,l)
  elif r<0.71:ok,l=attempt('claim before finalization','claim_auction_bid',acc=acc(x));expect('claim before finalization',False,ok,l)
  elif r<0.74:ok,l=attempt('finalize before the end','finalize_auction');expect('finalize before the end',False,ok,l)
  elif r<0.79:
   who=rng.choice(['admin','outsider']);want=not paused[0]
   ok,l=attempt(f'pause by {who}','pause',{'paused':want},{'admin':(t.admin if who=='admin' else x['key']).pubkey()},payer=t.admin if who=='admin' else x['key'])
   expect(f'pause by {who}',who=='admin',ok,l)
   if ok:paused[0]=want
  else:warp_to(min(end-1,now()+rng.choice([60,3600,rng.randint(60,3*DAY),max(0,end-FREEZE-now()-rng.randint(0,600))])))
  # Invariants after every step.
  a=t.read(t.defaults['auction'],'OpeningAuction');d=list(base)
  for y in actors:
   if y['active']:d[y['tick']]+=y['qty']
  check(a['demand']==d,'auction demand per level differs from the bids placed')
  check(bal(t.defaults['quote_escrow'])==sum(y['qty']*price(y['tick']) for y in actors if y['active'])+sum(base[i]*price(i) for i in range(256)),'escrow differs from the active collateral')
  for y in actors:
   check(bal(y['quote'])==y['usdc'],'a wallet balance differs from the model')
   if y['exists']:b=t.read(y['bid'],'OpeningBid');check((b['active'],b['quantityHeli'] if b['active'] else 0)==(y['active'],y['qty'] if y['active'] else 0),'a bid account differs from the model')
 if paused[0]:attempt('pause by admin','pause',{'paused':False},{'admin':t.admin.pubkey()},payer=t.admin)
 a_phase.update(price=price,base=base)

f=bootstrap(t,1000,before_finalize=campaign_a)
# ---------------- after bootstrap's finalization: clearing and claims against the model
A=t.read(t.defaults['auction'],'OpeningAuction');price=a_phase['price']
demand=list(A['demand']);total=sum(demand);tick=0;above=0;mat=demand[0]*U;mdem=demand[0]
if total>=OFFER:
 for i in range(255,-1,-1):
  if above+demand[i]>=OFFER:tick=i;mat=(OFFER-above)*U;mdem=demand[i];break
  above+=demand[i]
check(A['clearingTick']==tick and A['soldHeli']==min(total,OFFER),'clearing differs from the model')
check(A['clearingPrice']==(price(tick) if total>0 else 0),'clearing price differs from the model')
for x in rng.sample(actors,len(actors)):
 ok,l=attempt('claim','claim_auction_bid',acc={'bidder':x['key'].pubkey(),'bid':x['bid'],'bidder_quote':x['quote'],'bidder_heli':x['heli']})
 expect('claim',x['active'],ok,l)
 if ok:
  got=0 if x['tick']<tick else x['qty']*U if x['tick']>tick else mat*x['qty']//mdem
  paid=(got*A['clearingPrice']+U-1)//U
  check(bal(x['heli'])==got,'claimed CHTA differs from the allocation rule')
  check(bal(x['quote'])==x['usdc']+x['qty']*price(x['tick'])-paid,'USDC refund differs from the rule')
  x['claimed']=True
  ok2,l2=attempt('claim twice','claim_auction_bid',acc={'bidder':x['key'].pubkey(),'bid':x['bid'],'bidder_quote':x['quote'],'bidder_heli':x['heli']});expect('claim twice',False,ok2,l2)
a_end=t.read(t.defaults['auction'],'OpeningAuction')
check(a_end['pendingClaims']==0 or bal(t.defaults['quote_escrow'])>0,'escrow emptied while claims are pending')

# ---------------- campaign B: months, donations, expenses
fee={'fee_base':t.pda(b'fee-base'),'fee_quote':t.pda(b'fee-quote'),'operations':t.pda(b'operations'),'quote_mint':q,'sale_proceeds':t.defaults['sale_proceeds']}
t.call('create_fee_base',acc=fee);t.call('create_fee_quote',acc=fee)
FLOOR=rng.choice([120,200,500,1500])*U  # the program requires at least 120
t.call('initialize_fee_vaults',{'monthly_cap':500*U,'reserve':0,'project_floor':FLOOR},fee)
mint_quote(t.defaults['sale_proceeds'],rng.randint(0,4000)*U)  # synthetic reserve on top of the auction proceeds
donor=t.token_account(q,t.admin.pubkey());mint_quote(donor,10_000*U)
payee=t.token_account(q,cranker.pubkey())
paid_log=[]   # (day, amount from the reserve, fixed)
expenses={}   # nonce -> model
months=0;paid=0;rate=4_022_473_737_086_389;scale=10**18
def stocks_ok(label):
 c=t.cfg();m=t.svm.get_account(t.defaults['mint']).data;supply=struct.unpack_from('<Q',bytes(m),36)[0]
 rows=[a for _,a in t.svm.get_program_accounts(t.TOKEN) if len(a.data)==165 and bytes(a.data)[:32]==bytes(t.defaults['mint'])]
 check(supply==90_000_000*U,f'{label}: supply changed')
 check(sum(struct.unpack_from('<Q',bytes(a.data),64)[0] for a in rows)==supply,f'{label}: CHTA accounts do not add up to the supply')
 check(bal(t.defaults['human'])==c['stocks'][0] and bal(t.defaults['founder'])==c['stocks'][3],f'{label}: vaults differ from their stocks')
 check(bal(t.defaults['market_inventory'])>=c['marketRemaining'],f'{label}: inventory below the recorded amount')
def boundary(n):return t.boundary(n)
for _ in range(B_STEPS):
 r=rng.random();c=t.cfg()
 if r<0.22:
  dt=rng.choice([3600,DAY,7*DAY,rng.randint(1,40)*DAY,max(1,boundary(min(720,c['lastSettledEpoch']+1))-now()+rng.randint(-120,120))])
  warp_to(now()+max(1,dt))
 elif r<0.36:
  n=rng.choice([c['lastSettledEpoch']+1,c['lastSettledEpoch']+2,c['lastSettledEpoch'],rng.randint(0,40)])
  e=t.pda(b'epoch',struct.pack('<H',n%65536));exists=t.svm.get_account(e) is not None
  allowed=1<=n<=720 and not exists and now()>=boundary(n-1)
  ok,l=attempt('open month','open_epoch',{'number':n},{'epoch':e,'payer':cranker.pubkey()});expect(f'open month {n}',allowed,ok,l)
 elif r<0.52:
  n=rng.choice([c['lastSettledEpoch']+1,c['lastSettledEpoch']+1,c['lastSettledEpoch']+2])
  e=t.pda(b'epoch',struct.pack('<H',n));ea=t.svm.get_account(e)
  allowed=ea is not None and not t.read(e,'Epoch')['settled'] and now()>=boundary(n) and n==c['lastSettledEpoch']+1
  supply=90_000_000*U;cap=(supply-sum(c['stocks']))*rate//scale;mg=min(cap//5,c['stocks'][3]) if 12<=n<720 else 0;release=min(cap-mg,c['stocks'][0])
  before=c['stocks'][0]
  ok,l=attempt('settle month','settle',acc={'epoch':e,'release_reserve':t.defaults['human'],'management_stock':t.defaults['founder']});expect(f'settle month {n}',allowed,ok,l)
  if ok:
   months+=1;e2=t.read(e,'Epoch');c2=t.cfg()
   check(e2['capacity']==cap and e2['humanBudget']==release and e2['founderBudget']==mg,f'month {n}: cap/release differ from the formula')
   check(before-c2['stocks'][0]==release and c2['marketRemaining']==c['marketRemaining']+release,f'month {n}: reserve movement differs')
 elif r<0.58:
  amt=rng.randint(1,300)*U;ok,l=attempt('donation','contribute_quote',{'amount':amt},fee|{'contributor':t.admin.pubkey(),'contributor_quote':donor},payer=t.admin)
  expect('donation',bal(donor)>=amt,ok,l)
 elif r<0.72:
  o=t.read(fee['operations'],'Operations');fixed=rng.random()<0.5
  amt=rng.choice([0,rng.randint(1,12)*U,12*U,12*U+1,rng.randint(1,600)*U,500*U+1]) if rng.random()<0.9 else rng.randint(1,20)*U
  nonce=rng.choice([o['nextNonce']]*4+[o['nextNonce']+1,max(0,o['nextNonce']-1)])
  who=rng.choice(['admin']*5+['outsider']);signer=t.admin if who=='admin' else actors[0]['key']
  dest=rng.choice([payee]*6+[fee['fee_quote'],t.defaults['sale_proceeds']])
  allowed=who=='admin' and nonce==o['nextNonce'] and 0<amt<=500*U and (not fixed or amt<=12*U) and dest==payee
  acc=fee|{'expense':t.pda(b'expense',struct.pack('<Q',nonce)),'destination':dest,'proposer':signer.pubkey()}
  ok,l=attempt(f'propose expense by {who}','propose_expense',{'nonce':nonce,'amount':amt,'purpose':[7]*32,'fixed':fixed},acc,payer=signer);expect(f'propose expense ({who}, {amt}, fixed={fixed})',allowed,ok,l)
  if ok:expenses[nonce]={'amount':amt,'fixed':fixed,'ready':now()+7*DAY,'paid':False,'cancelled':False}
 elif r<0.78 and expenses:
  n=rng.choice(list(expenses));x=expenses[n];who=rng.choice(['admin','outsider']);signer=t.admin if who=='admin' else actors[0]['key']
  ok,l=attempt(f'cancel expense by {who}','cancel_expense',acc={'expense':t.pda(b'expense',struct.pack('<Q',n)),'admin':signer.pubkey()},payer=signer)
  expect(f'cancel expense ({who})',who=='admin' and not x['paid'] and not x['cancelled'],ok,l)
  if ok:x['cancelled']=True
 elif r<0.92 and expenses:
  n=rng.choice(list(expenses));x=expenses[n];o=t.read(fee['operations'],'Operations');c=t.cfg()
  amount=x['amount'];from_fee=min(amount,max(0,bal(fee['fee_quote'])-o['reserve']));rest=amount-from_fee;day=now()//DAY
  balance=bal(t.defaults['sale_proceeds']);revenue_left=max(0,c['revenueTotal']-o['revenueSpent']);from_rev=min(rest,revenue_left)
  window=lambda fixed:sum(a for d,a,f in paid_log if f==fixed and day-30<=d<=day)
  allowed=not c['paused'] and not x['paid'] and not x['cancelled'] and now()>=x['ready']
  if allowed and rest>0:
   allowed=balance>=rest and (window(True)+rest<=12*U if x['fixed'] else ((rest-from_rev==0 or window(False)+(rest-from_rev)<=(balance-revenue_left)*25//1200) and balance-rest>=c['projectFloor']))
  before=bal(payee)
  ok,l=attempt('pay expense','execute_expense',acc=fee|{'expense':t.pda(b'expense',struct.pack('<Q',n)),'destination':payee});expect(f'pay expense ({amount}, fixed={x["fixed"]})',allowed,ok,l)
  if ok:
   x['paid']=True;paid+=1;check(bal(payee)-before==amount,'an expense paid a different amount')
   if rest>0:paid_log.append((day,rest if x['fixed'] else rest-from_rev,x['fixed']))
 elif r<0.97:
  want=not c['paused'];who=rng.choice(['admin','outsider']);signer=t.admin if who=='admin' else actors[1]['key']
  ok,l=attempt(f'pause by {who}','pause',{'paused':want},{'admin':signer.pubkey()},payer=signer);expect(f'pause by {who}',who=='admin',ok,l)
 else:
  y=actors[2]['key'];ok,l=attempt('outsider proposes to pay themselves','propose_expense',{'nonce':t.read(fee['operations'],'Operations')['nextNonce'],'amount':U,'purpose':[1]*32,'fixed':True},fee|{'expense':t.pda(b'expense',struct.pack('<Q',t.read(fee['operations'],'Operations')['nextNonce'])),'destination':actors[2]['quote'],'proposer':y.pubkey()},payer=y)
  expect('outsider proposes an expense',False,ok,l)
 stocks_ok('launch phase')
 # Program-side windows never exceed the limits the model tracks.
 day=now()//DAY;check(sum(a for d,a,f in paid_log if f and day-30<=d<=day)<=12*U,'fixed costs exceeded 12 USDC within 30 days')

print(json.dumps({'seed':SEED,**stats,'months':months,'paid':paid,'findings':findings}))
