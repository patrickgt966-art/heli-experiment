//! Monthly sale inventory: only the separate initial 1M allocation is free.
//! Vault 0 and Epoch.human_budget are legacy layout names, not human entitlements.
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint,Token,TokenAccount};
use crate::{Config,Epoch,ErrorCode,outgoing,capacity};
use crate::calendar::boundary;

#[derive(Accounts)]
#[instruction(number:u16)]
pub struct OpenMarketEpoch<'info> {
 #[account(seeds=[b"config"],bump=config.bump)] pub config:Box<Account<'info,Config>>,
 #[account(init,payer=payer,space=8+160,seeds=[b"epoch".as_ref(),&number.to_le_bytes()],bump)] pub epoch:Box<Account<'info,Epoch>>,
 #[account(mut)] pub payer:Signer<'info>,
 pub system_program:Program<'info,System>,
}

#[derive(Accounts)]
pub struct SettleMarket<'info> {
 #[account(mut,seeds=[b"config"],bump=config.bump)] pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)] pub mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"epoch".as_ref(),&epoch.number.to_le_bytes()],bump=epoch.bump)] pub epoch:Box<Account<'info,Epoch>>,
 #[account(mut,seeds=[b"vault".as_ref(),&[0]],bump,token::mint=mint,token::authority=config)] pub release_reserve:Box<Account<'info,TokenAccount>>,
 #[account(seeds=[b"vault".as_ref(),&[3]],bump,token::mint=mint,token::authority=config)] pub management_stock:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"market-inventory"],bump,token::mint=mint,token::authority=config)] pub market_inventory:Box<Account<'info,TokenAccount>>,
 pub token_program:Program<'info,Token>,
}

pub fn open(ctx:Context<OpenMarketEpoch>,number:u16)->Result<()> {
 let c=&ctx.accounts.config;
 // Owner decision (review H2-B): the monthly rule is not pausable. Opening and settling only move HELI
 // between the program's own vaults; pause halts sales, treasury outflows and registrations instead.
 require!(c.live&&!c.closed&&number>=1&&number<=720&&Clock::get()?.unix_timestamp>=boundary(c.start,number-1),ErrorCode::Time);
 let e=&mut ctx.accounts.epoch;e.number=number;e.bump=ctx.bumps.epoch;
 // No monthly person register or claim/reward token accounts are needed.
 e.registry_finalized=true;Ok(())
}

pub fn settle(mut ctx:Context<SettleMarket>)->Result<()> {
 let a=&mut ctx.accounts;let c=&a.config;let n=a.epoch.number;
 require!(c.live&&!c.closed&&!a.epoch.settled&&Clock::get()?.unix_timestamp>=boundary(c.start,n)&&n==c.last_settled_epoch.checked_add(1).ok_or(ErrorCode::Math)?,ErrorCode::Time);
 require!(c.stocks[1]==0&&c.stocks[2]==0&&a.release_reserve.amount>=c.stocks[0]&&a.management_stock.amount>=c.stocks[3]&&a.market_inventory.amount>=c.market_remaining,ErrorCode::Collateral);
 let cap=capacity(a.mint.supply,c.stocks)?;
 // Same common monetary cap. Management release permissions expire; no separate liquidity budget.
 let management_budget=if n>=12&&n<720 {(cap/5).min(c.stocks[3])}else{0};
 let market_release=cap.checked_sub(management_budget).ok_or(ErrorCode::Math)?.min(c.stocks[0]);
 let inventory=c.market_remaining.checked_add(market_release).ok_or(ErrorCode::Math)?;
 let authorized=c.sale_authorized.checked_add(market_release).ok_or(ErrorCode::Math)?;
 outgoing(a.token_program.to_account_info(),a.release_reserve.to_account_info(),a.market_inventory.to_account_info(),c.to_account_info(),c.bump,market_release)?;
 let c=&mut a.config;c.stocks[0]-=market_release;c.market_remaining=inventory;c.sale_authorized=authorized;c.last_settled_epoch=n;
 let e=&mut a.epoch;e.settled=true;e.capacity=cap;e.human_budget=market_release;e.founder_budget=management_budget;
 e.people=0;e.per_person=0;e.human_remaining=0;e.reward_remaining=0;e.burned=0;e.staking=0;e.liquidity=0;e.liquidity_budget=0;e.founder=0;
 emit!(MonthlyMarketRelease{number:n,capacity:cap,released:market_release,management_budget});
 Ok(())
}

#[event]
pub struct MonthlyMarketRelease {pub number:u16,pub capacity:u64,pub released:u64,pub management_budget:u64}
