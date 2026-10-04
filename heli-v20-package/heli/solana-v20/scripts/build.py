"""Compile the HELI v20 management allocation draft with Solana Playground; no keys sent."""
import hashlib,json,urllib.request
from pathlib import Path

root=Path(__file__).resolve().parents[1]
names=['lib.rs','accounts.rs','calendar.rs','economics.rs','auction.rs','manifest_bridge.rs','identity.rs','release.rs','management.rs','market_release.rs']
digest=hashlib.sha256(b''.join((root/'src'/n).read_bytes() for n in names)).hexdigest()
source=(root/'src/lib.rs').read_text(encoding='utf-8-sig')
source=source.replace('include!("accounts.rs");',(root/'src/accounts.rs').read_text(encoding='utf-8'))
files=[['/src/lib.rs',source]]+[['/src/'+n,(root/'src'/n).read_text(encoding='utf-8')]
 for n in ['calendar.rs','economics.rs','auction.rs','manifest_bridge.rs','identity.rs','release.rs','management.rs','market_release.rs']]
import sys
if '--prepare-only' in sys.argv:
 print(json.dumps({'source_sha256':digest,'files':[x[0] for x in files],'program':'heli_core_v20'}));raise SystemExit(0)
payload={'files':files,'flags':{'seedsFeature':False,'noDocs':True,'safetyChecks':True}}
cache=root/'build.json'
if cache.exists():payload['uuid']=json.loads(cache.read_text(encoding='utf-8'))['uuid']
request=urllib.request.Request('https://api.solpg.io/build',data=json.dumps(payload).encode(),
 headers={'Content-Type':'application/json'},method='POST')
response=json.load(urllib.request.urlopen(request,timeout=90))
uuid=response.get('uuid') or payload.get('uuid')
response['uuid']=uuid
cache.write_text(json.dumps(response,indent=2),encoding='utf-8')
print(response.get('stderr',''))
if not response.get('idl') or 'error[' in response.get('stderr',''):
 raise SystemExit('Build failed')
binary=urllib.request.urlopen('https://api.solpg.io/deploy/'+uuid,timeout=45).read()
if binary[:4]!=b'\x7fELF':raise SystemExit('Not an ELF program')
(root/'heli_core_v20.so').write_bytes(binary)
(root/'idl.json').write_text(json.dumps(response['idl'],indent=2),encoding='utf-8')
(root/'compiled-source.json').write_text(json.dumps({
 'source_sha256':digest,'binary_sha256':hashlib.sha256(binary).hexdigest()},indent=2),encoding='utf-8')
print(json.dumps({'bytes':len(binary),'sha256':hashlib.sha256(binary).hexdigest()}))



