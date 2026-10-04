"""Fresh synthetic local setup-order and layout checks, pinned commit only."""
import pathlib,sys,json,re
ROOT=pathlib.Path(__file__).resolve().parents[2];p=ROOT/'heli-v20-package/heli/solana-v20'
sys.path.insert(0,str(p/'scripts'))
import svm_fixture as t
import bootstrap_v15 as setup
mode=sys.argv[1];result={'mode':mode,'source':t.actual_source,'elf':t.actual_binary}
if mode=='missing-policy':
 setup.bootstrap(t,1000,with_policy=False)
 t.defaults['policy']=t.pda(b'release-policy')
 assert t.svm.get_account(t.defaults['policy']) is None and t.cfg()['live']
 t.call('initialize_release_policy',{'minimum_quote_depth':250*t.U},reject='Quota',label='missing policy cannot be created after genesis')
 result.update(genesis_without_policy=True,late_policy_rejected=True,supply=t.supply())
elif mode=='early-floor':
 # Stop the repository setup helper immediately after genesis, before any auction.
 ns={'__name__':'setup_prefix'}
 src=(p/'scripts/bootstrap_v15.py').read_text().replace("t.call('genesis');t.call('prepare_auction_quote')", "t.call('genesis');return {}\n t.call('prepare_auction_quote')")
 exec(compile(src,str(p/'scripts/bootstrap_v15.py'),'exec'),ns)
 ns['bootstrap'](t,1000,with_policy=True)
 assert t.svm.get_account(t.defaults['auction']) is None
 t.call('initialize_fee_vaults',{'monthly_cap':10**12,'reserve':0,'project_floor':120*t.U},{'operations':t.pda(b'operations')})
 result.update(floor_set_before_auction=True,project_floor=t.cfg()['projectFloor'])
else:raise ValueError(mode)
def size(typ):
 if typ=='publicKey':return 32
 if typ=='bool':return 1
 if isinstance(typ,str):return int(typ[1:])//8
 if 'array' in typ:return typ['array'][1]*size(typ['array'][0])
 if 'vec' in typ:return 4+256*size(typ['vec'])
 return sum(size(f['type']) for f in typ['fields'])
result['idl_account_borsh_bytes']={n:8+size(typ) for n,typ in t.TYPES.items() if n in ['Config','Epoch','Operations','ManagementBook','ReleasePolicy','Governance','Expense','OpeningAuction','OpeningBid']}
body=(p/'src/lib.rs').read_text().split('#[program]',1)[1].split('\nfn incoming',1)[0]
source_names=set(re.findall(r'pub fn (\w+)\(',body));idl_names=set(t.INSTRUCTIONS)
assert source_names==idl_names,(source_names-idl_names,idl_names-source_names)
result['instruction_names_match']=True;result['instructions']=len(source_names)
(ROOT/'reviews/v22-final'/('poc-'+mode+'.json')).write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
