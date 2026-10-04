//! Single-manager project treasury on the bound Manifest market.
//! New treasury releases consume the legacy founder epoch budget exactly once.
//! Market collateral, cancelled orders and purchased HELI never refill locked stock.
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{instruction::{AccountMeta,Instruction},program::{invoke,invoke_signed},system_instruction};
use anchor_spl::token::{self,Mint,Token,TokenAccount,Transfer};
use crate::{Config,Epoch,ErrorCode,OpeningAuction,boundary,outgoing,manifest_bridge::check_market,release::{ReleasePolicy,reference_price,bid_book,band_depth,order_bounds,check_order_price,order_expiry,outside_shallow,crash_ceiling,order_quote,own_bid_quote}};

#[account]
pub struct ManagementBook {pub quote_floor:u64,pub total_released:u64,pub quote_funded:u64,pub quote_returned:u64,pub trader_bump:u8,pub bid_day:i64,pub bid_days:[u64;31],pub revenue_counted:u64}

#[derive(Accounts)]
pub struct InitializeManagement<'info>{
 #[account(seeds=[b"config"],bump=config.bump,has_one=admin)] pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)] pub mint:Box<Account<'info,Mint>>,
 #[account(address=config.quote_mint)] pub quote_mint:Box<Account<'info,Mint>>,
 #[account(init,payer=admin,space=8+297,seeds=[b"management-book"],bump)] pub management_book:Box<Account<'info,ManagementBook>>,
 /// CHECK: Fixed System-owned signer PDA; Manifest seat is claimed by CPI.
 #[account(init,payer=admin,space=0,owner=system_program.key(),seeds=[b"management-trader"],bump)] pub management_trader:UncheckedAccount<'info>,
 /// CHECK: Bound market, owner, mints, program and header checked before CPI.
 #[account(mut,address=config.manifest_market)] pub manifest_market:UncheckedAccount<'info>,
 /// CHECK: Executable pinned Manifest program checked by check_market.
 pub manifest_program:UncheckedAccount<'info>,
 #[account(mut)] pub admin:Signer<'info>,pub token_program:Program<'info,Token>,pub system_program:Program<'info,System>,pub rent:Sysvar<'info,Rent>,
}

pub fn initialize(mut ctx:Context<InitializeManagement>,quote_floor:u64,rent_lamports:u64)->Result<()> {
 let a=&mut ctx.accounts;require!(a.config.live&&!a.config.closed&&a.config.manifest_bound&&rent_lamports>=1_000_000&&rent_lamports<=100_000_000,ErrorCode::State);
 // Owner decision (V22): the untouchable project quote reserve is at least 1,000 quote units.
 require!(quote_floor>=1000*10u64.pow(a.quote_mint.decimals as u32),ErrorCode::Quota);
 check_market(&a.manifest_market.to_account_info(),&a.manifest_program.to_account_info(),&a.config.mint,&a.config.quote_mint)?;
 invoke(&system_instruction::transfer(&a.admin.key(),&a.management_trader.key(),rent_lamports),&[a.admin.to_account_info(),a.management_trader.to_account_info(),a.system_program.to_account_info()])?;
 let bump=[ctx.bumps.management_trader];let sign:&[&[u8]]=&[b"management-trader",&bump];
 let ix=Instruction{program_id:a.manifest_program.key(),data:vec![1],accounts:vec![AccountMeta::new(a.management_trader.key(),true),AccountMeta::new(a.manifest_market.key(),false),AccountMeta::new_readonly(a.system_program.key(),false)]};
 invoke_signed(&ix,&[a.management_trader.to_account_info(),a.manifest_market.to_account_info(),a.system_program.to_account_info(),a.manifest_program.to_account_info()],&[sign])?;
 a.management_book.quote_floor=quote_floor;a.management_book.trader_bump=ctx.bumps.management_trader;Ok(())
}

