"""Post-close observation rejection and permanent auction floor, synthetic only."""
import sys,pathlib,json
base=pathlib.Path(__file__).resolve().parent
if not (base/'heli-v20-package').exists(): base=pathlib.Path(__file__).resolve().parents[2]
here=base/'heli-v20-package/heli/solana-v20/scripts';sys.path.insert(0,str(here))
body=(here/'test_market_release_svm.py').read_text().split("result={'source_sha256'",1)[0]
ns={'__name__':'__main__'};exec(compile(body,str(here/'test_market_release_svm.py'),'exec'),ns)
t=ns['t'];assert t.cfg()['closed']
t.clock(t.boundary(720)+86400)
t.call('observe_release_market',reject='Invalid state',label='post-close reference observations cannot resume')
t.call('place_project_ask',{'amount':t.U,'price_mantissa':95,'price_exponent':-6},reject='Order price outside',label='post-close sale below original auction price rejected')
out={'closed':True,'observations_disabled':True,'auction_floor_atoms_per_heli':t.read(t.defaults['auction'],'OpeningAuction')['clearingPrice'],'sale_at_95_percent_original_auction_price_rejected':True,'market_below_auction_scenario':'economic hypothesis; program floor behavior reproduced'}
pathlib.Path('closure-results.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
