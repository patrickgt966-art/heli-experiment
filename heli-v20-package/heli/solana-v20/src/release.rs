//! Atomic demand-driven sale of locked inventory on the bound Manifest market.
//! Observations count only bids that rested since the previous observation; sustained wash markets remain a risk.
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{instruction::{AccountMeta,Instruction},program::{invoke,invoke_signed},system_instruction,pubkey,sysvar::instructions::load_instruction_at_checked};
use anchor_lang::Discriminator;
const COMPUTE_BUDGET:Pubkey=pubkey!("ComputeBudget111111111111111111111111111111");
use anchor_spl::token::{self,Mint,Token,TokenAccount,Transfer};
use crate::{Config,Epoch,ErrorCode,UNIT,SCALE,boundary,outgoing,manifest_bridge::check_market};
#[account]
pub struct ReleasePolicy {pub minimum_quote_depth:u64,pub count:u8,pub next:u8,pub prices:[u64;24],pub times:[i64;24],pub sequence_mark:u64,pub mark_time:i64}
#[derive(Accounts)]
pub struct InitializeReleasePolicy<'info>{
 #[account(seeds=[b"config"],bump=config.bump,has_one=admin)] pub config:Box<Account<'info,Config>>,
 #[account(address=config.quote_mint)] pub quote_mint:Box<Account<'info,Mint>>,
 #[account(init,payer=admin,space=8+512,seeds=[b"release-policy"],bump)] pub policy:Box<Account<'info,ReleasePolicy>>,
 #[account(mut)] pub admin:Signer<'info>,pub system_program:Program<'info,System>,
}
pub fn initialize(ctx:Context<InitializeReleasePolicy>,minimum_quote_depth:u64)->Result<()> {
 require!(!ctx.accounts.config.live&&minimum_quote_depth>=5000*10u64.pow(ctx.accounts.quote_mint.decimals as u32),ErrorCode::Quota);
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
 require!((kind==2||kind==3)&&rent_lamports>=1_000_000&&rent_lamports<=100_000_000,ErrorCode::Quota);
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
/// Walks resting bids from the best price downward until `min_quote` of depth is reached and returns
/// (marginal price in quote atoms per HELI, base atoms counted). Expired and global (unbacked) orders are
/// skipped, so a stale or dust order cannot block or set the price on its own. Only orders with a sequence
/// number below `before_sequence` count, which excludes bids placed after the previous observation.
pub(crate) fn bid_book(market:&AccountInfo,now:&Clock,min_quote:u64,before_sequence:u64)->Result<(u64,u64)> {
 let d=market.try_borrow_data()?;require!(d.len()>=256,ErrorCode::Market);
 let mut i=word(&d,160)?;let mut depth=0u64;
 for _ in 0..64 {
  if i==NIL {break;}
  let at=node(&d,i)?;let v=&d[at+16..at+80];
  let raw=u128::from_le_bytes(v[0..16].try_into().unwrap());let qty=u64::from_le_bytes(v[16..24].try_into().unwrap());
  let sequence=u64::from_le_bytes(v[24..32].try_into().unwrap());let last=u32::from_le_bytes(v[36..40].try_into().unwrap());
  if v[40]==1&&v[41]!=3&&(last==0||last as u64>=now.slot)&&qty>0&&sequence<before_sequence {
   let price=raw.checked_mul(UNIT as u128).ok_or(ErrorCode::Math)?/SCALE;require!(price>0&&price<=u64::MAX as u128,ErrorCode::Market);
   depth=depth.checked_add(qty).ok_or(ErrorCode::Math)?;
   if depth as u128*price/UNIT as u128>=min_quote as u128 {return Ok((price as u64,depth));}
  }
  i=predecessor(&d,i)?;
 }
 err!(ErrorCode::Market)
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
 let c=&ctx.accounts.config;require!(c.live&&!c.closed&&c.manifest_bound,ErrorCode::State);
 alone_in_transaction(&ctx.accounts.instructions.to_account_info())?;
 let market=ctx.accounts.manifest_market.to_account_info();
 check_market(&market,&ctx.accounts.manifest_program.to_account_info(),&c.mint,&c.quote_mint)?;
 let now=Clock::get()?;let sequence=market_sequence(&market)?;let p=&mut ctx.accounts.policy;
 // Arm (or re-arm after a gap): record which orders already rest; the first sample follows an hour later.
 if p.mark_time==0||now.unix_timestamp-p.mark_time>7200 {p.count=0;p.next=0;p.sequence_mark=sequence;p.mark_time=now.unix_timestamp;return Ok(());}
 require!(now.unix_timestamp-p.mark_time>=3600,ErrorCode::Time);
 let(price,depth)=bid_book(&market,&now,p.minimum_quote_depth,p.sequence_mark)?;
 require!((depth as u128*price as u128)/UNIT as u128>=p.minimum_quote_depth as u128,ErrorCode::Market);
 let i=p.next as usize;p.prices[i]=price;p.times[i]=now.unix_timestamp;p.next=((i+1)%24)as u8;p.count=(p.count+1).min(24);
 p.sequence_mark=sequence;p.mark_time=now.unix_timestamp;Ok(())
}
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
 require!(c.live&&!c.closed&&!c.paused&&c.manifest_bound&&e.settled&&e.number<720&&e.number==c.last_settled_epoch&&now.unix_timestamp>=boundary(c.start,e.number)&&now.unix_timestamp<boundary(c.start,e.number+1)&&amount>0&&(kind==2||kind==3),ErrorCode::Time);
 let left=if kind==2 {e.liquidity_budget.checked_sub(e.liquidity)}else {require!(now.unix_timestamp>=boundary(c.start,12),ErrorCode::Time);e.founder_budget.checked_sub(e.founder)}.ok_or(ErrorCode::Quota)?;
 require!(amount<=left&&amount<=c.stocks[kind as usize]&&a.source.amount>=c.stocks[kind as usize],ErrorCode::Quota);
 if kind==2 {let dest=Pubkey::find_program_address(&[b"auction-proceeds"],&crate::ID).0;require!(a.destination.key()==dest&&a.destination.owner==c.key(),ErrorCode::Market);}
 else {let dest=Pubkey::find_program_address(&[b"auction-proceeds"],&crate::ID).0;require!(a.destination.key()==dest&&a.destination.owner==c.key(),ErrorCode::Market);let allowance=(e.human_budget as u128)/4;require!(e.founder as u128+amount as u128<=allowance,ErrorCode::Quota);}
 let (bv,qv)=check_market(&a.manifest_market.to_account_info(),&a.manifest_program.to_account_info(),&c.mint,&c.quote_mint)?;
 require_keys_eq!(bv,a.base_vault.key(),ErrorCode::Market);require_keys_eq!(qv,a.quote_vault.key(),ErrorCode::Market);
 let reference=reference_price(&a.policy,now.unix_timestamp)?;let(price,depth)=bid_book(&a.manifest_market.to_account_info(),&now,a.policy.minimum_quote_depth,u64::MAX)?;
 require!(price as u128*100>=reference as u128*98&&price as u128*100<=reference as u128*102&&amount<=depth/50&&(price as u128*depth as u128)/UNIT as u128>=a.policy.minimum_quote_depth as u128,ErrorCode::Market);
 let floor=(reference as u128*98/100)as u64;require!(floor>0,ErrorCode::Market);
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
 let e=&mut a.epoch;
 if kind==2 {e.liquidity=e.liquidity.checked_add(filled).ok_or(ErrorCode::Math)?;e.quote_lp=e.quote_lp.checked_add(earned).ok_or(ErrorCode::Math)?;}
 else {e.founder=e.founder.checked_add(filled).ok_or(ErrorCode::Math)?;e.quote_founder=e.quote_founder.checked_add(earned).ok_or(ErrorCode::Math)?;}
 require!(e.human_budget as u128+e.staking as u128+e.liquidity as u128+e.founder as u128<=e.capacity as u128&&e.founder<=e.capacity/5&&4*e.founder as u128<=e.human_budget as u128,ErrorCode::Quota);
 a.config.stocks[kind as usize]=a.config.stocks[kind as usize].checked_sub(filled).ok_or(ErrorCode::Math)?;Ok(())
}


