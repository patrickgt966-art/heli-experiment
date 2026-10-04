"""Independent synthetic PoCs against the pinned packaged ELF; no network."""
import sys,pathlib,json
base=pathlib.Path(__file__).resolve().parent
if not (base/'heli-v20-package').exists(): base=pathlib.Path(__file__).resolve().parents[2]
here=base/'heli-v20-package/heli/solana-v20/scripts'
sys.path.insert(0,str(here))
body=(here/'test_market_measure_v22_svm.py').read_text().split('# --- Keeper stops:')[0]
ns={'__name__':'__main__'}
exec(compile(body,str(here/'test_market_measure_v22_svm.py'),'exec'),ns)
t=ns['t'];mgmt=ns['mgmt'];pol=ns['pol'];R=ns['R']
before=pol()['count']
t.svm.airdrop(ns['ma']['management_trader'],100_000_000)
for i in range(64): mgmt(1,True,105,-2,label='independent project dust bid '+str(i))
t.clock(R+27*3600)
t.call('observe_release_market',reject='Market guard',label='64 project dust orders hide existing outside funded bid')
assert pol()['count']==before
book_data=bytes(t.svm.get_account(ns['m']).data)
out={'source':t.actual_source,'elf':t.actual_binary,'project_dust_order_count':64,'project_dust_base_atoms':64,'observation_rejected_despite_existing_outside_bid':True,'outside_bid_original_quote_units':1500}
pathlib.Path('adversarial-results.json').write_text(json.dumps(out,indent=2))
print(json.dumps(out,indent=2))
