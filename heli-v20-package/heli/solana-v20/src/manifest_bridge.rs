//! Direct, program-owned Manifest core seat. Pinned to Manifest v3.0.24.
//! Pilot only. Raw CPI bytes and market layout must be rechecked on upgrade.
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{instruction::{AccountMeta,Instruction},program::{invoke,invoke_signed},pubkey,system_instruction};
use anchor_spl::token::{self,Mint,Token,TokenAccount,Transfer};
use crate::{Config,ErrorCode,OpeningAuction,UNIT,outgoing,release::{ReleasePolicy,order_bounds,check_order_price,order_expiry}};

const MANIFEST:Pubkey=pubkey!("MNFSTqtC93rEfYHB6hF82sKdZpUDFWkViLByLd1k1Ms");
const MARKET_DISCRIMINANT:u64=4859840929024028656;

pub(crate) fn check_market(market:&AccountInfo,program:&AccountInfo,heli:&Pubkey,quote:&Pubkey)->Result<(Pubkey,Pubkey)> {
 require_keys_eq!(program.key(),MANIFEST,ErrorCode::Market);
 require!(program.executable&&market.owner==&MANIFEST,ErrorCode::Market);
 let data=market.try_borrow_data()?;
 require!(data.len()>=256&&data[0..8]==MARKET_DISCRIMINANT.to_le_bytes()&&data[8]==0&&data[9]==6&&
   data[16..48]==heli.to_bytes()&&data[48..80]==quote.to_bytes(),ErrorCode::Market);
 let base=Pubkey::find_program_address(&[b"vault",market.key().as_ref(),heli.as_ref()],&MANIFEST).0;
 let quote_vault=Pubkey::find_program_address(&[b"vault",market.key().as_ref(),quote.as_ref()],&MANIFEST).0;
 require!(data[80..112]==base.to_bytes()&&data[112..144]==quote_vault.to_bytes(),ErrorCode::Market);
 Ok((base,quote_vault))
}

fn cpi<'a>(program:AccountInfo<'a>,accounts:&[AccountInfo<'a>],metas:Vec<AccountMeta>,data:Vec<u8>,bump:u8)->Result<()> {
 let ix=Instruction{program_id:MANIFEST,accounts:metas,data};
 let seed=[bump];let signer:&[&[u8]]=&[b"manifest-trader",&seed];
 let mut infos=accounts.to_vec();infos.push(program);
 invoke_signed(&ix,&infos,&[signer])?;Ok(())
}

fn manifest_data(tag:u8,amount:u64)->Vec<u8>{let mut d=vec![tag];d.extend_from_slice(&amount.to_le_bytes());d.push(0);d}
fn update_data(cancel:Option<u64>,order:Option<(u64,u32,i8,u32)>)->Vec<u8>{
 let mut d=vec![6,0]; // BatchUpdate, no trader-index hint.
 d.extend_from_slice(&(if cancel.is_some(){1u32}else{0}).to_le_bytes());
 if let Some(s)=cancel {d.extend_from_slice(&s.to_le_bytes());d.push(0);}
 d.extend_from_slice(&(if order.is_some(){1u32}else{0}).to_le_bytes());
 if let Some((amount,mantissa,exponent,last_valid_slot))=order {
  d.extend_from_slice(&amount.to_le_bytes());d.extend_from_slice(&mantissa.to_le_bytes());
  d.push(exponent as u8);d.push(0); // Ask; is_bid=false.
  d.extend_from_slice(&last_valid_slot.to_le_bytes());d.push(0); // Expiring limit order.
 }
 d
}

#[derive(Accounts)]
pub struct BindManifestMarket<'info> {
 #[account(mut,seeds=[b"config"],bump=config.bump,has_one=admin)] pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)] pub mint:Box<Account<'info,Mint>>,
 #[account(address=config.quote_mint)] pub quote_mint:Box<Account<'info,Mint>>,
 /// CHECK: owner, discriminant, mints and vaults are checked by check_market.
 #[account(mut)] pub manifest_market:UncheckedAccount<'info>,
 /// CHECK: checked against the pinned Manifest ID and executable flag.
 pub manifest_program:UncheckedAccount<'info>,
 /// CHECK: Seeds and System owner create a zero-data PDA used only as a Manifest CPI signer.
 #[account(init,payer=admin,space=0,owner=system_program.key(),seeds=[b"manifest-trader"],bump)] pub trader:UncheckedAccount<'info>,
 #[account(mut)] pub admin:Signer<'info>,
 pub token_program:Program<'info,Token>,pub system_program:Program<'info,System>,pub rent:Sysvar<'info,Rent>,
}

