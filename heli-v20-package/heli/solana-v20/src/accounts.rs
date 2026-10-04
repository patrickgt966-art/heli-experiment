#[derive(Accounts)]
pub struct Initialize<'info> {
 #[account(init,payer=admin,space=8+640,seeds=[b"config".as_ref()],bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(init,payer=admin,mint::decimals=6,mint::authority=config,seeds=[b"mint".as_ref()],bump)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(init,payer=admin,token::mint=mint,token::authority=config,seeds=[b"launch-claims".as_ref()],bump)]
 pub launch:Box<Account<'info,TokenAccount>>,
 #[account(init,payer=admin,token::mint=mint,token::authority=config,seeds=[b"market-inventory".as_ref()],bump)]
 pub market_inventory:Box<Account<'info,TokenAccount>>,
 pub quote_mint:Box<Account<'info,Mint>>,
 #[account(zero)]
 pub history:AccountLoader<'info,GlobalBook>,
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
pub struct Genesis<'info> {
 #[account(mut,seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(mut,address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(seeds=[b"identity-policy"],bump)] pub identity_policy:Box<Account<'info,IdentityPolicy>>,
 pub admin:Signer<'info>,
 #[account(mut,seeds=[b"launch-claims".as_ref()],bump,token::mint=mint,token::authority=config)]
 pub launch:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"market-inventory".as_ref()],bump,token::mint=mint,token::authority=config)]
 pub market_inventory:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"vault".as_ref(),&[0]],bump,token::mint=mint,token::authority=config)]
 pub human:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"vault".as_ref(),&[1]],bump,token::mint=mint,token::authority=config)]
 pub rewards:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"vault".as_ref(),&[2]],bump,token::mint=mint,token::authority=config)]
 pub liquidity:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"vault".as_ref(),&[3]],bump,token::mint=mint,token::authority=config)]
 pub founder:Box<Account<'info,TokenAccount>>,
 pub token_program:Program<'info,Token>,
}

#[derive(Accounts)]
pub struct Close<'info> {
 #[account(mut,seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(mut,address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"launch-claims".as_ref()],bump,token::mint=mint,token::authority=config)]
 pub launch:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"vault".as_ref(),&[0]],bump,token::mint=mint,token::authority=config)]
 pub human:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"vault".as_ref(),&[1]],bump,token::mint=mint,token::authority=config)]
 pub rewards:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"vault".as_ref(),&[2]],bump,token::mint=mint,token::authority=config)]
 pub liquidity:Box<Account<'info,TokenAccount>>,
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
pub struct ReadConfig<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
}

#[derive(Accounts)]
#[instruction(nullifier:[u8;32],proof_digest:[u8;32])]
pub struct IssueCredential<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(init,payer=account_payer,space=8+97,seeds=[b"human".as_ref(),nullifier.as_ref()],bump)]
 pub credential:Box<Account<'info,Credential>>,
 #[account(init,payer=account_payer,space=8+32,seeds=[b"id-wallet".as_ref(),person.key().as_ref()],bump)]
 pub wallet_identity:Box<Account<'info,WalletIdentity>>,
 pub person:Signer<'info>,
 #[account(seeds=[b"identity-policy"],bump)]
 pub identity_policy:Box<Account<'info,IdentityPolicy>>,
 /// CHECK: fixed Instructions sysvar, inspected by identity::verify_admission.
 #[account(address=anchor_lang::solana_program::sysvar::instructions::ID)]
 pub instructions:UncheckedAccount<'info>,
 #[account(mut)]
 pub account_payer:Signer<'info>,
 pub system_program:Program<'info,System>,
}

