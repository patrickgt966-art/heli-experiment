"""Review A6 regression (4 Oct 2026): an observation that proves outside demand clears the crash-exception
record even when no price sample is due, so the clearing can never be rolled back by a failed sample.
Reuses the market setup of test_market_measure_v22_svm.py. Local LiteSVM, synthetic keys/quote only.
"""
import json,struct
from pathlib import Path
here=Path(__file__).resolve().parent
src=(here/'test_market_measure_v22_svm.py').read_text(encoding='utf-8')
head=src[:src.index('# --- Crash exception needs')]
# Same setup, but at the code floor of the minimum depth (250 quote units) to show it is accepted.
head=head.replace('min_depth=1000,reject_depth=249*t.U','min_depth=250,reject_depth=249*t.U').replace("'minimum depth of exactly 1,000 quote units accepted',t.read(t.defaults['policy'],'ReleasePolicy')['minimumQuoteDepth']==1000*t.U","'minimum depth of exactly 250 quote units accepted (code floor)',t.read(t.defaults['policy'],'ReleasePolicy')['minimumQuoteDepth']==250*t.U")
assert 'min_depth=250' in head and 'exactly 250' in head
ns={'__name__':'crash_record'};exec(compile(head,str(here/'test_market_measure_v22_svm.py'),'exec'),ns)
t=ns['t'];q=ns['q'];m=ns['m'];qv=ns['qv'];bv=ns['bv'];f=ns['f'];pol=ns['pol']
seat,deposit,order,funded=ns['seat'],ns['deposit'],ns['order'],ns['funded']
T0=t.start+3600;t.clock(T0)
funded(t.bob,2_000*t.U);order(t.bob,1_500*t.U,True)
t.call('observe_release_market',label='deep book: observation arms the price sampler')
t.check('sampler armed, no crash record',pol()['markTime']==T0 and pol()['shallowSince']==0)
seat(t.alice);deposit(t.alice,f['wallet'],bv,t.defaults['mint'],1_600*t.U);order(t.alice,1_600*t.U,False)
t.clock(T0+600);t.call('observe_release_market',label='outside demand sold out: shallowness recorded')
t.check('crash record opened',pol()['shallowSince']==T0+600)
bw=t.token_account(q,t.bob.pubkey())
t.send('synthetic quote',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',2_000*t.U),[t.meta(q,True),t.meta(bw,True),t.meta(t.admin.pubkey(),False,True)])])
deposit(t.bob,bw,qv,q,2_000*t.U);order(t.bob,1_500*t.U,True)
t.clock(T0+1200);t.call('observe_release_market',label='outside demand back 20 minutes after arming: the call succeeds without a sample')
t.check('the proven-deep observation cleared the crash record (no rollback)',pol()['shallowSince']==0 and pol()['count']==0)
result={'source_sha256':t.actual_source,'binary_sha256':t.actual_binary,'checks_and_transactions':len(t.checks),'checks':t.checks,'all_passed':True,
 'scope':'Compiled ELF and Manifest v3.0.24 ELF in local LiteSVM, synthetic quote/keys; crash-record clearing (review A6) only. Not a deployment or audit.'}
(t.ROOT/'crash-record-svm-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='checks'},indent=2))
