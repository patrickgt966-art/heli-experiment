#[derive(Accounts)]
pub struct Initialize<'info> {
 // Only the deployer (program upgrade authority) may claim the singleton config; checked before any init.
 #[account(constraint=program.programdata_address()?==Some(program_data.key()) @ ErrorCode::InitializerNotAuthorized)]
 pub program:Program<'info,crate::program::HeliCoreV20>,
 #[account(constraint=program_data.upgrade_authority_address==Some(admin.key()) @ ErrorCode::InitializerNotAuthorized)]
 pub program_data:Box<Account<'info,ProgramData>>,
 #[account(init,payer=admin,space=8+290,seeds=[b"config".as_ref()],bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(init,payer=admin,mint::decimals=6,mint::authority=config,seeds=[b"mint".as_ref()],bump)]
 pub mint:Box<Account<'info,Mint>>,
 pub quote_mint:Box<Account<'info,Mint>>,
 #[account(mut)]
 pub admin:Signer<'info>,
 pub token_program:Program<'info,Token>,
 pub system_program:Program<'info,System>,
 pub rent:Sysvar<'info,Rent>,
}

#[derive(Accounts)]
pub struct CreateMarketInventory<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(init,payer=admin,token::mint=mint,token::authority=config,seeds=[b"market-inventory".as_ref()],bump)]
 pub market_inventory:Box<Account<'info,TokenAccount>>,
 #[account(mut)]
 pub admin:Signer<'info>,
 pub token_program:Program<'info,Token>,
 pub system_program:Program<'info,System>,
 pub rent:Sysvar<'info,Rent>,
}

// Token accounts for later setup steps, one Anchor `init` each (see CreateLaunchClaims).
#[derive(Accounts)]
pub struct PrepareAuctionProceeds<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.quote_mint)]
 pub quote_mint:Box<Account<'info,Mint>>,
 #[account(init,payer=admin,token::mint=quote_mint,token::authority=config,seeds=[b"auction-proceeds"],bump)]
 pub sale_proceeds:Box<Account<'info,TokenAccount>>,
 #[account(mut)]
 pub admin:Signer<'info>,
 pub token_program:Program<'info,Token>,
 pub system_program:Program<'info,System>,
 pub rent:Sysvar<'info,Rent>,
}

#[derive(Accounts)]
pub struct CreateManifestBase<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 /// CHECK: signer PDA only used as the token account authority; created by its own setup instruction.
 #[account(seeds=[b"manifest-trader"],bump)]
 pub trader:UncheckedAccount<'info>,
 #[account(init,payer=admin,token::mint=mint,token::authority=trader,seeds=[b"manifest-heli"],bump)]
 pub manifest_base:Box<Account<'info,TokenAccount>>,
 #[account(mut)]
 pub admin:Signer<'info>,
 pub token_program:Program<'info,Token>,
 pub system_program:Program<'info,System>,
 pub rent:Sysvar<'info,Rent>,
}

#[derive(Accounts)]
pub struct CreateManifestQuote<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.quote_mint)]
 pub quote_mint:Box<Account<'info,Mint>>,
 /// CHECK: signer PDA only used as the token account authority; created by its own setup instruction.
 #[account(seeds=[b"manifest-trader"],bump)]
 pub trader:UncheckedAccount<'info>,
 #[account(init,payer=admin,token::mint=quote_mint,token::authority=trader,seeds=[b"manifest-quote"],bump)]
 pub manifest_quote:Box<Account<'info,TokenAccount>>,
 #[account(mut)]
 pub admin:Signer<'info>,
 pub token_program:Program<'info,Token>,
 pub system_program:Program<'info,System>,
 pub rent:Sysvar<'info,Rent>,
}

#[derive(Accounts)]
#[instruction(kind:u8)]
pub struct CreateReleaseBase<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 /// CHECK: signer PDA only used as the token account authority; created by its own setup instruction.
 #[account(seeds=[b"release-trader".as_ref(),&[kind]],bump)]
 pub trader:UncheckedAccount<'info>,
 #[account(init,payer=admin,token::mint=mint,token::authority=trader,seeds=[b"release-base".as_ref(),&[kind]],bump)]
 pub base:Box<Account<'info,TokenAccount>>,
 #[account(mut)]
 pub admin:Signer<'info>,
 pub token_program:Program<'info,Token>,
 pub system_program:Program<'info,System>,
 pub rent:Sysvar<'info,Rent>,
}

#[derive(Accounts)]
#[instruction(kind:u8)]
pub struct CreateReleaseQuote<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.quote_mint)]
 pub quote_mint:Box<Account<'info,Mint>>,
 /// CHECK: signer PDA only used as the token account authority; created by its own setup instruction.
 #[account(seeds=[b"release-trader".as_ref(),&[kind]],bump)]
 pub trader:UncheckedAccount<'info>,
 #[account(init,payer=admin,token::mint=quote_mint,token::authority=trader,seeds=[b"release-quote".as_ref(),&[kind]],bump)]
 pub quote:Box<Account<'info,TokenAccount>>,
 #[account(mut)]
 pub admin:Signer<'info>,
 pub token_program:Program<'info,Token>,
 pub system_program:Program<'info,System>,
 pub rent:Sysvar<'info,Rent>,
}