#[derive(Accounts)]
#[instruction(number:u16)]
pub struct OpenEpoch<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(init,payer=payer,space=8+160,seeds=[b"epoch".as_ref(),&number.to_le_bytes()],bump)]
 pub epoch:Box<Account<'info,Epoch>>,
 #[account(init,payer=payer,token::mint=mint,token::authority=config,seeds=[b"claims".as_ref(),&number.to_le_bytes()],bump)]
 pub claim_vault:Box<Account<'info,TokenAccount>>,
 #[account(init,payer=payer,token::mint=mint,token::authority=config,seeds=[b"reward-claims".as_ref(),&number.to_le_bytes()],bump)]
 pub reward_vault:Box<Account<'info,TokenAccount>>,
 #[account(mut)]
 pub payer:Signer<'info>,
 pub token_program:Program<'info,Token>,
 pub system_program:Program<'info,System>,
 pub rent:Sysvar<'info,Rent>,
}

#[derive(Accounts)]
pub struct EnrollLaunch<'info> {
 #[account(mut,seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(seeds=[b"human".as_ref(),credential.nullifier.as_ref()],bump)]
 pub credential:Box<Account<'info,Credential>>,
 #[account(seeds=[b"id-wallet".as_ref(),person.key().as_ref()],bump,constraint=wallet_identity.credential==credential.key())]
 pub wallet_identity:Box<Account<'info,WalletIdentity>>,
 #[account(init,payer=account_payer,space=8+42,seeds=[b"launch-receipt".as_ref(),credential.key().as_ref()],bump)]
 pub receipt:Box<Account<'info,LaunchReceipt>>,
 #[account(mut)]
 pub person:Signer<'info>,
 #[account(mut)] pub account_payer:Signer<'info>,
 pub system_program:Program<'info,System>,
}

#[derive(Accounts)]
pub struct DisputeLaunch<'info> {
 #[account(mut,seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(seeds=[b"human".as_ref(),credential.nullifier.as_ref()],bump)]
 pub credential:Box<Account<'info,Credential>>,
 #[account(mut,seeds=[b"launch-receipt".as_ref(),credential.key().as_ref()],bump)]
 pub receipt:Box<Account<'info,LaunchReceipt>>,
 pub admin:Signer<'info>,
}

#[derive(Accounts)]
pub struct PrepareDlmmAccounts<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(address=config.quote_mint)]
 pub quote_mint:Box<Account<'info,Mint>>,
 #[account(init,payer=admin,token::mint=quote_mint,token::authority=config,seeds=[b"dlmm-proceeds".as_ref()],bump)]
 pub dlmm_proceeds:Box<Account<'info,TokenAccount>>,
 /// CHECK: Seeds and System owner create a zero-data PDA used only as a CPI signer and rent funder.
 #[account(init,payer=admin,space=0,owner=system_program.key(),seeds=[b"dlmm-funder".as_ref()],bump)]
 pub dlmm_funder:UncheckedAccount<'info>,
 #[account(init,payer=admin,token::mint=mint,token::authority=dlmm_funder,seeds=[b"dlmm-proof-heli".as_ref()],bump)]
 pub dlmm_proof_heli:Box<Account<'info,TokenAccount>>,
 #[account(init,payer=admin,token::mint=quote_mint,token::authority=dlmm_funder,seeds=[b"dlmm-proof-quote".as_ref()],bump)]
 pub dlmm_proof_quote:Box<Account<'info,TokenAccount>>,
 #[account(mut)]
 pub admin:Signer<'info>,
 pub token_program:Program<'info,Token>,
 pub system_program:Program<'info,System>,
 pub rent:Sysvar<'info,Rent>,
}

#[derive(Accounts)]
pub struct RegistryLaunch<'info> {
 #[account(mut,seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(mut,address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"launch-claims".as_ref()],bump,token::mint=mint,token::authority=config)]
 pub launch:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"market-inventory".as_ref()],bump,token::mint=mint,token::authority=config)]
 pub market_inventory:Box<Account<'info,TokenAccount>>,
 pub token_program:Program<'info,Token>,
}

