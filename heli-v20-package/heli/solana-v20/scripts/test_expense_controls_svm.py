"""Expense controls on the compiled V20 ELF (review finding C2b).
Fresh local LiteSVM ledger, synthetic quote mint and keys; no public transactions.
"""
import json,struct
import svm_fixture as t
from bootstrap_v15 import bootstrap

f=bootstrap(t,1000)
q=t.defaults['quote_mint']
fee={'fee_base':t.pda(b'fee-base'),'fee_quote':t.pda(b'fee-quote'),'operations':t.pda(b'operations'),'quote_mint':q,'sale_proceeds':t.defaults['sale_proceeds']}
t.call('create_fee_base',acc=fee);t.call('create_fee_quote',acc=fee)
t.call('initialize_fee_vaults',{'monthly_cap':50_000,'reserve':0,'project_floor':120*t.U},fee)
t.removed('allocate_auction_proceeds','the reserve is not moved ahead of an expense')
private=t.token_account(q,t.admin.pubkey())
def expense(nonce):return {'expense':t.pda(b'expense',struct.pack('<Q',nonce)),'destination':private,'proposer':t.admin.pubkey()}|fee

e0=expense(0);t.call('propose_expense',{'nonce':0,'amount':10_000,'purpose':[1]*32,'fixed':True},e0)
t.clock(t.read(e0['expense'],'Expense')['readyAt'])
t.call('pause',{'paused':True})
t.call('execute_expense',acc=e0,reject='Invalid state',label='paused program halts treasury outflow')
t.check('nothing paid while paused',t.amount(private)==0)
t.call('pause',{'paused':False})
t.call('cancel_expense',acc=e0|{'admin':t.outsider.pubkey()},reject='has one',label='only the administrator can cancel a proposal')
t.call('cancel_expense',acc=e0,label='administrator withdraws an unpaid proposal during the review window')
t.check('cancelled flag stored',t.read(e0['expense'],'Expense')['cancelled'] is True)
t.call('execute_expense',acc=e0,reject='Invalid calendar window',label='cancelled proposal can never execute')
t.call('cancel_expense',acc=e0,reject='Invalid state',label='cancellation is not repeatable')
t.check('cancelled proposal paid nothing',t.amount(private)==0)

e1=expense(1);t.call('propose_expense',{'nonce':1,'amount':10_000,'purpose':[2]*32,'fixed':True},e1)
t.call('execute_expense',acc=e1,reject='Invalid calendar window',label='seven-day delay still enforced')
t.clock(t.read(e1['expense'],'Expense')['readyAt'])
t.call('execute_expense',acc=e1,label='unpaused, uncancelled proposal executes after the delay')
t.check('approved expense paid exactly once',t.amount(private)==10_000)
t.call('cancel_expense',acc=e1,reject='Invalid state',label='paid proposal cannot be cancelled')
t.call('execute_expense',acc=e1,reject='Invalid calendar window',label='paid proposal cannot be replayed')

result={'source_sha256':t.actual_source,'binary_sha256':t.actual_binary,'checks_and_transactions':len(t.checks),'checks':t.checks,'all_passed':True,
 'scope':'Compiled V20 ELF in local LiteSVM, synthetic quote/keys; expense pause/cancel controls only. Not a deployment or audit.'}
(t.ROOT/'expense-controls-svm-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='checks'},indent=2))
