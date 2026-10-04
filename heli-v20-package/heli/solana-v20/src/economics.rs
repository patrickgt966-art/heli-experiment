use anchor_lang::prelude::*;
use crate::ErrorCode;
pub const UNIT:u64=1_000_000;
pub const RATE:u128=4_022_473_737_086_389;
pub const SCALE:u128=1_000_000_000_000_000_000;
pub fn muldiv(a:u128,b:u128,d:u128)->Result<u128>{require!(d>0,ErrorCode::Math);Ok(a.checked_mul(b).ok_or(ErrorCode::Math)?/d)}
pub fn capacity(supply:u64,stocks:[u64;4])->Result<u64>{let u=stocks.iter().try_fold(0u64,|s,x|s.checked_add(*x)).ok_or(ErrorCode::Math)?;let r=supply.checked_sub(u).ok_or(ErrorCode::Collateral)?;Ok(muldiv(r as u128,RATE,SCALE)? as u64)}
