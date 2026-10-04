//! Provider-bound admission. Ed25519 precompile must immediately precede issue_credential.
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{ed25519_program,sysvar::instructions::{load_current_index_checked,load_instruction_at_checked}};
use crate::{Config,ErrorCode};
pub const PREFIX:&[u8]=b"HELI_IDENTITY_V15\0";
#[account]
pub struct IdentityPolicy {pub verifier:Pubkey}
#[derive(Accounts)]
pub struct InitializeIdentity<'info>{
 #[account(seeds=[b"config"],bump=config.bump,has_one=admin)] pub config:Box<Account<'info,Config>>,
 #[account(init,payer=admin,space=8+32,seeds=[b"identity-policy"],bump)] pub identity_policy:Box<Account<'info,IdentityPolicy>>,
 #[account(mut)] pub admin:Signer<'info>,pub system_program:Program<'info,System>,
}
pub fn initialize(ctx:Context<InitializeIdentity>,verifier:Pubkey)->Result<()>{
 require!(!ctx.accounts.config.live&&verifier!=Pubkey::default()&&verifier!=ctx.accounts.config.admin,ErrorCode::Identity);
 ctx.accounts.identity_policy.verifier=verifier;Ok(())
}
pub fn message(config:&Pubkey,person:&Pubkey,nullifier:&[u8;32],digest:&[u8;32],issued:i64,expires:i64)->Vec<u8>{
 let mut m=PREFIX.to_vec();m.extend_from_slice(crate::ID.as_ref());m.extend_from_slice(config.as_ref());m.extend_from_slice(person.as_ref());m.extend_from_slice(nullifier);m.extend_from_slice(digest);m.extend_from_slice(&issued.to_le_bytes());m.extend_from_slice(&expires.to_le_bytes());m
}
fn word(d:&[u8],i:usize)->Result<u16>{require!(i+2<=d.len(),ErrorCode::Identity);Ok(u16::from_le_bytes([d[i],d[i+1]]))}
pub fn verify_admission(sysvar:&AccountInfo,policy:&IdentityPolicy,config:&Pubkey,person:&Pubkey,nullifier:&[u8;32],digest:&[u8;32],issued:i64,expires:i64)->Result<()>{
 let now=Clock::get()?.unix_timestamp;
 require!(issued<=now&&expires>=now&&expires>issued&&expires.checked_sub(issued).ok_or(ErrorCode::Math)?<=600&&nullifier!=&[0;32]&&digest!=&[0;32],ErrorCode::Identity);
 let current=load_current_index_checked(sysvar)?;require!(current>0,ErrorCode::Identity);
 let ix=load_instruction_at_checked(current as usize-1,sysvar)?;
 require!(ix.program_id==ed25519_program::id()&&ix.accounts.is_empty()&&ix.data.len()>=16&&ix.data[0]==1&&ix.data[1]==0,ErrorCode::Identity);
 let d=&ix.data;let sig=word(d,2)? as usize;let key=word(d,6)? as usize;let msg=word(d,10)? as usize;let len=word(d,12)? as usize;
 require!(word(d,4)?==u16::MAX&&word(d,8)?==u16::MAX&&word(d,14)?==u16::MAX&&sig>=16&&key>=16&&msg>=16&&sig+64<=d.len()&&key+32<=d.len()&&msg+len==d.len(),ErrorCode::Identity);
 // Offset segments must not overlap; the precompile verified this exact message/key.
 require!(sig+64<=key||key+32<=sig,ErrorCode::Identity);
 require!((sig+64<=msg||msg+len<=sig)&&(key+32<=msg||msg+len<=key),ErrorCode::Identity);
 let expected=message(config,person,nullifier,digest,issued,expires);
 require!(d[key..key+32]==policy.verifier.to_bytes()&&d[msg..]==expected,ErrorCode::Identity);Ok(())
}

