"""V22 owner decisions on market measurement, on the compiled ELF with the real Manifest ELF.
Fresh local LiteSVM ledger, synthetic quote/keys; no public transactions.
1. Minimum quote depth code floor lowered from 5,000 to 1,000 quote units.
2. The project's own Manifest seats never count toward the reference price or depth.
3. Crash exception: with no reference AND outside bids recorded below the minimum depth for 24 hours,
   reserve-funded bids are allowed at most at 95% of the last outside reference (<= 30 days old, else the
   opening auction price). Shallowness must be confirmed by observations at most two hours apart.
4. Dust bids cannot crowd out real demand in the measurement.
5. All reserve-funded bids (normal and crash) share one rolling 30-day cap of 10% of the project quote
   reserve balance; cancelling a live bid gives back its unfilled part. The project quote floor is >= 1,000 units.
6. Dust at the 192-node scan limit can stall observations, but without a reference the sale floor stays at
   95% of the last outside reference for 30 days, so stalling cannot lower it.
"""
import json,struct
import svm_fixture as t
from bootstrap_v15 import bootstrap,epoch_accounts

f=bootstrap(t,1_000_000,with_policy=True,min_depth=1000,reject_depth=249*t.U)
t.check('minimum depth of exactly 1,000 quote units accepted',t.read(t.defaults['policy'],'ReleasePolicy')['minimumQuoteDepth']==1000*t.U)