pub fn bind(ctx:Context<BindManifestMarket>,market_rent_lamports:u64)->Result<()> {
 let a=&ctx.accounts;let c=&a.config;
 require!(c.live&&!c.closed&&!c.manifest_bound&&!c.dlmm_listed&&!c.meteora_listed&&
   market_rent_lamports>=1_000_000&&market_rent_lamports<=100_000_000,ErrorCode::Market);
 check_market(&a.manifest_market.to_account_info(),&a.manifest_program.to_account_info(),&c.mint,&c.quote_mint)?;
 invoke(&system_instruction::transfer(&a.admin.key(),&a.trader.key(),market_rent_lamports),
   &[a.admin.to_account_info(),a.trader.to_account_info(),a.system_program.to_account_info()])?;
 let metas=vec![AccountMeta::new(a.trader.key(),true),AccountMeta::new(a.manifest_market.key(),false),
   AccountMeta::new_readonly(a.system_program.key(),false)];
 cpi(a.manifest_program.to_account_info(),&[a.trader.to_account_info(),a.manifest_market.to_account_info(),
   a.system_program.to_account_info()],metas,vec![1],ctx.bumps.trader)?;
 let market_key=a.manifest_market.key();let c=&mut ctx.accounts.config;c.manifest_market=market_key;
 c.manifest_trader_bump=ctx.bumps.trader;c.manifest_bound=true;Ok(())
}

#[derive(Accounts)]
pub struct PlaceProjectAsk<'info> {
 #[account(mut,seeds=[b"config"],bump=config.bump,has_one=admin)] pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)] pub mint:Box<Account<'info,Mint>>,
 #[account(seeds=[b"opening-auction"],bump)] pub auction:Box<Account<'info,OpeningAuction>>,
 #[account(seeds=[b"release-policy"],bump)] pub policy:Box<Account<'info,ReleasePolicy>>,
 #[account(mut,seeds=[b"market-inventory"],bump,token::mint=mint,token::authority=config)] pub market_inventory:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"manifest-heli"],bump,token::mint=mint,token::authority=trader)] pub manifest_base:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"manifest-trader"],bump=config.manifest_trader_bump)] pub trader:SystemAccount<'info>,
 /// CHECK: bound address and Manifest header checked at runtime.
 #[account(mut,address=config.manifest_market)] pub manifest_market:UncheckedAccount<'info>,
 /// CHECK: checked against fixed program ID and executable flag.
 pub manifest_program:UncheckedAccount<'info>,
 /// CHECK: verified PDA of bound Manifest market and HELI mint.
 #[account(mut)] pub base_vault:UncheckedAccount<'info>,
 #[account(mut)] pub admin:Signer<'info>,
 pub token_program:Program<'info,Token>,pub system_program:Program<'info,System>,
}

pub fn place_ask(ctx:Context<PlaceProjectAsk>,amount:u64,mantissa:u32,exponent:i8)->Result<()> {
 let a=&ctx.accounts;let c=&a.config;
 require!((c.live||c.closed)&&!c.paused&&c.manifest_bound&&a.auction.finalized&&
   amount>0&&mantissa>0&&exponent>=-18&&exponent<=18&&
   a.market_inventory.amount>=c.market_remaining,ErrorCode::Market);
 let (base,_)=check_market(&a.manifest_market.to_account_info(),&a.manifest_program.to_account_info(),&c.mint,&c.quote_mint)?;
 require_keys_eq!(a.base_vault.key(),base,ErrorCode::Market);
 let now=Clock::get()?;check_order_price(mantissa,exponent,false,order_bounds(&a.policy,&a.auction,now.unix_timestamp))?;let expiry=order_expiry(&now)?;
 let unclaimed=a.auction.reserved_atoms;
 // Anyone can send SPL tokens here. Gifts must neither halt trading nor
 // enlarge constitutionally authorized inventory.
 let available=c.market_remaining.checked_sub(unclaimed).ok_or(ErrorCode::Collateral)?;
 require!(amount<=available,ErrorCode::Collateral);
 outgoing(a.token_program.to_account_info(),a.market_inventory.to_account_info(),a.manifest_base.to_account_info(),
   c.to_account_info(),c.bump,amount)?;
 let deposit=vec![AccountMeta::new_readonly(a.trader.key(),true),AccountMeta::new(a.manifest_market.key(),false),
   AccountMeta::new(a.manifest_base.key(),false),AccountMeta::new(a.base_vault.key(),false),
   AccountMeta::new_readonly(a.token_program.key(),false),AccountMeta::new_readonly(a.mint.key(),false)];
 cpi(a.manifest_program.to_account_info(),&[a.trader.to_account_info(),a.manifest_market.to_account_info(),
   a.manifest_base.to_account_info(),a.base_vault.to_account_info(),a.token_program.to_account_info(),a.mint.to_account_info()],
   deposit,manifest_data(2,amount),c.manifest_trader_bump)?;
 let update=vec![AccountMeta::new(a.trader.key(),true),AccountMeta::new(a.manifest_market.key(),false),
   AccountMeta::new_readonly(a.system_program.key(),false)];
 cpi(a.manifest_program.to_account_info(),&[a.trader.to_account_info(),a.manifest_market.to_account_info(),
   a.system_program.to_account_info()],update,update_data(None,Some((amount,mantissa,exponent,expiry))),c.manifest_trader_bump)?;
 let c=&mut ctx.accounts.config;c.market_remaining=c.market_remaining.checked_sub(amount).ok_or(ErrorCode::Math)?;
 c.manifest_base_deposited=c.manifest_base_deposited.checked_add(amount).ok_or(ErrorCode::Math)?;Ok(())
}

