use anchor_lang::prelude::*;
use crate::ErrorCode;
pub const UNIT:u64=1_000_000;
pub const RATE:u128=4_022_473_737_086_389;
pub const SCALE:u128=1_000_000_000_000_000_000;
pub fn muldiv(a:u128,b:u128,d:u128)->Result<u128>{require!(d>0,ErrorCode::Math);Ok(a.checked_mul(b).ok_or(ErrorCode::Math)?/d)}
pub fn capacity(supply:u64,stocks:[u64;4])->Result<u64>{let u=stocks.iter().try_fold(0u64,|s,x|s.checked_add(*x)).ok_or(ErrorCode::Math)?;let r=supply.checked_sub(u).ok_or(ErrorCode::Collateral)?;Ok(muldiv(r as u128,RATE,SCALE)? as u64)}
pub fn swap_output(x:u64,y:u64,amount:u64)->Result<u64>{let net=muldiv(amount as u128,997,1000)?;Ok(muldiv(y as u128,net,x as u128+net)? as u64)}
pub fn impact_ok(x:u64,y:u64,amount:u64)->Result<bool>{if x==0||y==0{return Ok(false);}let out=swap_output(x,y,amount)?;
 Ok((y-out) as u128*x as u128*10000>=y as u128*(x as u128+amount as u128)*9800)}
pub fn founder_market_limit(x:u64,y:u64,max:u64)->Result<u64>{if y<5000*UNIT{return Ok(0);}let(mut lo,mut hi)=(0,max);
 while lo<hi {let a=lo+(hi-lo+1)/2;let out=swap_output(x,y,a)?;if impact_ok(x,y,a)?&&y-out>=5000*UNIT&&out>0{lo=a;}else{hi=a-1;}}
 Ok(lo)
}
