"""Key governance (review finding C3, owner decision B) on the compiled V20 ELF.
Fresh local LiteSVM ledger, synthetic keys; no public transactions.
"""
import hashlib,json,struct
import svm_fixture as t
from bootstrap_v15 import bootstrap

f=bootstrap(t,1000)
def key():
 k=t.Keypair();t.KEYS[str(k.pubkey())]=k;t.svm.airdrop(k.pubkey(),10_000_000_000);return k
gov=t.pda(b'governance');t.defaults['governance']=gov
G=lambda:t.read(gov,'Governance')
admin=lambda:t.cfg()['admin']
def act(name,signer,args=None,reject=None,label=None):return t.call(name,args or {},{'signer':signer.pubkey()},reject=reject,label=label)
UNAUTH='Signer is not authorized for this governance action'
recovery=key()

t.call('initialize_governance',{'recovery':recovery.pubkey()},{'admin':t.outsider.pubkey()},reject='has one',label='only the administrator creates governance')
t.call('initialize_governance',{'recovery':t.admin.pubkey()},reject=UNAUTH,label='recovery key must differ from the admin key')
t.call('initialize_governance',{'recovery':recovery.pubkey()})
t.check('cold recovery key registered',G()['recovery']==str(recovery.pubkey()))

# Routine handover: propose + accept in one transaction, no waiting.
a2=key()
t.send('routine admin handover in one transaction',[t.instruction('propose_admin',{'new_admin':a2.pubkey()},{'signer':t.admin.pubkey()}),t.instruction('accept_admin',{},{'signer':a2.pubkey()})],[t.admin,a2])
t.check('new admin installed immediately',admin()==str(a2.pubkey()))
t.call('pause',{'paused':True},reject='has one',label='old admin key lost its powers')
act('propose_admin',t.outsider,{'new_admin':t.outsider.pubkey()},reject=UNAUTH,label='outsider cannot propose an admin')
act('propose_admin',a2,{'new_admin':recovery.pubkey()},reject=UNAUTH,label='recovery key cannot also become admin')

# Lost admin key: the recovery key proposes; the change waits seven days and nobody vetoes.
a3=key();now=t.svm.get_clock().unix_timestamp
act('propose_admin',recovery,{'new_admin':a3.pubkey()})
t.check('recovery proposal waits seven days',G()['readyAt']==now+7*t.DAY and G()['byRecovery'])
act('accept_admin',a3,reject='Invalid calendar window',label='recovery handover cannot complete early')
act('accept_admin',t.outsider,reject=UNAUTH,label='only the proposed key can accept')
t.clock(now+7*t.DAY)
act('accept_admin',a3,label='lost admin replaced after the waiting period')
t.check('recovered admin installed',admin()==str(a3.pubkey()))

# Stolen recovery key: the admin vetoes its proposal during the window.
thief=key();now=t.svm.get_clock().unix_timestamp
act('propose_admin',recovery,{'new_admin':thief.pubkey()})
act('cancel_admin_proposal',t.outsider,reject=UNAUTH,label='outsider cannot cancel proposals')
act('cancel_admin_proposal',a3,label='admin vetoes a recovery-key proposal')
t.clock(now+8*t.DAY)
act('accept_admin',thief,reject=UNAUTH,label='vetoed takeover cannot complete')
t.check('admin unchanged after veto',admin()==str(a3.pubkey()))

# Recovery key rotation: immediate by the recovery key itself; a delayed, vetoable replacement by the admin.
r2=key()
t.send('recovery key rotates itself',[t.instruction('propose_recovery',{'new_recovery':r2.pubkey()},{'signer':recovery.pubkey()}),t.instruction('accept_recovery',{},{'signer':r2.pubkey()})],[recovery,r2])
t.check('new recovery key installed',G()['recovery']==str(r2.pubkey()))
act('propose_admin',recovery,{'new_admin':thief.pubkey()},reject=UNAUTH,label='old recovery key lost its powers')
r3=key();now=t.svm.get_clock().unix_timestamp
act('propose_recovery',a3,{'new_recovery':r3.pubkey()})
act('accept_recovery',r3,reject='Invalid calendar window',label='admin-proposed recovery key waits seven days')
act('cancel_recovery_proposal',a3,reject=UNAUTH,label='admin cannot cancel on behalf of the recovery key')
act('cancel_recovery_proposal',r2,label='current recovery key vetoes the replacement')
act('propose_recovery',a3,{'new_recovery':r3.pubkey()});t.clock(now+8*t.DAY+7*t.DAY)
act('accept_recovery',r3,label='lost recovery key replaced after the waiting period')
t.check('replacement recovery key installed',G()['recovery']==str(r3.pubkey()))