#[derive(Accounts)]
pub struct CancelProjectAsk<'info> {
 #[account(seeds=[b"config"],bump=config.bump,has_one=admin)] pub config:Box<Account<'info,Config>>,
 #[account(mut,seeds=[b"manifest-trader"],bump=config.manifest_trader_bump)] pub trader:SystemAccount<'info>,
 /// CHECK: fixed bound market is validated in cancel_ask.
 #[account(mut,address=config.manifest_market)] pub manifest_market:UncheckedAccount<'info>,
 /// CHECK: pinned program checked in cancel_ask.
 pub manifest_program:UncheckedAccount<'info>,
 #[account(mut)] pub admin:Signer<'info>,pub system_program:Program<'info,System>,
}

pub fn cancel_ask(ctx:Context<CancelProjectAsk>,sequence:u64)->Result<()> {
 let a=&ctx.accounts;let c=&a.config;require!(c.manifest_bound,ErrorCode::Market);
 check_market(&a.manifest_market.to_account_info(),&a.manifest_program.to_account_info(),&c.mint,&c.quote_mint)?;
 let metas=vec![AccountMeta::new(a.trader.key(),true),AccountMeta::new(a.manifest_market.key(),false),
   AccountMeta::new_readonly(a.system_program.key(),false)];
 cpi(a.manifest_program.to_account_info(),&[a.trader.to_account_info(),a.manifest_market.to_account_info(),
   a.system_program.to_account_info()],metas,update_data(Some(sequence),None),c.manifest_trader_bump)
}

#[derive(Accounts)]
pub struct WithdrawProjectHeli<'info> {
 #[account(mut,seeds=[b"config"],bump=config.bump,has_one=admin)] pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)] pub mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"manifest-trader"],bump=config.manifest_trader_bump)] pub trader:SystemAccount<'info>,
 #[account(mut,seeds=[b"manifest-heli"],bump,token::mint=mint,token::authority=trader)] pub manifest_base:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"market-inventory"],bump,token::mint=mint,token::authority=config)] pub market_inventory:Box<Account<'info,TokenAccount>>,
 /// CHECK: fixed bound market checked in withdraw_heli.
 #[account(mut,address=config.manifest_market)] pub manifest_market:UncheckedAccount<'info>,
 /// CHECK: pinned program checked in withdraw_heli.
 pub manifest_program:UncheckedAccount<'info>,
 /// CHECK: verified base vault PDA.
 #[account(mut)] pub base_vault:UncheckedAccount<'info>,
 #[account(mut)] pub admin:Signer<'info>,pub token_program:Program<'info,Token>,
}

