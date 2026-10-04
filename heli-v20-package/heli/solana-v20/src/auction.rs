//! 256 price levels with per-wallet PDAs. No fixed bidder-count limit.
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint,Token,TokenAccount};
use crate::{Config,ErrorCode,UNIT,incoming,outgoing};
pub const LEVELS:usize=256;
pub const OFFER_HELI:u64=5_000_000;
/// Owner decision (V22, against monopoly): one wallet may bid for at most 5% of the offer (250,000 HELI);
/// HELI the auction does not sell stays in the project inventory under the 95%-of-reference sale floor.
pub const WALLET_CAP_HELI:u64=OFFER_HELI/20;
const FREEZE_SECONDS:i64=300;
#[account]
pub struct OpeningAuction {
 pub floor:u64,pub tick_size:u64,pub end:i64,pub clearing_price:u64,
 pub sold_heli:u64,pub finalized:bool,pub demand:Vec<u64>,
 pub active_bids:u64,pub pending_claims:u64,pub reserved_atoms:u64,
 pub clearing_tick:u16,pub marginal_atoms:u64,pub marginal_demand:u64,
}
#[account]
pub struct OpeningBid {pub owner:Pubkey,pub quantity_heli:u64,pub tick:u16,pub active:bool,pub claimed:bool}
#[derive(Accounts)]
pub struct OpenAuction<'info> {
 #[account(seeds=[b"config"],bump=config.bump,has_one=admin)] pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)] pub mint:Box<Account<'info,Mint>>,
 #[account(address=config.quote_mint)] pub quote_mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"market-inventory"],bump,token::mint=mint,token::authority=config)] pub market_inventory:Box<Account<'info,TokenAccount>>,
 #[account(init,payer=admin,space=8+2304,seeds=[b"opening-auction"],bump)] pub auction:Box<Account<'info,OpeningAuction>>,
 #[account(seeds=[b"auction-quote"],bump,token::mint=quote_mint,token::authority=config)] pub quote_escrow:Box<Account<'info,TokenAccount>>,
 #[account(seeds=[b"auction-proceeds"],bump,token::mint=quote_mint,token::authority=config)] pub sale_proceeds:Box<Account<'info,TokenAccount>>,
 #[account(mut)] pub admin:Signer<'info>,pub token_program:Program<'info,Token>,pub system_program:Program<'info,System>,pub rent:Sysvar<'info,Rent>,
}
#[derive(Accounts)]
pub struct PrepareAuctionQuote<'info> {
 #[account(seeds=[b"config"],bump=config.bump,has_one=admin)] pub config:Box<Account<'info,Config>>,
 #[account(address=config.quote_mint)] pub quote_mint:Box<Account<'info,Mint>>,
 #[account(init,payer=admin,token::mint=quote_mint,token::authority=config,seeds=[b"auction-quote"],bump)] pub quote_escrow:Box<Account<'info,TokenAccount>>,
 #[account(mut)] pub admin:Signer<'info>,pub token_program:Program<'info,Token>,pub system_program:Program<'info,System>,pub rent:Sysvar<'info,Rent>,
}
#[derive(Accounts)]
pub struct CreateAuctionBid<'info> {
 #[account(seeds=[b"config"],bump=config.bump)] pub config:Box<Account<'info,Config>>,
 #[account(seeds=[b"opening-auction"],bump)] pub auction:Box<Account<'info,OpeningAuction>>,
 #[account(init,payer=account_payer,space=8+44,seeds=[b"auction-bid",bidder.key().as_ref()],bump)] pub bid:Box<Account<'info,OpeningBid>>,
 pub bidder:Signer<'info>,#[account(mut)] pub account_payer:Signer<'info>,pub system_program:Program<'info,System>,
}
#[derive(Accounts)]
pub struct PlaceAuctionBid<'info> {
 #[account(seeds=[b"config"],bump=config.bump)] pub config:Box<Account<'info,Config>>,
 #[account(mut,seeds=[b"opening-auction"],bump)] pub auction:Box<Account<'info,OpeningAuction>>,
 #[account(mut,seeds=[b"auction-bid",bidder.key().as_ref()],bump,constraint=bid.owner==bidder.key())] pub bid:Box<Account<'info,OpeningBid>>,
 #[account(mut,seeds=[b"auction-quote"],bump,token::mint=config.quote_mint,token::authority=config)] pub quote_escrow:Box<Account<'info,TokenAccount>>,
 #[account(mut,token::mint=config.quote_mint,token::authority=bidder)] pub bidder_quote:Box<Account<'info,TokenAccount>>,
 pub bidder:Signer<'info>,pub token_program:Program<'info,Token>,
}
#[derive(Accounts)]
pub struct FinalizeAuction<'info> {
 #[account(seeds=[b"config"],bump=config.bump)] pub config:Box<Account<'info,Config>>,
 #[account(mut,seeds=[b"opening-auction"],bump)] pub auction:Box<Account<'info,OpeningAuction>>,
 #[account(seeds=[b"market-inventory"],bump,token::mint=config.mint,token::authority=config)] pub market_inventory:Box<Account<'info,TokenAccount>>,
}
#[derive(Accounts)]
pub struct ClaimAuctionBid<'info> {
 #[account(mut,seeds=[b"config"],bump=config.bump)] pub config:Box<Account<'info,Config>>,
 #[account(mut,seeds=[b"opening-auction"],bump)] pub auction:Box<Account<'info,OpeningAuction>>,
 #[account(mut,seeds=[b"auction-bid",bidder.key().as_ref()],bump,constraint=bid.owner==bidder.key())] pub bid:Box<Account<'info,OpeningBid>>,
 #[account(mut,seeds=[b"market-inventory"],bump,token::mint=config.mint,token::authority=config)] pub market_inventory:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"auction-quote"],bump,token::mint=config.quote_mint,token::authority=config)] pub quote_escrow:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"auction-proceeds"],bump,token::mint=config.quote_mint,token::authority=config)] pub sale_proceeds:Box<Account<'info,TokenAccount>>,
 #[account(mut,token::mint=config.mint,token::authority=bidder)] pub bidder_heli:Box<Account<'info,TokenAccount>>,
 #[account(mut,token::mint=config.quote_mint,token::authority=bidder)] pub bidder_quote:Box<Account<'info,TokenAccount>>,
 pub bidder:Signer<'info>,pub token_program:Program<'info,Token>,
}
pub fn price(a:&OpeningAuction,tick:u16)->Result<u64>{
 require!((tick as usize)<LEVELS,ErrorCode::Quota);
 a.floor.checked_add(a.tick_size.checked_mul(tick as u64).ok_or(ErrorCode::Math)?).ok_or_else(||error!(ErrorCode::Math))
}
pub fn open(ctx:Context<OpenAuction>,floor:u64,tick_size:u64)->Result<()> {
 let c=&ctx.accounts.config;require!(c.live&&!c.closed&&!c.paused&&Clock::get()?.unix_timestamp<c.start-600&&floor>0&&tick_size>0,ErrorCode::Time);
 let highest=floor.checked_add(tick_size.checked_mul((LEVELS-1)as u64).ok_or(ErrorCode::Math)?).ok_or(ErrorCode::Math)?;
 require!((highest as u128)*(OFFER_HELI as u128)<=u64::MAX as u128&&ctx.accounts.market_inventory.amount>=OFFER_HELI*UNIT,ErrorCode::Collateral);
 let a=&mut ctx.accounts.auction;a.floor=floor;a.tick_size=tick_size;a.end=c.start;a.demand=vec![0;LEVELS];Ok(())
}
pub fn create_bid(ctx:Context<CreateAuctionBid>)->Result<()> {
 require!(ctx.accounts.config.live&&!ctx.accounts.config.closed&&!ctx.accounts.auction.finalized&&Clock::get()?.unix_timestamp<ctx.accounts.auction.end-FREEZE_SECONDS,ErrorCode::Time);
 ctx.accounts.bid.owner=ctx.accounts.bidder.key();Ok(())
}
pub fn place(ctx:Context<PlaceAuctionBid>,qty:u64,tick:u16)->Result<()> {
 let a=&mut ctx.accounts.auction;let b=&mut ctx.accounts.bid;
 require!(ctx.accounts.config.live&&!ctx.accounts.config.closed&&!ctx.accounts.config.paused&&!a.finalized&&Clock::get()?.unix_timestamp<a.end-FREEZE_SECONDS&&qty>0&&!b.active&&!b.claimed,ErrorCode::State);
 require!(qty<=WALLET_CAP_HELI,ErrorCode::Quota);
 let collateral=qty.checked_mul(price(a,tick)?).ok_or(ErrorCode::Math)?;
 incoming(ctx.accounts.token_program.to_account_info(),ctx.accounts.bidder_quote.to_account_info(),ctx.accounts.quote_escrow.to_account_info(),ctx.accounts.bidder.to_account_info(),collateral)?;
 a.demand[tick as usize]=a.demand[tick as usize].checked_add(qty).ok_or(ErrorCode::Math)?;
 a.active_bids=a.active_bids.checked_add(1).ok_or(ErrorCode::Math)?;b.quantity_heli=qty;b.tick=tick;b.active=true;Ok(())
}
pub fn cancel(ctx:Context<PlaceAuctionBid>)->Result<()> {
 let a=&mut ctx.accounts.auction;let b=&mut ctx.accounts.bid;
 require!(!a.finalized&&b.active&&!b.claimed&&Clock::get()?.unix_timestamp<a.end-FREEZE_SECONDS,ErrorCode::Time);
 let collateral=b.quantity_heli.checked_mul(price(a,b.tick)?).ok_or(ErrorCode::Math)?;
 outgoing(ctx.accounts.token_program.to_account_info(),ctx.accounts.quote_escrow.to_account_info(),ctx.accounts.bidder_quote.to_account_info(),ctx.accounts.config.to_account_info(),ctx.accounts.config.bump,collateral)?;
 a.demand[b.tick as usize]=a.demand[b.tick as usize].checked_sub(b.quantity_heli).ok_or(ErrorCode::Math)?;a.active_bids=a.active_bids.checked_sub(1).ok_or(ErrorCode::Math)?;b.active=false;b.quantity_heli=0;Ok(())
}
pub fn finalize(ctx:Context<FinalizeAuction>)->Result<()> {
 let a=&mut ctx.accounts.auction;require!(ctx.accounts.config.live&&!ctx.accounts.config.closed&&!a.finalized&&Clock::get()?.unix_timestamp>=a.end&&ctx.accounts.market_inventory.amount>=OFFER_HELI*UNIT,ErrorCode::Time);
 let total=a.demand.iter().try_fold(0u64,|n,x|n.checked_add(*x).ok_or(ErrorCode::Math))?;
 a.sold_heli=total.min(OFFER_HELI);a.clearing_tick=0;
 if total>=OFFER_HELI {let mut above=0u64;for i in(0..LEVELS).rev(){let next=above.checked_add(a.demand[i]).ok_or(ErrorCode::Math)?;if next>=OFFER_HELI {a.clearing_tick=i as u16;a.marginal_atoms=(OFFER_HELI-above)*UNIT;a.marginal_demand=a.demand[i];break;}above=next;}}
 else {a.marginal_atoms=a.demand[0]*UNIT;a.marginal_demand=a.demand[0];}
 a.clearing_price=if total>0 {price(a,a.clearing_tick)?}else{0};
 a.reserved_atoms=a.sold_heli*UNIT;a.pending_claims=a.active_bids;a.finalized=true;Ok(())
}
pub fn allocation(a:&OpeningAuction,b:&OpeningBid)->Result<u64>{
 if b.tick<a.clearing_tick{return Ok(0);}if b.tick>a.clearing_tick{return Ok(b.quantity_heli*UNIT);}
 require!(a.marginal_demand>0,ErrorCode::State);
 Ok(((a.marginal_atoms as u128*b.quantity_heli as u128)/a.marginal_demand as u128)as u64)
}
pub fn claim(ctx:Context<ClaimAuctionBid>)->Result<()> {
 let a=&mut ctx.accounts.auction;let b=&mut ctx.accounts.bid;require!(a.finalized&&b.active&&!b.claimed,ErrorCode::State);
 let got=allocation(a,b)?;let collateral=b.quantity_heli.checked_mul(price(a,b.tick)?).ok_or(ErrorCode::Math)?;
 let paid=((got as u128*a.clearing_price as u128+UNIT as u128-1)/UNIT as u128)as u64;
 let refund=collateral.checked_sub(paid).ok_or(ErrorCode::Math)?;
 require!(ctx.accounts.market_inventory.amount>=got&&ctx.accounts.quote_escrow.amount>=collateral,ErrorCode::Collateral);
 let token=ctx.accounts.token_program.to_account_info();let authority=ctx.accounts.config.to_account_info();let bump=ctx.accounts.config.bump;
 outgoing(token.clone(),ctx.accounts.market_inventory.to_account_info(),ctx.accounts.bidder_heli.to_account_info(),authority.clone(),bump,got)?;
 outgoing(token.clone(),ctx.accounts.quote_escrow.to_account_info(),ctx.accounts.sale_proceeds.to_account_info(),authority.clone(),bump,paid)?;
 outgoing(token,ctx.accounts.quote_escrow.to_account_info(),ctx.accounts.bidder_quote.to_account_info(),authority,bump,refund)?;
 b.claimed=true;a.pending_claims=a.pending_claims.checked_sub(1).ok_or(ErrorCode::Math)?;a.reserved_atoms=a.reserved_atoms.checked_sub(got).ok_or(ErrorCode::Math)?;
 if a.pending_claims==0 {a.reserved_atoms=0;}
 let c=&mut ctx.accounts.config;c.market_remaining=c.market_remaining.checked_sub(got).ok_or(ErrorCode::Math)?;c.sale_total_sold=c.sale_total_sold.checked_add(got).ok_or(ErrorCode::Math)?;Ok(())
}