#[derive(Accounts)]
pub struct CreateManagementBase<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 /// CHECK: signer PDA only used as the token account authority; created by its own setup instruction.
 #[account(seeds=[b"management-trader"],bump)]
 pub management_trader:UncheckedAccount<'info>,
 #[account(init,payer=admin,token::mint=mint,token::authority=management_trader,seeds=[b"management-base"],bump)]
 pub management_base:Box<Account<'info,TokenAccount>>,
 #[account(mut)]
 pub admin:Signer<'info>,
 pub token_program:Program<'info,Token>,
 pub system_program:Program<'info,System>,
 pub rent:Sysvar<'info,Rent>,
}

#[derive(Accounts)]
pub struct CreateManagementQuote<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.quote_mint)]
 pub quote_mint:Box<Account<'info,Mint>>,
 /// CHECK: signer PDA only used as the token account authority; created by its own setup instruction.
 #[account(seeds=[b"management-trader"],bump)]
 pub management_trader:UncheckedAccount<'info>,
 #[account(init,payer=admin,token::mint=quote_mint,token::authority=management_trader,seeds=[b"management-quote"],bump)]
 pub management_quote:Box<Account<'info,TokenAccount>>,
 #[account(mut)]
 pub admin:Signer<'info>,
 pub token_program:Program<'info,Token>,
 pub system_program:Program<'info,System>,
 pub rent:Sysvar<'info,Rent>,
}

#[derive(Accounts)]
pub struct CreateFeeBase<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(init,payer=admin,token::mint=mint,token::authority=config,seeds=[b"fee-base"],bump)]
 pub fee_base:Box<Account<'info,TokenAccount>>,
 #[account(mut)]
 pub admin:Signer<'info>,
 pub token_program:Program<'info,Token>,
 pub system_program:Program<'info,System>,
 pub rent:Sysvar<'info,Rent>,
}

#[derive(Accounts)]
pub struct CreateFeeQuote<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.quote_mint)]
 pub quote_mint:Box<Account<'info,Mint>>,
 #[account(init,payer=admin,token::mint=quote_mint,token::authority=config,seeds=[b"fee-quote"],bump)]
 pub fee_quote:Box<Account<'info,TokenAccount>>,
 #[account(mut)]
 pub admin:Signer<'info>,
 pub token_program:Program<'info,Token>,
 pub system_program:Program<'info,System>,
 pub rent:Sysvar<'info,Rent>,
}
#[derive(Accounts)]
#[instruction(kind:u8)]
pub struct CreateVault<'info> {
 #[account(mut,seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(init,payer=admin,token::mint=mint,token::authority=config,seeds=[b"vault".as_ref(),&[kind]],bump)]
 pub vault:Box<Account<'info,TokenAccount>>,
 #[account(mut)]
 pub admin:Signer<'info>,
 pub token_program:Program<'info,Token>,
 pub system_program:Program<'info,System>,
 pub rent:Sysvar<'info,Rent>,
}

#[derive(Accounts)]
pub struct CreateTokenMetadata<'info> {
 #[account(mut,seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 /// CHECK: Metaplex metadata PDA of the mint, checked in the instruction and created by the CPI.
 #[account(mut)]
 pub metadata:UncheckedAccount<'info>,
 /// CHECK: pinned Metaplex Token Metadata program.
 #[account(address=TOKEN_METADATA)]
 pub token_metadata_program:UncheckedAccount<'info>,
 #[account(mut)]
 pub admin:Signer<'info>,
 pub system_program:Program<'info,System>,
}
#[derive(Accounts)]
pub struct Genesis<'info> {
 #[account(mut,seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(mut,address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 pub admin:Signer<'info>,
 #[account(mut,seeds=[b"market-inventory".as_ref()],bump,token::mint=mint,token::authority=config)]
 pub market_inventory:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"vault".as_ref(),&[0]],bump,token::mint=mint,token::authority=config)]
 pub human:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"vault".as_ref(),&[3]],bump,token::mint=mint,token::authority=config)]
 pub founder:Box<Account<'info,TokenAccount>>,
 pub token_program:Program<'info,Token>,
 // Review F4: the release policy can be created only before genesis, so genesis requires it to exist.
 #[account(seeds=[b"release-policy".as_ref()],bump)]
 pub policy:Box<Account<'info,crate::release::ReleasePolicy>>,
}