#[derive(Accounts)]
pub struct ListMeteoraLaunch<'info> {
 #[account(mut,seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(address=config.quote_mint)]
 pub quote_mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"market-inventory".as_ref()],bump,token::mint=mint,token::authority=config)]
 pub market_inventory:Box<Account<'info,TokenAccount>>,
 #[account(mut)]
 pub payer:Signer<'info>,
 #[account(mut,token::mint=mint,token::authority=payer)]
 pub payer_token_a:Box<Account<'info,TokenAccount>>,
 #[account(mut,token::mint=quote_mint,token::authority=payer)]
 pub payer_token_b:Box<Account<'info,TokenAccount>>,
 #[account(mut)]
 pub position_nft_mint:Signer<'info>,
 /// CHECK: The fixed Meteora program validates its PDAs and vaults; HELI checks the program ID and resulting balances.
 #[account(mut)]
 pub position_nft_account:UncheckedAccount<'info>,
 /// CHECK: The fixed Meteora program validates its PDAs and vaults; HELI checks the program ID and resulting balances.
 pub pool_authority:UncheckedAccount<'info>,
 /// CHECK: The fixed Meteora program validates its PDAs and vaults; HELI checks the program ID and resulting balances.
 #[account(mut)]
 pub pool:UncheckedAccount<'info>,
 /// CHECK: The fixed Meteora program validates its PDAs and vaults; HELI checks the program ID and resulting balances.
 #[account(mut)]
 pub position:UncheckedAccount<'info>,
 /// CHECK: The fixed Meteora program validates its PDAs and vaults; HELI checks the program ID and resulting balances.
 #[account(mut)]
 pub token_a_vault:UncheckedAccount<'info>,
 /// CHECK: The fixed Meteora program validates its PDAs and vaults; HELI checks the program ID and resulting balances.
 #[account(mut)]
 pub token_b_vault:UncheckedAccount<'info>,
 /// CHECK: The fixed Meteora program validates its PDAs and vaults; HELI checks the program ID and resulting balances.
 pub token_2022_program:UncheckedAccount<'info>,
 /// CHECK: The fixed Meteora program validates its PDAs and vaults; HELI checks the program ID and resulting balances.
 pub event_authority:UncheckedAccount<'info>,
 /// CHECK: The fixed Meteora program validates its PDAs and vaults; HELI checks the program ID and resulting balances.
 pub meteora_program:UncheckedAccount<'info>,
 pub token_program:Program<'info,Token>,
 pub system_program:Program<'info,System>,
}

#[derive(Accounts)]
pub struct PlaceDlmmOrder<'info> {
 #[account(mut,seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(address=config.quote_mint)]
 pub quote_mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"market-inventory".as_ref()],bump,token::mint=mint,token::authority=config)]
 pub market_inventory:Box<Account<'info,TokenAccount>>,
 /// CHECK: checked against the committed pair and decoded Meteora mint/reserve fields.
 #[account(mut,address=config.dlmm_pair)]
 pub lb_pair:UncheckedAccount<'info>,
 /// CHECK: fixed DLMM program and verified by CPI.
 pub dlmm_program:UncheckedAccount<'info>,
 /// CHECK: DLMM validates this PDA; no bitmap extension is used in this pilot.
 pub bitmap_placeholder:UncheckedAccount<'info>,
 #[account(mut,token::mint=mint)]
 pub reserve:Box<Account<'info,TokenAccount>>,
 /// CHECK: DLMM initializes the signer account as a limit order in the same transaction.
 #[account(mut)]
 pub limit_order:Signer<'info>,
 #[account(mut)]
 pub payer:Signer<'info>,
 #[account(init,payer=payer,space=8+128,seeds=[b"dlmm-order".as_ref(),limit_order.key().as_ref()],bump)]
 pub order_receipt:Box<Account<'info,DlmmOrderReceipt>>,
 /// CHECK: checked against the DLMM event-authority PDA.
 pub event_authority:UncheckedAccount<'info>,
 /// CHECK: DLMM verifies this bin array for the selected bin.
 #[account(mut)]
 pub bin_array:UncheckedAccount<'info>,
 pub token_program:Program<'info,Token>,
 pub system_program:Program<'info,System>,
}

