"""Small genuine V15 fixture; no public chain or keys."""
import hashlib,struct
NAME='HELI Test Token';URI='https://heli-experiment.pages.dev/token.json'  # placeholders until the name is decided
def bootstrap(t, auction_quantity=1000, with_policy=False, min_depth=5000, reject_depth=None, metadata_checks=False):
 t.clock(t.start-14*t.DAY);q=t.allocate(82,t.TOKEN);t.defaults['quote_mint']=q
 t.send('TEST quote mint',[t.Instruction(t.TOKEN,b'\x14\x06'+bytes(t.admin.pubkey())+b'\x00',[t.meta(q,True)])])
 t.defaults.update(market_inventory=t.pda(b'market-inventory'),auction=t.pda(b'opening-auction'),quote_escrow=t.pda(b'auction-quote'),sale_proceeds=t.pda(b'auction-proceeds'),instructions=t.INSTRUCTIONS_SYSVAR)
 t.call('initialize',{'start':t.start});t.call('create_market_inventory')
 if with_policy:
  t.defaults['policy']=t.pda(b'release-policy');(reject_depth is not None and t.call('initialize_release_policy',{'minimum_quote_depth':reject_depth},reject='Quota',label='minimum depth below the code floor rejected'));t.call('initialize_release_policy',{'minimum_quote_depth':min_depth*t.U})
 for i,n in [(0,'human'),(3,'founder')]:t.call('create_vault',{'kind':i},{'vault':t.defaults[n]})
 if metadata_checks:
  for k in (1,2):t.call('create_vault',{'kind':k},{'vault':t.pda(b'vault',bytes([k]))},reject='Invalid state',label=f'no vault {k}: the former rewards and liquidity stocks no longer exist')
 t.defaults.update(token_metadata_program=t.TOKEN_METADATA,metadata=t.Pubkey.find_program_address([b'metadata',bytes(t.TOKEN_METADATA),bytes(t.defaults['mint'])],t.TOKEN_METADATA)[0])
 t.call('genesis',reject='Invalid or missing token metadata',label='genesis refused before the token has a name (mint authority would be revoked)')
 if metadata_checks:
  for args,why in [(dict(name='',symbol='HELI',uri=URI),'empty name'),(dict(name='N'*33,symbol='HELI',uri=URI),'name over 32 bytes'),(dict(name=NAME,symbol='S'*11,uri=URI),'symbol over 10 bytes'),(dict(name=NAME,symbol='HELI',uri='http://example.org/t.json'),'non-https logo URI'),(dict(name=NAME,symbol='HELI',uri='https://'+'a'*193),'URI over 200 bytes'),(dict(name=NAME,symbol='HELI',uri='https://'),'bare https:// URI'),(dict(name=NAME,symbol='HELI',uri='https://exa mple.org/t.json'),'URI with a space'),(dict(name=NAME,symbol='HELI',uri='https://localhost/t.json'),'URI host without a dot')]:
   t.call('create_token_metadata',args,reject='Invalid or missing token metadata',label='metadata rejected: '+why)
  t.call('create_token_metadata',dict(name=NAME,symbol='HELI',uri=URI),{'metadata':t.pda(b'not-metadata')},reject='Invalid or missing token metadata',label='metadata rejected: wrong metadata account')
  t.call('create_token_metadata',dict(name=NAME,symbol='HELI',uri=URI),{'admin':t.outsider.pubkey()},reject='has one',label='only the admin writes the token metadata')
 t.call('create_token_metadata',dict(name=NAME,symbol='HELI',uri=URI),label='token name, symbol and logo URI written before genesis')
 if metadata_checks:t.call('create_token_metadata',dict(name=NAME,symbol='HELI',uri=URI),reject='Invalid state',label='metadata can be written only once')
 t.call('genesis');t.call('prepare_auction_quote');t.call('prepare_auction_proceeds');t.call('open_auction',{'floor_quote_atoms_per_heli':100,'tick_size':50})
 qw=t.token_account(q,t.alice.pubkey());hw=t.token_account(t.defaults['mint'],t.alice.pubkey())
 t.send('TEST quote to alice',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',1_000_000*t.U),[t.meta(q,True),t.meta(qw,True),t.meta(t.admin.pubkey(),False,True)])])
 ba={'bidder':t.alice.pubkey(),'bid':t.pda(b'auction-bid',bytes(t.alice.pubkey())),'bidder_quote':qw,'bidder_heli':hw}
 # One wallet may bid for at most 250,000 HELI (5% of the offer); larger fixtures add synthetic bidders whose
 # HELI is moved to alice after the claim, so later tests see the same alice balance as before.
 cap=250_000;mine=min(auction_quantity,cap);extra=[]
 if metadata_checks:
  t.call('create_auction_bid',acc=ba);t.call('place_auction_bid',{'quantity_heli':cap+1,'tick':0},ba,reject='Quota',label='one wallet cannot bid for more than 5% of the auction offer')
  t.call('place_auction_bid',{'quantity_heli':cap,'tick':0},ba,label='one wallet may bid for exactly 5% of the auction offer');t.call('cancel_auction_bid',acc=ba)
  t.call('place_auction_bid',{'quantity_heli':cap+1,'tick':0},ba,reject='Quota',label='cancelling and re-bidding does not raise the per-wallet limit')
 else:t.call('create_auction_bid',acc=ba)
 t.call('place_auction_bid',{'quantity_heli':mine,'tick':0},ba)
 left=auction_quantity-mine
 while left>0:
  k=t.Keypair();t.KEYS[str(k.pubkey())]=k;t.svm.airdrop(k.pubkey(),10_000_000_000);n=min(left,cap);left-=n
  kq=t.token_account(q,k.pubkey());kh=t.token_account(t.defaults['mint'],k.pubkey())
  t.send('TEST quote to bidder',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',1_000_000*t.U),[t.meta(q,True),t.meta(kq,True),t.meta(t.admin.pubkey(),False,True)])])
  kb={'bidder':k.pubkey(),'bid':t.pda(b'auction-bid',bytes(k.pubkey())),'bidder_quote':kq,'bidder_heli':kh}
  t.call('create_auction_bid',acc=kb);t.call('place_auction_bid',{'quantity_heli':n,'tick':0},kb);extra.append((k,kb,kh,n))
 t.clock(t.start);t.call('finalize_auction');t.call('claim_auction_bid',acc=ba)
 for k,kb,kh,n in extra:t.call('claim_auction_bid',acc=kb);t.transfer(kh,hw,n*t.U,k)
 nul=hashlib.sha256(b'long-run-local-person').digest()
 ac={'person':t.alice.pubkey(),'owner':t.alice.pubkey(),'credential':t.pda(b'human',nul),'wallet_identity':t.pda(b'id-wallet',bytes(t.alice.pubkey())),'destination':hw}
 t.removed('issue_credential','free allocation removed: the credential instruction no longer exists')
 # 'verifier' is an unused synthetic key kept for the archived claim-service bridge.
 return {'wallet':hw,'quote_wallet':qw,'identity':ac,'verifier':t.Keypair()}
def epoch_accounts(t,n):
 seed=struct.pack('<H',n);return {'epoch':t.pda(b'epoch',seed),'claim_vault':t.pda(b'claims',seed),'reward_vault':t.pda(b'reward-claims',seed)}
