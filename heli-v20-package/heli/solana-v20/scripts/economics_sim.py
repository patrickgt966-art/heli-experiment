"""Economic scenarios for Charta (6 Oct 2026). Analysis only: no rule or parameter is changed.

Monthly steps after the opening auction. Supply follows the program exactly (economics.rs capacity, market_release.rs
settle, integer atoms). Everything about the market is an ASSUMPTION per scenario, not a forecast:
  * price: an outside reference price path; the project sells released inventory at 95% of it (the lowest its
    asks may go, release.rs), so revenue is on the cautious side;
  * demand: USDC that outside buyers spend per month on the project's inventory (sold = min(inventory, demand/price));
  * the fixed technical cost of 12 USDC per 30 days is paid first and may use the project floor (owner rule, 5 Oct);
  * other expenses: "lean" spends nothing else; "max" spends everything the rules allow each month: all unspent sale
    revenue plus 25%/12 of the reserve excluding unspent revenue, never below the project floor (lib.rs);
  * if the auction raised less than 120 USDC the founder tops the reserve up to 120 (owner decision, 4 Oct);
  * management treasury sales and reserve-funded support bids are not modelled (both are optional for the manager).
Cross-check: with no management sales, 60 months release exactly 1,116,708 CHTA, as the keeper long-run test
measured on the compiled program.

  python scripts/economics_sim.py            (writes reviews/v23/economics-sim.json)
"""
import json
from pathlib import Path

U=1_000_000;RATE=4_022_473_737_086_389;SCALE=10**18
FIXED=12.0;FLOOR=120.0

def supply_path(months,management_sells=False):
 """Released-for-sale CHTA per month (atoms), exactly as settle() computes it."""
 reserve=70_000_000*U;treasury=15_000_000*U;out=[]
 for n in range(1,months+1):
  cap=(90_000_000*U-reserve-treasury)*RATE//SCALE
  mg=min(cap//5,treasury) if 12<=n<720 else 0
  rel=min(cap-mg,reserve);reserve-=rel
  if management_sells:treasury-=mg  # the manager sells its whole monthly budget (adds to circulating supply)
  out.append({'month':n,'cap':cap,'release':rel,'management':mg})
 return out

def run(raise_usdc,price,demand,policy,months=240):
 path=supply_path(months)
 reserve=max(raise_usdc,FLOOR);inventory=0.0;sold_total=0.0;revenue_total=0.0;revenue_spent=0.0;other_spent=0.0;fixed_paid=0.0
 runway=None;snap={}
 for m,p in enumerate(path,1):
  inventory+=p['release']/U
  px=price(m);sale_px=0.95*px
  sold=min(inventory,demand(m)/sale_px if sale_px>0 else 0.0);inventory-=sold;sold_total+=sold
  income=sold*sale_px;reserve+=income;revenue_total+=income
  # Fixed technical cost first (protected), from the reserve while it lasts.
  pay=min(FIXED,reserve);reserve-=pay;fixed_paid+=pay
  from_rev=min(pay,revenue_total-revenue_spent);revenue_spent+=from_rev
  if pay<FIXED and runway is None:runway=m
  if policy=='max':
   left=revenue_total-revenue_spent;base=max(0.0,reserve-left)
   allowed=min(left+base*0.25/12,max(0.0,reserve-FLOOR))
   reserve-=allowed;other_spent+=allowed;revenue_spent+=min(allowed,left)
  if m in (12,60,240):
   snap[m]={'reserveUsdc':round(reserve,2),'soldChta':round(sold_total),'unsoldInventoryChta':round(inventory),'revenueUsdc':round(revenue_total,2),
    'otherSpentUsdc':round(other_spent,2),'fixedPaidUsdc':round(fixed_paid,2),'circulatingChta':round(5_000_000+sold_total)}
 return {'runwayEndsMonth':runway,'at':snap}

flat=lambda v:(lambda m:v)
grow=lambda v,y:(lambda m:v*(1+y)**(m/12))
crash=lambda v,at,keep:(lambda m:v if m<at else v*keep)
SCENARIOS={
 'no buyers':(flat(0.0002),flat(0.0)),
 'few buyers (5 USDC/month at 0.0002)':(flat(0.0002),flat(5.0)),
 'steady (50 USDC/month, price +20%/year from 0.0003)':(grow(0.0003,0.20),flat(50.0)),
 'strong (500 USDC/month, price +50%/year from 0.0003)':(grow(0.0003,0.50),flat(500.0)),
 'crash (price -80% in month 6, 20 USDC/month)':(crash(0.00023,6,0.2),flat(20.0)),
}

def main():
 lean=supply_path(240);full=supply_path(240,True)
 assert sum(p['release'] for p in lean[:60])//U==1_116_708,'supply model differs from the keeper long-run measurement'
 years=lambda path,n:round(sum(p['release'] for p in path[:n])/U)
 supply={'releasedForSaleChta':{'1y':years(lean,12),'5y':years(lean,60),'20y':years(lean,240)},
  'releasedIfManagementSellsItsBudgetChta':{'1y':years(full,12)+round(sum(p['management'] for p in full[:12])/U),'5y':years(full,60)+round(sum(p['management'] for p in full[:60])/U),'20y':years(full,240)+round(sum(p['management'] for p in full[:240])/U)},
  'firstMonthRelease':round(lean[0]['release']/U,2),'month60Release':round(lean[59]['release']/U,2),
  'breakEvenPriceUsdcForFixedCost':{'month1':round(FIXED/(0.95*lean[0]['release']/U),6),'month60':round(FIXED/(0.95*lean[59]['release']/U),6)}}
 results={}
 for raise_usdc in (120,1150,5000):
  for name,(price,demand) in SCENARIOS.items():
   for policy in ('lean','max'):results[f'{raise_usdc} USDC raised | {name} | {policy}']=run(raise_usdc,price,demand,policy)
 out={'date':'2026-10-06','assumptions':__doc__.split('\n\n')[1].strip(),'supply':supply,'scenarios':results}
 dst=Path(__file__).resolve().parents[4]/"reviews/v23/economics-sim.json";dst.write_text(json.dumps(out,indent=1,ensure_ascii=False)+'\n')
 print(json.dumps(supply,indent=1))
 for k,v in results.items():
  a=v['at'];print(f"{k:95} runway end {v['runwayEndsMonth']}; reserve 1y {a[12]['reserveUsdc']}, 5y {a[60]['reserveUsdc']}, 20y {a[240]['reserveUsdc']}; unsold 5y {a[60]['unsoldInventoryChta']}")
main()