t.check('90M genesis includes 70M market reserve and 15M management',t.cfg()['stocks']==[70_000_000*t.U,0,0,15_000_000*t.U] and t.supply()==90_000_000*t.U)
t.check('the former rewards and liquidity vaults do not exist',t.svm.get_account(t.pda(b'vault',bytes([1]))) is None and t.svm.get_account(t.pda(b'vault',bytes([2]))) is None)
MANIFEST=t.Pubkey.from_string('MNFSTqtC93rEfYHB6hF82sKdZpUDFWkViLByLd1k1Ms')
TOKEN22=t.Pubkey.from_string('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')
t.svm.add_program_from_file(MANIFEST,t.ROOT.parent/'manifest-integration/vendor-manifest/manifest-release-v3.0.24.so')
m=t.allocate(256,MANIFEST);q=t.defaults['quote_mint'];bv=t.Pubkey.find_program_address([b'vault',bytes(m),bytes(t.defaults['mint'])],MANIFEST)[0];qv=t.Pubkey.find_program_address([b'vault',bytes(m),bytes(q)],MANIFEST)[0]
t.send('initialize bound Manifest market',[t.Instruction(MANIFEST,b'\x00',[t.meta(t.admin.pubkey(),True,True),t.meta(m,True),t.meta(t.SYSTEM),t.meta(t.defaults['mint']),t.meta(q),t.meta(bv,True),t.meta(qv,True),t.meta(t.TOKEN),t.meta(TOKEN22)])])
t.defaults.update(manifest_market=m,manifest_program=MANIFEST,trader=t.pda(b'manifest-trader'),manifest_base=t.pda(b'manifest-heli'),manifest_quote=t.pda(b'manifest-quote'),base_vault=bv,quote_vault=qv)
t.call('create_manifest_base');t.call('create_manifest_quote')
t.call('bind_manifest_market',{'market_rent_lamports':10_000_000})
t.defaults['release_reserve']=t.defaults['human']
ma={'management_book':t.pda(b'management-book'),'management_trader':t.pda(b'management-trader'),'management_base':t.pda(b'management-base'),'management_quote':t.pda(b'management-quote'),'project_quote':t.defaults['sale_proceeds'],'management_stock':t.defaults['founder']}
t.call('create_management_base',acc=ma);t.call('create_management_quote',acc=ma)
t.send('TEST quote to project reserve',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',2000*t.U),[t.meta(t.defaults['quote_mint'],True),t.meta(t.defaults['sale_proceeds'],True),t.meta(t.admin.pubkey(),False,True)])])
fee={'fee_base':t.pda(b'fee-base'),'fee_quote':t.pda(b'fee-quote'),'operations':t.pda(b'operations'),'quote_mint':t.defaults['quote_mint'],'sale_proceeds':t.defaults['sale_proceeds']}
t.call('create_fee_base',acc=fee);t.call('create_fee_quote',acc=fee)
t.call('initialize_fee_vaults',{'monthly_cap':10**15,'reserve':0,'project_floor':119*t.U},fee,reject='Quota',label='project floor below one year of fixed cost (120 units) rejected')
t.call('initialize_fee_vaults',{'monthly_cap':10**15,'reserve':0,'project_floor':1000*t.U},fee)
t.call('initialize_management',{'rent_lamports':10_000_000},ma)
ea=epoch_accounts(t,1);t.call('open_epoch',{'number':1},ea);act=ma|ea
t.call('management_release',{'amount':t.U},act,reject='calendar',label='management cannot release in first twelve months')
t.call('management_fund_quote',{'amount':t.U},act|{'admin':t.outsider.pubkey()},reject='has one',label='outsider cannot use project reserve')
t.call('management_order',{'amount':t.U,'base_deposit':0,'price_mantissa':1,'price_exponent':0,'is_bid':True},act|{'admin':t.outsider.pubkey()},reject='has one',label='outsider cannot place treasury orders')
t.removed('set_liquidity_request','no duplicate liquidity release budget')
t.call('management_fund_quote',{'amount':400*t.U},act)

def seat(owner):t.send('user seat',[t.Instruction(MANIFEST,b'\x01',[t.meta(owner.pubkey(),True,True),t.meta(m,True),t.meta(t.SYSTEM)])],[owner])
def deposit(owner,wallet,vault,mint,amount):
 t.send('user deposit',[t.Instruction(MANIFEST,b'\x02'+struct.pack('<Q',amount)+b'\x00',[t.meta(owner.pubkey(),False,True),t.meta(m,True),t.meta(wallet,True),t.meta(vault,True),t.meta(t.TOKEN),t.meta(mint)])],[owner])
def order(owner,amount,is_bid,mantissa=1,exponent=0):
 t.send('user funded limit order',[t.Instruction(MANIFEST,b'\x06\x00'+struct.pack('<II',0,1)+struct.pack('<QIbBIB',amount,mantissa,exponent,int(is_bid),0,0),[t.meta(owner.pubkey(),True,True),t.meta(m,True),t.meta(t.SYSTEM)])],[owner])
def management_order(amount,is_bid,deposit_base=0,mantissa=1,exponent=0):
 t.call('management_order',{'amount':amount,'base_deposit':deposit_base,'price_mantissa':mantissa,'price_exponent':exponent,'is_bid':is_bid},act)

pol=lambda:t.read(t.defaults['policy'],'ReleasePolicy')
def funded(owner,quote):
 seat(owner);w=t.token_account(q,owner.pubkey())
 t.send('synthetic quote',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',quote),[t.meta(q,True),t.meta(w,True),t.meta(t.admin.pubkey(),False,True)])])
 deposit(owner,w,qv,q,quote)
def ask(amount,mantissa,exponent,reject=None,label=None):
 t.call('place_project_ask',{'amount':amount,'price_mantissa':mantissa,'price_exponent':exponent},reject=reject,label=label)
def mgmt(amount,is_bid,mantissa,exponent,deposit=0,reject=None,label=None):
 t.call('management_order',{'amount':amount,'base_deposit':deposit,'price_mantissa':mantissa,'price_exponent':exponent,'is_bid':is_bid},act,reject=reject,label=label)
def best(offset):  # (price per HELI, last_valid_slot) of the best resting order on one side
 d=bytes(t.svm.get_account(m).data);i=int.from_bytes(d[offset:offset+4],'little');v=d[256+i+16:256+i+80]
 return int.from_bytes(v[0:16],'little')*t.U//10**18,int.from_bytes(v[36:40],'little')
BAND='Order price outside the permitted band'
book=lambda:t.read(ma['management_book'],'ManagementBook')
def last_sample():p=pol();return p['prices'][(p['next']-1)%24]
window=lambda:sum(book()['bidDays'])
seen=[0]
def keep_shallow(until,label=None):  # hourly observations of a shallow market up to `until`
 x=seen[0]+3600
 while x<=until:t.clock(x);t.call('observe_release_market');seen[0]=x;x+=3600
 t.check(label or 'shallowness confirmed hourly up to %d'%until,pol()['shallowSeen']==seen[0])
def observe_now(at,label=None):t.clock(at);t.call('observe_release_market',label=label);seen[0]=at
clearing=t.read(t.defaults['auction'],'OpeningAuction')['clearingPrice']
t.check('opening auction cleared at 100 quote atoms per HELI',clearing==100)

# --- Crash exception needs outside demand recorded below the minimum for 24 hours (no reference yet).
T0=t.start+3600;t.clock(T0)
mgmt(t.U,True,95,-6,reject=BAND,label='no crash bid before shallowness is recorded by an observation')
observe_now(T0,label='observation records a shallow market (no outside buyers)')
t.check('shallow market recorded, no price sample',pol()['shallowSince']==T0 and pol()['shallowSeen']==T0 and pol()['count']==0)
mgmt(t.U,True,95,-6,reject=BAND,label='crash bid rejected before 24 hours of recorded shallowness')
TS=T0+2*3600+1;observe_now(TS,label='observation after a gap of more than two hours')
t.check('a gap of more than two hours restarts the shallowness record',pol()['shallowSince']==TS)
keep_shallow(TS+23*3600)
t.clock(TS+86_399);mgmt(t.U,True,95,-6,reject=BAND,label='crash bid rejected one second before 24 hours')
T1=TS+86_400;t.clock(T1)
mgmt(t.U,True,96,-6,reject=BAND,label='crash bid above 95% of the auction price rejected')
P=t.amount(t.defaults['sale_proceeds'])
A1=P*6//100//95;C1=A1*95
mgmt(A1*t.U,True,95,-6,label='crash bid at 95% of the auction price accepted after 24 hours')
t.check('crash spend recorded in the rolling 30-day window',window()==C1)
mgmt(A1*t.U,True,95,-6,reject='Quota exceeded',label='bids capped at 10% of the reserve over 30 days')
A3=(P//10-C1)//95
mgmt(A3*t.U,True,95,-6,label='crash bid within the 30-day cap accepted')
t.check('window holds both crash bids',window()==C1+A3*95)
W=C1+A3*95;A4=((P+W)//10-W)//95
t.check('a bid fitting (reserve + window)/10 exists for the check below',A4>0 and W+A4*95>P//10)
mgmt(A4*t.U,True,95,-6,reject='Quota exceeded',label='the window is not added to the base: the cap is a flat 10% of the reserve balance')
keep_shallow(t.boundary(1)+3600)
t.check('a new calendar month has started',t.boundary(1)<T1+30*86400)
mgmt(A1*t.U,True,95,-6,reject='Quota exceeded',label='a new calendar month does not reset the rolling 30-day budget')
T2=T1+31*86400;keep_shallow(T2);t.clock(T2)
mgmt(2_000*t.U,True,95,-6,label='after 30 days the window has rolled and crash bidding resumes')
t.check('old spending dropped out of the window',window()==190_000)

# --- An outside buyer closes the exception and resets the shallowness record.
funded(t.bob,2_000*t.U);order(t.bob,1_500*t.U,True)
mgmt(t.U,True,95,-6,reject=BAND,label='no crash exception while outside bids meet the minimum depth')
t.clock(T2+3600);t.call('observe_release_market',label='observation with outside demand clears the shallowness record')
t.check('shallowness record cleared',pol()['shallowSince']==0)

# --- Dust cannot crowd out real demand (review finding B1/M1): 100 one-atom bids above the real bid.
funded(t.outsider,10*t.U)
for k in range(100):order(t.outsider,1,True,mantissa=11,exponent=-1)
t.check('100 dust bids rest above the outside bid',best(160)[0]==1_100_000)

# --- Reference from outside demand only.
R=T2+2*3600;t.clock(R);t.call('observe_release_market',label='re-arm observation')
for h in range(1,25):t.clock(R+h*3600);t.call('observe_release_market')
from release_ref import reference
t.check('100 dust bids do not block the reference; it is the outside 1.0',pol()['count']==24 and reference(pol(),R+24*3600)==1_000_000)
W0=window()
mgmt(1_000*t.U,True,1,0,reject='Quota exceeded',label='a normal reserve bid beyond 10% of the reserve over 30 days rejected')
mgmt(10*t.U,True,105,-2,label='management bid at 105% of reference')
t.check('a normal reserve bid shares the rolling 30-day window',window()==W0+10_500_000)
seq=int.from_bytes(t.svm.get_account(m).data[144:152],'little')
mgmt(10*t.U,True,105,-2,label='second management bid at 105% of reference (below 100 dust bids in the book)')
t.check('second bid counted',window()==W0+21_000_000)
t.call('management_cancel',{'sequence':seq},act,label='cancel the unfilled management bid')
t.check('cancelling an unfilled bid gives its quota back',window()==W0+10_500_000)
t.clock(R+25*3600);t.call('observe_release_market')
t.clock(R+26*3600);t.call('observe_release_market')
t.check('rested management bid at 1.05 is not counted: sample stays at the outside 1.0',last_sample()==1_000_000)
p=pol();t.check('last outside reference remembered',p['lastReference']==1_000_000 and p['lastReferenceTime']==R+26*3600)

# --- Keeper stops: a stale reference does not open the crash exception while outside buyers exist.
t.clock(R+30*3600)
mgmt(t.U,True,95,-2,reject=BAND,label='stale reference with outside buyers: no crash exception')

# --- Outside buyers removed by a sale into them (e.g. by the manager): no immediate crash bid (finding B4).
seat(t.alice);deposit(t.alice,f['wallet'],bv,t.defaults['mint'],1_600*t.U);order(t.alice,1_600*t.U,False)
mgmt(t.U,True,95,-2,reject=BAND,label='a sale that empties outside demand cannot open the crash exception on the spot')
S0=R+31*3600;observe_now(S0,label='observation records the new shallow market')
keep_shallow(S0+23*3600)
t.clock(S0+86_399);mgmt(t.U,True,95,-2,reject=BAND,label='still rejected before 24 hours of recorded shallowness')
t.clock(S0+86_400)
mgmt(t.U,True,96,-2,reject=BAND,label='crash bid above 95% of the last outside reference rejected')
mgmt(t.U,True,95,-2,label='after 24 hours: crash bid at 95% of the last outside reference accepted')

# --- Last reference older than 30 days: ceiling falls back to the opening auction price.
O=p['lastReferenceTime']+31*86400;keep_shallow(O);t.clock(O)
mgmt(t.U,True,95,-2,reject=BAND,label='crash ceiling ignores a reference older than 30 days')
mgmt(t.U,True,95,-6,label='old reference: crash bid at 95% of the auction price accepted')

# --- Stale record (Qwen/Claude review): no observation for more than two hours closes the exception.
t.clock(seen[0]+7201)
mgmt(t.U,True,95,-6,reject=BAND,label='crash bid rejected when the latest shallow observation is older than two hours')
observe_now(seen[0]+7201,label='observation after the gap')
t.check('the gap restarted the 24-hour wait',pol()['shallowSince']==seen[0])
mgmt(t.U,True,95,-6,reject=BAND,label='crash bid rejected right after the restart')

# --- Dust at the scan limit (Grok finding 2): 191 skipped nodes ahead of the real bid still measure; 192 stall
# the observation. With the reference stale, the sale floor stays at 95% of the last outside reference.
def bid_nodes():  # (price per HELI, seat index, sequence) from the best bid downward
 d=bytes(t.svm.get_account(m).data);w=lambda o:int.from_bytes(d[o:o+4],'little');NIL=2**32-1;out=[];i=w(160)
 while i!=NIL:
  at=256+i;v=d[at+16:at+80];out.append((int.from_bytes(v[0:16],'little')*t.U//10**18,int.from_bytes(v[32:36],'little'),int.from_bytes(v[24:32],'little')))
  l=w(at)
  if l!=NIL:
   while w(256+l+4)!=NIL:l=w(256+l+4)
   i=l
  else:
   c=i;p_=w(at+8)
   while p_!=NIL and w(256+p_+4)!=c:c=p_;p_=w(256+p_+8)
   i=p_
 return out
bw=t.token_account(q,t.bob.pubkey())
t.send('synthetic quote',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',2_000*t.U),[t.meta(q,True),t.meta(bw,True),t.meta(t.admin.pubkey(),False,True)])])
deposit(t.bob,bw,qv,q,2_000*t.U);bob_seq=int.from_bytes(t.svm.get_account(m).data[144:152],'little');order(t.bob,1_500*t.U,True,mantissa=98,exponent=-2)
D=seen[0]+3*3600;t.clock(D);t.call('observe_release_market',label='re-arm with a real outside bid at 0.98')
for h in range(1,25):t.clock(D+h*3600);t.call('observe_release_market')
t.check('reference at the outside 0.98',reference(pol(),D+24*3600)==980_000)
ahead=next(k for k,(_,_,sq) in enumerate(bid_nodes()) if sq==bob_seq)
for k in range(191-ahead):order(t.outsider,2,True,mantissa=99,exponent=-2)
nodes=bid_nodes();t.check('exactly 191 bid nodes rest above the real bid',next(k for k,(_,_,sq) in enumerate(nodes) if sq==bob_seq)==191)
t.clock(D+25*3600);t.call('observe_release_market',label='191 skipped nodes ahead: the real bid is still measured')
t.check('sample still the outside 0.98',last_sample()==980_000)
order(t.outsider,2,True,mantissa=99,exponent=-2)
t.check('now 192 bid nodes rest above the real bid',next(k for k,(_,_,sq) in enumerate(bid_nodes()) if sq==bob_seq)==192)
t.clock(D+26*3600);t.call('observe_release_market',reject='Market guard rejected',label='192 skipped nodes ahead: the observation stalls')
t.clock(D+25*3600+3601)
t.check('last outside reference remembered while observations stall',pol()['lastReference']==980_000)
mgmt(t.U,True,1,0,reject=BAND,label='no live reference: a normal reserve bid at 1.0 (within 105% of 0.98) is rejected')
ask(t.U,1,-4,reject=BAND,label='stalled reference: an ask at the opening auction price is rejected')
ask(t.U,930,-3,reject=BAND,label='stalled reference: an ask below 95% of the last outside reference is rejected')
ask(t.U,931,-3,label='stalled reference: an ask at 95% of the last outside reference is accepted')
t.clock(pol()['lastReferenceTime']+30*86400+1)
ask(t.U,1,-4,label='after 30 days without a reference the floor returns to the opening auction price')

result={'source_sha256':t.actual_source,'binary_sha256':t.actual_binary,'checks_and_transactions':len(t.checks),'checks':t.checks,'all_passed':True,
 'scope':'Compiled ELF and Manifest v3.0.24 ELF in local LiteSVM, synthetic quote/keys; V22 market-measurement decisions only. Not a deployment or audit.'}
(t.ROOT/'market-measure-v22-svm-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='checks'},indent=2))
