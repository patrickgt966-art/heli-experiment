"""Red-team run 2 (5 Oct 2026): outside attackers only (no administrator key), on the compiled ELF with the real
Manifest ELF in a fresh local LiteSVM ledger; synthetic quote/keys, no public transactions.
Mallory has quote; Eve is an auction buyer with tokens. Every attack must fail or stay inside published bounds;
a successful attack is recorded as a finding and fails the run. Reuses the setup of test_codex_final_svm.py.
"""
import json,re,struct
from pathlib import Path
import svm_fixture as t
here=Path(__file__).resolve().parent
MAL=t.outsider;EVE=t.alice
blocked=[];findings=[]
def why(e):
 s=str(e);x=re.search(r'Error Message: ([^."\]]+)',s) or re.search(r'(Custom\(\d+\))',s) or re.search(r"(Fallback functions are not supported|already in use|insufficient funds|InvalidAccountData|MissingRequiredSignature|IncorrectProgramId|owner does not match|InvalidArgument)",s)
 return x.group(1).strip() if x else s[:80]
def attack(label,fn):
 try:fn()
 except AssertionError as e:blocked.append([label,why(e)]);return
 findings.append(label);t.checks.append('FINDING: '+label)
def attack_call(label,name,args=None,acc=None):attack(label,lambda:t.call(name,args,acc,label='attack: '+label))
def spl(label,data,metas,signer):attack(label,lambda:t.send(label,[t.Instruction(t.TOKEN,data,metas)],[signer]))
mq=[None]

