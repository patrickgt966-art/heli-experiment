"""Red-team run (5 Oct 2026): malicious outsiders and a malicious administrator attack the compiled ELF.
Fresh local LiteSVM ledger with the real Manifest ELF, synthetic quote/keys; no public transactions.
Every attack below must fail (or stay inside the published bounds); a successful attack is recorded as a
finding and makes the run fail. Reuses the market setup of test_codex_final_svm.py.
"""
import json,re,struct
from pathlib import Path
here=Path(__file__).resolve().parent
src=(here/'test_codex_final_svm.py').read_text(encoding='utf-8')
ns={'__name__':'redteam'};exec(compile(src[:src.index('# A live outside reference')],str(here/'test_codex_final_svm.py'),'exec'),ns)
t,m,q,ma,act,fee,f=ns['t'],ns['m'],ns['q'],ns['ma'],ns['act'],ns['fee'],ns['f']
funded,order,mgmt,seat,deposit=ns['funded'],ns['order'],ns['mgmt'],ns['seat'],ns['deposit']
from release_ref import reference
MAL=t.outsider  # Mallory
mint=t.defaults['mint']
blocked=[];findings=[]
def why(e):
 s=str(e);x=re.search(r'Error Message: ([^."\]]+)',s) or re.search(r'(Custom\(\d+\))',s) or re.search(r"(Fallback functions are not supported|already in use|insufficient funds|InvalidAccountData|MissingRequiredSignature|IncorrectProgramId)",s)
 return x.group(1).strip() if x else s[:80]
def attack(label,fn):
 try:fn()
 except AssertionError as e:blocked.append([label,why(e)]);return
 findings.append(label);t.checks.append('FINDING: '+label)
def attack_call(label,name,args=None,acc=None):
 acc=dict(acc or {})
 def go():
  while True:
   try:return t.call(name,args,acc,label='attack: '+label)
   except KeyError as k:acc[k.args[0]]=MAL.pubkey()  # account without a fixture default: Mallory's address
 attack(label,go)
def balances():
 return {k:(t.amount(a) if t.svm.get_account(a) else 0) for k,a in [('mal_quote',mq),('mal_heli',mh)]}
