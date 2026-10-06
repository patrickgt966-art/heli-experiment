"""Actual V20/Manifest ELF acceptance test; run after compiling V20.
Fresh local ledger, synthetic quote mint/provider and no public transactions.
"""
import json,struct
import svm_fixture as t
from bootstrap_v15 import bootstrap,epoch_accounts

f=bootstrap(t,1_000_000,with_policy=True)
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
t.send('TEST quote to project reserve',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',1000*t.U),[t.meta(t.defaults['quote_mint'],True),t.meta(t.defaults['sale_proceeds'],True),t.meta(t.admin.pubkey(),False,True)])])
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
start_quote=t.amount(t.defaults['sale_proceeds'])
t.call('management_fund_quote',{'amount':start_quote-1000*t.U+1},act,reject='Collateral',label='quote reserve floor protects project cash')
t.call('management_fund_quote',{'amount':40*t.U},act)
t.check('liquidity bid funded only with actual project cash',t.amount(t.defaults['sale_proceeds'])==start_quote-40*t.U)
t.call('management_fund_quote',{'amount':t.U},act|{'quote_vault':bv},reject='Market',label='wrong market quote vault rejected before transfer')
t.check('wrong vault operation rolls back project funds',t.amount(t.defaults['sale_proceeds'])==start_quote-40*t.U)

def seat(owner):t.send('user seat',[t.Instruction(MANIFEST,b'\x01',[t.meta(owner.pubkey(),True,True),t.meta(m,True),t.meta(t.SYSTEM)])],[owner])
def deposit(owner,wallet,vault,mint,amount):
 t.send('user deposit',[t.Instruction(MANIFEST,b'\x02'+struct.pack('<Q',amount)+b'\x00',[t.meta(owner.pubkey(),False,True),t.meta(m,True),t.meta(wallet,True),t.meta(vault,True),t.meta(t.TOKEN),t.meta(mint)])],[owner])
def order(owner,amount,is_bid,mantissa=1,exponent=0):
 t.send('user funded limit order',[t.Instruction(MANIFEST,b'\x06\x00'+struct.pack('<II',0,1)+struct.pack('<QIbBIB',amount,mantissa,exponent,int(is_bid),0,0),[t.meta(owner.pubkey(),True,True),t.meta(m,True),t.meta(t.SYSTEM)])],[owner])
def management_order(amount,is_bid,deposit_base=0,mantissa=1,exponent=0):
 t.call('management_order',{'amount':amount,'base_deposit':deposit_base,'price_mantissa':mantissa,'price_exponent':exponent,'is_bid':is_bid},act)

seat(t.alice);deposit(t.alice,f['wallet'],bv,t.defaults['mint'],10*t.U);order(t.alice,10*t.U,False)
t.call('management_order',{'amount':10*t.U,'base_deposit':0,'price_mantissa':1,'price_exponent':0,'is_bid':True},act,reject='Order price outside the permitted band',label='no reserve-funded bid without a market reference price')
t.transfer(f['wallet'],ma['management_base'],10*t.U,owner=t.alice)
t.check('working HELI arrives without unlocking treasury allocation',t.amount(ma['management_base'])==10*t.U and t.cfg()['stocks'][3]==15_000_000*t.U)
seat(t.bob);bq=t.token_account(q,t.bob.pubkey())
t.send('synthetic user quote collateral',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',20_000*t.U),[t.meta(q,True),t.meta(bq,True),t.meta(t.admin.pubkey(),False,True)])])
deposit(t.bob,bq,qv,q,20_000*t.U);order(t.bob,10_000*t.U,True)
management_order(5*t.U,False,5*t.U)
t.call('management_withdraw',{'amount':5*t.U,'is_base':False},act)
t.check('management sale returns cash to project reserve',t.amount(t.defaults['sale_proceeds'])==start_quote-35*t.U)
seq=int.from_bytes(t.svm.get_account(m).data[144:152],'little')
management_order(5*t.U,False,5*t.U,mantissa=10)
t.call('management_cancel',{'sequence':seq},act)
t.call('management_withdraw',{'amount':5*t.U,'is_base':True},act)
t.check('cancellation returns working HELI without restocking locked allocation',t.amount(ma['management_base'])==5*t.U and t.cfg()['stocks'][3]==15_000_000*t.U and t.read(ma['management_book'],'ManagementBook')['totalReleased']==0)
private=t.token_account(q,t.admin.pubkey())
t.call('management_withdraw',{'amount':t.U,'is_base':False},act|{'project_quote':private},reject='seeds',label='management cash cannot be redirected to personal wallet')

# Owner decision (V22): no free initial allocation; the whole 5M launch base goes through the auction and market.
t.clock(t.start+7*t.DAY)
t.check('no free allocation stock: the launch transit account does not exist',t.svm.get_account(t.pda(b'launch-claims')) is None)
first_cap=None
for n in range(1,13):
 ea=epoch_accounts(t,n);t.clock(t.boundary(n-1))
 if n>1:t.call('open_epoch',{'number':n},ea|{'payer':t.outsider.pubkey()})
 monthly=ma|ea
 if n==1:
  t.call('settle',acc=monthly,reject='calendar',label='monthly unlock cannot occur before month end')
  ac=f['identity']|ea|{'receipt':t.pda(b'receipt',bytes(ea['epoch']),bytes(f['identity']['credential']))}
  t.removed('enroll','monthly free distribution impossible: no identity credential can exist')
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
 t.check('month '+str(n)+' no mint no burn no person dividend',t.supply()==supply and not any(k in e for k in ('burned','perPerson','people','humanRemaining','staking')))
 t.check('month '+str(n)+' shared cap and authorized sale accounting',e['capacity']==cap and e['humanBudget']==expected and e['founderBudget']==management_budget and t.cfg()['saleAuthorized']==before['saleAuthorized']+expected)
 if n==1:
  first_cap=cap;t.check('first month starts from 5M and unlocks 20112.368685 HELI',cap==20_112_368_685)
  t.call('settle',acc=monthly,reject='calendar',label='same monthly unlock cannot be replayed')
 if n==2:t.check('next monthly base includes actual prior unlock',cap>first_cap and released==5_000_000*t.U+first_cap)
 if n==6:
  t.removed('finalize_launch','no six-month free allocation reconciliation')
act=ma|ea
# An unlocked unsold order can be cancelled and re-offered without new release.
inv_before=t.amount(t.defaults['market_inventory']);reserve_before=t.cfg()['stocks'][0];epoch_before=t.read(ea['epoch'],'Epoch')['humanBudget']
seq=int.from_bytes(t.svm.get_account(m).data[144:152],'little')
t.call('place_project_ask',{'amount':20*t.U,'price_mantissa':10,'price_exponent':0})
t.call('cancel_project_ask',{'sequence':seq})
t.call('withdraw_project_heli',{'amount':20*t.U})
t.check('unsold inventory survives cancel and return without restoring locked reserve',t.amount(t.defaults['market_inventory'])==inv_before and t.cfg()['stocks'][0]==reserve_before and t.read(ea['epoch'],'Epoch')['humanBudget']==epoch_before)
t.check('all twelve unlocks occurred without any monthly participants','people' not in t.read(ea['epoch'],'Epoch'))
act=ma|ea
t.clock(t.boundary(12)-3600);t.call('observe_release_market',label='arm price observations')
for h in range(24):t.clock(t.boundary(12)+h*3600);t.call('observe_release_market')
t.call('management_release',{'amount':t.U},act)
t.check('new working capital consumes management quota once',t.cfg()['stocks'][3]==15_000_000*t.U-t.U and t.read(ea['epoch'],'Epoch')['founder']==t.U)
rs={'source':t.defaults['founder'],'trader':t.pda(b'release-trader',bytes([3])),'base':t.pda(b'release-base',bytes([3])),'quote':t.pda(b'release-quote',bytes([3])),'destination':t.defaults['sale_proceeds']}|ea
t.call('create_release_base',{'kind':3},rs);t.call('create_release_quote',{'kind':3},rs)
t.call('initialize_release_seat',{'kind':3,'rent_lamports':10_000_000},rs)
t.call('execute_release_sale',{'kind':3,'amount':t.U},rs|{'destination':private},reject='Market',label='legacy sale cannot bypass project revenue custody')
t.call('execute_release_sale',{'kind':3,'amount':t.U},rs)
t.check('liquidity and direct sale share one management counter',t.read(ea['epoch'],'Epoch')['founder']==2*t.U and t.cfg()['stocks'][3]==15_000_000*t.U-2*t.U)
e=t.read(ea['epoch'],'Epoch');max_total=min(e['humanBudget']//4,e['founderBudget'])
t.call('management_release',{'amount':max_total-2*t.U+1},act,reject='Quota',label='combined management operations cannot exceed actual release allowance')
seq=int.from_bytes(t.svm.get_account(m).data[144:152],'little')
management_order(t.U,False,t.U,mantissa=10);t.call('management_cancel',{'sequence':seq},act)
t.call('management_withdraw',{'amount':t.U,'is_base':True},act)
t.check('cancel and rewithdraw cannot reset monthly release allowance',t.read(ea['epoch'],'Epoch')['founder']==2*t.U and t.read(ma['management_book'],'ManagementBook')['totalReleased']==t.U)
t.clock(t.boundary(13))
t.call('management_release',{'amount':t.U},act,reject='calendar',label='previous month management permission expires')
# Pause halts sales and treasury outflows but not the monthly rule (owner decision H2-B);
# delayed settlement remains sequential.
ea13=epoch_accounts(t,13);t.call('open_epoch',{'number':13},ea13)
t.ensure_governance();t.clock(t.boundary(13));t.call('pause',{'paused':True})
stock=t.cfg()['stocks'][0];inventory=t.amount(t.defaults['market_inventory'])
t.call('place_project_ask',{'amount':t.U,'price_mantissa':10,'price_exponent':0},reject='Market guard rejected',label='pause halts project sales')
ea14=epoch_accounts(t,14);t.clock(t.boundary(14));t.call('open_epoch',{'number':14},ea14,label='next monthly period opens while paused')
t.call('settle',acc=ma|ea14,reject='calendar',label='missed monthly periods cannot be skipped')
t.call('settle',acc=ma|ea13,label='monthly unlock proceeds while paused');t.call('settle',acc=ma|ea14)
t.check('paused program still moved both monthly releases into sale inventory',t.cfg()['stocks'][0]<stock and t.amount(t.defaults['market_inventory'])>inventory and t.cfg()['paused'])
t.call('pause',{'paused':False})
t.check('late periods settle once in order with no human burn',t.cfg()['lastSettledEpoch']==14 and 'burned' not in t.read(ea14['epoch'],'Epoch'))
# Exercise the complete 720-month calendar and retention of unsold released stock.
for n in range(15,721):
 ea=epoch_accounts(t,n);t.clock(t.boundary(n-1));t.call('open_epoch',{'number':n},ea)
 before=t.cfg();cap=t.released()*4_022_473_737_086_389//10**18
 management_budget=min(cap//5,before['stocks'][3]) if n>=12 and n<720 else 0
 expected=min(cap-management_budget,before['stocks'][0])
 inventory=t.amount(t.defaults['market_inventory']);supply=t.supply()
 t.clock(t.boundary(n));t.call('settle',acc=ma|ea)
 e=t.read(ea['epoch'],'Epoch')
 assert t.amount(t.defaults['market_inventory'])==inventory+expected
 assert t.cfg()['stocks'][0]==before['stocks'][0]-expected
 assert t.supply()==supply and e['capacity']==cap and e['founderBudget']==management_budget
t.check('all 720 months preserve the exact cap and never burn unsold monthly release',t.cfg()['lastSettledEpoch']==720)
remaining_locked=sum(t.cfg()['stocks']);sale_stock=t.amount(t.defaults['market_inventory']);mint_before=t.supply()
t.call('close_constitution')
t.check('60-year final burn touches only still-locked stock',t.supply()==mint_before-remaining_locked and t.amount(t.defaults['market_inventory'])==sale_stock and t.cfg()['stocks']==[0,0,0,0])
t.call('open_epoch',{'number':721},epoch_accounts(t,721),reject='calendar',label='no monthly unlock after the 720-month horizon')
seq=int.from_bytes(t.svm.get_account(m).data[144:152],'little')
t.call('place_project_ask',{'amount':20*t.U,'price_mantissa':10,'price_exponent':0})
t.call('cancel_project_ask',{'sequence':seq});t.call('withdraw_project_heli',{'amount':20*t.U})
t.check('unsold released inventory can still be offered and recovered after the horizon',t.amount(t.defaults['market_inventory'])==sale_stock)
quote_before=t.amount(t.defaults['sale_proceeds']);supply=t.supply()
t.call('place_project_ask',{'amount':t.U,'price_mantissa':1,'price_exponent':0})
t.call('withdraw_project_quote',{'amount':t.U})
t.check('released monthly sale inventory matches a funded buyer and proceeds stay in project reserve',t.amount(t.defaults['market_inventory'])==sale_stock-t.U and t.amount(t.defaults['sale_proceeds'])==quote_before+t.U and t.supply()==supply)
result={'source_sha256':t.actual_source,'binary_sha256':t.actual_binary,'checks_and_transactions':len(t.checks),'checks':t.checks,'all_passed':True,'calendar_months':720,'scope':'Real V20 and Manifest ELFs in local LiteSVM, synthetic quote/provider; not public deployment or audit.'}
(t.ROOT/'market-release-svm-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='checks'},indent=2))
