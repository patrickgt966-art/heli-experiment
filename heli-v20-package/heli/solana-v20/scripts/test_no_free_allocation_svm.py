"""Owner decision (V22): no free initial allocation, on the compiled ELF.
The whole 5M launch base is sold through the opening auction and the market; identity and entitlement
instructions remain in the IDL but always fail. Fresh local LiteSVM ledger, synthetic keys; no public transactions.
"""
import json,struct
import svm_fixture as t
from bootstrap_v15 import bootstrap

NOFREE='There is no free initial allocation'
from bootstrap_v15 import NAME,URI
f=bootstrap(t,1000,metadata_checks=True)  # alice buys 1,000 HELI in the opening auction
md=t.svm.get_account(t.defaults['metadata']);d=bytes(md.data)
def mstr(o):n=int.from_bytes(d[o:o+4],'little');return d[o+4:o+4+n].rstrip(b'\0').decode(),o+4+n
name,o=mstr(65);symbol,o=mstr(o);uri,o=mstr(o)
t.check('token metadata is owned by Metaplex and names the HELI mint',str(md.owner)==str(t.TOKEN_METADATA) and d[33:65]==bytes(t.defaults['mint']))
t.check('wallet-visible name, symbol and logo URI as written',(name,symbol,uri)==(NAME,'HELI',URI))
t.check('metadata update authority is the program config PDA (no update instruction exists)',d[1:33]==bytes(t.defaults['config']))
t.check('mint authority revoked after genesis',t.svm.get_account(t.defaults['mint']).data[0:4]==bytes(4))
c=t.cfg();a=t.read(t.defaults['auction'],'OpeningAuction')
t.check('supply after genesis is 90M (100M minted, 10M burned)',t.supply()==90_000_000*t.U)
t.check('locked stocks unchanged: 70M market reserve, 15M management treasury',c['stocks']==[70_000_000*t.U,0,0,15_000_000*t.U])
t.check('no launch transit account exists',t.svm.get_account(t.pda(b'launch-claims')) is None)
t.check('the config has no free allocation fields any more',not any(k.startswith('launch') for k in c))
t.check('the whole 5M launch base is market inventory (5M minus the auction sale)',t.amount(t.defaults['market_inventory'])==5_000_000*t.U-a['soldHeli']*t.U and c['marketRemaining']==5_000_000*t.U-a['soldHeli']*t.U)
t.check('auction sale authorization covers 5M',c['saleAuthorized']==5_000_000*t.U)
t.check('auction buyer received her HELI',t.amount(f['wallet'])==1000*t.U)
t.check('no identity credential was created',t.svm.get_account(f['identity']['credential']) is None)
for name in ['issue_credential','enroll_launch','claim_launch','dispute_launch','restore_launch','set_credential_active','finalize_launch','enroll','dispute_entry','finalize_registry','claim_human','open_stake','stake','checkpoint_stake','request_exit','withdraw','claim_reward','checkpoint_global','schedule_apr','set_liquidity_request','allocate_auction_proceeds','calendar_boundary','create_launch_claims','initialize_identity','set_verifier']:
 t.removed(name)
t.clock(t.boundary(6)+3600);t.removed('finalize_launch','no six-month free allocation reconciliation exists')
t.check('market inventory unchanged',t.amount(t.defaults['market_inventory'])==5_000_000*t.U-a['soldHeli']*t.U)

result={'source_sha256':t.actual_source,'binary_sha256':t.actual_binary,'checks_and_transactions':len(t.checks),'checks':t.checks,'all_passed':True,
 'scope':'Compiled ELF in local LiteSVM, synthetic keys; no-free-allocation launch only. Not a deployment or audit.'}
(t.ROOT/'no-free-allocation-svm-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='checks'},indent=2))
