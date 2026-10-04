"""Reproducible local execution of the HELI v20 ELF, never a public deployment."""
import base64,calendar,datetime,hashlib,json,os,re,struct,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCE_NAMES=('lib.rs','accounts.rs','calendar.rs','economics.rs','auction.rs','manifest_bridge.rs','identity.rs','release.rs','management.rs','market_release.rs')
manifest=json.loads((ROOT/'compiled-source.json').read_text(encoding='utf-8'))
actual_source=hashlib.sha256(b''.join((ROOT/'src'/name).read_bytes() for name in SOURCE_NAMES)).hexdigest()
actual_binary=hashlib.sha256((ROOT/'heli_core_v20.so').read_bytes()).hexdigest()
assert manifest['source_sha256']==actual_source and manifest['binary_sha256']==actual_binary, 'Source and ELF do not match; rebuild before tests'
sys.path.insert(0,str(ROOT.parent/'solana/.python-deps'))
sys.path.insert(0,str(ROOT.parent/'solana-v2/.python-deps'))
from solders.litesvm import LiteSVM
from solders.pubkey import Pubkey
from solders.keypair import Keypair
from solders.instruction import Instruction,AccountMeta
from solders.transaction import Transaction
from solders.transaction_metadata import FailedTransactionMetadata
from solders.system_program import create_account,CreateAccountParams,ID as SYSTEM
from solders.sysvar import RENT
INSTRUCTIONS_SYSVAR=Pubkey.from_string("Sysvar1nstructions1111111111111111111111111")
from solders.compute_budget import set_compute_unit_limit
U=1_000_000; DAY=86400
PROGRAM=Pubkey.from_string('HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv')
TOKEN=Pubkey.from_string('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
IDL=json.loads((ROOT/'idl.json').read_text())
def snake(s):return re.sub(r'(?<!^)(?=[A-Z])','_',s).lower()
INSTRUCTIONS={snake(i['name']):i for i in IDL['instructions']}
TYPES={i['name']:i['type'] for i in IDL.get('accounts',[])+IDL.get('types',[])}
svm=LiteSVM();svm.add_program_from_file(PROGRAM,ROOT/'heli_core_v20.so')
admin=Keypair();alice=Keypair();bob=Keypair();outsider=Keypair()
KEYS={str(k.pubkey()):k for k in [admin,alice,bob,outsider]}
for k in KEYS.values():svm.airdrop(k.pubkey(),100_000_000_000)
checks=[];events=[]
def check(name,value):
 assert value,name
 checks.append(name)
def pda(*parts):return Pubkey.find_program_address(parts,PROGRAM)[0]
def meta(k,w=False,s=False):return AccountMeta(k,s,w)
def clock(t):
 c=svm.get_clock();c.unix_timestamp=int(t);svm.set_clock(c)
def send(name,ins,signers=None,reject=None):
 svm.expire_blockhash()
 signers=signers or [admin]
 signers=list({str(k.pubkey()):k for k in [admin]+signers}.values())
 tx=Transaction.new_signed_with_payer([set_compute_unit_limit(1_400_000)]+ins,admin.pubkey(),signers,svm.latest_blockhash())
 r=svm.send_transaction(tx);failed=isinstance(r,FailedTransactionMetadata)
 logs=r.meta().logs() if failed else r.logs()
 events.append({'name':name,'rejected':failed,'logs':logs})
 if reject:
  assert failed,name+' unexpectedly succeeded'
  assert any(reject in x for x in logs),name+' wrong failure '+str(logs)
 else:assert not failed,name+': '+str(r)
 checks.append(name)
 return logs
def encode(t,v):
 if t=='publicKey':return bytes(v)
 if t=='bool':return bytes([int(v)])
 if t=='bytes':return len(v).to_bytes(4,'little')+bytes(v)
 if isinstance(t,str):return int(v).to_bytes(int(t[1:])//8,'little',signed=t.startswith('i'))
 if 'array' in t:return b''.join(encode(t['array'][0],a) for a in v)
 if 'vec' in t:return encode('u32',len(v))+b''.join(encode(t['vec'],a) for a in v)
 raise ValueError(t)
def decode(t,b,o):
 if t=='publicKey':return str(Pubkey.from_bytes(b[o:o+32])),o+32
 if isinstance(t,str):
  z=1 if t=='bool' else int(t[1:])//8
  return (bool(b[o]) if t=='bool' else int.from_bytes(b[o:o+z],'little',signed=t.startswith('i'))),o+z
 if 'array' in t:
  out=[]
  for _ in range(t['array'][1]):v,o=decode(t['array'][0],b,o);out.append(v)
  return out,o
 if 'vec' in t:
  n,o=decode('u32',b,o);out=[]
  for _ in range(n):v,o=decode(t['vec'],b,o);out.append(v)
  return out,o
 if 'defined' in t:return decode(TYPES[t['defined']],b,o)
 out={}
 for f in t['fields']:out[f['name']],o=decode(f['type'],b,o)
 return out,o
def read(k,t):return decode(TYPES[t],svm.get_account(k).data,8)[0]
def amount(k):return struct.unpack_from('<Q',svm.get_account(k).data,64)[0]
def supply():return struct.unpack_from('<Q',svm.get_account(defaults['mint']).data,36)[0]
def cfg():return read(defaults['config'],'Config')
def released():return supply()-sum(cfg()['stocks'])
from solders.account import Account as _Account
PROGRAM_DATA=Pubkey.from_bytes(bytes(svm.get_account(PROGRAM).data[4:36]))
def set_upgrade_authority(key):
 a=svm.get_account(PROGRAM_DATA);d=bytearray(a.data);d[12]=0 if key is None else 1;d[13:45]=bytes(32) if key is None else bytes(key)
 svm.set_account(PROGRAM_DATA,_Account(a.lamports,bytes(d),a.owner,a.executable,a.rent_epoch))
set_upgrade_authority(admin.pubkey())
defaults={'config':pda(b'config'),'program':PROGRAM,'program_data':PROGRAM_DATA,'mint':pda(b'mint'),'admin':admin.pubkey(),'payer':admin.pubkey(),'account_payer':admin.pubkey(),'owner':admin.pubkey(),'token_program':TOKEN,'system_program':SYSTEM,'rent':RENT,'market':pda(b'market')}
for i,n in enumerate(['human','rewards','liquidity','founder']):defaults[n]=pda(b'vault',bytes([i]))
for n in ['base_pool','quote_pool','quote_treasury','founder_quote']:defaults[n]=pda(n.replace('_','-').encode())
def instruction(name,arguments=None,accounts=None):
 d=INSTRUCTIONS[name];a=defaults| (accounts or {})
 data=hashlib.sha256(('global:'+name).encode()).digest()[:8]
 for f in d['args']:data+=encode(f['type'],(arguments or {})[snake(f['name'])])
 return Instruction(PROGRAM,data,[meta(a[snake(f['name'])],f['isMut'],f['isSigner']) for f in d['accounts']])
def removed(name,label=None):
 # Instruction deleted from the program (owner decision, 4 Oct 2026: smaller ELF): its discriminator is unknown.
 assert name not in INSTRUCTIONS,name+' still in the IDL'
 ix=Instruction(PROGRAM,hashlib.sha256(('global:'+name).encode()).digest()[:8],[meta(admin.pubkey(),True,True)])
 return send(label or name+' no longer exists in the program',[ix],None,'Fallback functions are not supported')
def call(name,args=None,acc=None,label=None,reject=None):
 ix=instruction(name,args,acc);s=[KEYS[str(m.pubkey)] for m in ix.accounts if m.is_signer]
 return send(label or name,[ix],s,reject)
def allocate(size,owner=PROGRAM):
 k=Keypair();KEYS[str(k.pubkey())]=k
 send('allocate '+str(size),[create_account(CreateAccountParams(from_pubkey=admin.pubkey(),to_pubkey=k.pubkey(),lamports=svm.minimum_balance_for_rent_exemption(size),space=size,owner=owner))],[admin,k])
 return k.pubkey()
def token_account(mint,owner):
 k=Keypair();KEYS[str(k.pubkey())]=k
 send('create SPL account',[create_account(CreateAccountParams(from_pubkey=admin.pubkey(),to_pubkey=k.pubkey(),lamports=svm.minimum_balance_for_rent_exemption(165),space=165,owner=TOKEN)),Instruction(TOKEN,b'\x12'+bytes(owner),[meta(k.pubkey(),True),meta(mint)])],[admin,k])
 return k.pubkey()
def transfer(src,dst,n,owner=admin):send('SPL transfer',[Instruction(TOKEN,b'\x03'+struct.pack('<Q',n),[meta(src,True),meta(dst,True),meta(owner.pubkey(),False,True)])],[owner])

start=int(datetime.datetime(2026,1,31,12,34,56,tzinfo=datetime.timezone.utc).timestamp())
def boundary(n):
 y,m=divmod(2026*12+n,12);m+=1
 return int(datetime.datetime(y,m,min(31,calendar.monthrange(y,m)[1]),12,34,56,tzinfo=datetime.timezone.utc).timestamp())