#[derive(Accounts)]
pub struct CreateDlmmPair<'info> {
 #[account(mut,seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(address=config.quote_mint)]
 pub quote_mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"market-inventory".as_ref()],bump,token::mint=mint,token::authority=config)]
 pub market_inventory:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"dlmm-funder".as_ref()],bump)]
 pub dlmm_funder:SystemAccount<'info>,
 #[account(mut,seeds=[b"dlmm-proof-heli".as_ref()],bump,token::mint=mint,token::authority=dlmm_funder)]
 pub dlmm_proof_heli:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"dlmm-proof-quote".as_ref()],bump,token::mint=quote_mint,token::authority=dlmm_funder)]
 pub dlmm_proof_quote:Box<Account<'info,TokenAccount>>,
 #[account(mut,token::mint=quote_mint,token::authority=admin)]
 pub admin_quote_wallet:Box<Account<'info,TokenAccount>>,
 #[account(mut)]
 pub admin:Signer<'info>,
 /// CHECK: fixed public DLMM program ID and executable flag checked by adapter.
 pub dlmm_program:UncheckedAccount<'info>,
 /// CHECK: checked against committed deterministic pair.
 #[account(mut,address=config.dlmm_pair)]
 pub lb_pair:UncheckedAccount<'info>,
 /// CHECK: optional account placeholder must be fixed DLMM program ID.
 pub bitmap_placeholder:UncheckedAccount<'info>,
 /// CHECK: DLMM validates reserve PDA and mint.
 #[account(mut)]
 pub reserve_x:UncheckedAccount<'info>,
 /// CHECK: DLMM validates reserve PDA and mint.
 #[account(mut)]
 pub reserve_y:UncheckedAccount<'info>,
 /// CHECK: DLMM validates oracle PDA.
 #[account(mut)]
 pub oracle:UncheckedAccount<'info>,
 /// CHECK: checked against DLMM event authority PDA.
 pub event_authority:UncheckedAccount<'info>,
 pub token_program:Program<'info,Token>,
 pub system_program:Program<'info,System>,
}

#[derive(Accounts)]
pub struct CancelDlmmOrder<'info> {
 #[account(mut,seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 /// CHECK: checked against config.admin by has_one; callers sign separately.
 pub admin:UncheckedAccount<'info>,
 pub caller:Signer<'info>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(address=config.quote_mint)]
 pub quote_mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"market-inventory".as_ref()],bump,token::mint=mint,token::authority=config)]
 pub market_inventory:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"dlmm-proceeds".as_ref()],bump,token::mint=quote_mint,token::authority=config)]
 pub dlmm_proceeds:Box<Account<'info,TokenAccount>>,
 /// CHECK: compared with the committed pair and decoded against the pinned DLMM layout.
 #[account(mut,address=config.dlmm_pair)]
 pub lb_pair:UncheckedAccount<'info>,
 #[account(mut)]
 pub reserve_x:Box<Account<'info,TokenAccount>>,
 #[account(mut)]
 pub reserve_y:Box<Account<'info,TokenAccount>>,
 /// CHECK: DLMM owner and receipt address are checked by the adapter.
 #[account(mut)]
 pub limit_order:UncheckedAccount<'info>,
 #[account(mut,seeds=[b"dlmm-order".as_ref(),limit_order.key().as_ref()],bump)]
 pub order_receipt:Box<Account<'info,DlmmOrderReceipt>>,
 /// CHECK: constrained to fixed DLMM ID.
 pub dlmm_program:UncheckedAccount<'info>,
 /// CHECK: constrained to fixed DLMM ID as optional-account placeholder.
 pub bitmap_placeholder:UncheckedAccount<'info>,
 /// CHECK: fixed SPL Memo ID.
 pub memo_program:UncheckedAccount<'info>,
 /// CHECK: checked against DLMM event-authority PDA.
 pub event_authority:UncheckedAccount<'info>,
 /// CHECK: DLMM validates this bin array for the receipt bin.
 #[account(mut)]
 pub bin_array:UncheckedAccount<'info>,
 pub token_program:Program<'info,Token>,
}