#[derive(Accounts)]
pub struct ManagementAction<'info>{
 #[account(mut,seeds=[b"config"],bump=config.bump,has_one=admin)] pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)] pub mint:Box<Account<'info,Mint>>,
 #[account(address=config.quote_mint)] pub quote_mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"management-book"],bump)] pub management_book:Box<Account<'info,ManagementBook>>,
 #[account(mut,seeds=[b"management-trader"],bump=management_book.trader_bump)] pub management_trader:SystemAccount<'info>,
 #[account(mut,seeds=[b"management-base"],bump,token::mint=mint,token::authority=management_trader)] pub management_base:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"management-quote"],bump,token::mint=quote_mint,token::authority=management_trader)] pub management_quote:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"auction-proceeds"],bump,token::mint=quote_mint,token::authority=config)] pub project_quote:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"vault",&[3u8]],bump,token::mint=mint,token::authority=config)] pub management_stock:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"epoch",&epoch.number.to_le_bytes()],bump=epoch.bump)] pub epoch:Box<Account<'info,Epoch>>,
 #[account(seeds=[b"release-policy"],bump)] pub policy:Box<Account<'info,ReleasePolicy>>,
 #[account(seeds=[b"opening-auction"],bump)] pub auction:Box<Account<'info,OpeningAuction>>,
 /// CHECK: Bound market and its canonical vaults are checked for every operation.
 #[account(mut,address=config.manifest_market)] pub manifest_market:UncheckedAccount<'info>,
 /// CHECK: Pinned Manifest executable checked by check_market.
 pub manifest_program:UncheckedAccount<'info>,
 /// CHECK: Canonical market base vault checked by market().
 #[account(mut)] pub base_vault:UncheckedAccount<'info>,
 /// CHECK: Canonical market quote vault checked by market().
 #[account(mut)] pub quote_vault:UncheckedAccount<'info>,
 #[account(mut)] pub admin:Signer<'info>,pub token_program:Program<'info,Token>,pub system_program:Program<'info,System>,
}

fn market(a:&ManagementAction)->Result<()> {
 require!(a.config.manifest_bound,ErrorCode::Market);
 let(b,q)=check_market(&a.manifest_market.to_account_info(),&a.manifest_program.to_account_info(),&a.config.mint,&a.config.quote_mint)?;
 require_keys_eq!(a.base_vault.key(),b,ErrorCode::Market);require_keys_eq!(a.quote_vault.key(),q,ErrorCode::Market);Ok(())
}
// Owner decision (V22): every reserve-funded bid, normal or crash exception, shares one rolling 30-day
// window of placed quote (bid_days, one slot per UTC day). Cancelling a live bid gives back its unfilled part.
// 31 daily slots: the current day plus the 30 before it, so any two bids less than 30 days apart share the window.
fn roll(b:&mut ManagementBook,day:i64){
 if day.saturating_sub(b.bid_day)>=31 {b.bid_days=[0;31];}
 else {let mut d=b.bid_day+1;while d<=day {b.bid_days[d.rem_euclid(31) as usize]=0;d+=1;}}
 b.bid_day=b.bid_day.max(day);
}
fn active(a:&ManagementAction)->Result<()> {require!(a.config.live&&!a.config.closed&&!a.config.paused,ErrorCode::State);market(a)}
fn invoke_management<'a>(a:&ManagementAction<'a>,data:Vec<u8>,metas:Vec<AccountMeta>,mut infos:Vec<AccountInfo<'a>>)->Result<()> {
 let bump=[a.management_book.trader_bump];let sign:&[&[u8]]=&[b"management-trader",&bump];
 infos.push(a.manifest_program.to_account_info());invoke_signed(&Instruction{program_id:a.manifest_program.key(),data,accounts:metas},&infos,&[sign])?;Ok(())
}
fn deposit_or_withdraw(a:&ManagementAction,base:bool,amount:u64,tag:u8)->Result<()> {
 let(wallet,vault,mint)=if base {(a.management_base.to_account_info(),a.base_vault.to_account_info(),a.mint.to_account_info())}else{(a.management_quote.to_account_info(),a.quote_vault.to_account_info(),a.quote_mint.to_account_info())};
 let mut data=vec![tag];data.extend_from_slice(&amount.to_le_bytes());data.push(0);
 invoke_management(a,data,vec![AccountMeta::new_readonly(a.management_trader.key(),true),AccountMeta::new(a.manifest_market.key(),false),AccountMeta::new(wallet.key(),false),AccountMeta::new(vault.key(),false),AccountMeta::new_readonly(a.token_program.key(),false),AccountMeta::new_readonly(mint.key(),false)],vec![a.management_trader.to_account_info(),a.manifest_market.to_account_info(),wallet,vault,a.token_program.to_account_info(),mint])
}

