"""Free-allocation dispute, appeal and credential status (review finding M4, owner decision) on the compiled V20 ELF.
Fresh local LiteSVM ledger, synthetic identities and keys; no public transactions.
"""
import hashlib,json,struct
import svm_fixture as t
from bootstrap_v15 import bootstrap

f=bootstrap(t,1000)
def key():
 k=t.Keypair();t.KEYS[str(k.pubkey())]=k;t.svm.airdrop(k.pubkey(),10_000_000_000);return k
def person(seed):
 """Synthetic verified person: credential issued with the provider (verifier) signature."""
 p=key();now=t.svm.get_clock().unix_timestamp;nul=hashlib.sha256(seed).digest();dig=hashlib.sha256(b'synthetic').digest()
 msg=b'HELI_IDENTITY_V15\0'+bytes(t.PROGRAM)+bytes(t.defaults['config'])+bytes(p.pubkey())+nul+dig+struct.pack('<qq',now,now+600)
 data=b'\x01\x00'+struct.pack('<7H',48,65535,16,65535,112,len(msg),65535)+bytes(f['verifier'].pubkey())+bytes(f['verifier'].sign_message(msg))+msg
 cred=t.pda(b'human',nul)
 acc={'person':p.pubkey(),'owner':p.pubkey(),'credential':cred,'wallet_identity':t.pda(b'id-wallet',bytes(p.pubkey())),'receipt':t.pda(b'launch-receipt',bytes(cred)),'destination':t.token_account(t.defaults['mint'],p.pubkey())}
 t.send('issue synthetic credential',[t.Instruction(t.Pubkey.from_string('Ed25519SigVerify111111111111111111111111111'),data,[]),t.instruction('issue_credential',{'nullifier':list(nul),'proof_digest':list(dig),'issued_at':now,'expires_at':now+600},acc)],[p])
 return acc
R=lambda a:t.read(a['receipt'],'LaunchReceipt')
reason=lambda text:list(hashlib.sha256(text.encode()).digest())
people=lambda:t.cfg()['launchPeople']
t.clock(t.start)

# Dispute only inside the waiting period, only with a reason hash; appeal restarts the wait.
a=person(b'alice-like');t.call('enroll_launch',acc=a)
t.call('dispute_launch',{'reason':[0]*32},a,reject='Invalid state',label='dispute without a written reason rejected')
t.call('dispute_launch',{'reason':reason('x')},a|{'admin':t.outsider.pubkey()},reject='has one',label='only the administrator disputes')
why=reason('Application 17: provider changed the decision to Declined on day 3')
t.call('dispute_launch',{'reason':why},a,label='registration disputed during its waiting period')
t.check('dispute recorded with its reason hash',R(a)['valid'] is False and R(a)['reason']==why and people()==0)
t.clock(R(a)['eligibleAt'])
t.call('claim_launch',acc=a,reject='Invalid calendar window',label='disputed registration cannot claim')
back=reason('Application 17: appeal upheld, document re-checked')
t.call('restore_launch',{'reason':back},a,label='administrator reinstates on appeal')
t.check('appeal restores the right with a fresh seven-day wait',R(a)['valid'] and R(a)['reason']==back and R(a)['eligibleAt']==t.svm.get_clock().unix_timestamp+7*t.DAY and people()==1)
t.call('claim_launch',acc=a,reject='Invalid calendar window',label='reinstated right waits again')
t.clock(R(a)['eligibleAt']);t.call('claim_launch',acc=a,label='reinstated right claims after the new wait')
t.call('restore_launch',{'reason':back},a,reject='Invalid calendar window',label='claimed right cannot be restored twice')

# After the waiting period the right is final.
b=person(b'bob-like');t.call('enroll_launch',acc=b);t.clock(R(b)['eligibleAt'])
t.call('dispute_launch',{'reason':reason('late')},b,reject='Invalid calendar window',label='earned right cannot be disputed after its waiting period')

# Credential status: an inactive credential cannot register; re-activation needs a reason too.
c=person(b'carol-like')
t.call('set_credential_active',{'active':False,'reason':reason('forged credential from leaked verifier key')},c)
t.check('credential deactivated with reason',t.read(c['credential'],'Credential')['active'] is False)
t.call('enroll_launch',acc=c,reject='Invalid credential',label='inactive credential cannot register')
t.call('set_credential_active',{'active':True,'reason':[0]*32},c,reject='Invalid state',label='re-activation also needs a reason')
t.call('set_credential_active',{'active':True,'reason':reason('false alarm, identity confirmed')},c)
t.call('enroll_launch',acc=c,label='re-activated credential registers')

# Deactivating a credential never touches a right that already passed its waiting period.
t.call('set_credential_active',{'active':False,'reason':reason('later suspicion')},b)
t.call('claim_launch',acc=b,label='final right still claims after credential deactivation')
t.call('set_credential_active',{'active':False,'reason':reason('again')},b,reject='Invalid state',label='status change must change the status')

result={'source_sha256':t.actual_source,'binary_sha256':t.actual_binary,'checks_and_transactions':len(t.checks),'checks':t.checks,'all_passed':True,
 'scope':'Compiled V20 ELF in local LiteSVM, synthetic identities; free-allocation dispute/appeal/credential status only. Not a deployment or audit.'}
(t.ROOT/'entitlement-controls-svm-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='checks'},indent=2))