#[derive(Accounts)]
#[instruction(monthly_cap:u64,reserve:u64)]
pub struct InitializeFeeVaults<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(address=config.quote_mint)]
 pub quote_mint:Box<Account<'info,Mint>>,
 #[account(init,payer=payer,token::mint=mint,token::authority=config,seeds=[b"fee-base".as_ref()],bump)]
 pub fee_base:Box<Account<'info,TokenAccount>>,
 #[account(init,payer=payer,token::mint=quote_mint,token::authority=config,seeds=[b"fee-quote".as_ref()],bump)]
 pub fee_quote:Box<Account<'info,TokenAccount>>,
 #[account(init,payer=payer,space=8+96,seeds=[b"operations".as_ref()],bump)]
 pub operations:Box<Account<'info,Operations>>,
 pub admin:Signer<'info>,
 #[account(mut)]
 pub payer:Signer<'info>,
 pub token_program:Program<'info,Token>,
 pub system_program:Program<'info,System>,
 pub rent:Sysvar<'info,Rent>,
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
pub struct AllocateAuctionProceeds<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(seeds=[b"opening-auction".as_ref()],bump)]
 pub auction:Box<Account<'info,OpeningAuction>>,
 #[account(mut,seeds=[b"operations".as_ref()],bump)]
 pub operations:Box<Account<'info,Operations>>,
 #[account(address=config.quote_mint)]
 pub quote_mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"auction-proceeds".as_ref()],bump,token::mint=quote_mint,token::authority=config)]
 pub sale_proceeds:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"fee-quote".as_ref()],bump,token::mint=quote_mint,token::authority=config)]
 pub fee_quote:Box<Account<'info,TokenAccount>>,
 pub admin:Signer<'info>,
 pub token_program:Program<'info,Token>,
}

#[derive(Accounts)]
pub struct ClaimMeteoraFees<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(mut,seeds=[b"operations".as_ref()],bump)]
 pub operations:Box<Account<'info,Operations>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(address=config.quote_mint)]
 pub quote_mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"fee-base".as_ref()],bump,token::mint=mint,token::authority=config)]
 pub fee_base:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"fee-quote".as_ref()],bump,token::mint=quote_mint,token::authority=config)]
 pub fee_quote:Box<Account<'info,TokenAccount>>,
 /// CHECK: Meteora validates this PDA; HELI verifies its fixed address.
 pub pool_authority:UncheckedAccount<'info>,
 /// CHECK: The fixed Meteora program validates the pool and position relation.
 #[account(address=config.meteora_pool)]
 pub pool:UncheckedAccount<'info>,
 /// CHECK: The fixed Meteora program validates the position and its NFT.
 #[account(mut)]
 pub position:UncheckedAccount<'info>,
 /// CHECK: The fixed Meteora program validates the vault against the pool.
 #[account(mut)]
 pub token_a_vault:UncheckedAccount<'info>,
 /// CHECK: The fixed Meteora program validates the vault against the pool.
 #[account(mut)]
 pub token_b_vault:UncheckedAccount<'info>,
 /// CHECK: Meteora checks NFT ownership and amount.
 pub position_nft_account:UncheckedAccount<'info>,
 /// CHECK: The fixed Meteora program validates its event authority.
 pub event_authority:UncheckedAccount<'info>,
 /// CHECK: Fixed audited external program ID is checked before CPI.
 pub meteora_program:UncheckedAccount<'info>,
 pub token_program:Program<'info,Token>,
}

#[derive(Accounts)]
#[instruction(nonce:u64,amount:u64,purpose:[u8;32])]
pub struct ProposeExpense<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(mut,seeds=[b"operations".as_ref()],bump)]
 pub operations:Box<Account<'info,Operations>>,
 #[account(init,payer=proposer,space=8+128,seeds=[b"expense".as_ref(),&nonce.to_le_bytes()],bump)]
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
 pub token_program:Program<'info,Token>,
}