pub fn fund_quote(mut ctx:Context<ManagementAction>,amount:u64)->Result<()> {
 let a=&mut ctx.accounts;active(a)?;require!(amount>0,ErrorCode::Quota);
 let needed=amount.checked_add(a.management_book.quote_floor).ok_or(ErrorCode::Math)?;require!(a.project_quote.amount>=needed,ErrorCode::Collateral);
 outgoing(a.token_program.to_account_info(),a.project_quote.to_account_info(),a.management_quote.to_account_info(),a.config.to_account_info(),a.config.bump,amount)?;
 deposit_or_withdraw(a,false,amount,2)?;
 a.management_book.quote_funded=a.management_book.quote_funded.checked_add(amount).ok_or(ErrorCode::Math)?;Ok(())
}

pub fn release(mut ctx:Context<ManagementAction>,amount:u64)->Result<()> {
 let a=&mut ctx.accounts;active(a)?;let now=Clock::get()?;let e=&a.epoch;let c=&a.config;
 require!(amount>0&&e.settled&&e.number>=12&&e.number<720&&e.number==c.last_settled_epoch&&now.unix_timestamp>=boundary(c.start,e.number)&&now.unix_timestamp<boundary(c.start,e.number+1),ErrorCode::Time);
 let used=e.founder.checked_add(amount).ok_or(ErrorCode::Math)?;
 let non_management=e.human_budget as u128;
 require!(used<=e.founder_budget&&used<=e.capacity/5&&used as u128*4<=non_management&&amount<=c.stocks[3]&&a.management_stock.amount>=c.stocks[3],ErrorCode::Quota);
 // Owner decision (V22, finding 4 option B): the 2% depth limit applies to the month total; management
 // releases and direct release sales share epoch.founder.
 // Owner decision (V22): the 2% applies to all rested outside bids down to 98% of the reference.
 let ref_price=reference_price(&a.policy,now.unix_timestamp)?;let market=a.manifest_market.to_account_info();
 let(price,_)=bid_book(&market,&now,a.policy.minimum_quote_depth,a.policy.sequence_mark)?;
 let floor=(ref_price as u128*98/100)as u64;require!(floor>0,ErrorCode::Market);
 let depth=band_depth(&market,&now,a.policy.minimum_quote_depth,a.policy.sequence_mark,floor)?;
 require!(price as u128*100>=ref_price as u128*98&&price as u128*100<=ref_price as u128*102&&used<=depth/50,ErrorCode::Market);
 outgoing(a.token_program.to_account_info(),a.management_stock.to_account_info(),a.management_base.to_account_info(),c.to_account_info(),c.bump,amount)?;
 a.config.stocks[3]-=amount;a.epoch.founder=used;
 require!(a.epoch.human_budget as u128+used as u128<=a.epoch.capacity as u128,ErrorCode::Quota);
 a.management_book.total_released=a.management_book.total_released.checked_add(amount).ok_or(ErrorCode::Math)?;
 // Withdrawal/cancellation never reverses this release or refills this epoch's budget.
 Ok(())
}