#[derive(Accounts)]
pub struct Close<'info> {
 #[account(mut,seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(mut,address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"vault".as_ref(),&[0]],bump,token::mint=mint,token::authority=config)]
 pub human:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"vault".as_ref(),&[3]],bump,token::mint=mint,token::authority=config)]
 pub founder:Box<Account<'info,TokenAccount>>,
 pub token_program:Program<'info,Token>,
}

#[derive(Accounts)]
pub struct Admin<'info> {
 #[account(mut,seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 pub admin:Signer<'info>,
}

#[derive(Accounts)]
#[instruction(monthly_cap:u64,reserve:u64)]
pub struct InitializeFeeVaults<'info> {
 #[account(mut,seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(address=config.quote_mint)]
 pub quote_mint:Box<Account<'info,Mint>>,
 #[account(init,payer=payer,space=8+320,seeds=[b"operations".as_ref()],bump)]
 pub operations:Box<Account<'info,Operations>>,
 pub admin:Signer<'info>,
 #[account(mut)]
 pub payer:Signer<'info>,
 pub token_program:Program<'info,Token>,
 pub system_program:Program<'info,System>,
 pub rent:Sysvar<'info,Rent>,
 // Review F5: the project floor is chosen once, after the opening auction has finished.
 #[account(seeds=[b"opening-auction".as_ref()],bump,constraint=auction.finalized@ErrorCode::State)]
 pub auction:Box<Account<'info,OpeningAuction>>,
}

#[derive(Accounts)]
pub struct ContributeQuote<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(mut,seeds=[b"operations".as_ref()],bump)]
 pub operations:Box<Account<'info,Operations>>,
 #[account(address=config.quote_mint)]
 pub quote_mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"fee-quote".as_ref()],bump,token::mint=quote_mint,token::authority=config)]
 pub fee_quote:Box<Account<'info,TokenAccount>>,
 #[account(mut,token::mint=quote_mint,token::authority=contributor)]
 pub contributor_quote:Box<Account<'info,TokenAccount>>,
 pub contributor:Signer<'info>,
 pub token_program:Program<'info,Token>,
}

#[derive(Accounts)]
#[instruction(nonce:u64,amount:u64,purpose:[u8;32])]
pub struct ProposeExpense<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(mut,seeds=[b"operations".as_ref()],bump)]
 pub operations:Box<Account<'info,Operations>>,
 #[account(init,payer=proposer,space=8+122,seeds=[b"expense".as_ref(),&nonce.to_le_bytes()],bump)]
 pub expense:Box<Account<'info,Expense>>,
 #[account(address=config.quote_mint)]
 pub quote_mint:Box<Account<'info,Mint>>,
 #[account(token::mint=quote_mint)]
 pub destination:Box<Account<'info,TokenAccount>>,
 #[account(mut)]
 pub proposer:Signer<'info>,
 pub system_program:Program<'info,System>,
}

#[derive(Accounts)]
pub struct ExecuteExpense<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(mut,seeds=[b"operations".as_ref()],bump)]
 pub operations:Box<Account<'info,Operations>>,
 #[account(mut,seeds=[b"expense".as_ref(),&expense.nonce.to_le_bytes()],bump)]
 pub expense:Box<Account<'info,Expense>>,
 #[account(address=config.quote_mint)]
 pub quote_mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"fee-quote".as_ref()],bump,token::mint=quote_mint,token::authority=config)]
 pub fee_quote:Box<Account<'info,TokenAccount>>,
 #[account(mut,address=expense.destination,token::mint=quote_mint)]
 pub destination:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"auction-proceeds".as_ref()],bump,token::mint=quote_mint,token::authority=config)]
 pub sale_proceeds:Box<Account<'info,TokenAccount>>,
 pub token_program:Program<'info,Token>,
}

#[derive(Accounts)]
pub struct InitializeGovernance<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(init,payer=admin,space=8+114,seeds=[b"governance".as_ref()],bump)]
 pub governance:Box<Account<'info,Governance>>,
 #[account(mut)]
 pub admin:Signer<'info>,
 pub system_program:Program<'info,System>,
}

// Authorization (admin, recovery key or proposed key) is checked in each handler.
#[derive(Accounts)]
pub struct GovernanceAction<'info> {
 #[account(mut,seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(mut,seeds=[b"governance".as_ref()],bump=governance.bump)]
 pub governance:Box<Account<'info,Governance>>,
 pub signer:Signer<'info>,
}

#[derive(Accounts)]
pub struct RecoveryCancelExpense<'info> {
 #[account(seeds=[b"governance".as_ref()],bump=governance.bump)]
 pub governance:Box<Account<'info,Governance>>,
 #[account(mut,seeds=[b"expense".as_ref(),&expense.nonce.to_le_bytes()],bump)]
 pub expense:Box<Account<'info,Expense>>,
 pub recovery:Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelExpense<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(mut,seeds=[b"expense".as_ref(),&expense.nonce.to_le_bytes()],bump)]
 pub expense:Box<Account<'info,Expense>>,
 pub admin:Signer<'info>,
}

