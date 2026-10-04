"""Initialization access (review finding H1) on the compiled V20 ELF.
Fresh local LiteSVM ledger, synthetic keys; no public transactions.
"""
import json
import svm_fixture as t
from bootstrap_v15 import bootstrap

t.clock(t.start-14*t.DAY)
q=t.allocate(82,t.TOKEN);t.send('TEST quote mint',[t.Instruction(t.TOKEN,b'\x14\x06'+bytes(t.admin.pubkey())+b'\x00',[t.meta(q,True)])])
h=t.allocate(8+720*8*4)
attempt={'quote_mint':q,'history':h}
t.call('initialize',{'start':t.start},attempt|{'admin':t.outsider.pubkey()},reject='Only the program upgrade authority can initialize',label='front-runner without upgrade authority cannot initialize')
t.set_upgrade_authority(None)
t.call('initialize',{'start':t.start},attempt,reject='Only the program upgrade authority can initialize',label='immutable deployment cannot be initialized by anyone')
t.set_upgrade_authority(t.admin.pubkey())
wrong=t.allocate(1200,t.TOKEN)
t.call('initialize',{'start':t.start},attempt|{'program_data':wrong},reject='AccountOwnedByWrongProgram',label='a substituted program-data account is rejected')
# Attacker-made account with the loader owner and ProgramData layout naming the attacker as authority.
fake=t.Keypair().pubkey();real=t.svm.get_account(t.PROGRAM_DATA)
t.svm.set_account(fake,t._Account(real.lamports,bytes(real.data[:12])+b'\x01'+bytes(t.outsider.pubkey())+bytes(real.data[45:]),real.owner,False,0))
t.call('initialize',{'start':t.start},attempt|{'admin':t.outsider.pubkey(),'program_data':fake},reject='Only the program upgrade authority can initialize',label='forged program-data naming the attacker is rejected')
t.check('no config created by rejected attempts',t.svm.get_account(t.defaults['config']) is None)
bootstrap(t,1000)
t.check('upgrade authority initializes and becomes administrator',t.cfg()['admin']==str(t.admin.pubkey()))

result={'source_sha256':t.actual_source,'binary_sha256':t.actual_binary,'checks_and_transactions':len(t.checks),'checks':t.checks,'all_passed':True,
 'scope':'Compiled V20 ELF in local LiteSVM, synthetic keys; initialization access only. Not a deployment or audit.'}
(t.ROOT/'setup-controls-svm-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='checks'},indent=2))