# --- A. Attacks on the live opening auction (before it is finalized).
def auction_attacks(ba):
 q=t.defaults['quote_mint'];mq[0]=t.token_account(q,MAL.pubkey())
 t.send('TEST quote to Mallory',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',5_000*t.U),[t.meta(q,True),t.meta(mq[0],True),t.meta(t.admin.pubkey(),False,True)])])
 mb={'bidder':MAL.pubkey(),'bid':t.pda(b'auction-bid',bytes(MAL.pubkey())),'bidder_quote':mq[0],'account_payer':MAL.pubkey()}
 def forged():  # bob's account is passed as a non-signer: only Mallory (and the fee payer) sign
  ix=t.instruction('create_auction_bid',None,mb|{'bidder':t.bob.pubkey(),'bid':t.pda(b'auction-bid',bytes(t.bob.pubkey()))})
  metas=[t.meta(x.pubkey,x.is_writable,x.is_signer and x.pubkey!=t.bob.pubkey()) for x in ix.accounts]
  t.send('forged bid account for bob',[t.Instruction(ix.program_id,bytes(ix.data),metas)],[MAL])
 attack("Mallory opens bob's bid account without bob's signature",forged)
 t.call('create_auction_bid',acc=mb,label='Mallory opens her own bid account')
 attack_call('Mallory bids at a price level beyond the 256 levels','place_auction_bid',{'quantity_heli':10,'tick':256},mb)
 attack_call('Mallory bids for zero tokens','place_auction_bid',{'quantity_heli':0,'tick':0},mb)
 attack_call('Mallory bids with a quantity that overflows the collateral','place_auction_bid',{'quantity_heli':2**63,'tick':255},mb)
 attack_call('Mallory bids beyond the 5% wallet cap','place_auction_bid',{'quantity_heli':250_001,'tick':0},mb)
 t.call('place_auction_bid',{'quantity_heli':1_000,'tick':3},mb,label='Mallory places a normal bid')
 attack_call('Mallory places a second bid on top without cancelling','place_auction_bid',{'quantity_heli':1_000,'tick':3},mb)
 attack_call("Mallory cancels alice's bid",'cancel_auction_bid',acc=ba|{'bidder':MAL.pubkey()})
 attack_call("Mallory cancels alice's bid and takes the refund",'cancel_auction_bid',acc=ba|{'bidder':MAL.pubkey(),'bidder_quote':mq[0]})
 attack_call('Mallory claims before the auction is finalized','claim_auction_bid',acc=mb|{'bidder_heli':t.token_account(t.defaults['mint'],MAL.pubkey())})
 t.clock(t.start-299)
 attack_call('Mallory cancels inside the last five minutes (bid sniping)','cancel_auction_bid',acc=mb)
 attack_call('anyone finalizes before the auction end','finalize_auction')
 # Gifts to the auction escrow must not break finalization or claims.
 t.send('Mallory gifts 1 quote unit to the auction escrow',[t.Instruction(t.TOKEN,b'\x03'+struct.pack('<Q',t.U),[t.meta(mq[0],True),t.meta(t.defaults['quote_escrow'],True),t.meta(MAL.pubkey(),False,True)])],[MAL])

src=(here/'test_codex_final_svm.py').read_text(encoding='utf-8');head=src[:src.index('# A live outside reference')]
head=head.replace("f=bootstrap(t,1_000_000,min_depth=1000,order_checks=True)","f=bootstrap(t,1_000_000,min_depth=1000,order_checks=True,before_finalize=AUCTION_ATTACKS)")
assert 'AUCTION_ATTACKS' in head
ns={'__name__':'redteam_outside','AUCTION_ATTACKS':auction_attacks};exec(compile(head,str(here/'test_codex_final_svm.py'),'exec'),ns)
m,q,ma,f=ns['m'],ns['q'],ns['ma'],ns['f'];funded,order,seat,deposit=ns['funded'],ns['order'],ns['seat'],ns['deposit']
mint=t.defaults['mint'];mq=mq[0];mh=t.token_account(mint,MAL.pubkey())
mb={'bidder':MAL.pubkey(),'bid':t.pda(b'auction-bid',bytes(MAL.pubkey())),'bidder_quote':mq,'bidder_heli':mh}
t.check('gift to the auction escrow did not stop finalization or the claims',t.read(t.defaults['auction'],'OpeningAuction')['finalized'])
t.call('claim_auction_bid',acc=mb,label='Mallory claims her own finalized bid (legitimate)')
t.check('Mallory paid the uniform auction price for exactly 1,000 tokens',t.amount(mh)==1_000*t.U)
attack_call('Mallory claims her bid a second time','claim_auction_bid',acc=mb)
start=(t.amount(mq),t.amount(mh));supply0=t.supply()

# --- B. Token-level attacks on the mint and the program vaults.
d=bytes(t.svm.get_account(mint).data)
t.check('mint authority and freeze authority are both revoked (nobody can mint or freeze balances)',d[0:4]==b'\0\0\0\0' and d[46:50]==b'\0\0\0\0')
spl('Mallory mints new tokens',b'\x07'+struct.pack('<Q',t.U),[t.meta(mint,True),t.meta(mh,True),t.meta(MAL.pubkey(),False,True)],MAL)
for name in ['human','founder','market_inventory']:
 spl('Mallory transfers tokens out of the %s vault'%name,b'\x03'+struct.pack('<Q',t.U),[t.meta(t.defaults[name],True),t.meta(mh,True),t.meta(MAL.pubkey(),False,True)],MAL)
 spl('Mallory closes the %s vault'%name,b'\x09',[t.meta(t.defaults[name],True),t.meta(MAL.pubkey(),True),t.meta(MAL.pubkey(),False,True)],MAL)
spl('Mallory transfers quote out of the project reserve',b'\x03'+struct.pack('<Q',t.U),[t.meta(t.defaults['sale_proceeds'],True),t.meta(mq,True),t.meta(MAL.pubkey(),False,True)],MAL)
spl('Mallory sets herself as authority of the project reserve',b'\x06\x02\x01'+bytes(MAL.pubkey()),[t.meta(t.defaults['sale_proceeds'],True),t.meta(MAL.pubkey(),False,True)],MAL)

# --- C. Permissionless lifecycle with substituted accounts, plus gifts into the vaults.
ea=ns['ea'];st=ea|{'management_stock':t.defaults['founder']}
EVE_H=f['wallet'];t.transfer(EVE_H,t.defaults['human'],t.U,owner=EVE)
t.check('a 1-token gift into the market release reserve does not change its accounted stock',t.cfg()['stocks'][0]==70_000_000*t.U)
t.clock(t.boundary(1)+1)
attack_call('Mallory settles the month into her own account as release reserve','settle',acc=st|{'release_reserve':mh})
attack_call('Mallory settles the month into her own account as market inventory','settle',acc=st|{'market_inventory':mh})
attack_call('Mallory settles with her own account as management stock','settle',acc=st|{'management_stock':mh})
attack_call('Mallory settles with a fake epoch account','settle',acc=st|{'epoch':ns['epoch_accounts'](t,2)['epoch']})
t.call('settle',acc=st,label='honest settle by anyone after the month ends')
attack_call('the month is settled a second time','settle',acc=st)
attack_call('Mallory opens an epoch out of order','open_epoch',{'number':3},ns['epoch_accounts'](t,3)|{'payer':MAL.pubkey()})
t.call('open_epoch',{'number':2},ns['epoch_accounts'](t,2)|{'payer':MAL.pubkey()},label='Mallory opens the next epoch (permissionless, she pays the rent)')
attack_call('Mallory closes the 60-year constitution early','close_constitution')
attack_call('Mallory closes the constitution with her own accounts as vaults','close_constitution',acc={'human':mh,'founder':mh})

# --- D. Market measurement from outside.
pol=lambda:t.read(t.defaults['policy'],'ReleasePolicy')
funded(t.bob,2_000*t.U);order(t.bob,1_500*t.U,True)
attack_call('observation with a fake Manifest program','observe_release_market',acc={'manifest_program':t.TOKEN})
attack_call('observation with the instructions sysvar replaced','observe_release_market',acc={'instructions':MAL.pubkey()})
fake=t.allocate(256,ns['MANIFEST']);t.svm.set_account(fake,t.svm.get_account(m))
attack_call('observation of a copied fake market','observe_release_market',acc={'manifest_market':fake})
now=[t.clock_now() if hasattr(t,'clock_now') else t.svm.get_clock().unix_timestamp]
now[0]+=3600;t.clock(now[0]);t.call('observe_release_market',label='arm observation')
def tick():now[0]+=3600;t.clock(now[0]);t.call('observe_release_market')
for h in range(24):tick()
from release_ref import reference
ref0=reference(pol(),now[0]);t.check('honest reference is the outside 1.0',ref0==1_000_000)
# Mallory floods the book with bids just below the real one: they rest but cannot lower the measured price.
seat(MAL);deposit(MAL,mq,ns['qv'],q,1_000*t.U)
for k in range(40):order(MAL,t.U//10,True,mantissa=50+k,exponent=-2)
tick();tick();t.check('40 cheap bids below the real one do not move the reference',reference(pol(),now[0])==ref0)
# Mallory sells her auction tokens into the outside bid: a real trade, the reference follows only the outside book.
deposit(MAL,mh,ns['bv'],mint,1_000*t.U);order(MAL,1_000*t.U,False,mantissa=1,exponent=0)
tick();tick()
def no_ref():
 try:reference(pol(),now[0]);return False
 except AssertionError:return True
t.check('a dump that empties outside demand stops the reference instead of lowering it, and is recorded as shallow',no_ref() and pol()['shallowSince']>0 and pol()['lastReference']==ref0)
BAND='Order price outside the permitted band'
t.call('place_project_ask',{'amount':t.U,'price_mantissa':94,'price_exponent':-2},reject=BAND,label='after the dump the project still cannot sell below 95% of the last outside reference')

# --- Invariants.
assert not findings,findings
t.check('token supply unchanged by every outside attack',t.supply()==supply0)
c=t.cfg();t.check('locked stocks only moved by the honest monthly settle',c['stocks'][3]==15_000_000*t.U and c['stocks'][0]<70_000_000*t.U and t.amount(t.defaults['human'])>=c['stocks'][0])
result={'source_sha256':t.actual_source,'binary_sha256':t.actual_binary,'attacks_blocked':len(blocked),'findings':findings,
 'blocked':blocked,'checks_and_transactions':len(t.checks),'checks':t.checks,'all_passed':True,
 'scope':'Compiled ELF and Manifest v3.0.24 ELF in local LiteSVM, synthetic quote/keys; outside attackers only. Not a deployment or audit.'}
(t.ROOT/'redteam-outside-svm-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k not in('checks','blocked')},indent=2))