pub fn withdraw_heli(ctx:Context<WithdrawProjectHeli>,amount:u64)->Result<()> {
 let a=&ctx.accounts;let c=&a.config;require!(c.manifest_bound&&amount>0,ErrorCode::Market);
 let (base,_)=check_market(&a.manifest_market.to_account_info(),&a.manifest_program.to_account_info(),&c.mint,&c.quote_mint)?;
 require_keys_eq!(a.base_vault.key(),base,ErrorCode::Market);
 let metas=vec![AccountMeta::new_readonly(a.trader.key(),true),AccountMeta::new(a.manifest_market.key(),false),
   AccountMeta::new(a.manifest_base.key(),false),AccountMeta::new(a.base_vault.key(),false),
   AccountMeta::new_readonly(a.token_program.key(),false),AccountMeta::new_readonly(a.mint.key(),false)];
 cpi(a.manifest_program.to_account_info(),&[a.trader.to_account_info(),a.manifest_market.to_account_info(),
   a.manifest_base.to_account_info(),a.base_vault.to_account_info(),a.token_program.to_account_info(),a.mint.to_account_info()],
   metas,manifest_data(3,amount),c.manifest_trader_bump)?;
 let seed=[c.manifest_trader_bump];let sign:&[&[u8]]=&[b"manifest-trader",&seed];
 token::transfer(CpiContext::new_with_signer(a.token_program.to_account_info(),Transfer{
   from:a.manifest_base.to_account_info(),to:a.market_inventory.to_account_info(),authority:a.trader.to_account_info()},&[sign]),amount)?;
 let c=&mut ctx.accounts.config;c.market_remaining=c.market_remaining.checked_add(amount).ok_or(ErrorCode::Math)?;
 c.manifest_base_returned=c.manifest_base_returned.checked_add(amount).ok_or(ErrorCode::Math)?;Ok(())
}

#[derive(Accounts)]
pub struct WithdrawProjectQuote<'info> {
 #[account(mut,seeds=[b"config"],bump=config.bump,has_one=admin)] pub config:Box<Account<'info,Config>>,
 #[account(address=config.quote_mint)] pub quote_mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"manifest-trader"],bump=config.manifest_trader_bump)] pub trader:SystemAccount<'info>,
 #[account(mut,seeds=[b"manifest-quote"],bump,token::mint=quote_mint,token::authority=trader)] pub manifest_quote:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"auction-proceeds"],bump,token::mint=quote_mint,token::authority=config)] pub sale_proceeds:Box<Account<'info,TokenAccount>>,
 /// CHECK: fixed bound market checked in withdraw_quote.
 #[account(mut,address=config.manifest_market)] pub manifest_market:UncheckedAccount<'info>,
 /// CHECK: pinned program checked in withdraw_quote.
 pub manifest_program:UncheckedAccount<'info>,
 /// CHECK: verified quote vault PDA.
 #[account(mut)] pub quote_vault:UncheckedAccount<'info>,
 #[account(mut)] pub admin:Signer<'info>,pub token_program:Program<'info,Token>,
}

pub fn withdraw_quote(ctx:Context<WithdrawProjectQuote>,amount:u64)->Result<()> {
 let a=&ctx.accounts;let c=&a.config;require!(c.manifest_bound&&amount>0,ErrorCode::Market);
 let (_,quote)=check_market(&a.manifest_market.to_account_info(),&a.manifest_program.to_account_info(),&c.mint,&c.quote_mint)?;
 require_keys_eq!(a.quote_vault.key(),quote,ErrorCode::Market);
 let metas=vec![AccountMeta::new_readonly(a.trader.key(),true),AccountMeta::new(a.manifest_market.key(),false),
   AccountMeta::new(a.manifest_quote.key(),false),AccountMeta::new(a.quote_vault.key(),false),
   AccountMeta::new_readonly(a.token_program.key(),false),AccountMeta::new_readonly(a.quote_mint.key(),false)];
 cpi(a.manifest_program.to_account_info(),&[a.trader.to_account_info(),a.manifest_market.to_account_info(),
   a.manifest_quote.to_account_info(),a.quote_vault.to_account_info(),a.token_program.to_account_info(),a.quote_mint.to_account_info()],
   metas,manifest_data(3,amount),c.manifest_trader_bump)?;
 let seed=[c.manifest_trader_bump];let sign:&[&[u8]]=&[b"manifest-trader",&seed];
 token::transfer(CpiContext::new_with_signer(a.token_program.to_account_info(),Transfer{
   from:a.manifest_quote.to_account_info(),to:a.sale_proceeds.to_account_info(),authority:a.trader.to_account_info()},&[sign]),amount)?;
 let c=&mut ctx.accounts.config;c.manifest_quote_withdrawn=c.manifest_quote_withdrawn.checked_add(amount).ok_or(ErrorCode::Math)?;Ok(())
}
