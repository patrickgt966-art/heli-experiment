"""Small genuine V15 fixture; no public chain or keys."""
import hashlib,struct
def bootstrap(t, auction_quantity=1000, with_policy=False):
 t.clock(t.start-14*t.DAY);q=t.allocate(82,t.TOKEN);t.defaults['quote_mint']=q
 t.send('TEST quote mint',[t.Instruction(t.TOKEN,b'\x14\x06'+bytes(t.admin.pubkey())+b'\x00',[t.meta(q,True)])])
 t.defaults.update(history=t.allocate(8+720*8*4),launch=t.pda(b'launch-claims'),market_inventory=t.pda(b'market-inventory'),auction=t.pda(b'opening-auction'),quote_escrow=t.pda(b'auction-quote'),sale_proceeds=t.pda(b'auction-proceeds'),identity_policy=t.pda(b'identity-policy'),instructions=t.INSTRUCTIONS_SYSVAR)
 t.call('initialize',{'start':t.start});t.call('create_launch_claims');t.call('create_market_inventory');verifier=t.Keypair();t.call('initialize_identity',{'verifier':verifier.pubkey()})
 if with_policy:
  t.defaults['policy']=t.pda(b'release-policy');t.call('initialize_release_policy',{'minimum_quote_depth':5000*t.U})
 for i,n in enumerate(['human','rewards','liquidity','founder']):t.call('create_vault',{'kind':i},{'vault':t.defaults[n]})
 t.call('genesis');t.call('prepare_auction_quote');t.call('prepare_auction_proceeds');t.call('open_auction',{'floor_quote_atoms_per_heli':100,'tick_size':50})
 qw=t.token_account(q,t.alice.pubkey());hw=t.token_account(t.defaults['mint'],t.alice.pubkey())
 t.send('TEST quote to alice',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',1_000_000*t.U),[t.meta(q,True),t.meta(qw,True),t.meta(t.admin.pubkey(),False,True)])])
 ba={'bidder':t.alice.pubkey(),'bid':t.pda(b'auction-bid',bytes(t.alice.pubkey())),'bidder_quote':qw,'bidder_heli':hw}
 t.call('create_auction_bid',acc=ba);t.call('place_auction_bid',{'quantity_heli':auction_quantity,'tick':0},ba)
 t.clock(t.start);t.call('finalize_auction');t.call('claim_auction_bid',acc=ba)
 nul=hashlib.sha256(b'long-run-local-person').digest();dig=hashlib.sha256(b'synthetic provider signature, no person data').digest();now=t.start
 ac={'person':t.alice.pubkey(),'owner':t.alice.pubkey(),'credential':t.pda(b'human',nul),'wallet_identity':t.pda(b'id-wallet',bytes(t.alice.pubkey())),'destination':hw}
 message=b'HELI_IDENTITY_V15\0'+bytes(t.PROGRAM)+bytes(t.defaults['config'])+bytes(t.alice.pubkey())+nul+dig+struct.pack('<qq',now,now+600)
 data=b'\x01\x00'+struct.pack('<7H',48,65535,16,65535,112,len(message),65535)+bytes(verifier.pubkey())+bytes(verifier.sign_message(message))+message
 t.send('native test provider credential',[t.Instruction(t.Pubkey.from_string('Ed25519SigVerify111111111111111111111111111'),data,[]),t.instruction('issue_credential',{'nullifier':list(nul),'proof_digest':list(dig),'issued_at':now,'expires_at':now+600},ac)],[t.alice])
 return {'wallet':hw,'quote_wallet':qw,'identity':ac,'verifier':verifier}
def epoch_accounts(t,n):
 seed=struct.pack('<H',n);return {'epoch':t.pda(b'epoch',seed),'claim_vault':t.pda(b'claims',seed),'reward_vault':t.pda(b'reward-claims',seed)}