#[derive(Accounts)]
pub struct CancelExpense<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(mut,seeds=[b"expense".as_ref(),&expense.nonce.to_le_bytes()],bump)]
 pub expense:Box<Account<'info,Expense>>,
 pub admin:Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimLaunch<'info> {
 #[account(mut,seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(seeds=[b"human".as_ref(),credential.nullifier.as_ref()],bump)]
 pub credential:Box<Account<'info,Credential>>,
 #[account(mut,seeds=[b"launch-receipt".as_ref(),credential.key().as_ref()],bump,has_one=owner)]
 pub receipt:Box<Account<'info,LaunchReceipt>>,
 pub owner:Signer<'info>,
 #[account(mut,token::mint=mint,token::authority=owner)]
 pub destination:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"launch-claims".as_ref()],bump,token::mint=mint,token::authority=config)]
 pub launch:Box<Account<'info,TokenAccount>>,
 pub token_program:Program<'info,Token>,
}

#[derive(Accounts)]
pub struct Enroll<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(mut,seeds=[b"epoch".as_ref(),&epoch.number.to_le_bytes()],bump=epoch.bump)]
 pub epoch:Box<Account<'info,Epoch>>,
 #[account(seeds=[b"human".as_ref(),credential.nullifier.as_ref()],bump)]
 pub credential:Box<Account<'info,Credential>>,
 #[account(seeds=[b"id-wallet".as_ref(),person.key().as_ref()],bump,constraint=wallet_identity.credential==credential.key())]
 pub wallet_identity:Box<Account<'info,WalletIdentity>>,
 #[account(init,payer=account_payer,space=8+34,seeds=[b"receipt".as_ref(),epoch.key().as_ref(),credential.key().as_ref()],bump)]
 pub receipt:Box<Account<'info,Receipt>>,
 #[account(mut)]
 pub person:Signer<'info>,
 #[account(mut)] pub account_payer:Signer<'info>,
 pub system_program:Program<'info,System>,
}

#[derive(Accounts)]
pub struct DisputeEntry<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(mut,seeds=[b"epoch".as_ref(),&epoch.number.to_le_bytes()],bump=epoch.bump)]
 pub epoch:Box<Account<'info,Epoch>>,
 #[account(seeds=[b"human".as_ref(),credential.nullifier.as_ref()],bump)]
 pub credential:Box<Account<'info,Credential>>,
 #[account(mut,seeds=[b"receipt".as_ref(),epoch.key().as_ref(),credential.key().as_ref()],bump)]
 pub receipt:Box<Account<'info,Receipt>>,
 pub admin:Signer<'info>,
}

#[derive(Accounts)]
pub struct Registry<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(mut,seeds=[b"epoch".as_ref(),&epoch.number.to_le_bytes()],bump=epoch.bump)]
 pub epoch:Box<Account<'info,Epoch>>,
}

#[derive(Accounts)]
pub struct GlobalCheckpoint<'info> {
 #[account(mut,seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(mut,address=config.history)]
 pub history:AccountLoader<'info,GlobalBook>,
}

