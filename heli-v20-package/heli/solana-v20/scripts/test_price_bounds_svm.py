"""Price bounds and order expiry for project/management orders (review findings C1, C2a).
Compiled V20 + Manifest ELFs in a fresh local LiteSVM ledger; synthetic quote/keys; no public transactions.
"""
import json,struct
import svm_fixture as t
from bootstrap_v15 import bootstrap,epoch_accounts

f=bootstrap(t,1_000_000,with_policy=True)
t.check('90M genesis includes 70M market reserve and 15M management',t.cfg()['stocks']==[70_000_000*t.U,0,0,15_000_000*t.U] and t.supply()==90_000_000*t.U)
t.check('no rewards or independent liquidity allocation',t.amount(t.defaults['rewards'])==0 and t.amount(t.defaults['liquidity'])==0)
MANIFEST=t.Pubkey.from_string('MNFSTqtC93rEfYHB6hF82sKdZpUDFWkViLByLd1k1Ms')
TOKEN22=t.Pubkey.from_string('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')
t.svm.add_program_from_file(MANIFEST,t.ROOT.parent/'manifest-integration/vendor-manifest/manifest-release-v3.0.24.so')
m=t.allocate(256,MANIFEST);q=t.defaults['quote_mint'];bv=t.Pubkey.find_program_address([b'vault',bytes(m),bytes(t.defaults['mint'])],MANIFEST)[0];qv=t.Pubkey.find_program_address([b'vault',bytes(m),bytes(q)],MANIFEST)[0]
t.send('initialize bound Manifest market',[t.Instruction(MANIFEST,b'\x00',[t.meta(t.admin.pubkey(),True,True),t.meta(m,True),t.meta(t.SYSTEM),t.meta(t.defaults['mint']),t.meta(q),t.meta(bv,True),t.meta(qv,True),t.meta(t.TOKEN),t.meta(TOKEN22)])])
t.defaults.update(manifest_market=m,manifest_program=MANIFEST,trader=t.pda(b'manifest-trader'),manifest_base=t.pda(b'manifest-heli'),manifest_quote=t.pda(b'manifest-quote'),base_vault=bv,quote_vault=qv)
t.call('create_manifest_base');t.call('create_manifest_quote')
t.call('bind_manifest_market',{'market_rent_lamports':10_000_000})
t.defaults['release_reserve']=t.defaults['human']
ma={'management_book':t.pda(b'management-book'),'management_trader':t.pda(b'management-trader'),'management_base':t.pda(b'management-base'),'management_quote':t.pda(b'management-quote'),'project_quote':t.defaults['sale_proceeds'],'management_stock':t.defaults['founder']}
t.call('create_management_base',acc=ma);t.call('create_management_quote',acc=ma)
t.send('TEST quote to project reserve',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',1000*t.U),[t.meta(t.defaults['quote_mint'],True),t.meta(t.defaults['sale_proceeds'],True),t.meta(t.admin.pubkey(),False,True)])])
t.call('initialize_management',{'quote_floor':999*t.U,'rent_lamports':10_000_000},ma,reject='Quota',label='project quote floor below 1,000 units rejected')
t.call('initialize_management',{'quote_floor':1000*t.U,'rent_lamports':10_000_000},ma)
ea=epoch_accounts(t,1);t.call('open_epoch',{'number':1},ea);act=ma|ea
t.call('management_release',{'amount':t.U},act,reject='calendar',label='management cannot release in first twelve months')
t.call('management_fund_quote',{'amount':t.U},act|{'admin':t.outsider.pubkey()},reject='has one',label='outsider cannot use project reserve')
t.call('management_order',{'amount':t.U,'base_deposit':0,'price_mantissa':1,'price_exponent':0,'is_bid':True},act|{'admin':t.outsider.pubkey()},reject='has one',label='outsider cannot place treasury orders')
t.removed('set_liquidity_request','no duplicate liquidity release budget')
start_quote=t.amount(t.defaults['sale_proceeds'])
t.call('management_fund_quote',{'amount':start_quote-1000*t.U+1},act,reject='Collateral',label='quote reserve floor protects project cash')
t.call('management_fund_quote',{'amount':40*t.U},act)
t.check('liquidity bid funded only with actual project cash',t.amount(t.defaults['sale_proceeds'])==start_quote-40*t.U)
t.call('management_fund_quote',{'amount':t.U},act|{'quote_vault':bv},reject='Market',label='wrong market quote vault rejected before transfer')
t.check('wrong vault operation rolls back project funds',t.amount(t.defaults['sale_proceeds'])==start_quote-40*t.U)

def seat(owner):t.send('user seat',[t.Instruction(MANIFEST,b'\x01',[t.meta(owner.pubkey(),True,True),t.meta(m,True),t.meta(t.SYSTEM)])],[owner])
def deposit(owner,wallet,vault,mint,amount):
 t.send('user deposit',[t.Instruction(MANIFEST,b'\x02'+struct.pack('<Q',amount)+b'\x00',[t.meta(owner.pubkey(),False,True),t.meta(m,True),t.meta(wallet,True),t.meta(vault,True),t.meta(t.TOKEN),t.meta(mint)])],[owner])
def order(owner,amount,is_bid,mantissa=1,exponent=0):
 t.send('user funded limit order',[t.Instruction(MANIFEST,b'\x06\x00'+struct.pack('<II',0,1)+struct.pack('<QIbBIB',amount,mantissa,exponent,int(is_bid),0,0),[t.meta(owner.pubkey(),True,True),t.meta(m,True),t.meta(t.SYSTEM)])],[owner])
def management_order(amount,is_bid,deposit_base=0,mantissa=1,exponent=0):
 t.call('management_order',{'amount':amount,'base_deposit':deposit_base,'price_mantissa':mantissa,'price_exponent':exponent,'is_bid':is_bid},act)

pol=lambda:t.read(t.defaults['policy'],'ReleasePolicy')
def funded(owner,quote):
 seat(owner);w=t.token_account(q,owner.pubkey())
 t.send('synthetic quote',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',quote),[t.meta(q,True),t.meta(w,True),t.meta(t.admin.pubkey(),False,True)])])
 deposit(owner,w,qv,q,quote)
def ask(amount,mantissa,exponent,reject=None,label=None):
 t.call('place_project_ask',{'amount':amount,'price_mantissa':mantissa,'price_exponent':exponent},reject=reject,label=label)
def mgmt(amount,is_bid,mantissa,exponent,deposit=0,reject=None,label=None):
 t.call('management_order',{'amount':amount,'base_deposit':deposit,'price_mantissa':mantissa,'price_exponent':exponent,'is_bid':is_bid},act,reject=reject,label=label)
def best(offset):  # (price per HELI, last_valid_slot) of the best resting order on one side
 d=bytes(t.svm.get_account(m).data);i=int.from_bytes(d[offset:offset+4],'little');v=d[256+i+16:256+i+80]
 return int.from_bytes(v[0:16],'little')*t.U//10**18,int.from_bytes(v[36:40],'little')
BAND='Order price outside the permitted band'
funded(t.bob,20_000*t.U);order(t.bob,10_000*t.U,True)            # resting market: 10,000 HELI bid at 1.0
t.transfer(f['wallet'],ma['management_base'],20*t.U,owner=t.alice) # released working HELI for management asks
clearing=t.read(t.defaults['auction'],'OpeningAuction')['clearingPrice']
t.check('opening auction cleared at 100 quote atoms per HELI',clearing==100)

# Without a reference price: asks >= auction price, no reserve-funded bids.
ask(1_000*t.U,1,-6,reject=BAND,label='C1 replay: near-zero project ask rejected')
ask(t.U,99,-6,reject=BAND,label='project ask 1% under the auction price rejected')
ask(t.U,1,-4,label='project ask at the auction price accepted')
mgmt(t.U,True,1,0,reject=BAND,label='no management bid without a reference price')
mgmt(t.U,False,99,-6,t.U,reject=BAND,label='management ask under the auction price rejected')

# Build a 24-hour reference from the rested 1.0 bid.
T=t.boundary(1);t.clock(T);t.call('observe_release_market')
for h in range(1,25):t.clock(T+h*3600);t.call('observe_release_market')
from release_ref import reference
ref=reference(pol(),T+24*3600)
t.check('reference price is 1.0 quote per HELI',ref==1_000_000)

ask(t.U,94,-2,reject=BAND,label='project ask at 94% of reference rejected')
ask(t.U,95,-2,label='project ask at exactly 95% of reference accepted')
mgmt(t.U,False,94,-2,t.U,reject=BAND,label='management ask at 94% rejected')
mgmt(40*t.U,True,40,0,reject=BAND,label='C2a replay: management bid at 40x reference rejected')
mgmt(t.U,True,106,-2,reject=BAND,label='management bid at 106% of reference rejected')
slot=t.svm.get_clock().slot
mgmt(t.U,True,105,-2,label='management bid at exactly 105% accepted')
price,last=best(160)
t.check('management bid rests at 1.05 and expires 216,000 slots later',price==1_050_000 and last==slot+216_000)
mgmt(t.U,False,2,0,t.U,label='management ask above the floor accepted')
price,last=best(168)
t.check('management ask carries the same 24-hour expiry',last==slot+216_000)

result={'source_sha256':t.actual_source,'binary_sha256':t.actual_binary,'checks_and_transactions':len(t.checks),'checks':t.checks,'all_passed':True,
 'scope':'Compiled V20 and Manifest ELFs in local LiteSVM, synthetic quote/keys; order price bounds and expiry only. Not a deployment or audit.'}
(t.ROOT/'price-bounds-svm-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='checks'},indent=2))