# Verifier rotation is immediate; old provider signatures stop working at once.
v2=key()
t.removed('set_verifier','no verifier exists any more (identity removed with the free allocation)')
t.removed('issue_credential','no credential can be issued with any verifier (instruction removed with the free allocation)')

# Defensive cancel: the recovery key stops an expense written with a compromised admin key.
q=t.defaults['quote_mint']
fee={'fee_base':t.pda(b'fee-base'),'fee_quote':t.pda(b'fee-quote'),'operations':t.pda(b'operations'),'quote_mint':q,'admin':a3.pubkey(),'payer':a3.pubkey()}
t.call('create_fee_base',acc=fee);t.call('create_fee_quote',acc=fee);t.call('initialize_fee_vaults',{'monthly_cap':50_000,'reserve':0,'project_floor':120*t.U},fee)
t.removed('allocate_auction_proceeds','the reserve is not moved ahead of an expense')
loot=t.token_account(q,thief.pubkey());e={'expense':t.pda(b'expense',struct.pack('<Q',0)),'destination':loot,'proposer':a3.pubkey()}|fee
t.call('propose_expense',{'nonce':0,'amount':10_000,'purpose':[9]*32,'fixed':True},e)
t.call('recovery_cancel_expense',{},{'expense':e['expense'],'recovery':t.outsider.pubkey()},reject=UNAUTH,label='only the recovery key has the defensive cancel')
t.call('recovery_cancel_expense',{},{'expense':e['expense'],'recovery':r3.pubkey()},label='recovery key cancels a hostile expense')
t.clock(t.read(e['expense'],'Expense')['readyAt'])
t.call('execute_expense',acc=e,reject='Invalid calendar window',label='cancelled hostile expense never pays')
t.check('nothing reached the thief',t.amount(loot)==0)

# Recovery unpause (owner decision, 6 Oct 2026): a stolen admin key cannot keep the program paused. The recovery key
# lifts a pause; the administrator then cannot pause again for seven days, so pause/unpause ping-pong cannot block.
pause=lambda on,signer,**k:t.call('pause',{'paused':on},{'admin':signer.pubkey()},**k)
runpause=lambda signer,**k:t.call('recovery_unpause',{},{'recovery':signer.pubkey()},**k)
runpause(r3,reject='Invalid state',label='recovery unpause only acts on a paused program')
pause(True,a3,label='administrator (or a thief holding its key) pauses')
runpause(t.outsider,reject=UNAUTH,label='outsider cannot lift the pause')
runpause(a3,reject=UNAUTH,label='administrator cannot use the recovery unpause')
now=t.svm.get_clock().unix_timestamp;runpause(r3,label='recovery key lifts the pause')
t.check('pause lifted by the recovery key',not t.cfg()['paused'])
t.check('pause locked for seven days',G()['pauseLockedUntil']==now+7*t.DAY)
pause(True,a3,reject='Invalid calendar window',label='administrator cannot pause again during the lock')
pause(False,a3,label='unpausing stays allowed during the lock')
t.clock(now+7*t.DAY-1);pause(True,a3,reject='Invalid calendar window',label='lock holds until its last second')
t.clock(now+7*t.DAY);pause(True,a3,label='administrator can pause again after seven days')
runpause(r3,label='recovery key lifts the repeated pause');t.check('lock renewed from the new unpause',G()['pauseLockedUntil']==now+14*t.DAY)

result={'source_sha256':t.actual_source,'binary_sha256':t.actual_binary,'checks_and_transactions':len(t.checks),'checks':t.checks,'all_passed':True,
 'scope':'Compiled V20 ELF in local LiteSVM, synthetic keys; admin/recovery/verifier governance only. Not a deployment or audit.'}
(t.ROOT/'governance-svm-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='checks'},indent=2))
