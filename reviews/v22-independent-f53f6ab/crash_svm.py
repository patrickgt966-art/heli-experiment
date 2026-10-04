"""Synthetic manager-induced crash and calendar reset; pinned V22 ELF."""
import sys,pathlib,json
base=pathlib.Path(__file__).resolve().parent
if not (base/'heli-v20-package').exists(): base=pathlib.Path(__file__).resolve().parents[2]
here=base/'heli-v20-package/heli/solana-v20/scripts';sys.path.insert(0,str(here))
body=(here/'test_market_measure_v22_svm.py').read_text().split('# --- Keeper stops:')[0]
ns={'__name__':'__main__'};exec(compile(body,str(here/'test_market_measure_v22_svm.py'),'exec'),ns)
t=ns['t'];mgmt=ns['mgmt'];book=ns['book'];act=ns['act'];R=ns['R']
t.clock(R+30*3600)
mgmt(t.U,True,95,-2,reject=ns['BAND'],label='independent stale keeper alone does not enable crash')
ns['ask'](1500*t.U,1,0,label='manager consumes outside demand with project inventory')
mgmt(t.U,True,95,-2,label='manager-induced shallow market now permits reserve bid')
first=book().copy()
# Remove collateral effects as a confounder: remaining deposited quote already covers both bids.
t.clock(t.boundary(2)-1)
mgmt(t.U,True,95,-2,label='crash bid one second before calendar boundary')
before=book().copy()
t.clock(t.boundary(2))
mgmt(t.U,True,95,-6,label='crash bid at calendar boundary with auction fallback')
after=book().copy()
assert after['crashMonth']==before['crashMonth']+1 and after['crashSpent']==95
out={'stale_keeper_alone_rejected':True,'manager_sale_removes_outside_demand_then_crash_bid_accepted':True,'before_month':before['crashMonth'],'before_spent_atoms':before['crashSpent'],'after_month':after['crashMonth'],'after_spent_atoms':after['crashSpent'],'calendar_reset_accepted':True,'interpretation':'calendar reset is stated policy, not rolling-30-day protection'}
pathlib.Path('crash-results.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
