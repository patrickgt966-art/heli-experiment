from pathlib import Path

p=Path(__file__).resolve().parents[2]/'solana-v19/scripts/test_management_svm.py'
s=p.read_text(encoding='utf-8').replace('V19','V20')
s=s.replace("t.check('90M genesis includes 70M human and 15M management'", "t.check('90M genesis includes 70M market reserve and 15M management'")
s=s.replace("ma={'management_book'", "t.defaults['release_reserve']=t.defaults['human']\nma={'management_book'")
s=s.replace("act=ma|ea\n", "act=ma|ea\n",1)
start=s.index('for n in range(1,13):')
end=s.index('act=ma|ea\nfor h in range(24):',start)
s=s[:start]+'''# Initial allocation remains the only free entitlement.
t.clock(t.start)
launch=f['identity']|{'receipt':t.pda(b'launch-receipt',bytes(f['identity']['credential']))}
t.call('enroll_launch',acc=launch)
t.clock(t.start+7*t.DAY)
initial_wallet=t.amount(f['wallet'])
t.call('claim_launch',acc=launch)
t.check('only initial entitlement gives exactly 1000 free HELI',t.amount(f['wallet'])==initial_wallet+1000*t.U)
t.call('claim_launch',acc=launch,reject='calendar',label='initial free entitlement cannot be claimed twice')
first_cap=None
for n in range(1,13):
 ea=epoch_accounts(t,n);t.clock(t.boundary(n-1))
 if n>1:t.call('open_epoch',{'number':n},ea|{'payer':t.outsider.pubkey()})
 monthly=ma|ea
 if n==1:
  t.call('settle',acc=monthly,reject='calendar',label='monthly unlock cannot occur before month end')
  ac=f['identity']|ea|{'receipt':t.pda(b'receipt',bytes(ea['epoch']),bytes(f['identity']['credential']))}
  t.call('enroll',acc=ac,reject='Monthly free dividends are disabled',label='monthly free distribution explicitly rejected')
  # Earlier rejection does not leave a token entitlement behind.
  t.check('no monthly human receipt created',t.svm.get_account(ac['receipt']) is None)
  t.check('no monthly claim/reward SPL accounts created',t.svm.get_account(ea['claim_vault']) is None and t.svm.get_account(ea['reward_vault']) is None)
 before=t.cfg();inventory=t.amount(t.defaults['market_inventory']);supply=t.supply();released=t.released()
 cap=released*4_022_473_737_086_389//10**18
 management_budget=min(cap//5,before['stocks'][3]) if n>=12 and n<720 else 0
 expected=min(cap-management_budget,before['stocks'][0])
 t.clock(t.boundary(n))
 if n==1:
  wrong=t.token_account(t.defaults['mint'],t.admin.pubkey())
  t.call('settle',acc=monthly|{'market_inventory':wrong},reject='seeds',label='monthly release cannot go to arbitrary wallet')
 t.call('settle',acc=monthly)
 e=t.read(ea['epoch'],'Epoch')
 t.check('month '+str(n)+' exact unlock enters canonical sale inventory',t.amount(t.defaults['market_inventory'])==inventory+expected and t.cfg()['stocks'][0]==before['stocks'][0]-expected)
 t.check('month '+str(n)+' no mint no burn no person dividend',t.supply()==supply and e['burned']==0 and e['perPerson']==0 and e['people']==0 and e['humanRemaining']==0)
 t.check('month '+str(n)+' shared cap and authorized sale accounting',e['capacity']==cap and e['humanBudget']==expected and e['founderBudget']==management_budget and t.cfg()['saleAuthorized']==before['saleAuthorized']+expected)
 if n==1:
  first_cap=cap;t.check('first month starts from 5M and unlocks 20112.368685 HELI',cap==20_112_368_685)
  t.call('settle',acc=monthly,reject='calendar',label='same monthly unlock cannot be replayed')
 if n==2:t.check('next monthly base includes actual prior unlock',cap>first_cap and released==5_000_000*t.U+first_cap)
 if n==6:
  reserved_before=t.amount(t.defaults['market_inventory'])
  t.call('finalize_launch')
  t.check('only unassigned initial free stock joins market at six months',t.cfg()['launchRemaining']==0 and t.amount(t.defaults['market_inventory'])==reserved_before+999_000*t.U)
act=ma|ea
# An unlocked unsold order can be cancelled and re-offered without new release.
inv_before=t.amount(t.defaults['market_inventory']);reserve_before=t.cfg()['stocks'][0];epoch_before=t.read(ea['epoch'],'Epoch')['humanBudget']
seq=int.from_bytes(t.svm.get_account(m).data[144:152],'little')
t.call('place_project_ask',{'amount':20*t.U,'price_mantissa':10,'price_exponent':0})
t.call('cancel_project_ask',{'sequence':seq})
t.call('withdraw_project_heli',{'amount':20*t.U})
t.check('unsold inventory survives cancel and return without restoring locked reserve',t.amount(t.defaults['market_inventory'])==inv_before and t.cfg()['stocks'][0]==reserve_before and t.read(ea['epoch'],'Epoch')['humanBudget']==epoch_before)
t.check('all twelve unlocks occurred without any monthly participants',t.read(ea['epoch'],'Epoch')['people']==0)
''' + s[end:]
s=s.replace("max_total=e['perPerson']*e['people']//4", "max_total=min(e['humanBudget']//4,e['founderBudget'])")
s=s.replace("(t.ROOT/'management-svm-verification.json')", "(t.ROOT/'market-release-svm-verification.json')")
# Add late-calendar and pause acceptance before final report.
marker="result={'source_sha256'"
extra='''# A paused release must not move tokens; delayed settlement remains sequential.
ea13=epoch_accounts(t,13);t.call('open_epoch',{'number':13},ea13)
t.clock(t.boundary(13));t.call('pause',{'paused':True})
stock=t.cfg()['stocks'][0];inventory=t.amount(t.defaults['market_inventory'])
t.call('settle',acc=ma|ea13,reject='calendar',label='paused monthly unlock rejected')
t.check('pause preserves unlocked inventory and locked stock',t.cfg()['stocks'][0]==stock and t.amount(t.defaults['market_inventory'])==inventory)
t.call('pause',{'paused':False})
ea14=epoch_accounts(t,14);t.clock(t.boundary(14));t.call('open_epoch',{'number':14},ea14)
t.call('settle',acc=ma|ea14,reject='calendar',label='missed monthly periods cannot be skipped')
t.call('settle',acc=ma|ea13);t.call('settle',acc=ma|ea14)
t.check('late periods settle once in order with no human burn',t.cfg()['lastSettledEpoch']==14 and t.read(ea14['epoch'],'Epoch')['burned']==0)
'''
s=s.replace(marker,extra+marker)
(Path(__file__).resolve().parent/'test_market_release_svm.py').write_text(s,encoding='utf-8')
print('V20 genuine-program acceptance test prepared.')
