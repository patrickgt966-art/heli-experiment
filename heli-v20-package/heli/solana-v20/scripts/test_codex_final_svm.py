"""Codex final review (reviews/v22-final, commit 74c0594) fixes on the compiled ELF with the real Manifest ELF.
Fresh local LiteSVM ledger, synthetic quote/keys; no public transactions.
F1 Cancelling a reserve bid gives quota back only to the day that bid was charged on.
F2 The self-trade guard also follows the Manifest expiry slot, so slow slots cannot outlive it.
F3 Management asks never meet a resting management bid and are remembered for later bids.
F4 Genesis requires the release policy; F5 the project floor is chosen after the auction (both in bootstrap).
"""
import json,struct
import svm_fixture as t
from solders.clock import Clock
from bootstrap_v15 import bootstrap,epoch_accounts

f=bootstrap(t,1_000_000,min_depth=1000,order_checks=True)
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
t.send('TEST quote to project reserve',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',2000*t.U),[t.meta(q,True),t.meta(t.defaults['sale_proceeds'],True),t.meta(t.admin.pubkey(),False,True)])])
fee={'fee_base':t.pda(b'fee-base'),'fee_quote':t.pda(b'fee-quote'),'operations':t.pda(b'operations'),'quote_mint':q,'sale_proceeds':t.defaults['sale_proceeds']}
t.call('create_fee_base',acc=fee);t.call('create_fee_quote',acc=fee)
t.call('initialize_fee_vaults',{'monthly_cap':10**15,'reserve':0,'project_floor':1000*t.U},fee,label='project floor chosen after the auction finished (review F5)')
t.call('initialize_management',{'rent_lamports':10_000_000},ma)
ea=epoch_accounts(t,1);t.call('open_epoch',{'number':1},ea);act=ma|ea
t.call('management_fund_quote',{'amount':400*t.U},act)

def seat(owner):t.send('user seat',[t.Instruction(MANIFEST,b'\x01',[t.meta(owner.pubkey(),True,True),t.meta(m,True),t.meta(t.SYSTEM)])],[owner])
def deposit(owner,wallet,vault,mint,amount):
 t.send('user deposit',[t.Instruction(MANIFEST,b'\x02'+struct.pack('<Q',amount)+b'\x00',[t.meta(owner.pubkey(),False,True),t.meta(m,True),t.meta(wallet,True),t.meta(vault,True),t.meta(t.TOKEN),t.meta(mint)])],[owner])
def order(owner,amount,is_bid,mantissa=1,exponent=0):
 t.send('user funded limit order',[t.Instruction(MANIFEST,b'\x06\x00'+struct.pack('<II',0,1)+struct.pack('<QIbBIB',amount,mantissa,exponent,int(is_bid),0,0),[t.meta(owner.pubkey(),True,True),t.meta(m,True),t.meta(t.SYSTEM)])],[owner])
def funded(owner,quote):
 seat(owner);w=t.token_account(q,owner.pubkey())
 t.send('synthetic quote',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',quote),[t.meta(q,True),t.meta(w,True),t.meta(t.admin.pubkey(),False,True)])])
 deposit(owner,w,qv,q,quote)
def ask(amount,mantissa,exponent,reject=None,label=None):
 t.call('place_project_ask',{'amount':amount,'price_mantissa':mantissa,'price_exponent':exponent},reject=reject,label=label)
def mgmt(amount,is_bid,mantissa,exponent,deposit=0,reject=None,label=None):
 t.call('management_order',{'amount':amount,'base_deposit':deposit,'price_mantissa':mantissa,'price_exponent':exponent,'is_bid':is_bid},act,reject=reject,label=label)
def at(ts,slot):  # wall clock and slot set independently (slow slots or a halted chain)
 t.clock(ts);c=t.svm.get_clock();t.svm.set_clock(Clock(slot,c.epoch_start_timestamp,c.epoch,c.leader_schedule_epoch,ts))
seq=lambda:int.from_bytes(t.svm.get_account(m).data[144:152],'little')
book=lambda:t.read(ma['management_book'],'ManagementBook')
SELF='Project orders may not trade with each other'

# A live outside reference of 1.0 (24 hourly samples of a 1,500-unit outside bid).
funded(t.bob,2_000*t.U);order(t.bob,1_500*t.U,True)
now=[t.start+3600];t.clock(now[0]);t.call('observe_release_market',label='arm observation')
def tick():now[0]+=3600;t.clock(now[0]);t.call('observe_release_market')
for h in range(24):tick()
NB=max(10*t.U,t.min_bid(105,-2));NC=t.bid_cost(NB,105,-2)

# --- F1: bid A in the last hour of day dA, bid B on the next day, cancel A: only dA gets the credit.
while now[0]%86400<86400-3600:tick()
dA=now[0]//86400;sA=seq();mgmt(NB,True,105,-2,label='bid A in the last hour of its day')
tick();dB=now[0]//86400;t.check('the next observation is on the next day',dB==dA+1)
mgmt(NB,True,105,-2,label='bid B on the next day')
b=book();t.check('bid A and bid B are charged on their own days',b['bidDays'][dA%31]==NC and b['bidDays'][dB%31]==NC)
t.call('management_cancel',{'sequence':sA},act,label='cancel the unfilled bid A on day B')
b=book();credit=NB*105//100
t.check("cancelling bid A credits bid A's own day, not bid B's day (review F1)",b['bidDays'][dA%31]==NC-credit and b['bidDays'][dB%31]==NC)
t.check('the bid record is used once',all(not(s==sA and left>0) for s,left in zip(b['bidSeq'],b['bidLeft'])))

# --- F3: a management ask never meets the resting management bid B at 1.05.
t.transfer(f['wallet'],ma['management_base'],20*t.U,owner=t.alice)
mgmt(t.U,False,100,-2,deposit=t.U,reject=SELF,label='management ask at 1.00 under its own resting bid at 1.05 rejected (review F3)')
mgmt(t.U,False,106,-2,deposit=t.U,label='management ask at 1.06 above its own bid accepted')
c=t.cfg();t.check('the management ask is remembered for later bids',c['askMin']==1_060_000 and c['askSlot']>0)

# --- F2: two days later by the clock but the bid B is still live by slot (slow slots).
S=t.svm.get_clock().slot;c=t.cfg();t.check('bid B is remembered until its Manifest expiry slot',c['mgmtBidSlot']>=S)
T=c['mgmtBidUntil'];at(T+1,c['mgmtBidSlot'])
ask(t.U,100,-2,reject=SELF,label='two days passed by the clock, bid B still live by slot: project ask at 1.00 rejected (review F2)')
at(T+3600,c['mgmtBidSlot']+1)
ask(t.U,100,-2,label='after the expiry slot of bid B the project ask is allowed')

result={'source_sha256':t.actual_source,'binary_sha256':t.actual_binary,'checks_and_transactions':len(t.checks),'checks':t.checks,'all_passed':True,
 'scope':'Compiled ELF and Manifest v3.0.24 ELF in local LiteSVM, synthetic quote/keys; Codex final review fixes F1-F5 only. Not a deployment or audit.'}
(t.ROOT/'codex-final-svm-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='checks'},indent=2))
