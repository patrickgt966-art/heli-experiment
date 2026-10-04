"""V22 owner decisions on the compiled ELF (V21 recheck findings 3 and 4).
Runs the real 720-month market scenario (test_market_release_svm.py) in local LiteSVM with
synthetic quote/keys and adds checks; no public transactions.
  depth   finding 4, option B: the 2% depth limit is a month total shared by management releases
          and direct release sales (epoch.founder).
  closure finding 3, option B: after the 60-year close, sale revenue and contributions can still fund
          expenses under the same cap/delay rules; no new supply, management orders stay closed.
Usage: python test_policy_v22_svm.py depth|closure
"""
import sys,json,struct,pathlib
here=pathlib.Path(__file__).parent;sys.path.insert(0,str(here))
mode=sys.argv[1]
source=(here/'test_market_release_svm.py').read_text()
body=source.split("result={'source_sha256'",1)[0]
if mode=='depth':
 cut="t.check('liquidity and direct sale share one management counter'"
 body=body.split(cut,1)[0]
 ns={'__name__':'__main__'};exec(compile(body,str(here/'test_market_release_svm.py'),'exec'),ns)
 t=ns['t'];act=ns['act'];rs=ns['rs'];ea=ns['ea'];m=ns['m']
 def founder():return t.read(ea['epoch'],'Epoch')['founder']
 def depth():
  d=bytes(t.svm.get_account(m).data);i=int.from_bytes(d[160:164],'little');return int.from_bytes(d[256+i+32:256+i+40],'little')
 used=founder();limit=depth()//50
 t.check('scenario: two shared releases already used this month',used==2*t.U and limit>used)
 t.call('management_release',{'amount':100*t.U},act,label='first 100 HELI release fits the month total')
 t.call('management_release',{'amount':100*t.U},act,reject='Market guard',label='second 100 HELI release exceeds 2% of depth for the month (V21 allowed it)')
 limit=depth()//50;left=limit-founder()
 t.call('management_release',{'amount':left+1},act,reject='Market guard',label='one atom above the remaining month total is rejected')
 t.call('management_release',{'amount':left},act,label='exactly the remaining month total is accepted')
 t.check('month total equals 2% of current depth',founder()==limit)
 t.call('management_release',{'amount':1},act,reject='Market guard',label='no further management release this month')
 t.call('execute_release_sale',{'kind':3,'amount':t.U},rs,reject='Market guard',label='direct release sale shares the same month total')
 t.check('monthly management budget still respected',founder()<=t.read(ea['epoch'],'Epoch')['founderBudget'])
 t.clock(t.boundary(13));ea13=ns['epoch_accounts'](t,13);t.call('open_epoch',{'number':13},ea13);t.call('settle',acc=ns['ma']|ea13)
 t.check('new month starts with an empty counter',t.read(ea13['epoch'],'Epoch')['founder']==0)
 extra={'depth_atoms':depth(),'month_total_atoms':limit}
elif mode=='closure':
 setup="""
fee={'fee_base':t.pda(b'fee-base'),'fee_quote':t.pda(b'fee-quote'),'operations':t.pda(b'operations'),'quote_mint':q,'sale_proceeds':t.defaults['sale_proceeds']}
t.call('create_fee_base',acc=fee);t.call('create_fee_quote',acc=fee)
t.call('initialize_fee_vaults',{'monthly_cap':50_000,'reserve':0},fee)
"""
 body=body.replace("t.call('close_constitution')",setup+"t.call('close_constitution')",1)
 ns={'__name__':'__main__'};exec(compile(body,str(here/'test_market_release_svm.py'),'exec'),ns)
 t=ns['t'];fee=ns['fee'];act=ns['act'];q=ns['q']
 c=t.cfg();t.check('program is closed',c['closed'] and not c['live'])
 supply=t.supply();proceeds=t.amount(fee['sale_proceeds']);cash=t.amount(fee['fee_quote'])
 t.check('post-closure sale revenue is waiting in project proceeds',proceeds>=t.U)
 t.call('allocate_auction_proceeds',{'amount':proceeds},fee,label='post-closure sale revenue can be moved to the expense treasury')
 donor=t.token_account(q,t.admin.pubkey())
 t.send('TEST quote to donor',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',1_000),[t.meta(q,True),t.meta(donor,True),t.meta(t.admin.pubkey(),False,True)])])
 t.call('contribute_quote',{'amount':1_000},fee|{'contributor':t.admin.pubkey(),'contributor_quote':donor},label='contributions still accepted after closure')
 t.check('treasury received revenue and contribution',t.amount(fee['fee_quote'])==cash+proceeds+1_000 and t.amount(fee['sale_proceeds'])==0)
 dest=t.token_account(q,t.outsider.pubkey());o=t.read(fee['operations'],'Operations');n=o['nextNonce']
 e={'expense':t.pda(b'expense',struct.pack('<Q',n)),'destination':dest,'proposer':t.admin.pubkey()}|fee
 t.call('propose_expense',{'nonce':n,'amount':40_000,'purpose':[9]*32},e,label='expense proposal after closure')
 e2={'expense':t.pda(b'expense',struct.pack('<Q',n+1)),'destination':dest,'proposer':t.admin.pubkey()}|fee
 t.call('propose_expense',{'nonce':n+1,'amount':20_000,'purpose':[8]*32},e2,label='second proposal after closure')
 t.call('execute_expense',acc=e,reject='Invalid calendar window',label='seven-day delay still applies after closure')
 t.clock(t.read(e2['expense'],'Expense')['readyAt'])
 t.call('pause',{'paused':True});t.call('execute_expense',acc=e,reject='Invalid state',label='pause still halts expenses after closure');t.call('pause',{'paused':False})
 t.call('execute_expense',acc=e,label='expense paid after closure')
 t.check('expense paid exactly',t.amount(dest)==40_000)
 t.call('execute_expense',acc=e2,reject='Quota',label='monthly cap still applies after closure')
 t.check('expense month keeps counting after the horizon',t.read(fee['operations'],'Operations')['window']>720)
 t.call('management_order',{'amount':t.U,'base_deposit':t.U,'price_mantissa':10,'price_exponent':0,'is_bid':False},act,reject='Invalid state',label='management orders stay closed after closure (option B, not C)')
 t.check('no new supply after closure',t.supply()==supply and t.cfg()['stocks']==[0,0,0,0])
 extra={'post_closure_allocated_atoms':proceeds,'post_closure_expense_atoms':40_000}
else:raise SystemExit('mode: depth|closure')
result={'mode':mode,'source_sha256':t.actual_source,'binary_sha256':t.actual_binary,'checks_and_transactions':len(t.checks),'all_passed':True,**extra,
 'scope':'Compiled ELF in local LiteSVM, synthetic quote/keys; V22 owner-decision checks on top of the 720-month market scenario. Not a deployment or audit.'}
(t.ROOT/f'policy-v22-{mode}-svm-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2))
