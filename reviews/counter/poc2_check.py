# Counter-check of PoC2: did the near-zero project ask first fill against bob's resting bid (side effect)?
import sys,pathlib
S=pathlib.Path(__file__).resolve().parent.parent/'run/heli/solana-v20/scripts'
sys.path.insert(0,str(S))
src=(S/'poc_review.py').read_text()
src=src.split('# PoC-3')[0]
g={'__name__':'__main__'}
exec(compile(src,'poc_head','exec'),g)
t=g['t'];bv=g['bv'];qv=g['qv'];q=g['q'];m=g['m'];withdraw_user=g['withdraw_user']
import struct
print('PoC2 reported proceeds gain (only 1 unit withdrawn):',g['R']['poc2']['proceeds_gain_atoms'])
# 1) project seat: try to withdraw 9_995 more quote units
before=t.amount(t.defaults['sale_proceeds'])
t.call('withdraw_project_quote',{'amount':9_994_990_005})
print('extra quote withdrawn into project reserve:',(t.amount(t.defaults['sale_proceeds'])-before)/t.U,'quote units')
# 2) bob's seat: withdraw HELI he bought from the project ask at 1 quote/HELI
bh=t.token_account(t.defaults['mint'],t.bob.pubkey())
withdraw_user(t.bob,bh,bv,t.defaults['mint'],9_995*t.U)
print('bob HELI withdrawn:',t.amount(bh)/t.U)
# 3) eve's residual HELI in seat beyond 990k
eh=g['eh']
withdraw_user(g['eve'],eh,bv,t.defaults['mint'],5*t.U)
print('eve total HELI:',t.amount(eh)/t.U)
