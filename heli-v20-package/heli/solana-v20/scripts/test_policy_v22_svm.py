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
def outside_bid(ns,owner,amount,mantissa,exponent):
 t=ns['t'];q=ns['q'];w=t.token_account(q,owner.pubkey())
 t.send('synthetic quote',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',20_000*t.U),[t.meta(q,True),t.meta(w,True),t.meta(t.admin.pubkey(),False,True)])])
 try:ns['seat'](owner)
 except AssertionError:pass
 ns['deposit'](owner,w,ns['qv'],q,20_000*t.U);ns['order'](owner,amount,True,mantissa=mantissa,exponent=exponent)
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
 # Owner decision (V22): the 2% applies to all rested outside bids down to 98% of the reference, not just
 # the first minimum-depth slice. A bid at 0.99 raises the limit once it has rested; one at 0.97 does not.
 outside_bid(ns,t.outsider,5_000*t.U,99,-2);outside_bid(ns,t.alice,3_000*t.U,97,-2)
 t.call('management_release',{'amount':1},act,reject='Market guard',label='fresh outside bids do not count before they have rested')
 now=t.svm.get_clock().unix_timestamp;t.clock(now+3600);t.call('observe_release_market',label='observation marks the new bids as rested')
 band=depth()+5_000*t.U;left=band//50-founder()
 t.check('rested outside bids at 0.99 raise the monthly limit; the 0.97 bid is outside the band',left>0 and left<3_000*t.U//50+5_000*t.U//50)
 t.call('management_release',{'amount':left+1},act,reject='Market guard',label='one atom above 2% of the outside band is rejected')
 t.call('management_release',{'amount':left},act,label='release up to 2% of all outside bids within 98% of the reference')
 t.check('month total equals 2% of the outside band',founder()==band//50)
 t.check('monthly management budget still respected',founder()<=t.read(ea['epoch'],'Epoch')['founderBudget'])
 t.clock(t.boundary(13));ea13=ns['epoch_accounts'](t,13);t.call('open_epoch',{'number':13},ea13);t.call('settle',acc=ns['ma']|ea13)
 t.check('new month starts with an empty counter',t.read(ea13['epoch'],'Epoch')['founder']==0)
 extra={'depth_atoms':depth(),'month_total_atoms':limit,'band_month_total_atoms':band//50}
elif mode=='closure':
 setup="""
fee={'fee_base':t.pda(b'fee-base'),'fee_quote':t.pda(b'fee-quote'),'operations':t.pda(b'operations'),'quote_mint':q,'sale_proceeds':t.defaults['sale_proceeds']}
t.call('create_fee_base',acc=fee);t.call('create_fee_quote',acc=fee)
t.call('initialize_fee_vaults',{'monthly_cap':10**15,'reserve':0},fee)
"""
 body=body.replace("t.call('close_constitution')",setup+"t.call('close_constitution')",1)
 ns={'__name__':'__main__'};exec(compile(body,str(here/'test_market_release_svm.py'),'exec'),ns)
 t=ns['t'];fee=ns['fee'];act=ns['act'];q=ns['q']
 c=t.cfg();t.check('program is closed',c['closed'] and not c['live'])
 supply=t.supply();proceeds=t.amount(fee['sale_proceeds']);cash=t.amount(fee['fee_quote'])
 t.check('post-closure sale revenue is waiting in project proceeds',proceeds>=t.U)
 t.call('allocate_auction_proceeds',{'amount':1},fee,reject='Reserve funds move only when an approved expense is paid',label='the reserve is not moved ahead of an expense after closure')
 donor=t.token_account(q,t.admin.pubkey())
 t.send('TEST quote to donor',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',1_000),[t.meta(q,True),t.meta(donor,True),t.meta(t.admin.pubkey(),False,True)])])
 t.call('contribute_quote',{'amount':1_000},fee|{'contributor':t.admin.pubkey(),'contributor_quote':donor},label='contributions still accepted after closure')
 t.check('donation received; reserve untouched',t.amount(fee['fee_quote'])==cash+1_000 and t.amount(fee['sale_proceeds'])==proceeds)
 t.send('TEST quote to project reserve',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',10_000*t.U),[t.meta(q,True),t.meta(fee['sale_proceeds'],True),t.meta(t.admin.pubkey(),False,True)])])
 c=t.cfg();o=t.read(fee['operations'],'Operations');rev=c['revenueTotal']-o['revenueSpent']
 t.check('720-month scenario sale revenue was counted (direct release sales, project asks, management profit)',rev>0)
 B=t.amount(fee['sale_proceeds']);MAX=t.amount(fee['fee_quote'])+rev+10*t.U+(B-rev)*25//1200
 dest=t.token_account(q,t.outsider.pubkey());n=o['nextNonce']
 e={'expense':t.pda(b'expense',struct.pack('<Q',n)),'destination':dest,'proposer':t.admin.pubkey()}|fee
 t.call('propose_expense',{'nonce':n,'amount':MAX,'purpose':[9]*32},e,label='expense proposal after closure: donations + all revenue + fixed floor + 25%/12 of the reserve')
 e2={'expense':t.pda(b'expense',struct.pack('<Q',n+1)),'destination':dest,'proposer':t.admin.pubkey()}|fee
 t.call('propose_expense',{'nonce':n+1,'amount':1,'purpose':[8]*32},e2,label='second proposal after closure')
 t.call('execute_expense',acc=e,reject='Invalid calendar window',label='seven-day delay still applies after closure')
 t.clock(t.read(e2['expense'],'Expense')['readyAt'])
 t.call('pause',{'paused':True});t.call('execute_expense',acc=e,reject='Invalid state',label='pause still halts expenses after closure');t.call('pause',{'paused':False})
 t.call('execute_expense',acc=e,label='expense paid after closure: revenue 100%, reserve share on top')
 t.check('expense paid exactly; revenue fully used',t.amount(dest)==MAX and t.read(fee['operations'],'Operations')['revenueSpent']==c['revenueTotal'])
 t.call('execute_expense',acc=e2,reject='Quota',label='reserve spending limit still applies after closure')
 t.call('management_order',{'amount':t.U,'base_deposit':t.U,'price_mantissa':10,'price_exponent':0,'is_bid':False},act,reject='Invalid state',label='management orders stay closed after closure (option B, not C)')
 t.check('no new supply after closure',t.supply()==supply and t.cfg()['stocks']==[0,0,0,0])
 # Owner decision (V22, review finding B2): price observations continue after the close so the remaining
 # inventory is priced against current outside demand, not the 60-year-old auction price.
 outside_bid(ns,t.outsider,6_000*t.U,1,0)
 C=t.svm.get_clock().unix_timestamp+3600;t.clock(C);t.call('observe_release_market',label='price observation still runs after the close')
 for h in range(1,25):t.clock(C+h*3600);t.call('observe_release_market')
 from release_ref import reference
 t.check('post-closure reference from current outside demand',reference(t.read(t.defaults['policy'],'ReleasePolicy'),C+24*3600)==1_000_000)
 t.call('place_project_ask',{'amount':t.U,'price_mantissa':94,'price_exponent':-2},reject='Order price outside the permitted band',label='post-closure ask below 95% of the current reference rejected')
 t.call('place_project_ask',{'amount':t.U,'price_mantissa':95,'price_exponent':-2},label='post-closure ask at 95% of the current reference accepted')
 extra={'post_closure_revenue_atoms':rev,'post_closure_expense_atoms':MAX}
else:raise SystemExit('mode: depth|closure')
result={'mode':mode,'source_sha256':t.actual_source,'binary_sha256':t.actual_binary,'checks_and_transactions':len(t.checks),'all_passed':True,**extra,
 'scope':'Compiled ELF in local LiteSVM, synthetic quote/keys; V22 owner-decision checks on top of the 720-month market scenario. Not a deployment or audit.'}
(t.ROOT/f'policy-v22-{mode}-svm-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2))
