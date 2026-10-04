// HELI v20 monthly market release draft. Unaudited; no public deployment.
use anchor_lang::prelude::*;
use anchor_spl::token::{self,Mint,Token,TokenAccount,MintTo,Transfer,Burn,SetAuthority};
use anchor_spl::token::spl_token::instruction::AuthorityType;
mod calendar; mod economics; mod auction; mod manifest_bridge; mod release; mod management; mod market_release;
use calendar::{DAY,boundary}; use economics::*;
use auction::*;
use manifest_bridge::*; use release::*;
use management::*; use market_release::*;
declare_id!("HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv");
/// Metaplex Token Metadata program (wallet-visible token name, symbol and logo).
pub const TOKEN_METADATA:Pubkey=anchor_lang::solana_program::pubkey!("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

#[program]
pub mod heli_core_v20 {
 use super::*;
 pub fn initialize(ctx:Context<Initialize>,start:i64)->Result<()> {
  let now=Clock::get()?.unix_timestamp;require!(start>=now+7*DAY&&start<=now+30*DAY,ErrorCode::Time);
  require!(ctx.accounts.quote_mint.decimals==6||ctx.accounts.quote_mint.decimals==9,ErrorCode::State);
  let c=&mut ctx.accounts.config;c.admin=ctx.accounts.admin.key();c.mint=ctx.accounts.mint.key();c.quote_mint=ctx.accounts.quote_mint.key();c.start=start;c.bump=ctx.bumps.config;
  c.stocks=[70_000_000*UNIT,0,0,15_000_000*UNIT];c.market_remaining=5_000_000*UNIT;c.sale_authorized=5_000_000*UNIT;Ok(())
 }
 pub fn create_market_inventory(ctx:Context<CreateMarketInventory>)->Result<()> {require!(!ctx.accounts.config.live&&!ctx.accounts.config.closed,ErrorCode::State);Ok(())}
 pub fn prepare_auction_proceeds(ctx:Context<PrepareAuctionProceeds>)->Result<()> {require!(!ctx.accounts.config.closed,ErrorCode::State);Ok(())}
 pub fn create_manifest_base(ctx:Context<CreateManifestBase>)->Result<()> {require!(!ctx.accounts.config.closed,ErrorCode::State);Ok(())}
 pub fn create_manifest_quote(ctx:Context<CreateManifestQuote>)->Result<()> {require!(!ctx.accounts.config.closed,ErrorCode::State);Ok(())}
 pub fn create_release_base(ctx:Context<CreateReleaseBase>,kind:u8)->Result<()> {require!(kind==3,ErrorCode::LiquidityDisabled);require!(!ctx.accounts.config.closed,ErrorCode::State);Ok(())}
 pub fn create_release_quote(ctx:Context<CreateReleaseQuote>,kind:u8)->Result<()> {require!(kind==3,ErrorCode::LiquidityDisabled);require!(!ctx.accounts.config.closed,ErrorCode::State);Ok(())}
 pub fn create_management_base(ctx:Context<CreateManagementBase>)->Result<()> {require!(!ctx.accounts.config.closed,ErrorCode::State);Ok(())}
 pub fn create_management_quote(ctx:Context<CreateManagementQuote>)->Result<()> {require!(!ctx.accounts.config.closed,ErrorCode::State);Ok(())}
 pub fn create_fee_base(ctx:Context<CreateFeeBase>)->Result<()> {require!(!ctx.accounts.config.closed,ErrorCode::State);Ok(())}
 pub fn create_fee_quote(ctx:Context<CreateFeeQuote>)->Result<()> {require!(!ctx.accounts.config.closed,ErrorCode::State);Ok(())}
 pub fn create_vault(ctx:Context<CreateVault>,kind:u8)->Result<()> {require!((kind==0||kind==3)&&!ctx.accounts.config.live&&!ctx.accounts.config.closed,ErrorCode::State);ctx.accounts.config.vault_mask|=1<<kind;Ok(())}
 // Owner decision (4 Oct 2026): the token's public name, symbol and logo URI are written once, before genesis,
 // while the config PDA is still the mint authority. The config PDA is also the update authority and the program
 // has no update instruction, so the metadata is fixed once the upgrade key is removed.
 pub fn create_token_metadata(ctx:Context<CreateTokenMetadata>,name:String,symbol:String,uri:String)->Result<()> {
  let a=&ctx.accounts;let c=&a.config;
  require!(!c.live&&!c.closed&&!c.metadata_created&&a.mint.supply==0,ErrorCode::State);
  let host=uri.strip_prefix("https://").unwrap_or("").split('/').next().unwrap_or("");
  require!(!name.is_empty()&&name.len()<=32&&!symbol.is_empty()&&symbol.len()<=10&&uri.len()<=200&&host.len()>=4&&host.contains('.')&&!host.starts_with('.')&&!host.ends_with('.')
   &&uri.bytes().all(|b|b>0x20&&b<0x7f),ErrorCode::TokenMetadata);
  let(expected,_)=Pubkey::find_program_address(&[b"metadata",TOKEN_METADATA.as_ref(),c.mint.as_ref()],&TOKEN_METADATA);
  require_keys_eq!(a.metadata.key(),expected,ErrorCode::TokenMetadata);
  // CreateMetadataAccountV3 (index 33): DataV2 {name, symbol, uri, no royalty, no creators/collection/uses},
  // is_mutable, no collection details.
  let mut data=vec![33u8];
  for s in [&name,&symbol,&uri] {data.extend_from_slice(&(s.len() as u32).to_le_bytes());data.extend_from_slice(s.as_bytes());}
  data.extend_from_slice(&[0,0,0,0,0,1,0]);
  use anchor_lang::solana_program::{instruction::{AccountMeta,Instruction},program::invoke_signed};
  let ix=Instruction{program_id:TOKEN_METADATA,data,accounts:vec![AccountMeta::new(a.metadata.key(),false),AccountMeta::new_readonly(a.mint.key(),false),
   AccountMeta::new_readonly(c.key(),true),AccountMeta::new(a.admin.key(),true),AccountMeta::new_readonly(c.key(),true),AccountMeta::new_readonly(a.system_program.key(),false)]};
  let bump=[c.bump];let seeds:&[&[u8]]=&[b"config",&bump];
  invoke_signed(&ix,&[a.metadata.to_account_info(),a.mint.to_account_info(),c.to_account_info(),a.admin.to_account_info(),a.system_program.to_account_info(),a.token_metadata_program.to_account_info()],&[seeds])?;
  ctx.accounts.config.metadata_created=true;Ok(())
 }
 pub fn genesis(ctx:Context<Genesis>)->Result<()> {
  // Vault 0 is the 70M monthly market release reserve, vault 3 the 15M management treasury.
  let c=&ctx.accounts.config;require!(!c.live&&!c.closed&&c.vault_mask==9&&ctx.accounts.mint.supply==0,ErrorCode::State);
  // The mint authority is revoked below; without metadata the token would stay nameless in wallets forever.
  require!(c.metadata_created,ErrorCode::TokenMetadata);
  let bump=[c.bump];let seeds:&[&[u8]]=&[b"config",&bump];let sign=&[seeds];
  // 100M are minted into the sale inventory, 70M and 15M move to the locked stocks and 10M are burned: 5M remain for sale.
  let (tp,inv)=(ctx.accounts.token_program.to_account_info(),ctx.accounts.market_inventory.to_account_info());
  token::mint_to(CpiContext::new_with_signer(tp.clone(),MintTo{mint:ctx.accounts.mint.to_account_info(),to:inv.clone(),authority:c.to_account_info()},sign),100_000_000*UNIT)?;
  outgoing(tp.clone(),inv.clone(),ctx.accounts.human.to_account_info(),c.to_account_info(),c.bump,70_000_000*UNIT)?;
  outgoing(tp.clone(),inv.clone(),ctx.accounts.founder.to_account_info(),c.to_account_info(),c.bump,15_000_000*UNIT)?;
  token::burn(CpiContext::new_with_signer(tp.clone(),Burn{mint:ctx.accounts.mint.to_account_info(),from:inv,authority:c.to_account_info()},sign),10_000_000*UNIT)?;
  token::set_authority(CpiContext::new_with_signer(tp,SetAuthority{current_authority:c.to_account_info(),account_or_mint:ctx.accounts.mint.to_account_info()},sign),AuthorityType::MintTokens,None)?;
  ctx.accounts.config.live=true;Ok(())
 }
 pub fn prepare_auction_quote(ctx:Context<PrepareAuctionQuote>)->Result<()> {require!(!ctx.accounts.config.closed,ErrorCode::State);Ok(())}
 pub fn open_auction(ctx:Context<OpenAuction>,floor_quote_atoms_per_heli:u64,tick_size:u64)->Result<()> {
  auction::open(ctx,floor_quote_atoms_per_heli,tick_size)
 }
 pub fn create_auction_bid(ctx:Context<CreateAuctionBid>)->Result<()> {auction::create_bid(ctx)}
 pub fn place_auction_bid(ctx:Context<PlaceAuctionBid>,quantity_heli:u64,tick:u16)->Result<()> {
  auction::place(ctx,quantity_heli,tick)
 }
 pub fn cancel_auction_bid(ctx:Context<PlaceAuctionBid>)->Result<()> {auction::cancel(ctx)}
 pub fn finalize_auction(ctx:Context<FinalizeAuction>)->Result<()> {auction::finalize(ctx)}
 pub fn claim_auction_bid(ctx:Context<ClaimAuctionBid>)->Result<()> {auction::claim(ctx)}
 pub fn bind_manifest_market(ctx:Context<BindManifestMarket>,market_rent_lamports:u64)->Result<()> {manifest_bridge::bind(ctx,market_rent_lamports)}
 pub fn place_project_ask(ctx:Context<PlaceProjectAsk>,amount:u64,price_mantissa:u32,price_exponent:i8)->Result<()> {manifest_bridge::place_ask(ctx,amount,price_mantissa,price_exponent)}
 pub fn cancel_project_ask(ctx:Context<CancelProjectAsk>,sequence:u64)->Result<()> {manifest_bridge::cancel_ask(ctx,sequence)}
 pub fn withdraw_project_heli(ctx:Context<WithdrawProjectHeli>,amount:u64)->Result<()> {manifest_bridge::withdraw_heli(ctx,amount)}
 pub fn withdraw_project_quote(ctx:Context<WithdrawProjectQuote>,amount:u64)->Result<()> {manifest_bridge::withdraw_quote(ctx,amount)}
 pub fn initialize_release_policy(ctx:Context<InitializeReleasePolicy>,minimum_quote_depth:u64)->Result<()> {release::initialize(ctx,minimum_quote_depth)}
 pub fn initialize_release_seat(ctx:Context<InitializeReleaseSeat>,kind:u8,rent_lamports:u64)->Result<()> {release::initialize_seat(ctx,kind,rent_lamports)}
 pub fn observe_release_market(ctx:Context<ObserveReleaseMarket>)->Result<()> {release::observe(ctx)}
 pub fn execute_release_sale(ctx:Context<ExecuteReleaseSale>,kind:u8,amount:u64)->Result<()> {release::execute(ctx,kind,amount)}
 pub fn initialize_management(ctx:Context<InitializeManagement>,rent_lamports:u64)->Result<()> {management::initialize(ctx,rent_lamports)}
 pub fn management_fund_quote(ctx:Context<ManagementAction>,amount:u64)->Result<()> {management::fund_quote(ctx,amount)}
 pub fn management_release(ctx:Context<ManagementAction>,amount:u64)->Result<()> {management::release(ctx,amount)}
 pub fn management_order(ctx:Context<ManagementAction>,amount:u64,base_deposit:u64,price_mantissa:u32,price_exponent:i8,is_bid:bool)->Result<()> {management::order(ctx,amount,base_deposit,price_mantissa,price_exponent,is_bid)}
 pub fn management_cancel(ctx:Context<ManagementAction>,sequence:u64)->Result<()> {management::cancel(ctx,sequence)}
 pub fn management_withdraw(ctx:Context<ManagementAction>,amount:u64,is_base:bool)->Result<()> {management::withdraw(ctx,amount,is_base)}
 // Owner decision (4 Oct 2026): `project_floor` is the untouchable part of the project quote reserve, chosen once
 // after the opening auction from the amount actually raised (at least 120 quote units: one year of fixed cost). Reserve-funded bids and
 // reserve-paid expenses may not take the reserve below it (expenses only within the 10-unit technical floor).
 pub fn initialize_fee_vaults(ctx:Context<InitializeFeeVaults>,monthly_cap:u64,reserve:u64,project_floor:u64)->Result<()> {
  require!(ctx.accounts.config.live&&!ctx.accounts.config.closed&&monthly_cap>0,ErrorCode::State);
  // At least one year of the fixed technical floor (12 x 10 quote units), so the system can keep running.
  require!(project_floor>=120*10u64.pow(ctx.accounts.quote_mint.decimals as u32),ErrorCode::Quota);
  let o=&mut ctx.accounts.operations;o.monthly_cap=monthly_cap;o.reserve=reserve;
  ctx.accounts.config.project_floor=project_floor;Ok(())
 }
 pub fn contribute_quote(ctx:Context<ContributeQuote>,amount:u64)->Result<()> {
  // Owner decision (V22, finding 3 option B): treasury funding stays open after the 60-year close; no new supply.
  require!((ctx.accounts.config.live||ctx.accounts.config.closed)&&amount>0,ErrorCode::State);
  let o=&mut ctx.accounts.operations;
  let next_earned=o.earned_total.checked_add(amount).ok_or(ErrorCode::Math)?;
  let next_donated=o.donated_total.checked_add(amount).ok_or(ErrorCode::Math)?;
  incoming(ctx.accounts.token_program.to_account_info(),ctx.accounts.contributor_quote.to_account_info(),
   ctx.accounts.fee_quote.to_account_info(),ctx.accounts.contributor.to_account_info(),amount)?;
  o.earned_total=next_earned;o.donated_total=next_donated;
  emit!(QuoteContribution{contributor:ctx.accounts.contributor.key(),amount});Ok(())
 }
 pub fn propose_expense(ctx:Context<ProposeExpense>,nonce:u64,amount:u64,purpose:[u8;32])->Result<()> {
  let o=&mut ctx.accounts.operations;
  // monthly_cap (set once at setup) is now a per-proposal ceiling; spending limits apply at payment.
  require!(ctx.accounts.proposer.key()==ctx.accounts.config.admin&&nonce==o.next_nonce&&amount>0&&amount<=o.monthly_cap&&purpose!=[0;32],ErrorCode::Quota);
  require!(!treasury_owned(&ctx.accounts.destination.owner,&ctx.accounts.config.key(),ctx.program_id),ErrorCode::ExpenseDestination);
  let now=Clock::get()?.unix_timestamp;
  let p=&mut ctx.accounts.expense;p.destination=ctx.accounts.destination.key();p.proposer=ctx.accounts.proposer.key();p.purpose=purpose;p.amount=amount;
  p.ready_at=now.checked_add(7*DAY).ok_or(ErrorCode::Math)?;p.nonce=nonce;
  o.next_nonce=o.next_nonce.checked_add(1).ok_or(ErrorCode::Math)?;Ok(())
 }
 pub fn execute_expense(mut ctx:Context<ExecuteExpense>)->Result<()> {
  let a=&mut ctx.accounts;let now=Clock::get()?.unix_timestamp;
  // A pause halts treasury outflows; a cancelled proposal can never be executed.
  require!(!a.config.paused,ErrorCode::State);
  require!(!a.expense.paid&&!a.expense.cancelled&&now>=a.expense.ready_at,ErrorCode::Time);
  // Checked again at payment: a proposal written before this rule existed must not pay the treasury itself.
  require!(a.destination.key()!=a.fee_quote.key()&&!treasury_owned(&a.destination.owner,&a.config.key(),ctx.program_id),ErrorCode::ExpenseDestination);
  // Owner decision (V22, expenses): the expense treasury (donations) pays first, keeping its own reserve;
  // the rest is drawn from the project reserve at payment time. Sale revenue is 100% spendable; beyond it,
  // reserve spending over any rolling 30 days is limited to a fixed technical floor (10 quote units) plus
  // 25%/12 of the reserve excluding unspent revenue (25% a year). The reserve keeps the project floor
  // except for spending within the fixed floor, so the keeper can keep running.
  let amount=a.expense.amount;let o=&mut a.operations;
  let from_fee=amount.min(a.fee_quote.amount.saturating_sub(o.reserve));let r=amount-from_fee;
  if r>0 {
   let unit=10u64.pow(a.quote_mint.decimals as u32);let fixed=10*unit;let keep=a.config.project_floor;
   let balance=a.sale_proceeds.amount;require!(balance>=r,ErrorCode::Collateral);
   let revenue_left=a.config.revenue_total.saturating_sub(o.revenue_spent);let from_revenue=r.min(revenue_left);let rest=r-from_revenue;let mut below_ok=false;
   if rest>0 {
    let day=now.div_euclid(DAY);
    // 31 daily slots: today plus the 30 days before, so the window always covers at least 30 full days.
    if day.saturating_sub(o.out_day)>=31 {o.out_days=[0;31];}
    else {let mut d=o.out_day+1;while d<=day {o.out_days[d.rem_euclid(31) as usize]=0;d+=1;}}
    o.out_day=o.out_day.max(day);
    let window=o.out_days.iter().try_fold(0u64,|s,x|s.checked_add(*x)).ok_or(ErrorCode::Math)?.checked_add(rest).ok_or(ErrorCode::Math)?;
    let share=(balance.saturating_sub(revenue_left) as u128*25/1200) as u64;
    require!(window<=fixed.checked_add(share).ok_or(ErrorCode::Math)?,ErrorCode::Quota);
    below_ok=from_revenue==0&&window<=fixed;
    let slot=o.out_day.rem_euclid(31) as usize;o.out_days[slot]=o.out_days[slot].checked_add(rest).ok_or(ErrorCode::Math)?;
   }
   // The project floor applies to every reserve payment, revenue included; only a payment made purely
   // within the fixed technical floor may go below it (review A3).
   require!(balance-r>=keep||below_ok,ErrorCode::Collateral);
   o.revenue_spent=o.revenue_spent.checked_add(from_revenue).ok_or(ErrorCode::Math)?;
   o.earned_total=o.earned_total.checked_add(r).ok_or(ErrorCode::Math)?;o.sale_allocated_total=o.sale_allocated_total.checked_add(r).ok_or(ErrorCode::Math)?;
   outgoing(a.token_program.to_account_info(),a.sale_proceeds.to_account_info(),a.destination.to_account_info(),a.config.to_account_info(),a.config.bump,r)?;
  }
  outgoing(a.token_program.to_account_info(),a.fee_quote.to_account_info(),a.destination.to_account_info(),a.config.to_account_info(),a.config.bump,from_fee)?;
  a.operations.spent_total=a.operations.spent_total.checked_add(amount).ok_or(ErrorCode::Math)?;
  a.expense.paid=true;
  emit!(ExpenseExecuted{nonce:a.expense.nonce,destination:a.expense.destination,amount,purpose:a.expense.purpose});
  Ok(())
 }
 // The seven-day delay is a review window: the administrator can withdraw an unpaid proposal before it executes.
 pub fn cancel_expense(ctx:Context<CancelExpense>)->Result<()> {
  let e=&mut ctx.accounts.expense;require!(!e.paid&&!e.cancelled,ErrorCode::State);e.cancelled=true;
  emit!(ExpenseCancelled{nonce:e.nonce,destination:e.destination,amount:e.amount});Ok(())
 }
 // Key governance (review C3, owner decision B): routine two-step admin handover, a cold recovery key that
 // can replace a lost admin after a 7-day window the current admin can veto.
 pub fn initialize_governance(ctx:Context<InitializeGovernance>,recovery:Pubkey)->Result<()> {
  require!(recovery!=Pubkey::default()&&recovery!=ctx.accounts.config.admin,ErrorCode::Unauthorized);
  let g=&mut ctx.accounts.governance;g.recovery=recovery;g.bump=ctx.bumps.governance;Ok(())
 }
 pub fn propose_admin(mut ctx:Context<GovernanceAction>,new_admin:Pubkey)->Result<()> {
  let a=&mut ctx.accounts;let signer=a.signer.key();let now=Clock::get()?.unix_timestamp;
  require!(new_admin!=Pubkey::default()&&new_admin!=a.governance.recovery&&new_admin!=a.config.admin,ErrorCode::Unauthorized);
  let by_recovery=if signer==a.config.admin {false}else{require!(signer==a.governance.recovery,ErrorCode::Unauthorized);true};
  let g=&mut a.governance;g.pending_admin=new_admin;g.by_recovery=by_recovery;g.ready_at=if by_recovery {now.checked_add(GOVERNANCE_DELAY).ok_or(ErrorCode::Math)?}else{now};
  emit!(AdminProposed{new_admin,by_recovery,ready_at:g.ready_at});Ok(())
 }
 pub fn accept_admin(mut ctx:Context<GovernanceAction>)->Result<()> {
  let a=&mut ctx.accounts;let g=&mut a.governance;
  require!(g.pending_admin!=Pubkey::default()&&a.signer.key()==g.pending_admin&&g.pending_admin!=g.recovery,ErrorCode::Unauthorized);
  require!(Clock::get()?.unix_timestamp>=g.ready_at,ErrorCode::Time);
  let old=a.config.admin;a.config.admin=g.pending_admin;g.pending_admin=Pubkey::default();g.ready_at=0;g.by_recovery=false;
  emit!(AdminChanged{old,new:a.config.admin});Ok(())
 }
 pub fn cancel_admin_proposal(mut ctx:Context<GovernanceAction>)->Result<()> {
  let a=&mut ctx.accounts;let signer=a.signer.key();
  require!(a.governance.pending_admin!=Pubkey::default()&&(signer==a.config.admin||signer==a.governance.recovery),ErrorCode::Unauthorized);
  let g=&mut a.governance;g.pending_admin=Pubkey::default();g.ready_at=0;g.by_recovery=false;Ok(())
 }
 pub fn propose_recovery(mut ctx:Context<GovernanceAction>,new_recovery:Pubkey)->Result<()> {
  let a=&mut ctx.accounts;let signer=a.signer.key();let now=Clock::get()?.unix_timestamp;
  require!(new_recovery!=Pubkey::default()&&new_recovery!=a.config.admin&&new_recovery!=a.governance.recovery,ErrorCode::Unauthorized);
  // The recovery key may move itself at once; the admin may replace a lost recovery key only after the delay.
  let ready_at=if signer==a.governance.recovery {now}else{require!(signer==a.config.admin,ErrorCode::Unauthorized);now.checked_add(GOVERNANCE_DELAY).ok_or(ErrorCode::Math)?};
  let g=&mut a.governance;g.pending_recovery=new_recovery;g.recovery_ready_at=ready_at;Ok(())
 }
 pub fn accept_recovery(mut ctx:Context<GovernanceAction>)->Result<()> {
  let a=&mut ctx.accounts;let g=&mut a.governance;
  require!(g.pending_recovery!=Pubkey::default()&&a.signer.key()==g.pending_recovery&&g.pending_recovery!=a.config.admin,ErrorCode::Unauthorized);
  require!(Clock::get()?.unix_timestamp>=g.recovery_ready_at,ErrorCode::Time);
  let old=g.recovery;g.recovery=g.pending_recovery;g.pending_recovery=Pubkey::default();g.recovery_ready_at=0;
  emit!(RecoveryChanged{old,new:g.recovery});Ok(())
 }
 pub fn cancel_recovery_proposal(mut ctx:Context<GovernanceAction>)->Result<()> {
  let a=&mut ctx.accounts;
  require!(a.governance.pending_recovery!=Pubkey::default()&&a.signer.key()==a.governance.recovery,ErrorCode::Unauthorized);
  let g=&mut a.governance;g.pending_recovery=Pubkey::default();g.recovery_ready_at=0;Ok(())
 }
 // Defensive power of the cold key: stop a pending expense written by whoever holds the admin key.
 pub fn recovery_cancel_expense(ctx:Context<RecoveryCancelExpense>)->Result<()> {
  require_keys_eq!(ctx.accounts.recovery.key(),ctx.accounts.governance.recovery,ErrorCode::Unauthorized);
  let e=&mut ctx.accounts.expense;require!(!e.paid&&!e.cancelled,ErrorCode::State);e.cancelled=true;
  emit!(ExpenseCancelled{nonce:e.nonce,destination:e.destination,amount:e.amount});Ok(())
 }
 pub fn open_epoch(ctx:Context<OpenMarketEpoch>,number:u16)->Result<()> {market_release::open(ctx,number)}
 pub fn pause(ctx:Context<Admin>,paused:bool)->Result<()> {ctx.accounts.config.paused=paused;Ok(())}
 pub fn settle(ctx:Context<SettleMarket>)->Result<()> {market_release::settle(ctx)}
 pub fn close_constitution(ctx:Context<Close>)->Result<()> {
  if ctx.accounts.config.closed{return Ok(());}require!(ctx.accounts.config.live&&Clock::get()?.unix_timestamp>=boundary(ctx.accounts.config.start,720),ErrorCode::Time);
  let bump=[ctx.accounts.config.bump];let seeds:&[&[u8]]=&[b"config",&bump];
  require!(ctx.accounts.config.last_settled_epoch==720,ErrorCode::State);
  for(i,v)in[(0usize,&ctx.accounts.human),(3,&ctx.accounts.founder)]{let a=ctx.accounts.config.stocks[i];if a>0 {token::burn(CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(),Burn{mint:ctx.accounts.mint.to_account_info(),from:v.to_account_info(),authority:ctx.accounts.config.to_account_info()},&[seeds]),a)?;}}
  ctx.accounts.config.stocks=[0;4];ctx.accounts.config.closed=true;ctx.accounts.config.live=false;Ok(())
 }
}