# Mallory's own token accounts, funded with synthetic quote only.
mq=t.token_account(q,MAL.pubkey());mh=t.token_account(mint,MAL.pubkey())
t.send('TEST quote to Mallory',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',5_000*t.U),[t.meta(q,True),t.meta(mq,True),t.meta(t.admin.pubkey(),False,True)])])
start_bal=balances();supply0=t.supply()

# --- 1. Mallory signs every administrator instruction in place of the administrator.
idl=json.loads((t.ROOT/'idl.json').read_text())
snake=lambda s:re.sub(r'(?<!^)(?=[A-Z])','_',s).lower()
def default(ty):
 if ty in('u64','u32','u16'):return 1
 if ty in('u8','i8','i64','bool'):return False if ty=='bool' else 0
 if ty=='publicKey':return MAL.pubkey()
 if ty=='string':return 'x'
 if isinstance(ty,dict) and 'array' in ty:return [1]*ty['array'][1]
 return 0
for ix in idl['instructions']:
 signers=[a['name'] for a in ix['accounts'] if a.get('isSigner')]
 role=[s for s in signers if s in('admin','signer','recovery','proposer')]
 if not role or ix['name']=='initialize':continue
 args={snake(a['name']):default(a['type']) for a in ix['args']}
 acc={snake(r):MAL.pubkey() for r in role}
 if 'payer' in [snake(s) for s in signers]:acc['payer']=MAL.pubkey()
 base=act|fee if snake(ix['name']).startswith(('management','propose_expense','cancel_expense','recovery_cancel')) else {}
 attack_call('Mallory signs %s as %s'%(snake(ix['name']),'/'.join(role)),snake(ix['name']),args,base|acc)

# --- 2. Auction after the sale: steal or repeat a claim, bid late, finalize twice.
ab=t.pda(b'auction-bid',bytes(t.alice.pubkey()))
attack_call("Mallory claims alice's auction bid into her own accounts",'claim_auction_bid',acc={'bidder':MAL.pubkey(),'bid':ab,'bidder_heli':mh,'bidder_quote':mq})
attack_call("alice claims her auction bid a second time",'claim_auction_bid',acc={'bidder':t.alice.pubkey(),'bid':ab,'bidder_heli':f['wallet'],'bidder_quote':f['quote_wallet']})
mb={'bidder':MAL.pubkey(),'bid':t.pda(b'auction-bid',bytes(MAL.pubkey())),'bidder_quote':mq,'bidder_heli':mh,'account_payer':MAL.pubkey()}
attack_call('Mallory opens an auction bid after the auction ended','create_auction_bid',acc=mb)
attack_call('anyone finalizes the auction a second time','finalize_auction')

# --- 3. Price reference: bundle, spoof and repeat observations.
funded(t.bob,2_000*t.U);order(t.bob,1_500*t.U,True)
now=[t.start+3600];t.clock(now[0]);t.call('observe_release_market',label='arm observation')
def tick():now[0]+=3600;t.clock(now[0]);t.call('observe_release_market')
for h in range(24):tick()
pol=lambda:t.read(t.defaults['policy'],'ReleasePolicy')
ref0=reference(pol(),now[0])
t.check('honest reference is the outside 1.0',ref0==1_000_000)
p0=pol();t.call('observe_release_market',label='a second observation inside the same hour (succeeds by design, A6)')
p1=pol();t.check('...but adds no price sample and moves no timestamp',(p1['prices'],p1['times'],p1['next'],p1['count'],p1['markTime'])==(p0['prices'],p0['times'],p0['next'],p0['count'],p0['markTime']))
def bundled():
 ix=t.instruction('observe_release_market')
 pay=t.Instruction(t.SYSTEM,struct.pack('<IQ',2,1),[t.meta(MAL.pubkey(),True,True),t.meta(t.alice.pubkey(),True)])
 t.send('observation bundled with another instruction',[ix,pay],[MAL])
attack('an observation bundled with another instruction in one transaction',bundled)
fake=t.allocate(256,ns['MANIFEST']);t.svm.set_account(fake,t.svm.get_account(m))
attack_call('observation reads a copied fake market account','observe_release_market',acc={'manifest_market':fake})
# Spoof: Mallory rests a 1,000-unit bid at 10.0 just before a sample, then lets it count for one hour.
seat(MAL);deposit(MAL,mq,ns['qv'],q,1_100*t.U)
s_mal=int.from_bytes(t.svm.get_account(m).data[144:152],'little');order(MAL,100*t.U,True,mantissa=10,exponent=0)
tick();s1=pol()['prices'][(pol()['next']-1)%24]
t.check('a bid placed just before a sample is not counted (fresh)',s1==1_000_000)
tick();t.check('after resting an hour the spoof is sampled at 10.0',pol()['prices'][(pol()['next']-1)%24]==10_000_000)
t.check('the newest sample carries no weight yet: the reference is still 1.0',reference(pol(),now[0])==ref0)
t.send('Mallory cancels her spoof bid',[t.Instruction(ns['MANIFEST'],b'\x06\x00'+struct.pack('<I',1)+struct.pack('<Q',s_mal)+b'\x00'+struct.pack('<I',0),[t.meta(MAL.pubkey(),True,True),t.meta(m,True),t.meta(t.SYSTEM)])],[MAL])
tick();ref1=reference(pol(),now[0])
t.check('two hours of a 1,000-unit spoof at 10x move the 24-hour reference by 1/23 of the gap (about +39%), not to 10.0',ref1==(22*1_000_000+10_000_000)//23)
spoof=[ref0,ref1]
# --- 4. Expenses: redirect, repeat, or self-propose.
donor=t.token_account(q,t.admin.pubkey())
t.send('TEST quote to donor',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',50*t.U),[t.meta(q,True),t.meta(donor,True),t.meta(t.admin.pubkey(),False,True)])])
t.call('contribute_quote',{'amount':50*t.U},fee|{'contributor':t.admin.pubkey(),'contributor_quote':donor})
vendor=t.token_account(q,t.bob.pubkey())
ex={'expense':t.pda(b'expense',struct.pack('<Q',0)),'destination':vendor,'proposer':t.admin.pubkey()}|fee
t.call('propose_expense',{'nonce':0,'amount':20*t.U,'purpose':[7]*32},ex,label='administrator proposes a 20-unit expense to an outside vendor')
attack_call('Mallory proposes an expense to herself','propose_expense',{'nonce':1,'amount':20*t.U,'purpose':[8]*32},fee|{'expense':t.pda(b'expense',struct.pack('<Q',1)),'destination':mq,'proposer':MAL.pubkey()})
attack_call('the expense is paid before its seven-day wait','execute_expense',acc=ex)
now[0]+=7*86400+1;t.clock(now[0])
attack_call("Mallory redirects the approved expense to her own account",'execute_expense',acc=ex|{'destination':mq})
attack_call("Mallory passes her own account as the donation vault",'execute_expense',acc=ex|{'fee_quote':mq})
attack_call("Mallory passes her own account as the project reserve",'execute_expense',acc=ex|{'sale_proceeds':mq})
attack_call("Mallory passes a fake operations account",'execute_expense',acc=ex|{'operations':t.pda(b'not-operations')})
before=t.amount(vendor);t.call('execute_expense',acc=ex,label='the expense is paid to the vendor after seven days')
t.check('the vendor received exactly the approved amount',t.amount(vendor)-before==20*t.U)
attack_call('the same expense is paid a second time','execute_expense',acc=ex)

# --- 5. Malicious administrator: route treasury money to itself or fake revenue.
adm_q=t.token_account(q,t.admin.pubkey());adm_h=t.token_account(mint,t.admin.pubkey())
rev0=t.cfg()['revenueTotal']
t.call('management_fund_quote',{'amount':50*t.U},act,label='administrator moves 50 units to the management seat')
t.call('management_withdraw',{'amount':50*t.U,'is_base':False},act,label='and withdraws them back to the reserve')
t.check('moving reserve money out and back creates no spendable revenue',t.cfg()['revenueTotal']==rev0)
attack_call('administrator withdraws management quote into its own account','management_withdraw',{'amount':t.U,'is_base':False},act|{'project_quote':adm_q})
attack_call('administrator withdraws project inventory HELI into its own account','withdraw_project_heli',{'amount':t.U},{'market_inventory':adm_h})
attack_call('administrator withdraws project sale quote into its own account','withdraw_project_quote',{'amount':t.U},{'sale_proceeds':adm_q})
attack_call('administrator releases locked management stock in the first twelve months','management_release',{'amount':t.U},act)
attack_call('administrator closes the 60-year constitution early','close_constitution')
attack_call('anyone settles a month that has not ended','settle',acc=ns['ea']|{'management_stock':t.defaults['founder']})
attack_call('anyone opens an epoch out of order','open_epoch',{'number':5},ns['epoch_accounts'](t,5))

# --- Invariants.
end_bal=balances()
t.check("Mallory gained no quote or HELI from any attack (her only spend is the resting bid's deposit)",end_bal['mal_heli']==start_bal['mal_heli'] and end_bal['mal_quote']==start_bal['mal_quote']-1_100*t.U)
t.check('token supply unchanged by every attack',t.supply()==supply0)
c=t.cfg();t.check('locked stocks unchanged (70M market reserve, 15M management)',c['stocks'][0]==70_000_000*t.U and c['stocks'][3]==15_000_000*t.U and t.amount(t.defaults['human'])>=c['stocks'][0] and t.amount(t.defaults['founder'])>=c['stocks'][3])
assert not findings,findings
result={'source_sha256':t.actual_source,'binary_sha256':t.actual_binary,'attacks_blocked':len(blocked),'findings':findings,'spoof_reference':spoof,
 'blocked':blocked,'checks_and_transactions':len(t.checks),'checks':t.checks,'all_passed':True,
 'scope':'Compiled ELF and Manifest v3.0.24 ELF in local LiteSVM, synthetic quote/keys; red-team attacks by an outsider and a malicious administrator. Not a deployment or audit.'}
(t.ROOT/'redteam-svm-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k not in('checks','blocked')},indent=2))