#[derive(Accounts)]
pub struct OpenStake<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(init,payer=owner,space=8+88,seeds=[b"stake".as_ref(),owner.key().as_ref()],bump)]
 pub stake:Box<Account<'info,StakePosition>>,
 #[account(init,payer=owner,token::mint=mint,token::authority=config,seeds=[b"principal".as_ref(),owner.key().as_ref()],bump)]
 pub stake_vault:Box<Account<'info,TokenAccount>>,
 #[account(zero)]
 pub user_history:AccountLoader<'info,UserBook>,
 #[account(mut)]
 pub owner:Signer<'info>,
 pub token_program:Program<'info,Token>,
 pub system_program:Program<'info,System>,
 pub rent:Sysvar<'info,Rent>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
 #[account(mut,seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(mut,address=config.history)]
 pub history:AccountLoader<'info,GlobalBook>,
 #[account(mut,seeds=[b"stake".as_ref(),owner.key().as_ref()],bump,has_one=owner)]
 pub stake:Box<Account<'info,StakePosition>>,
 #[account(mut,address=stake.history)]
 pub user_history:AccountLoader<'info,UserBook>,
 #[account(mut,seeds=[b"principal".as_ref(),owner.key().as_ref()],bump,token::mint=mint,token::authority=config)]
 pub stake_vault:Box<Account<'info,TokenAccount>>,
 pub owner:Signer<'info>,
 #[account(mut,token::mint=mint,token::authority=owner)]
 pub wallet:Box<Account<'info,TokenAccount>>,
 pub token_program:Program<'info,Token>,
}

#[derive(Accounts)]
pub struct CreateMarket<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(address=config.quote_mint)]
 pub quote_mint:Box<Account<'info,Mint>>,
 #[account(init,payer=admin,space=8+1024,seeds=[b"market".as_ref()],bump)]
 pub market:Box<Account<'info,Market>>,
 #[account(init,payer=admin,token::mint=mint,token::authority=config,seeds=[b"base-pool".as_ref()],bump)]
 pub base_pool:Box<Account<'info,TokenAccount>>,
 #[account(init,payer=admin,token::mint=quote_mint,token::authority=config,seeds=[b"quote-pool".as_ref()],bump)]
 pub quote_pool:Box<Account<'info,TokenAccount>>,
 #[account(init,payer=admin,token::mint=quote_mint,token::authority=config,seeds=[b"quote-treasury".as_ref()],bump)]
 pub quote_treasury:Box<Account<'info,TokenAccount>>,
 #[account(init,payer=admin,token::mint=quote_mint,token::authority=admin,seeds=[b"founder-quote".as_ref()],bump)]
 pub founder_quote:Box<Account<'info,TokenAccount>>,
 #[account(mut)]
 pub admin:Signer<'info>,
 pub token_program:Program<'info,Token>,
 pub system_program:Program<'info,System>,
 pub rent:Sysvar<'info,Rent>,
}

#[derive(Accounts)]
pub struct SeedMarket<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump,has_one=admin)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(address=config.quote_mint)]
 pub quote_mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"market".as_ref()],bump)]
 pub market:Box<Account<'info,Market>>,
 #[account(mut,seeds=[b"base-pool".as_ref()],bump,token::mint=mint,token::authority=config)]
 pub base_pool:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"quote-pool".as_ref()],bump,token::mint=quote_mint,token::authority=config)]
 pub quote_pool:Box<Account<'info,TokenAccount>>,
 #[account(mut,token::mint=mint,token::authority=admin)]
 pub base_wallet:Box<Account<'info,TokenAccount>>,
 #[account(mut,token::mint=quote_mint,token::authority=admin)]
 pub quote_wallet:Box<Account<'info,TokenAccount>>,
 pub admin:Signer<'info>,
 pub token_program:Program<'info,Token>,
}

#[derive(Accounts)]
pub struct ObserveMarket<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(address=config.quote_mint)]
 pub quote_mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"market".as_ref()],bump)]
 pub market:Box<Account<'info,Market>>,
 #[account(seeds=[b"base-pool".as_ref()],bump,token::mint=mint,token::authority=config)]
 pub base_pool:Box<Account<'info,TokenAccount>>,
 #[account(seeds=[b"quote-pool".as_ref()],bump,token::mint=quote_mint,token::authority=config)]
 pub quote_pool:Box<Account<'info,TokenAccount>>,
}