fn incoming<'a>(program:AccountInfo<'a>,from:AccountInfo<'a>,to:AccountInfo<'a>,owner:AccountInfo<'a>,amount:u64)->Result<()> {if amount>0 {token::transfer(CpiContext::new(program,Transfer{from,to,authority:owner}),amount)?;}Ok(())}
// Quote paid to a token account controlled by the program would stay in the treasury while
// spent_total grows (fee-quote), or could be counted as revenue again (auction proceeds).
fn treasury_owned(owner:&Pubkey,config:&Pubkey,program:&Pubkey)->bool {
 if owner==config {return true;}
 let seeds:[&[&[u8]];3]=[&[b"manifest-trader"],&[b"management-trader"],&[b"release-trader",&[3]]];
 seeds.iter().any(|s|Pubkey::find_program_address(s,program).0==*owner)
}
fn outgoing<'a>(program:AccountInfo<'a>,from:AccountInfo<'a>,to:AccountInfo<'a>,authority:AccountInfo<'a>,bump:u8,amount:u64)->Result<()> {if amount>0 {let b=[bump];let seeds:&[&[u8]]=&[b"config",&b];token::transfer(CpiContext::new_with_signer(program,Transfer{from,to,authority},&[seeds]),amount)?;}Ok(())}
#[account] pub struct Config {pub admin:Pubkey,pub mint:Pubkey,pub quote_mint:Pubkey,pub start:i64,pub stocks:[u64;4],pub bump:u8,pub vault_mask:u8,pub live:bool,pub closed:bool,pub paused:bool,pub last_settled_epoch:u16,pub market_remaining:u64,pub sale_authorized:u64,pub sale_total_sold:u64,pub manifest_market:Pubkey,pub manifest_trader_bump:u8,pub manifest_bound:bool,pub manifest_base_deposited:u64,pub manifest_base_returned:u64,pub manifest_quote_withdrawn:u64,pub revenue_total:u64,pub metadata_created:bool,pub project_floor:u64,pub mgmt_bid_max:u64,pub mgmt_bid_until:i64,pub ask_min:u64,pub ask_until:i64}
#[account] pub struct Operations {pub monthly_cap:u64,pub reserve:u64,pub earned_total:u64,pub spent_total:u64,pub next_nonce:u64,pub donated_total:u64,pub sale_allocated_total:u64,pub revenue_spent:u64,pub out_day:i64,pub out_days:[u64;31]}
#[account] pub struct Expense {pub destination:Pubkey,pub proposer:Pubkey,pub purpose:[u8;32],pub amount:u64,pub ready_at:i64,pub nonce:u64,pub paid:bool,pub cancelled:bool}
#[event] pub struct ExpenseExecuted {pub nonce:u64,pub destination:Pubkey,pub amount:u64,pub purpose:[u8;32]}
#[event] pub struct ExpenseCancelled {pub nonce:u64,pub destination:Pubkey,pub amount:u64}
pub const GOVERNANCE_DELAY:i64=7*DAY;
#[account] pub struct Governance {pub recovery:Pubkey,pub pending_admin:Pubkey,pub ready_at:i64,pub by_recovery:bool,pub pending_recovery:Pubkey,pub recovery_ready_at:i64,pub bump:u8}
#[event] pub struct AdminProposed {pub new_admin:Pubkey,pub by_recovery:bool,pub ready_at:i64}
#[event] pub struct AdminChanged {pub old:Pubkey,pub new:Pubkey}
#[event] pub struct RecoveryChanged {pub old:Pubkey,pub new:Pubkey}
#[event] pub struct QuoteContribution {pub contributor:Pubkey,pub amount:u64}
#[account] pub struct Epoch {pub number:u16,pub capacity:u64,pub human_budget:u64,pub founder:u64,pub quote_founder:u64,pub settled:bool,pub bump:u8,pub founder_budget:u64}
#[error_code] pub enum ErrorCode {#[msg("Invalid state")]State,#[msg("Invalid calendar window")]Time,#[msg("Quota exceeded")]Quota,#[msg("Arithmetic error")]Math,#[msg("Collateral deficit")]Collateral,#[msg("Market guard rejected")]Market,#[msg("Liquidity inventory is disabled")]LiquidityDisabled,#[msg("Only the program upgrade authority can initialize")]InitializerNotAuthorized,#[msg("Order price outside the permitted band")]PriceOutsideBand,#[msg("Signer is not authorized for this governance action")]Unauthorized,#[msg("Expense destination must be outside the program treasury")]ExpenseDestination,#[msg("Invalid or missing token metadata")]TokenMetadata,#[msg("Project orders may not trade with each other")]SelfTrade}

// Account validation is kept in one source file for reproducible Playground builds.
include!("accounts.rs");

