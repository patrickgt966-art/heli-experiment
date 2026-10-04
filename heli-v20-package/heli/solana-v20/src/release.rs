//! Atomic demand-driven sale of locked inventory on the bound Manifest market.
//! Observations count only bids that rested since the previous observation; sustained wash markets remain a risk.
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{instruction::{AccountMeta,Instruction},program::{invoke,invoke_signed},system_instruction,pubkey,sysvar::instructions::load_instruction_at_checked};
use anchor_lang::Discriminator;
const COMPUTE_BUDGET:Pubkey=pubkey!("ComputeBudget111111111111111111111111111111");
use anchor_spl::token::{self,Mint,Token,TokenAccount,Transfer};
use crate::{Config,Epoch,ErrorCode,OpeningAuction,UNIT,SCALE,boundary,outgoing,manifest_bridge::check_market};
#[account]
pub struct ReleasePolicy {pub minimum_quote_depth:u64,pub count:u8,pub next:u8,pub prices:[u64;24],pub times:[i64;24],pub sequence_mark:u64,pub mark_time:i64,pub last_reference:u64,pub last_reference_time:i64,pub shallow_since:i64,pub shallow_seen:i64}
#[derive(Accounts)]
pub struct InitializeReleasePolicy<'info>{
 #[account(seeds=[b"config"],bump=config.bump,has_one=admin)] pub config:Box<Account<'info,Config>>,
 #[account(address=config.quote_mint)] pub quote_mint:Box<Account<'info,Mint>>,
 #[account(init,payer=admin,space=8+442,seeds=[b"release-policy"],bump)] pub policy:Box<Account<'info,ReleasePolicy>>,
 #[account(mut)] pub admin:Signer<'info>,pub system_program:Program<'info,System>,
}
pub fn initialize(ctx:Context<InitializeReleasePolicy>,minimum_quote_depth:u64)->Result<()> {
 // Owner decision (4 Oct 2026): code floor 250 quote units for a small market; the launch value is chosen at setup.
 require!(!ctx.accounts.config.live&&minimum_quote_depth>=250*10u64.pow(ctx.accounts.quote_mint.decimals as u32),ErrorCode::Quota);
 ctx.accounts.policy.minimum_quote_depth=minimum_quote_depth;Ok(())
}
#[derive(Accounts)]
#[instruction(kind:u8)]
pub struct InitializeReleaseSeat<'info>{
 #[account(seeds=[b"config"],bump=config.bump,has_one=admin)] pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)] pub mint:Box<Account<'info,Mint>>,
 #[account(address=config.quote_mint)] pub quote_mint:Box<Account<'info,Mint>>,
 /// CHECK: System-owned signer PDA, funded only for Manifest account rent.
 #[account(init,payer=admin,space=0,owner=system_program.key(),seeds=[b"release-trader".as_ref(),&[kind]],bump)] pub trader:UncheckedAccount<'info>,
 #[account(mut)] pub admin:Signer<'info>,pub token_program:Program<'info,Token>,pub system_program:Program<'info,System>,pub rent:Sysvar<'info,Rent>,
}
pub fn initialize_seat(ctx:Context<InitializeReleaseSeat>,kind:u8,rent_lamports:u64)->Result<()> {
 require!(kind==3,ErrorCode::LiquidityDisabled);
 require!(rent_lamports>=1_000_000&&rent_lamports<=100_000_000,ErrorCode::Quota);
 invoke(&system_instruction::transfer(&ctx.accounts.admin.key(),&ctx.accounts.trader.key(),rent_lamports),&[ctx.accounts.admin.to_account_info(),ctx.accounts.trader.to_account_info(),ctx.accounts.system_program.to_account_info()])?;Ok(())
}
#[derive(Accounts)]
pub struct ObserveReleaseMarket<'info>{
 #[account(seeds=[b"config"],bump=config.bump)] pub config:Box<Account<'info,Config>>,
 #[account(mut,seeds=[b"release-policy"],bump)] pub policy:Box<Account<'info,ReleasePolicy>>,
 /// CHECK: bound market owner/header checked.
 #[account(address=config.manifest_market)] pub manifest_market:UncheckedAccount<'info>,
 /// CHECK: fixed executable Manifest program checked.
 pub manifest_program:UncheckedAccount<'info>,
 /// CHECK: Instructions sysvar (address-checked); used to reject bundled order placement.
 #[account(address=anchor_lang::solana_program::sysvar::instructions::ID)] pub instructions:UncheckedAccount<'info>,
}
const NIL:u32=u32::MAX;
fn word(d:&[u8],o:usize)->Result<u32>{require!(o+4<=d.len(),ErrorCode::Market);Ok(u32::from_le_bytes(d[o..o+4].try_into().unwrap()))}
// Manifest v3.0.24 tree node: left u32, right u32, parent u32, color/type, then the 64-byte resting order.
fn node(d:&[u8],i:u32)->Result<usize>{require!(i!=NIL&&i%80==0,ErrorCode::Market);let at=256usize.checked_add(i as usize).ok_or(ErrorCode::Math)?;require!(at+80<=d.len(),ErrorCode::Market);Ok(at)}
// Next lower price in the bid tree (in-order predecessor); bounded so malformed data cannot loop.
fn predecessor(d:&[u8],i:u32)->Result<u32>{
 let at=node(d,i)?;let mut l=word(d,at)?;
 if l!=NIL {for _ in 0..64 {let r=word(d,node(d,l)?+4)?;if r==NIL {return Ok(l);}l=r;}return err!(ErrorCode::Market);}
 let mut c=i;let mut p=word(d,at+8)?;
 for _ in 0..64 {if p==NIL {return Ok(NIL);}let pa=node(d,p)?;if word(d,pa+4)?==c {return Ok(p);}c=p;p=word(d,pa+8)?;}
 err!(ErrorCode::Market)
}
pub(crate) fn market_sequence(market:&AccountInfo)->Result<u64>{let d=market.try_borrow_data()?;require!(d.len()>=256,ErrorCode::Market);Ok(u64::from_le_bytes(d[144..152].try_into().unwrap()))}
// Owner decision (V22): bids from the project's own Manifest seats (management, project inventory, release
// sales) never count toward the reference price or depth; only outside demand is measured.
fn project_traders()->[Pubkey;4]{
 let p=&crate::ID;
 [Pubkey::find_program_address(&[b"management-trader"],p).0,Pubkey::find_program_address(&[b"manifest-trader"],p).0,
  Pubkey::find_program_address(&[b"release-trader",&[2]],p).0,Pubkey::find_program_address(&[b"release-trader",&[3]],p).0]
}
// Resting order bytes 32..36 hold the trader's seat index; the seat node payload starts with the trader key.
fn own(d:&[u8],v:&[u8],project:&[Pubkey;4])->Result<bool>{
 let seat=node(d,u32::from_le_bytes(v[32..36].try_into().unwrap()))?;
 Ok(project.iter().any(|k|k.as_ref()==&d[seat+16..seat+48]))
}
/// Upper bound on bid-tree nodes read per measurement. Skipped orders (expired, global, project-owned,
/// too fresh, dust) also count, so a measurement stays within compute limits (~1,150 CU per node per walk;
/// a release reads the book twice). Filling this many slots above real demand costs an attacker Manifest
/// account rent for every order; an incomplete scan never counts as a shallow market.
const MAX_SCAN:usize=192;
/// Walks live outside bids from the best price downward and calls `f(price, base atoms, quote value)` for
/// each counted order until `f` returns true. Skipped: expired, global (unbacked), project-owned, orders
/// placed at or after `before_sequence`, and dust worth less than 1/1000 of the minimum depth (so cheap
/// orders cannot crowd out real demand). Returns true when the walk ended inside the book (stopped by `f`
/// or reached the last bid), false when MAX_SCAN was exhausted first.
fn walk_bids(market:&AccountInfo,now:&Clock,min_quote:u64,before_sequence:u64,mut f:impl FnMut(u64,u64,u128)->bool)->Result<bool>{
 let d=market.try_borrow_data()?;require!(d.len()>=256,ErrorCode::Market);
 let project=project_traders();let mut i=word(&d,160)?;
 for _ in 0..MAX_SCAN {
  if i==NIL {return Ok(true);}
  let at=node(&d,i)?;let v=&d[at+16..at+80];
  let raw=u128::from_le_bytes(v[0..16].try_into().unwrap());let qty=u64::from_le_bytes(v[16..24].try_into().unwrap());
  let sequence=u64::from_le_bytes(v[24..32].try_into().unwrap());let last=u32::from_le_bytes(v[36..40].try_into().unwrap());
  // Cheap filters first (dust, expiry, freshness); the seat lookup for project ownership runs last.
  if v[40]==1&&v[41]!=3&&(last==0||last as u64>=now.slot)&&qty>0&&sequence<before_sequence {
   let price=raw.checked_mul(UNIT as u128).ok_or(ErrorCode::Math)?/SCALE;require!(price>0&&price<=u64::MAX as u128,ErrorCode::Market);
   let quote=qty as u128*price/UNIT as u128;
   if quote.saturating_mul(1000)>=min_quote as u128&&!own(&d,v,&project)?&&f(price as u64,qty,quote) {return Ok(true);}
  }
  i=predecessor(&d,i)?;
 }
 Ok(false)
}
/// (marginal price, base atoms) of the best outside bids that together reach `min_quote` of depth.
pub(crate) fn bid_book(market:&AccountInfo,now:&Clock,min_quote:u64,before_sequence:u64)->Result<(u64,u64)> {
 let(mut depth,mut total,mut result)=(0u64,0u128,None);
 walk_bids(market,now,min_quote,before_sequence,|price,qty,quote|{depth=depth.saturating_add(qty);total=total.saturating_add(quote);
  if total>=min_quote as u128 {result=Some((price,depth));true}else{false}})?;
 result.ok_or(error!(ErrorCode::Market))
}
/// Owner decision (V22): base atoms of all rested outside bids priced at or above `floor` (98% of the
/// reference). The monthly management total may not exceed 2% of this. An incomplete scan counts only what
/// was read, which can only lower the limit.
pub(crate) fn band_depth(market:&AccountInfo,now:&Clock,min_quote:u64,before_sequence:u64,floor:u64)->Result<u64>{
 let mut depth=0u64;
 walk_bids(market,now,min_quote,before_sequence,|price,qty,_|{if price<floor {return true;}depth=depth.saturating_add(qty);false})?;
 Ok(depth)
}
/// Whether live outside bids (fresh ones included) are provably below `min_quote`: the whole book was read
/// and its outside quote value is short. An incomplete scan never counts as shallow.
pub(crate) fn outside_shallow(market:&AccountInfo,now:&Clock,min_quote:u64)->Result<bool>{Ok(outside_depth(market,now,min_quote)?==Depth::Shallow)}
#[derive(PartialEq)] pub(crate) enum Depth {Shallow,Deep,Unknown}
/// Shallow: the whole book was read and outside demand is below `min_quote`. Deep: outside demand reaches it.
/// Unknown: the scan limit ended the walk first.
pub(crate) fn outside_depth(market:&AccountInfo,now:&Clock,min_quote:u64)->Result<Depth>{
 let mut total=0u128;
 let complete=walk_bids(market,now,min_quote,u64::MAX,|_,_,quote|{total=total.saturating_add(quote);total>=min_quote as u128})?;
 Ok(if total>=min_quote as u128 {Depth::Deep}else if complete {Depth::Shallow}else{Depth::Unknown})
}
// Only ComputeBudget and this observation may share the transaction, so a bid cannot be placed and
// cancelled around the observation atomically (it would also fail the resting-order rule above).
fn alone_in_transaction(sysvar:&AccountInfo)->Result<()>{
 let n=u16::from_le_bytes(sysvar.try_borrow_data()?[0..2].try_into().unwrap()) as usize;
 for k in 0..n {let ix=load_instruction_at_checked(k,sysvar)?;
  let ok=ix.program_id==COMPUTE_BUDGET||(ix.program_id==crate::ID&&ix.data.len()>=8&&ix.data[..8]==crate::instruction::ObserveReleaseMarket::DISCRIMINATOR);
  require!(ok,ErrorCode::Market);}
 Ok(())
}
pub fn observe(ctx:Context<ObserveReleaseMarket>)->Result<()>{
 // Owner decision (V22): observations continue after the 60-year close so remaining inventory keeps a
 // current price floor; no new supply or management orders exist then.
 let c=&ctx.accounts.config;require!((c.live||c.closed)&&c.manifest_bound,ErrorCode::State);
 alone_in_transaction(&ctx.accounts.instructions.to_account_info())?;
 let market=ctx.accounts.manifest_market.to_account_info();
 check_market(&market,&ctx.accounts.manifest_program.to_account_info(),&c.mint,&c.quote_mint)?;
 let now=Clock::get()?;let sequence=market_sequence(&market)?;let p=&mut ctx.accounts.policy;
 // Crash exception bookkeeping: remember since when outside demand has been provably below the minimum.
 // A shallow market yields no price sample; the call still succeeds so the condition is recorded.
 // The record restarts unless the previous shallow observation is at most two hours old, so the 24-hour
 // wait needs continuous confirmation and cannot be bridged by a gap without observations.
 let demand=outside_depth(&market,&now,p.minimum_quote_depth)?;
 if demand==Depth::Shallow {
  if p.shallow_since==0||now.unix_timestamp.saturating_sub(p.shallow_seen)>7200 {p.shallow_since=now.unix_timestamp;}
  p.shallow_seen=now.unix_timestamp;return Ok(());
 }
 // Review A6: proven outside demand clears the crash record, and the call then succeeds even when no price
 // sample is due or possible, so a failed sample can never roll the clearing back.
 let deep=demand==Depth::Deep;if deep {p.shallow_since=0;}
 // Arm (or re-arm after a gap): record which orders already rest; the first sample follows an hour later.
 if p.mark_time==0||now.unix_timestamp-p.mark_time>7200 {p.count=0;p.next=0;p.sequence_mark=sequence;p.mark_time=now.unix_timestamp;return Ok(());}
 if deep&&now.unix_timestamp-p.mark_time<3600 {return Ok(());}
 require!(now.unix_timestamp-p.mark_time>=3600,ErrorCode::Time);
 let(price,depth)=match bid_book(&market,&now,p.minimum_quote_depth,p.sequence_mark) {Ok(x)=>x,Err(e)=>{if deep {return Ok(());} return Err(e);}};
 if ((depth as u128*price as u128)/UNIT as u128)<(p.minimum_quote_depth as u128) {if deep {return Ok(());} return err!(ErrorCode::Market);}
 let i=p.next as usize;p.prices[i]=price;p.times[i]=now.unix_timestamp;p.next=((i+1)%24)as u8;p.count=(p.count+1).min(24);
 // Remembered for the crash exception: the last reference built from outside demand.
 if let Ok(r)=reference_price(p,now.unix_timestamp) {p.last_reference=r;p.last_reference_time=now.unix_timestamp;}
 p.sequence_mark=sequence;p.mark_time=now.unix_timestamp;Ok(())
}
/// Owner policy for project and management orders (quote atoms per HELI): with a live reference price,
/// asks >= 95% and bids <= 105% of it; without one, asks >= the larger of the opening auction price (the
/// announced floor if the auction sold nothing) and 95% of the last outside reference if that is at most
/// 30 days old, and reserve-funded bids only through the crash exception (management::order with
/// crash_ceiling). Owner decision (V22, Grok finding 2): stalling observations, e.g. with a book full of
/// skipped dust, cannot lower the sale floor for 30 days after the last reference; then the floor is the
/// opening auction price again.
pub(crate) fn order_bounds(p:&ReleasePolicy,auction:&OpeningAuction,now:i64)->(u64,Option<u64>){
 match reference_price(p,now) {
  Ok(r)=>((r as u128*95/100)as u64,Some((r as u128*105/100)as u64)),
  Err(_)=>{
   let opening=if auction.clearing_price>0 {auction.clearing_price}else{auction.floor};
   let recent=if p.last_reference>0&&now.saturating_sub(p.last_reference_time)<=30*86400 {(p.last_reference as u128*95/100)as u64}else{0};
   (opening.max(recent),None)
  }
 }
}
/// Manifest prices are mantissa*10^exponent quote atoms per base atom; HELI has 6 decimals.
// Owner decision (V22, crash exception): with no valid reference AND outside bids recorded below the minimum
// depth for at least 24 hours (and still below it), reserve-funded bids may be placed at most at 95% of the
// last outside reference (at most 30 days old; otherwise the opening auction price). The caller also
// enforces a rolling 30-day quote cap.
pub(crate) fn crash_ceiling(p:&ReleasePolicy,auction:&OpeningAuction,now:i64)->u64{
 let base=if p.last_reference>0&&now.saturating_sub(p.last_reference_time)<=30*86400 {p.last_reference}
  else if auction.clearing_price>0 {auction.clearing_price}else{auction.floor};
 (base as u128*95/100)as u64
}
/// Unfilled quote value of the management seat's own live bid with `sequence`, or 0 when it is not found
/// within MAX_SCAN nodes, is not a bid of `trader`, or has expired. Used to give back rolling-window quota
/// when a bid is cancelled; rounds down, so it never exceeds what order_quote charged.
pub(crate) fn own_bid_quote(market:&AccountInfo,now:&Clock,sequence:u64,trader:&Pubkey)->Result<u64>{
 let d=market.try_borrow_data()?;require!(d.len()>=256,ErrorCode::Market);let mut i=word(&d,160)?;
 for _ in 0..MAX_SCAN {
  if i==NIL {return Ok(0);}
  let at=node(&d,i)?;let v=&d[at+16..at+80];
  if u64::from_le_bytes(v[24..32].try_into().unwrap())==sequence {
   let last=u32::from_le_bytes(v[36..40].try_into().unwrap());let seat=node(&d,u32::from_le_bytes(v[32..36].try_into().unwrap()))?;
   if v[40]!=1||(last!=0&&(last as u64)<now.slot)||&d[seat+16..seat+48]!=trader.as_ref() {return Ok(0);}
   let raw=u128::from_le_bytes(v[0..16].try_into().unwrap());let qty=u64::from_le_bytes(v[16..24].try_into().unwrap());
   let price=raw.checked_mul(UNIT as u128).ok_or(ErrorCode::Math)?/SCALE;
   return Ok(u64::try_from(qty as u128*price/UNIT as u128).map_err(|_|error!(ErrorCode::Math))?);
  }
  i=predecessor(&d,i)?;
 }
 Ok(0)
}
// Quote atoms locked by a bid of `amount` base atoms at mantissa*10^exponent (same units as check_order_price).
pub(crate) fn order_quote(amount:u64,mantissa:u32,exponent:i8)->Result<u64>{
 let e=exponent as i32+6;
 let(num,den)=if e>=0 {(mantissa as u128*10u128.pow(e as u32),1u128)}else{(mantissa as u128,10u128.pow((-e) as u32))};
 let d=den.checked_mul(UNIT as u128).ok_or(ErrorCode::Math)?;
 let q=(amount as u128).checked_mul(num).ok_or(ErrorCode::Math)?.checked_add(d-1).ok_or(ErrorCode::Math)?/d;
 u64::try_from(q).map_err(|_|error!(ErrorCode::Math))
}
/// Order price as an exact fraction num/den of quote atoms per HELI.
pub(crate) fn price_frac(mantissa:u32,exponent:i8)->(u128,u128){
 let e=exponent as i32+6;if e>=0 {(mantissa as u128*10u128.pow(e as u32),1)}else{(mantissa as u128,10u128.pow((-e) as u32))}
}
/// Owner decision (review A1/A2): the project's own orders never trade with each other. A reserve-funded bid
/// and a project ask are each remembered for two days (longer than the ~24h order expiry); while a management
/// bid may rest, project asks must be priced above it and release sales (market sells) are refused, and while
/// a project ask may rest, management bids must be priced below it.
pub(crate) const SELF_TRADE_WINDOW:i64=2*86_400;
pub(crate) fn check_order_price(mantissa:u32,exponent:i8,is_bid:bool,bounds:(u64,Option<u64>))->Result<()>{
 let e=exponent as i32+6;
 let(num,den)=if e>=0 {(mantissa as u128*10u128.pow(e as u32),1u128)}else{(mantissa as u128,10u128.pow((-e) as u32))};
 if is_bid {let ceiling=bounds.1.ok_or(error!(ErrorCode::PriceOutsideBand))?;require!(num<=ceiling as u128*den,ErrorCode::PriceOutsideBand);}
 else {require!(bounds.0>0&&num>=bounds.0 as u128*den,ErrorCode::PriceOutsideBand);}
 Ok(())
}
/// Project and management orders expire after about 24 hours (216,000 slots at ~400 ms), so a resting
/// order cannot become a gift after the market moves.
pub(crate) fn order_expiry(now:&Clock)->Result<u32>{u32::try_from(now.slot.checked_add(216_000).ok_or(ErrorCode::Math)?).map_err(|_|error!(ErrorCode::Math))}
pub fn reference_price(p:&ReleasePolicy,now:i64)->Result<u64>{
 require!(p.count==24,ErrorCode::Market);let first=p.next as usize;let last=(first+23)%24;
 require!(now>=p.times[last]&&now-p.times[last]<=3600&&p.times[last]-p.times[first]>=23*3600,ErrorCode::Time);
 let mut weighted=0u128;let mut duration=0u128;
 for k in 0..23 {let i=(first+k)%24;let j=(i+1)%24;let dt=p.times[j]-p.times[i];require!(dt>=3600&&dt<=7200,ErrorCode::Time);weighted=weighted.checked_add(p.prices[i] as u128*dt as u128).ok_or(ErrorCode::Math)?;duration+=dt as u128;}
 Ok((weighted/duration)as u64)
}
#[derive(Accounts)]
#[instruction(kind:u8)]
pub struct ExecuteReleaseSale<'info>{
 #[account(mut,seeds=[b"config"],bump=config.bump,has_one=admin)] pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)] pub mint:Box<Account<'info,Mint>>,
 #[account(address=config.quote_mint)] pub quote_mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"epoch",&epoch.number.to_le_bytes()],bump=epoch.bump)] pub epoch:Box<Account<'info,Epoch>>,
 #[account(seeds=[b"release-policy"],bump)] pub policy:Box<Account<'info,ReleasePolicy>>,
 #[account(mut,seeds=[b"vault",&[kind]],bump,token::mint=mint,token::authority=config)] pub source:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"release-trader".as_ref(),&[kind]],bump)] pub trader:SystemAccount<'info>,
 #[account(mut,seeds=[b"release-base".as_ref(),&[kind]],bump,token::mint=mint,token::authority=trader)] pub base:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"release-quote".as_ref(),&[kind]],bump,token::mint=quote_mint,token::authority=trader)] pub quote:Box<Account<'info,TokenAccount>>,
 #[account(mut,token::mint=quote_mint)] pub destination:Box<Account<'info,TokenAccount>>,
 /// CHECK: bound Manifest market header checked before CPI.
 #[account(mut,address=config.manifest_market)] pub manifest_market:UncheckedAccount<'info>,
 /// CHECK: pinned executable Manifest program checked.
 pub manifest_program:UncheckedAccount<'info>,
 /// CHECK: canonical vault addresses checked before CPI.
 #[account(mut)] pub base_vault:UncheckedAccount<'info>,
 /// CHECK: canonical vault addresses checked before CPI.
 #[account(mut)] pub quote_vault:UncheckedAccount<'info>,
 pub admin:Signer<'info>,pub token_program:Program<'info,Token>,pub system_program:Program<'info,System>,
}
pub fn execute(mut ctx:Context<ExecuteReleaseSale>,kind:u8,amount:u64)->Result<()>{
 require!(kind==3,ErrorCode::LiquidityDisabled);
 let a=&mut ctx.accounts;let now=Clock::get()?;let c=&a.config;let e=&a.epoch;
 require!(c.live&&!c.closed&&!c.paused&&c.manifest_bound&&e.settled&&e.number<720&&e.number==c.last_settled_epoch&&now.unix_timestamp>=boundary(c.start,e.number)&&now.unix_timestamp<boundary(c.start,e.number+1)&&amount>0,ErrorCode::Time);
 require!(now.unix_timestamp>=c.mgmt_bid_until,ErrorCode::SelfTrade);
 require!(now.unix_timestamp>=boundary(c.start,12),ErrorCode::Time);let left=e.founder_budget.checked_sub(e.founder).ok_or(ErrorCode::Quota)?;
 require!(amount<=left&&amount<=c.stocks[kind as usize]&&a.source.amount>=c.stocks[kind as usize],ErrorCode::Quota);
 {let dest=Pubkey::find_program_address(&[b"auction-proceeds"],&crate::ID).0;require!(a.destination.key()==dest&&a.destination.owner==c.key(),ErrorCode::Market);let allowance=(e.human_budget as u128)/4;require!(e.founder as u128+amount as u128<=allowance,ErrorCode::Quota);}
 let (bv,qv)=check_market(&a.manifest_market.to_account_info(),&a.manifest_program.to_account_info(),&c.mint,&c.quote_mint)?;
 require_keys_eq!(bv,a.base_vault.key(),ErrorCode::Market);require_keys_eq!(qv,a.quote_vault.key(),ErrorCode::Market);
 // Owner decision (V22, finding 4 option B): the 2% depth limit applies to the month total; management
 // releases and direct release sales share epoch.founder.
 // Owner decision (V22): 2% of all rested outside bids down to 98% of the reference (not just the first
 // minimum-depth slice); only bids that rested since the previous observation count, as for management.
 let reference=reference_price(&a.policy,now.unix_timestamp)?;let market=a.manifest_market.to_account_info();
 let(price,_)=bid_book(&market,&now,a.policy.minimum_quote_depth,a.policy.sequence_mark)?;
 let floor=(reference as u128*98/100)as u64;require!(floor>0,ErrorCode::Market);
 let depth=band_depth(&market,&now,a.policy.minimum_quote_depth,a.policy.sequence_mark,floor)?;
 require!(price as u128*100>=reference as u128*98&&price as u128*100<=reference as u128*102&&e.founder.checked_add(amount).ok_or(ErrorCode::Math)?<=depth/50,ErrorCode::Market);
 let min_out=(amount as u128*floor as u128+UNIT as u128-1)/UNIT as u128;require!(min_out>0&&min_out<=u64::MAX as u128,ErrorCode::Math);
 let before_base=a.base.amount;let before_quote=a.quote.amount;
 outgoing(a.token_program.to_account_info(),a.source.to_account_info(),a.base.to_account_info(),c.to_account_info(),c.bump,amount)?;
 let mut data=vec![4];data.extend_from_slice(&amount.to_le_bytes());data.extend_from_slice(&(min_out as u64).to_le_bytes());data.extend_from_slice(&[1,1]);
 let ix=Instruction{program_id:a.manifest_program.key(),data,accounts:vec![
  AccountMeta::new(a.trader.key(),true),AccountMeta::new(a.manifest_market.key(),false),AccountMeta::new_readonly(a.system_program.key(),false),AccountMeta::new(a.base.key(),false),AccountMeta::new(a.quote.key(),false),AccountMeta::new(bv,false),AccountMeta::new(qv,false),AccountMeta::new_readonly(a.token_program.key(),false)]};
 let bump=[ctx.bumps.trader];let kind_seed=[kind];let seeds:&[&[u8]]=&[b"release-trader",&kind_seed,&bump];
 invoke_signed(&ix,&[a.trader.to_account_info(),a.manifest_market.to_account_info(),a.system_program.to_account_info(),a.base.to_account_info(),a.quote.to_account_info(),a.base_vault.to_account_info(),a.quote_vault.to_account_info(),a.token_program.to_account_info(),a.manifest_program.to_account_info()],&[seeds])?;
 a.base.reload()?;a.quote.reload()?;
 let unfilled=a.base.amount.checked_sub(before_base).ok_or(ErrorCode::Collateral)?;let filled=amount.checked_sub(unfilled).ok_or(ErrorCode::Collateral)?;
 let earned=a.quote.amount.checked_sub(before_quote).ok_or(ErrorCode::Collateral)?;
 require!(filled>0&&earned as u128*UNIT as u128>=filled as u128*floor as u128,ErrorCode::Market);
 for(from,to,n)in[(&a.base,&a.source,unfilled),(&a.quote,&a.destination,earned)] {
  if n>0 {token::transfer(CpiContext::new_with_signer(a.token_program.to_account_info(),Transfer{from:from.to_account_info(),to:to.to_account_info(),authority:a.trader.to_account_info()},&[seeds]),n)?;}
 }
 a.config.revenue_total=a.config.revenue_total.checked_add(earned).ok_or(ErrorCode::Math)?;
 let e=&mut a.epoch;
 e.founder=e.founder.checked_add(filled).ok_or(ErrorCode::Math)?;e.quote_founder=e.quote_founder.checked_add(earned).ok_or(ErrorCode::Math)?;
 require!(e.human_budget as u128+e.founder as u128<=e.capacity as u128&&e.founder<=e.capacity/5&&4*e.founder as u128<=e.human_budget as u128,ErrorCode::Quota);
 a.config.stocks[kind as usize]=a.config.stocks[kind as usize].checked_sub(filled).ok_or(ErrorCode::Math)?;Ok(())
}