#[derive(Accounts)]
pub struct Trade<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(address=config.quote_mint)]
 pub quote_mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"market".as_ref()],bump)]
 pub market:Box<Account<'info,Market>>,
 #[account(mut,seeds=[b"base-pool".as_ref()],bump,token::mint=mint,token::authority=config)]
 pub base_pool:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"quote-pool".as_ref()],bump,token::mint=quote_mint,token::authority=config)]
 pub quote_pool:Box<Account<'info,TokenAccount>>,
 pub owner:Signer<'info>,
 #[account(mut,token::mint=mint,token::authority=owner)]
 pub base_wallet:Box<Account<'info,TokenAccount>>,
 #[account(mut,token::mint=quote_mint,token::authority=owner)]
 pub quote_wallet:Box<Account<'info,TokenAccount>>,
 pub token_program:Program<'info,Token>,
}

#[derive(Accounts)]
pub struct Settle<'info> {
 #[account(mut,seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(mut,address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"epoch".as_ref(),&epoch.number.to_le_bytes()],bump=epoch.bump)]
 pub epoch:Box<Account<'info,Epoch>>,
 #[account(mut,address=config.history)]
 pub history:AccountLoader<'info,GlobalBook>,
 #[account(mut,seeds=[b"vault".as_ref(),&[0]],bump,token::mint=mint,token::authority=config)]
 pub human:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"vault".as_ref(),&[1]],bump,token::mint=mint,token::authority=config)]
 pub rewards:Box<Account<'info,TokenAccount>>,
 #[account(seeds=[b"vault".as_ref(),&[2]],bump,token::mint=mint,token::authority=config)]
 pub liquidity:Box<Account<'info,TokenAccount>>,
 #[account(seeds=[b"vault".as_ref(),&[3]],bump,token::mint=mint,token::authority=config)]
 pub founder:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"claims".as_ref(),&epoch.number.to_le_bytes()],bump,token::mint=mint,token::authority=config)]
 pub claim_vault:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"reward-claims".as_ref(),&epoch.number.to_le_bytes()],bump,token::mint=mint,token::authority=config)]
 pub reward_vault:Box<Account<'info,TokenAccount>>,
 pub token_program:Program<'info,Token>,
}
#[derive(Accounts)]
pub struct ClaimHuman<'info> {
 #[account(seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"epoch".as_ref(),&epoch.number.to_le_bytes()],bump=epoch.bump)]
 pub epoch:Box<Account<'info,Epoch>>,
 #[account(seeds=[b"human".as_ref(),credential.nullifier.as_ref()],bump)]
 pub credential:Box<Account<'info,Credential>>,
 #[account(mut,seeds=[b"receipt".as_ref(),epoch.key().as_ref(),credential.key().as_ref()],bump,has_one=owner)]
 pub receipt:Box<Account<'info,Receipt>>,
 pub owner:Signer<'info>,
 #[account(mut,token::mint=mint,token::authority=owner)]
 pub destination:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"claims".as_ref(),&epoch.number.to_le_bytes()],bump,token::mint=mint,token::authority=config)]
 pub claim_vault:Box<Account<'info,TokenAccount>>,
 pub token_program:Program<'info,Token>,
}

#[derive(Accounts)]
pub struct ClaimReward<'info> {
 #[account(mut,seeds=[b"config".as_ref()],bump=config.bump)]
 pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)]
 pub mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"epoch".as_ref(),&epoch.number.to_le_bytes()],bump=epoch.bump)]
 pub epoch:Box<Account<'info,Epoch>>,
 #[account(mut,address=config.history)]
 pub history:AccountLoader<'info,GlobalBook>,
 #[account(mut,seeds=[b"stake".as_ref(),owner.key().as_ref()],bump,has_one=owner)]
 pub stake:Box<Account<'info,StakePosition>>,
 #[account(mut,address=stake.history)]
 pub user_history:AccountLoader<'info,UserBook>,
 pub owner:Signer<'info>,
 #[account(mut,token::mint=mint,token::authority=owner)]
 pub destination:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"reward-claims".as_ref(),&epoch.number.to_le_bytes()],bump,token::mint=mint,token::authority=config)]
 pub reward_vault:Box<Account<'info,TokenAccount>>,
 pub token_program:Program<'info,Token>,
}
