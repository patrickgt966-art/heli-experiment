"""Synthetic local-only adversarial tests of pinned 74c0594 ELF. No deployment.
Run each mode in a separate process: management-self, slot-time, cancellation.
Uses the pinned repository's setup helpers, not an earlier project copy.
"""
import sys,pathlib,json,struct
ROOT=pathlib.Path(__file__).resolve().parents[2]
scripts=ROOT/'heli-v20-package/heli/solana-v20/scripts'
sys.path.insert(0,str(scripts))
ns={'__name__':'review_setup'}
source=(scripts/'test_price_bounds_svm.py').read_text()
exec(compile(source.split('# Without a reference price:',1)[0],str(scripts/'test_price_bounds_svm.py'),'exec'),ns)
globals().update({k:v for k,v in ns.items() if not k.startswith('__')})
mode=sys.argv[1]
T=t.boundary(1);t.clock(T);t.call('observe_release_market')
for h in range(1,25):
 t.clock(T+h*3600);t.call('observe_release_market')
def seq():return int.from_bytes(t.svm.get_account(m).data[144:152],'little')
def book():return t.read(ma['management_book'],'ManagementBook')
def bid(amount,mantissa=102):
 s=seq();mgmt(amount,True,mantissa,-2);return s
def live_order(s):
 d=bytes(t.svm.get_account(m).data)
 for at in range(256,len(d)-79,80):
  v=d[at+16:at+80]
  if int.from_bytes(v[24:32],'little')==s and v[40]==1 and int.from_bytes(v[16:24],'little')>0:
   return int.from_bytes(v[16:24],'little')
 return 0
result={'mode':mode,'source':t.actual_source,'elf':t.actual_binary,'synthetic_clock':True}
if mode=='management-self':
 # Highest bid belongs to management, above the outside bid at 1.00.
 s=bid(10*t.U)
 mgmt(10*t.U,False,102,-2,10*t.U,label='management ask crosses its own reserve-funded bid')
 t.call('management_withdraw',{'amount':10*t.U,'is_base':True},act)
 assert t.amount(ma['management_base'])==20*t.U
 assert t.cfg()['askUntil']==0
 assert sum(book()['bidDays'])==10_200_000
 result.update(self_match_executed=True,charged_quote=10_200_000,ask_guard_until=t.cfg()['askUntil'],working_base=t.amount(ma['management_base']),note='Same-seat round trip, not external cash theft.')
elif mode=='slot-time':
 t.call('management_fund_quote',{'amount':50*t.U},act)
 start=t.svm.get_clock();s=bid(80*t.U)
 # Two days plus one second at one second per slot, below 216000-slot expiry.
 c=t.svm.get_clock();c.unix_timestamp+=172801;c.slot+=172801;t.svm.set_clock(c)
 assert c.unix_timestamp>=t.cfg()['mgmtBidUntil']
 before=t.amount(t.defaults['sale_proceeds']);revenue=t.cfg()['revenueTotal']
 ask(80*t.U,102,-2,label='project ask crosses still-live reserve bid after timestamp guard ends')
 t.call('withdraw_project_quote',{'amount':81_600_000})
 assert t.cfg()['revenueTotal']==revenue+81_600_000
 t.call('management_withdraw',{'amount':8_400_000,'is_base':False},act)
 result.update(slot_elapsed=172801,time_elapsed=172801,expiry_slots=216000,self_funded_revenue=t.cfg()['revenueTotal']-revenue,reserve_after_roundtrip=t.amount(t.defaults['sale_proceeds']),reserve_before_funding=start_quote,note='Conditional slot/time divergence, not proof of its current occurrence on a public network.')
 assert t.amount(t.defaults['sale_proceeds'])==start_quote
 destination=t.token_account(q,t.admin.pubkey());expense=fee|{'expense':t.pda(b'expense',struct.pack('<Q',0)),'destination':destination,'proposer':t.admin.pubkey()}
 t.call('propose_expense',{'nonce':0,'amount':81_600_000,'purpose':[1]*32},expense)
 t.clock(t.read(expense['expense'],'Expense')['readyAt'])
 t.call('execute_expense',acc=expense)
 assert t.amount(destination)==81_600_000
 result.update(external_expense_paid=81_600_000,ordinary_no_revenue_limit=10*t.U+start_quote*25//1200,reserve_after_expense=t.amount(t.defaults['sale_proceeds']))
elif mode=='cancellation':
 # Synthetic reserve top-up; respect the unchanged 1000-unit project floor.
 t.send('synthetic quote top-up',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',1000*t.U),[t.meta(q,True),t.meta(t.defaults['sale_proceeds'],True),t.meta(t.admin.pubkey(),False,True)])])
 t.call('management_fund_quote',{'amount':200*t.U},act)
 cap=t.amount(t.defaults['sale_proceeds'])//10
 # Refresh hourly observations up to a late UTC day; use timestamps, not account mutations.
 now=t.svm.get_clock().unix_timestamp
 a_time=(now//t.DAY+1)*t.DAY+int(.9*t.DAY)
 def refresh(target):
  now=t.svm.get_clock().unix_timestamp
  while now+3600<=target:
   now+=3600;t.clock(now);t.call('observe_release_market')
  t.clock(target);t.call('observe_release_market')
 refresh(a_time);a_day=a_time//t.DAY
 cancelled=20*t.U;s=bid(cancelled,100)
 b_time=(a_day+1)*t.DAY+int(.8*t.DAY);refresh(b_time)
 qty=100*t.U;s2=bid(qty,102);filled=t.bid_cost(qty,102,-2)
 seat(t.alice);deposit(t.alice,f['wallet'],bv,t.defaults['mint'],qty)
 order(t.alice,qty,False,102,-2)
 t.call('management_cancel',{'sequence':s},act)
 buckets=book()['bidDays']
 assert buckets[a_day%31]==cancelled
 assert buckets[(a_day+1)%31]==filled-cancelled
 # The misplaced refund expires while the actual filled purchase is only 29.3 days old.
 target=(a_day+31)*t.DAY+int(.1*t.DAY)
 t.clock(target-24*3600);t.call('observe_release_market')
 for h in range(1,25):t.clock(target-24*3600+h*3600);t.call('observe_release_market')
 new=cap-(filled-cancelled);bid(new,100)
 assert sum(book()['bidDays'])==cap
 assert target-b_time<30*t.DAY
 assert filled+new>cap
 result.update(cap=cap,filled=filled,cancelled_quote=cancelled,old_day_remaining=buckets[a_day%31],new_day_remaining=buckets[(a_day+1)%31],wrong_bucket_refund=True,new_bid=new,actual_rolling_commitment=filled+new,charged_rolling_commitment=sum(book()['bidDays']),filled_age_seconds=target-b_time)
else:raise ValueError(mode)
(ROOT/'reviews/v22-final'/('poc-'+mode+'.json')).write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
