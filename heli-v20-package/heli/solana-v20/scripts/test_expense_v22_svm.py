"""V22 expense accounting fixes on the compiled ELF (V21 recheck findings 1 and 2).
Fresh local LiteSVM ledger, synthetic quote mint and keys; no public transactions.
1. An expense cannot pay a token account controlled by the program (fee-quote itself, auction
   proceeds, other program PDAs): cash would stay in the treasury while spent_total grows, or
   be counted as revenue again.
2. (Replaced by the owner's expense rule, 4 Oct 2026.) The reserve is drawn only when an approved expense is
   paid. Donations pay first; sale revenue is 100% spendable; beyond it, reserve spending over any rolling
   30 days is limited to a fixed technical floor of 10 quote units plus 25%/12 of the reserve (25% a year),
   and the reserve keeps 1,000 quote units except for spending within the fixed floor.
"""
import json,struct
import svm_fixture as t
from bootstrap_v15 import bootstrap

f=bootstrap(t,1000)
q=t.defaults['quote_mint']
fee={'fee_base':t.pda(b'fee-base'),'fee_quote':t.pda(b'fee-quote'),'operations':t.pda(b'operations'),'quote_mint':q,'sale_proceeds':t.defaults['sale_proceeds']}
t.call('create_fee_base',acc=fee);t.call('create_fee_quote',acc=fee)
t.call('initialize_fee_vaults',{'monthly_cap':10**15,'reserve':0},fee)
t.removed('allocate_auction_proceeds','the reserve is not moved ahead of an expense')
# Synthetic donation so the post-horizon payments below are funded.
donor=t.token_account(q,t.admin.pubkey())
t.send('TEST quote to donor',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',1_000_000),[t.meta(q,True),t.meta(donor,True),t.meta(t.admin.pubkey(),False,True)])])
t.call('contribute_quote',{'amount':1_000_000},fee|{'contributor':t.admin.pubkey(),'contributor_quote':donor})
private=t.token_account(q,t.outsider.pubkey())
nonce=0
def ops():return t.read(fee['operations'],'Operations')
def accounts(n,destination):return {'expense':t.pda(b'expense',struct.pack('<Q',n)),'destination':destination,'proposer':t.admin.pubkey()}|fee
def propose(destination,amount,label=None,reject=None):
 global nonce
 a=accounts(nonce,destination);t.call('propose_expense',{'nonce':nonce,'amount':amount,'purpose':[nonce%250+1]*32},a,label=label,reject=reject)
 if not reject:nonce+=1
 return a
def pay_at(when,amount,label,reject=None):
 t.clock(when-7*t.DAY);a=propose(private,amount);t.clock(when)
 before=t.amount(private);t.call('execute_expense',acc=a,label=label,reject=reject)
 return t.amount(private)-before

# Finding 1: treasury-controlled destinations.
TREASURY='Expense destination must be outside the program treasury'
t.clock(t.start+3*t.DAY)
propose(fee['fee_quote'],10_000,label='fee-quote cannot pay itself',reject=TREASURY)
propose(fee['sale_proceeds'],10_000,label='auction proceeds account cannot receive an expense (would be re-counted as revenue)',reject=TREASURY)
for name,owner in [('config',t.defaults['config']),('management trader',t.pda(b'management-trader')),('manifest trader',t.pda(b'manifest-trader')),('release trader',t.pda(b'release-trader',bytes([3]))),('dlmm funder',t.pda(b'dlmm-funder'))]:
 propose(t.token_account(q,owner),1,label=f'account owned by the {name} PDA is rejected',reject=TREASURY)
t.check('rejected proposals did not consume a nonce',ops()['nextNonce']==0)
# A proposal written before V22 (simulated by rewriting the stored destination) is stopped at payment.
legacy=propose(private,10_000)
acc=t.svm.get_account(legacy['expense']);d=bytearray(acc.data);d[8:40]=bytes(fee['fee_quote'])
t.svm.set_account(legacy['expense'],t._Account(acc.lamports,bytes(d),acc.owner,acc.executable,acc.rent_epoch))
t.clock(t.read(legacy['expense'],'Expense')['readyAt'])
cash,spent=t.amount(fee['fee_quote']),ops()['spentTotal']
t.call('execute_expense',acc=legacy|{'destination':fee['fee_quote']},label='pre-V22 self-payment proposal is rejected at execution',reject=TREASURY)
t.check('self-payment changed neither cash nor spent_total',t.amount(fee['fee_quote'])==cash and ops()['spentTotal']==spent)
t.call('cancel_expense',acc=legacy)
ok=propose(private,10_000,label='external wallet destination is still accepted')
t.clock(t.read(ok['expense'],'Expense')['readyAt'])
t.call('execute_expense',acc=ok,label='external expense executes')
t.check('external expense moves cash and spent_total together',t.amount(fee['fee_quote'])==cash-10_000 and ops()['spentTotal']==spent+10_000 and t.amount(private)==10_000)

# Owner's expense rule.
U=t.U;FIXED=10*U;KEEP=1000*U
res=lambda:t.amount(fee['sale_proceeds'])
def mint_reserve(n):t.send('TEST quote to project reserve',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',n),[t.meta(q,True),t.meta(fee['sale_proceeds'],True),t.meta(t.admin.pubkey(),False,True)])])
def pay(amount,label,reject=None):
 a=propose(private,amount);t.clock(t.read(a['expense'],'Expense')['readyAt'])
 before=t.amount(private);t.call('execute_expense',acc=a,label=label,reject=reject)
 if reject:t.call('cancel_expense',acc=a)
 return t.amount(private)-before
donated=t.amount(fee['fee_quote']);r0=res()
t.check('donations paid first: an expense equal to the donation balance leaves the reserve untouched',pay(donated,'expense paid from donations')==donated and res()==r0 and t.amount(fee['fee_quote'])==0)
mint_reserve(1005*U-res());t.check('reserve set to 1,005 quote units',res()==1005*U)
pay(20*U,'20 units would leave the reserve below 1,000 beyond the fixed floor',reject='Collateral deficit')
t.check('within the fixed floor the reserve may go below 1,000 (keeper keeps running)',pay(FIXED,'10-unit technical expense from the reserve')==FIXED and res()==995*U)
pay(1,'beyond the fixed floor the 1,000-unit reserve minimum holds',reject='Collateral deficit')
T=t.svm.get_clock().unix_timestamp+31*t.DAY;t.clock(T-7*t.DAY)
mint_reserve(100_000*U-res());t.clock(T)
B=res();L=FIXED+B*25//1200
n=next(k for k in range(1,1300) if t.boundary(k)>T+40*t.DAY)
P=t.boundary(n)-2*t.DAY
a=propose(private,L);a2=propose(private,1);t.clock(P);t.call('execute_expense',acc=a,label='fixed floor + 25%/12 of the reserve paid in one 30-day window')
t.check('reserve spending recorded in the rolling window',sum(ops()['outDays'])==L and res()==B-L)
a=a2;t.clock(P+t.DAY);t.call('execute_expense',acc=a,reject='Quota exceeded',label='one atom more within 30 days rejected')
t.clock(t.boundary(n)+t.DAY);t.call('execute_expense',acc=a,reject='Quota exceeded',label='a new calendar month does not reset the 30-day window')
t.clock(P+30*t.DAY);t.call('execute_expense',acc=a,label='after 30 days the window has rolled')
t.check('no sale revenue without a market: nothing counted as revenue',t.cfg()['revenueTotal']==0 and ops()['revenueSpent']==0)
L2=FIXED+res()*25//1200
a=propose(private,L2+1);t.clock(t.boundary(1199)+t.DAY);t.call('execute_expense',acc=a,reject='Quota exceeded',label='100 years on: the same limit applies')
t.call('cancel_expense',acc=a);a=propose(private,L2);t.clock(t.boundary(1199)+t.DAY+7*t.DAY);t.call('execute_expense',acc=a,label='100 years on: payment within the limit')
cfg=t.cfg()
t.check('supply settlement state untouched by expenses',cfg['lastSettledEpoch']<=720)

result={'source_sha256':t.actual_source,'binary_sha256':t.actual_binary,'checks_and_transactions':len(t.checks),'checks':t.checks,'all_passed':True,
 'scope':'Compiled ELF in local LiteSVM, synthetic quote/keys; V22 expense destination fix and the owner revenue/reserve expense rule only. Not a deployment or audit.'}
(t.ROOT/'expense-v22-svm-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='checks'},indent=2))
