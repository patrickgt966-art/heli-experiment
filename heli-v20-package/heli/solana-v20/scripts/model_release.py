"""Independent integer supply recurrence; price, demand and sales are not forecasts."""
from pathlib import Path
import json

UNIT=1_000_000;RATE=4_022_473_737_086_389;SCALE=10**18
def scenario(use_management):
    released=5_000_000*UNIT;market_stock=70_000_000*UNIT;management_stock=15_000_000*UNIT;points=[]
    for month in range(1,721):
        cap=released*RATE//SCALE
        permission=min(cap//5,management_stock) if 12<=month<720 else 0
        market=min(cap-permission,market_stock)
        management=min(permission,market//4) if use_management else 0
        released+=market+management;market_stock-=market;management_stock-=management
        assert market+management<=cap and market_stock>=0 and management_stock>=0
        assert released+market_stock+management_stock==90_000_000*UNIT
        if month in [1,2,3,6,12,120,360,720]:
            points.append({'month':month,'cap_HELI':cap/UNIT,'market_unlock_HELI':market/UNIT,'management_release_HELI':management/UNIT,'released_HELI':released/UNIT,'market_locked_HELI':market_stock/UNIT,'management_locked_HELI':management_stock/UNIT})
    return points
result={'rate_percent':RATE/SCALE*100,'initial_base_HELI':5_000_000,'scope':'Policy arithmetic only; not a price or demand forecast. Actual ELF acceptance separately verifies all 720 months.','with_full_management_capacity_use':scenario(True),'without_management_releases':scenario(False)}
(Path(__file__).resolve().parents[1]/'market-release-model.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result['with_full_management_capacity_use'][:3],indent=2))
