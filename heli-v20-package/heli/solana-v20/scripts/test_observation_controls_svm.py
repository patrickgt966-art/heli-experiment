"""Price-observation controls (review findings M2, N2, M3) on compiled V20 + Manifest ELFs.
Fresh local LiteSVM ledger, synthetic quote/keys; no public transactions.
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
t.call('set_liquidity_request',{'amount':1},reject='Liquidity inventory is disabled',label='no duplicate liquidity release budget')
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

def raw_bid(owner,amount,mantissa,exponent=0,last_valid_slot=0):
 return t.Instruction(MANIFEST,b'\x06\x00'+struct.pack('<II',0,1)+struct.pack('<QIbBIB',amount,mantissa,exponent,1,last_valid_slot,0),[t.meta(owner.pubkey(),True,True),t.meta(m,True),t.meta(t.SYSTEM)])
def cancel(owner,seq):
 t.send('user cancel',[t.Instruction(MANIFEST,b'\x06\x00'+struct.pack('<I',1)+struct.pack('<Q',seq)+b'\x00'+struct.pack('<I',0),[t.meta(owner.pubkey(),True,True),t.meta(m,True),t.meta(t.SYSTEM)])],[owner])
next_seq=lambda:int.from_bytes(t.svm.get_account(m).data[144:152],'little')
pol=lambda:t.read(t.defaults['policy'],'ReleasePolicy')
last_price=lambda:(lambda p:p['prices'][(p['next']+23)%24])(pol())
def funded(owner,quote):
 seat(owner);w=t.token_account(q,owner.pubkey())
 t.send('synthetic quote',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',quote),[t.meta(q,True),t.meta(w,True),t.meta(t.admin.pubkey(),False,True)])])
 deposit(owner,w,qv,q,quote)
ONE=1_000_000  # quote atoms per HELI at price 1.0
funded(t.bob,20_000*t.U);order(t.bob,10_000*t.U,True)            # real liquidity: 10,000 HELI at 1.0
eve=t.outsider;funded(eve,100_000*t.U)
T=t.boundary(1);t.clock(T)
t.call('observe_release_market',label='first call arms the series without a sample')
t.check('armed: no sample yet, mark recorded',pol()['count']==0 and pol()['markTime']==T)
t.call('observe_release_market',reject='Invalid calendar window',label='no sample within the hour after arming')

# M2: bid, observe and cancel in one transaction (the original PoC5) is refused outright.
t.clock(T+3600);seq=next_seq()
cancel_ix=t.Instruction(MANIFEST,b'\x06\x00'+struct.pack('<I',1)+struct.pack('<Q',seq)+b'\x00'+struct.pack('<I',0),[t.meta(eve.pubkey(),True,True),t.meta(m,True),t.meta(t.SYSTEM)])
t.send('flash bid + observe + cancel in one transaction',[raw_bid(eve,10_000*t.U,5),t.instruction('observe_release_market',{},{}),cancel_ix],[eve],reject='Market guard rejected')
t.check('flash attempt recorded nothing',pol()['count']==0)
# A bid placed after the mark (e.g. in an earlier transaction of the same bundle) does not count yet.
seq=next_seq();t.send('eve high bid',[raw_bid(eve,10_000*t.U,5)],[eve])
t.call('observe_release_market',label='hourly sample after arming')
t.check('sample ignores the just-placed 5.0 bid and uses rested liquidity (1.0)',last_price()==ONE)
t.clock(T+7200);t.call('observe_release_market',label='next hourly sample')
t.check('a bid that rested a full interval with capital at risk does count',last_price()==5*ONE)
cancel(eve,seq)

# N2: a 0.01-HELI dust bid on top neither blocks observation nor sets the price.
t.send('eve dust bid on top',[raw_bid(eve,10_000,9)],[eve])
t.clock(T+3*3600);t.call('observe_release_market',label='sample with fresh dust on top')
t.clock(T+4*3600);t.call('observe_release_market',label='sample with rested dust on top')
t.check('rested dust does not set the price; depth is aggregated down to real liquidity',last_price()==ONE)

# M3: an expired best bid is skipped instead of blocking observation.
slot=t.svm.get_clock().slot
t.send('eve short-lived top bid',[raw_bid(eve,10_000*t.U,3,0,slot+5)],[eve])
t.clock(T+5*3600);t.call('observe_release_market')
t.svm.warp_to_slot(slot+50);t.clock(T+6*3600)
t.call('observe_release_market',label='observation proceeds past an expired best bid')
t.check('expired order skipped; price from live liquidity',last_price()==ONE)

# A gap of more than two hours re-arms instead of joining stale samples.
t.clock(T+9*3600);t.call('observe_release_market',label='gap re-arms the series')
t.check('series restarted',pol()['count']==0 and pol()['markTime']==T+9*3600)

result={'source_sha256':t.actual_source,'binary_sha256':t.actual_binary,'checks_and_transactions':len(t.checks),'checks':t.checks,'all_passed':True,
 'scope':'Compiled V20 and Manifest ELFs in local LiteSVM, synthetic quote/keys; price-observation controls only. Not a deployment or audit.'}
(t.ROOT/'observation-controls-svm-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='checks'},indent=2))