pub fn order(mut ctx:Context<ManagementAction>,amount:u64,base_deposit:u64,mantissa:u32,exponent:i8,is_bid:bool)->Result<()> {
 let now=Clock::get()?;
 {let a=&mut ctx.accounts;active(a)?;require!(amount>0&&mantissa>0&&exponent>=-18&&exponent<=18&&(!is_bid||base_deposit==0),ErrorCode::Quota);
  let bounds=order_bounds(&a.policy,&a.auction,now.unix_timestamp);
  if is_bid&&bounds.1.is_none() {
   // Crash exception (owner decision V22): outside demand must have been recorded below the minimum by
   // continuous observations (at most two hours apart) for at least 24 hours, the latest within two hours,
   // and still be below it now, so a sale by the manager cannot open it on the spot.
   let(since,seen,t)=(a.policy.shallow_since,a.policy.shallow_seen,now.unix_timestamp);
   require!(since>0&&t.saturating_sub(since)>=86_400&&t.saturating_sub(seen)<=7200&&outside_shallow(&a.manifest_market.to_account_info(),&now,a.policy.minimum_quote_depth)?,ErrorCode::PriceOutsideBand);
   check_order_price(mantissa,exponent,true,(0,Some(crash_ceiling(&a.policy,&a.auction,t))))?;
  } else {check_order_price(mantissa,exponent,is_bid,bounds)?;}
  if is_bid {
   // All reserve-funded bids: placed quote over any rolling 30 days <= 10% of the current project quote
   // reserve balance (Grok finding 3: the window is not added to the base).
   roll(&mut a.management_book,now.unix_timestamp.div_euclid(86_400));let b=&mut a.management_book;
   let window:u64=b.bid_days.iter().try_fold(0u64,|s,x|s.checked_add(*x)).ok_or(ErrorCode::Math)?;
   let cost=order_quote(amount,mantissa,exponent)?;
   require!(window.checked_add(cost).ok_or(ErrorCode::Math)?<=a.project_quote.amount/10,ErrorCode::Quota);
   let slot=b.bid_day.rem_euclid(31) as usize;b.bid_days[slot]=b.bid_days[slot].checked_add(cost).ok_or(ErrorCode::Math)?;
  }}
 let a=&ctx.accounts;let expiry=order_expiry(&now)?;
 if base_deposit>0 {require!(base_deposit<=a.management_base.amount,ErrorCode::Collateral);deposit_or_withdraw(a,true,base_deposit,2)?;}
 let mut data=vec![6,0];data.extend_from_slice(&0u32.to_le_bytes());data.extend_from_slice(&1u32.to_le_bytes());
 data.extend_from_slice(&amount.to_le_bytes());data.extend_from_slice(&mantissa.to_le_bytes());data.push(exponent as u8);data.push(is_bid as u8);data.extend_from_slice(&expiry.to_le_bytes());data.push(0);
 invoke_management(a,data,vec![AccountMeta::new(a.management_trader.key(),true),AccountMeta::new(a.manifest_market.key(),false),AccountMeta::new_readonly(a.system_program.key(),false)],vec![a.management_trader.to_account_info(),a.manifest_market.to_account_info(),a.system_program.to_account_info()])
}
pub fn cancel(mut ctx:Context<ManagementAction>,sequence:u64)->Result<()> {
 let now=Clock::get()?;
 {let a=&mut ctx.accounts;market(a)?;
  // Give back the unfilled part of a live bid to the rolling window, newest days first.
  let mut credit=own_bid_quote(&a.manifest_market.to_account_info(),&now,sequence,&a.management_trader.key())?;
  if credit>0 {roll(&mut a.management_book,now.unix_timestamp.div_euclid(86_400));let b=&mut a.management_book;let mut d=b.bid_day;
   for _ in 0..31 {let s=d.rem_euclid(31) as usize;let x=credit.min(b.bid_days[s]);b.bid_days[s]-=x;credit-=x;if credit==0 {break;}d-=1;}}}
 let a=&ctx.accounts;let mut data=vec![6,0];data.extend_from_slice(&1u32.to_le_bytes());data.extend_from_slice(&sequence.to_le_bytes());data.push(0);data.extend_from_slice(&0u32.to_le_bytes());
 invoke_management(a,data,vec![AccountMeta::new(a.management_trader.key(),true),AccountMeta::new(a.manifest_market.key(),false),AccountMeta::new_readonly(a.system_program.key(),false)],vec![a.management_trader.to_account_info(),a.manifest_market.to_account_info(),a.system_program.to_account_info()])
}
pub fn withdraw(mut ctx:Context<ManagementAction>,amount:u64,is_base:bool)->Result<()> {
 let a=&mut ctx.accounts;market(a)?;require!(amount>0,ErrorCode::Quota);deposit_or_withdraw(a,is_base,amount,3)?;
 if !is_base {
  let bump=[a.management_book.trader_bump];let sign:&[&[u8]]=&[b"management-trader",&bump];
  token::transfer(CpiContext::new_with_signer(a.token_program.to_account_info(),Transfer{from:a.management_quote.to_account_info(),to:a.project_quote.to_account_info(),authority:a.management_trader.to_account_info()},&[sign]),amount)?;
  a.management_book.quote_returned=a.management_book.quote_returned.checked_add(amount).ok_or(ErrorCode::Math)?;
  // Only net trading profit (returned beyond funded, counted once) is sale revenue.
  let b=&mut a.management_book;let profit=b.quote_returned.saturating_sub(b.quote_funded);
  if profit>b.revenue_counted {a.config.revenue_total=a.config.revenue_total.checked_add(profit-b.revenue_counted).ok_or(ErrorCode::Math)?;b.revenue_counted=profit;}
 }
 // HELI remains in management_base as already-released working inventory.
 Ok(())
}
