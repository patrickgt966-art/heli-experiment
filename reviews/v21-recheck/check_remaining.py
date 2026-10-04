"""Synthetic V21 ELF checks only; no RPC, private credentials or deployment."""
import sys, pathlib, runpy, json, struct, contextlib, io, os
scripts=pathlib.Path(os.environ.get('HELI_V21_SCRIPTS',str(pathlib.Path(__file__).parent/'heli/solana-v20/scripts')))
sys.path.insert(0,str(scripts))
# Preload the selected pinned dependency before fixture.py prepends historical package paths.
from solders.litesvm import LiteSVM
mode=sys.argv[1]
captured=io.StringIO()
with contextlib.redirect_stdout(captured):
 if mode=='expense':
  ns=runpy.run_path(str(scripts/'test_expense_controls_svm.py'));t=ns['t'];fee=ns['fee']
  e=ns['expense'](2);e['destination']=fee['fee_quote']
  cash=t.amount(fee['fee_quote']);spent=t.read(fee['operations'],'Operations')['spentTotal']
  t.call('propose_expense',{'nonce':2,'amount':10_000,'purpose':[3]*32},e)
  t.clock(t.read(e['expense'],'Expense')['readyAt']);t.call('execute_expense',acc=e)
  assert t.amount(fee['fee_quote'])==cash
  assert t.read(fee['operations'],'Operations')['spentTotal']==spent+10_000
  alias={'cash_before':cash,'cash_after':t.amount(fee['fee_quote']),'spent_increase':10_000}
  t.clock(t.boundary(720)+10*t.DAY)
  e3=ns['expense'](3);t.call('propose_expense',{'nonce':3,'amount':50_000,'purpose':[4]*32},e3)
  t.clock(t.read(e3['expense'],'Expense')['readyAt']);t.call('execute_expense',acc=e3)
  window=t.read(fee['operations'],'Operations')['window']
  t.clock(t.boundary(722)+10*t.DAY)
  e4=ns['expense'](4);t.call('propose_expense',{'nonce':4,'amount':1,'purpose':[5]*32},e4)
  t.clock(t.read(e4['expense'],'Expense')['readyAt'])
  t.call('execute_expense',acc=e4,reject='Quota',label='later month cannot reset post-horizon expense counter')
  assert window==721 and t.read(fee['operations'],'Operations')['window']==721
  result={'mode':mode,'self_payment':alias,'post_horizon_window':window,'later_month_payment_rejected':True}
 elif mode=='depth':
  source=(scripts/'test_market_release_svm.py').read_text()
  prefix=source.split("t.call('management_release',{'amount':t.U},act)\n",1)[0]
  ns={'__name__':'__main__'};exec(compile(prefix,str(scripts/'test_market_release_svm.py'),'exec'),ns)
  t=ns['t'];d=bytes(t.svm.get_account(ns['m']).data);idx=int.from_bytes(d[160:164],'little');depth=int.from_bytes(d[256+idx+32:256+idx+40],'little')
  before=t.read(ns['ea']['epoch'],'Epoch')['founder']
  for _ in range(3):t.call('management_release',{'amount':100*t.U},ns['act'])
  released=t.read(ns['ea']['epoch'],'Epoch')['founder']-before
  assert released>depth//50
  assert t.read(ns['ea']['epoch'],'Epoch')['founder']<=t.read(ns['ea']['epoch'],'Epoch')['founderBudget']
  result={'mode':mode,'depth_atoms':depth,'single_call_limit_atoms':depth//50,'released_three_calls_atoms':released,'monthly_budget_still_respected':True}
 elif mode=='closure':
  source=(scripts/'test_market_release_svm.py').read_text()
  setup="""
fee={'fee_base':t.pda(b'fee-base'),'fee_quote':t.pda(b'fee-quote'),'operations':t.pda(b'operations'),'quote_mint':q,'sale_proceeds':t.defaults['sale_proceeds']}
t.call('create_fee_base',acc=fee);t.call('create_fee_quote',acc=fee)
t.call('initialize_fee_vaults',{'monthly_cap':50_000,'reserve':0},fee)
t.call('allocate_auction_proceeds',{'amount':1},fee)
"""
  source=source.replace("t.call('close_constitution')",setup+"\nt.call('close_constitution')",1)
  ns={'__name__':'__main__'};exec(compile(source,str(scripts/'test_market_release_svm.py'),'exec'),ns)
  t=ns['t'];fee=ns['fee'];working=t.amount(ns['ma']['management_base'])
  assert working>0
  t.call('management_order',{'amount':t.U,'base_deposit':t.U,'price_mantissa':10,'price_exponent':0,'is_bid':False},ns['act'],reject='Invalid state',label='released management inventory cannot be offered after closure')
  t.call('allocate_auction_proceeds',{'amount':1},fee,reject='Invalid state',label='existing sale revenue cannot fund expenses after closure')
  result={'mode':mode,'working_heli_atoms':working,'management_ask_rejected':True,'allocate_existing_proceeds_rejected':True,'project_inventory_sales_still_work':True}
 else: raise ValueError(mode)
result.update(source_sha256=t.actual_source,binary_sha256=t.actual_binary)
print(json.dumps(result,indent=2))
