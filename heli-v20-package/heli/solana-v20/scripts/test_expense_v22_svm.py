"""V22 expense accounting fixes on the compiled ELF (V21 recheck findings 1 and 2).
Fresh local LiteSVM ledger, synthetic quote mint and keys; no public transactions.
1. An expense cannot pay a token account controlled by the program (fee-quote itself, auction
   proceeds, other program PDAs): cash would stay in the treasury while spent_total grows, or
   be counted as revenue again.
2. The expense month keeps counting after the 720-month supply calendar ends.
"""
import json,struct
import svm_fixture as t
from bootstrap_v15 import bootstrap

f=bootstrap(t,1000)
q=t.defaults['quote_mint']
fee={'fee_base':t.pda(b'fee-base'),'fee_quote':t.pda(b'fee-quote'),'operations':t.pda(b'operations'),'quote_mint':q,'sale_proceeds':t.defaults['sale_proceeds']}
t.call('create_fee_base',acc=fee);t.call('create_fee_quote',acc=fee)
t.call('initialize_fee_vaults',{'monthly_cap':50_000,'reserve':0},fee)
t.call('allocate_auction_proceeds',{'amount':t.amount(t.defaults['sale_proceeds'])},fee)
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
t.check('expense window during the supply calendar equals the supply month (1)',ops()['window']==1)

# Finding 2: month counter after month 720. fixture boundary(n) = start of month n+1 (start is the 31st, so day clamps).
for month in [2,13,720]:
 pay_at(t.boundary(month-1)+t.DAY,1,f'payment in month {month}')
 t.check(f'expense window {month} matches supply month {month}',ops()['window']==month)
pay_at(t.boundary(1)-1,1,'payment one second before month 2 starts')
t.check('one second before boundary stays in month 1',ops()['window']==1)
pay_at(t.boundary(1),1,'payment exactly at the month-2 boundary (clamped 28 Feb)')
t.check('boundary second opens month 2',ops()['window']==2)
pay_at(t.boundary(720)+10*t.DAY,50_000,'month 721 uses the full cap')
t.check('window 721 after the supply horizon',ops()['window']==721)
pay_at(t.boundary(720)+20*t.DAY,1,'month 721 cap still enforced',reject='Quota exceeded')
paid=pay_at(t.boundary(721)+10*t.DAY,1,'month 722 opens a new expense month')
t.check('month 722 payment paid',paid==1 and ops()['window']==722)
pay_at(t.boundary(721)+12*t.DAY,49_999,'month 722 remaining cap')
pay_at(t.boundary(721)+14*t.DAY,1,'month 722 cap enforced',reject='Quota exceeded')
pay_at(t.boundary(1199)+t.DAY,50_000,'month 1200 (100 years) payment')
t.check('window keeps counting (1200)',ops()['window']==1200)
cfg=t.cfg()
t.check('supply settlement state untouched by expense months',cfg['lastSettledEpoch']<=720)

result={'source_sha256':t.actual_source,'binary_sha256':t.actual_binary,'checks_and_transactions':len(t.checks),'checks':t.checks,'all_passed':True,
 'scope':'Compiled ELF in local LiteSVM, synthetic quote/keys; V22 expense destination and post-horizon month fixes only. Not a deployment or audit.'}
(t.ROOT/'expense-v22-svm-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='checks'},indent=2))
