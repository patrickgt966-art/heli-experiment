# HELI V20 — text review bundle

Read-only review snapshot, 4 October 2026. No live credentials or identity records.

## FILE: CLAUDE_PROMPT.md

# Paste this prompt into Claude

Please conduct an independent, adversarial review of the attached HELI V20 review package. Reply in Turkish. This is an experimental Solana token project, not a deployed or audited financial product. Do not accept the author's claims that it is complete, secure, economically sustainable, or faithful to Milton Friedman without checking the evidence.

Start with CURRENT_STATE.md and RUN_AND_EVIDENCE.md. Review actual code, not only READMEs. The ZIP preserves relative paths and includes current source, tests, existing local test reports and two program binaries. SOURCE_FOR_CHAT.md is a text alternative for a chat environment; it is not the entire executable package. FILE_MANIFEST.json records file hashes. Older names and historical descriptions may remain in the code; identify discrepancies rather than treating every document as current policy.

Do not submit code to an external compiler, create live identity sessions, transmit identity data, deploy programs, spend funds, edit production settings or use credentials. No secrets are supplied. Tests should run in isolation with synthetic identities and temporary keys. Scripts such as build.py perform external requests; do not run them merely to inspect the project.

Review these areas:

1. Token accounting: 100M mint, 10M initial burn, 1M initial free allocation, 4M initial market inventory, 70M monthly market reserve, 15M management treasury. Staking and monthly free Human Dividend are cancelled. Check invariants, SPL supply, locked versus released stock, burns, six-month handling of unused initial allocations and protection of earned but unclaimed rights.
2. Monetary rule: floor(released and unburned supply × 4,022,473,737,086,389 / 10^18) per month; initial base 5M, 720 months. Management shares the same cap. Analyze whether the 60-year 5M→90M upper path is achievable, rounding and depletion, management non-use, late settlements, unsold inventory counting in the base, last-period handling, and final burning of locked stock. Distinguish an emission ceiling from actual sales and economic demand.
3. Management and cash: one human manager, 12-month treasury lock, at most 20% of total monthly capacity and one quarter of non-management releases, shared sales/liquidity quota, funded bids, returns to project reserve, contributions, expenses, authority rotation, upgrade powers, reserve floors and withdrawal paths. Find ways to steal assets, bypass quotas, manipulate price observations or block users. Separate intended control from actual enforcement.
4. Opening auction and secondary market: auction pricing/allocation/refunds, initial 4M stock, user claims, Manifest CPI account validation, funding/order/cancel/withdraw flows, replay and reentrancy assumptions, manipulation and low-depth markets, quote mint checks. Identify remaining UI, SDK, deployment and market initialization gaps. There is no per-buyer purchase cap; concentration after purchase is allowed by current design.
5. Identity: wallet challenge signatures, Didit workflow/session/vendor binding, authenticated status, webhook signatures/timestamps/replay, durable queue, document and person HMAC deduplication, duplicate-face evidence, missing checks, manual provider approval, revoked decisions, races, multiple wallets, different documents, stolen application tokens and spoofed callbacks. Separate a real provider pilot from synthetic unit/SVM tests. One person cannot claim twice; distinct family members may participate.
6. Application and website: wallet→normal-browser handoff, fragment token handling, camera access, result refresh and error display, XSS/CSRF/origin handling, storage, logging, rate limiting and abuse, unauthenticated session costs, temporary tunnel availability, static-site claims and privacy. Check whether a normal phone user can actually complete the flow.
7. Keeper and operating costs: chain time, missed months, sequential catch-up, transaction retry journals, program/authority pins, single writer, RPC outages, funding, fee sponsorship, account rent, quote/SOL distinction, API quotas and zero-volume scenarios. Never assume trading volume creates project revenue or tokens pay fiat bills.
8. Release readiness: portable/reproducible builds, dependencies and versions, compiler provenance, binary/source linkage, scope and quality of tests, independent audit gaps, backup/recovery, monitoring, stable hosting, legal/privacy obligations and unresolved launch parameters. Use official primary sources if you research current external requirements; state which jurisdiction is missing instead of inventing it.

Output:
- A clear verdict: prototype/local-test readiness, Devnet readiness, and public/mainnet readiness assessed separately.
- Findings ordered Critical / High / Medium / Low. Each needs file and line, concrete exploit or failure scenario, likely effect, and a specific fix/test. Mark confirmed defects versus hypotheses requiring reproduction.
- A table of requirements: implemented, only simulated, incomplete, or contradicted by code/docs.
- At least five realistic adversarial/economic scenarios, including zero demand, one large buyer, unsold monthly stock, a year of keeper outage, management not using its quota, quote insolvency/SOL exhaustion, and a duplicate identity using another wallet.
- A minimal prioritized repair plan. Say what can be done before Devnet, what requires Devnet, and what blocks mainnet.
- State what you could not run or verify. Report counts accurately: assertion/transaction counts are not independent test cases or real users. Do not add the different evidence counts into one security score.

Do not rewrite the monetary policy silently. If a policy choice is problematic, explain the conflict and propose alternatives for the owner to decide. A project reserve is not a guaranteed redemption backing; no fixed-price redemption promise has been implemented merely by keeping sale proceeds.

## FILE: CURRENT_STATE.md

# HELI — Claude inceleme özeti

Hazırlanma: 4 Ekim 2026. Güncel on-chain çalışma sürümü **V20**. Bu belge bir güvenlik onayı değildir. Kullanıcının hedefi düşük kurucu katkısıyla yürüyebilen, kurallı para arzına sahip deneysel bir Solana tokenıdır.

## Geçerli tasarım

| Tahsis | HELI | İşleyiş |
|---|---:|---|
| İlk mint sırasında burn | 10.000.000 | 100M ilk mintten çıkarılır |
| İlk ücretsiz dağıtım | 1.000.000 | En çok 1.000 ayrı doğrulanmış kişi × 1.000 HELI |
| İlk piyasa envanteri | 4.000.000 | Açılış ihalesi ve sonrasında bağlı emir piyasası |
| Aylık Piyasa Arzı Kasası | 70.000.000 | Aylık kilit açılışı; ücretsiz dağıtım değildir |
| HELI Yönetim Hazinesi | 15.000.000 | Eski founder + likidite + staking tahsislerinin birleşimi |

Burn sonrası toplam 90M. Staking iptal edildi. Eski Human Dividend adı bazı alanlarda bulunur; aylık kişi başına ödeme artık yoktur. Tek yönetici insan vardır; farklı teknik anahtar rolleri bulunması ek insan/yetkili gerektirmez.

Aylık ortak tavan serbest bırakılmış, yakılmamış arz üzerinden hesaplanır. Oran yaklaşık %0,4022473737; başlangıç tabanı 5M; ilk tavan 20.112,368685 HELI. 70M stok üzerinden yüzde alınmaz. Yönetim ve aylık kasa birlikte aynı tavanı paylaşır. Yönetim 12 aylık kilitten sonra en çok %20 izin kullanabilir; ayrıca yönetim dışı gerçek release'in dörtte biri sınırı vardır. Kullanılmayan yönetim izni devretmez ve otomatik aylık kasaya aktarılmaz. 60 yıl/90M yolu bu nedenle koşullu üst yoldur, zorunlu sonuç değildir.

Unlock satış değildir. Alıcı yoksa açılmış satış stoğu bekler; aylık burn yoktur. 720. dönem kapanışı yalnız hâlâ kilitli stokları yakma kuralını içerir. Başlangıç ücretsiz kaydı ilk altı ayla sınırlıdır; yedi gün bekleme vardır. Altı ay sonunda ayrılmamış ücretsiz pay satış stokuna geçer, hak edilmiş fakat çekilmemiş pay korunur. Başlangıç 5M tabanının satılmamış/çekilmemiş envanteri de kapsamasının ekonomik sonucu incelenmelidir.

Piyasa tasarımı, önceki Meteora denemelerinden sonra V20'de **Manifest emir piyasası** bağlantısına dayanır. İlk fiyat/ihale parametreleri ilan edilmelidir; sonra fonlanmış alım/satım emirleri eşleşir. Tek kişinin tüm satış envanterini alması yasak değildir. İlk ücretsiz payın kişi başına eşitliği, sonraki mülkiyet yoğunlaşmasını önleyen bir kural değildir.

Yönetim satış gelirleri kişisel cüzdana değil proje rezervine döner. Gerçek karşılık varlığı olmadan alış likiditesi oluşmaz. Proje rezervi, fiyat garantisi veya sabit kurdan geri ödeme hakkı değildir. Gider gelirlerinin sıfır hacimde yeterli olacağı doğrulanmadı; sponsor gelirine güvenilmemesi kullanıcı tercihidir.

## Gerçekte çalışan ile henüz çalışmayan

- V20 ve Manifest ikilileri yerel Solana LiteSVM testlerinde çalıştırıldı. Devnet/mainnet dağıtımı yapılmadı. Paket içindeki program adresi yerel/test kimliğidir; canlı token adresi gibi tanıtılmamalıdır.
- Keeper V20 için hazırlanmış ve yerelde sınanmıştır; sürekli açık ağ hizmeti olarak kurulmadı.
- Didit üzerinden gerçek kimlik pilotu denenmiştir. İlk test onaylandı; sonraki aynı kişi başvuruları tekrar/face uyarılarıyla inceleme veya red aldı. Kullanıcı sonradan eski başvuruları reddetti. Bu paket gerçek kimlik belgelerini, başvuru kayıtlarını veya yüz verilerini içermez.
- Katı HELI karar değerlendiricisi yalnız sağlayıcıda Approved yazmasına bakmaz; gerekli kontroller ve boş uyarı/eşleşme kanıtları aranır. Manuel Didit onayı uyarıları otomatik kaldırmaz. Bu davranışın amaçla uyumu incelenmelidir.
- Gerçek farklı belge ve ayrı aile üyesi uçtan uca kimlik testleri tamamlanmış sayılmaz. Sentetik test geçmesi bu iddiayı kanıtlamaz.
- Kimlik sunucusu şu an **identity-only**: zincir kaydı, sponsor işlem ve coin teslimi kapalıdır. Geçici Cloudflare tunnel bilgisayara bağlıdır; kalıcı hosting değildir.
- İngilizce ana siteye 4 Ekim'de `/apply.html` başvuru girişi yayımlandı. Cloudflare üretim durumu Success. Bu ortamdan pages.dev erişim testi 20 saniyede zaman aşımına uğradı; dış erişim doğrulanamadı. Geçici pilotun config isteği HTTP 200 ve chainEnabled=false döndürdü.
- Wallet→Safari/Chrome geçişi, aynı başvuruyu fragment içindeki özel erişim tokenıyla taşır. Token uygulama durumuna erişim yetkisidir, paylaşılmamalıdır. Gerçek telefon/tarayıcı uçtan uca kabul testi tamamlanmış sayılmaz.

## Özellikle sorgulanacak tutarsızlıklar

1. `claim-service/.env.example` eski workflow editor kimliğini içerirken güncel README/launcher published API kimliğini kullanıyor. Örnek ayarı takip eden kişinin yanlış kimlik seçmesi incelenmeli.
2. Bazı README'lerde V15/önceki sürüm açıklamaları tarihsel olarak tutuldu. V20 kaynak ve V20.md üstün tutulmalı; yine de doküman çelişkileri listelenmeli.
3. Statik `heli-rules.txt` kimlik pilotunun önceki durumunu anlatabilir; son gerçek başvuruların mevcut onayı anlamına gelmez.
4. Test bağımlılıklarında yerel yollar ve eski sürüm isimleri var. Kaynakları incelemek taşınabilir; derleme/testi yeni makinede tekrarlamak ayrıca sınanmalı.
5. Kaynak hash'i ile ELF hash'inin kaydedilmesi, üçüncü taraf derleyicinin aynı kaynağı doğru derlediğinin bağımsız/reproducible-build ispatı değildir.
6. Açılış fiyatı, quote varlığı, gerçek piyasa adresi, fonlanma, kalıcı hosting, canlı işlem yetkileri ve bağımsız denetim henüz tamamlanmış kabul edilmemeli.

## Paket kapsamı

Güncel V20 Rust kaynakları/IDL/ELF; claim-service ve testleri; kullandığı mobile ortak modülleri; keeper; operations; Manifest adaptörü ve resmî program ikilisi; İngilizce website; ilgili yerel sonuçlar. V1–V19 arşivi, node_modules, bağımlılık depoları, .private, .state, cüzdan anahtarları, gerçek kişi oturumları, kimlik görüntüleri ve ekran görüntüleri dahil değildir. Tarihsel sonuçlar dosya tarihleriyle ayrılmalıdır. Gizli veriler olmadan canlı sağlayıcı doğrulaması yeniden üretilemez.

## FILE: RUN_AND_EVIDENCE.md

# Reproduction and evidence

Run only in an isolated working copy. No live API keys, private wallets or real identity records are included. Do not run `start-identity.mjs`, probes, deployment or compiler-upload scripts for this review.

## Dependency setup

Node.js 24 LTS is the suggested review runtime (built-in node:sqlite and node:test). The root package.json pins the Solana JS packages used by the shared modules. `npm install` requires network; a lock file for this new review wrapper is not supplied. The original mobile pnpm-lock.yaml is provided for provenance, but its historical package also had additional features.

Python SVM tests require a compatible `solders` with LiteSVM (the original environment used 0.29.0). Rust source pins Anchor 0.29.0. A complete locally validated clean-room Solana compiler toolchain is not supplied. Do not treat a successful third-party compilation as a production audit.

## Fresh local tests — 4 October 2026

The following command passed **70 tests, 0 failures** in the existing project environment. Output is in FRESH_TEST_OUTPUT.txt. These are selected automated service/keeper/operations/adapter tests, not 70 real users or 70 public network transactions:

```sh
node --test heli/claim-service/tests/claim.test.mjs heli/claim-service/tests/identity.test.mjs heli/claim-service/tests/browser-handoff.test.mjs heli/keeper/tests/keeper.test.mjs heli/operations/tests/operations.test.mjs heli/manifest-integration/market_adapter.test.mjs heli/manifest-integration/inventory_guard.test.mjs
```

These include synthetic provider decisions, fake RPC/SDK fixtures and local HTTP fixtures. They do not prove actual phone cameras, Didit production behavior or Devnet compatibility.

## Existing local program evidence — not rerun during packaging

| Evidence | Recorded scope |
|---|---|
| solana-v20/market-release-svm-verification.json | 1,606 checks/transactions, compiled V20 + Manifest, 720 periods |
| keeper/v20-svm-verification.json | 4,348 checks/transactions, 1,442 maintenance jobs, 720 periods, local ELF execution |
| claim-service/v20-claim-svm-verification.json | JavaScript-sponsored transaction builder → V20 local ELF, synthetic provider, native Ed25519 checks, seven-day wait, single 1,000 HELI claim |
| claim-service/identity-connection-report.json | Historical live pilot connection observations; latest restart config HTTP 200, delivery disabled |
| application-entry-deployment.json | Cloudflare Success; public pages.dev accessibility not verified |

Counts overlap in scope and are not a single combined independent security score. A current clean rerun is stronger evidence than merely reading these result files.

Optional isolated SVM commands after Python dependencies are installed:

```sh
python heli/solana-v20/scripts/test_market_release_svm.py
python heli/keeper/tests/test_v20_svm.py
```

The keeper Python bridge starts `node` through PATH. The claim SVM test defaults to the original Windows Python path; set `HELI_TEST_PYTHON` to your own Python executable before:

```sh
node --test heli/claim-service/tests/v20-svm.test.mjs
```

Fixtures check the concatenated V20 source SHA-256 and ELF hash against compiled-source.json. Source order: lib.rs, accounts.rs, calendar.rs, economics.rs, auction.rs, manifest_bridge.rs, identity.rs, release.rs, management.rs, market_release.rs.

`prepare_acceptance.py` is a historical generator referencing V19; V19 is deliberately excluded. The generated V20 test and bootstrap are included, so do not run that generator. `manifest-integration/test_official_manifest_svm.py` is excluded because it uses an older fixture; current V20 tests include actual Manifest CPI execution.

## Review artifacts

FILE_MANIFEST.json contains hashes of included files (except itself and the generated chat source bundle). The actual source is preserved unchanged; this review wrapper adds documentation and dependency instructions only. External-service IDs and public/test addresses are not private keys. No assumption about current token price, guaranteed reserve coverage or legal jurisdiction is made.

## FILE: heli/claim-service/admission.mjs

````text
import {randomBytes,randomUUID,sign,createPublicKey} from 'node:crypto';
import {hash,verifyWallet,proofMessage} from '../mobile/identity.mjs';
import {web3} from '../mobile/deps.mjs';
import {evaluateDecision} from './didit.mjs';
export class ClaimAdmission {
 constructor({program,workflowId,applicationId,provider,personSecret,verifierKey,data,environment='live',now=()=>Math.floor(Date.now()/1000)}){Object.assign(this,{program,workflowId,applicationId,provider,personSecret,verifierKey,data,environment,now});this.config=web3.PublicKey.findProgramAddressSync([Buffer.from('config')],new web3.PublicKey(program))[0].toBase58();}
 session(wallet){new web3.PublicKey(wallet);const token=randomBytes(32).toString('hex'),id=randomUUID(),expiresAt=this.now()+900;const message=`HELI initial free allocation\nWallet: ${wallet}\nApplication: ${id}\nNonce: ${randomBytes(24).toString('hex')}\nExpires: ${expiresAt}\nThis signature proves wallet ownership. It does not authorize a payment.`;const s={id,wallet,tokenHash:hash(token),message,expiresAt,status:'challenge'};this.data.sessions[id]=s;this.data.save();return {id,wallet,token,message};}
 get(id,token){const s=this.data.sessions[id];if(!s||typeof token!=='string'||hash(token)!==s.tokenHash)throw Error('Application access denied');return s;}
 async authenticate(s,signature){
  if(s.providerId)return {verificationUrl:s.verificationUrl};
  if(s.status!=='challenge'||this.now()>s.expiresAt)throw Error('Wallet challenge expired');verifyWallet(s.wallet,Buffer.from(s.message),signature);
  if(s.creating)throw Error('Verification session is being created');s.creating=true;
  try{const r=await this.provider.create(s.id);s.providerId=r.id;s.verificationUrl=r.url;s.status='verifying';this.data.save();return {verificationUrl:r.url};}finally{delete s.creating;}
 }
 apply(s,d){const r=evaluateDecision(d,{sessionId:s.providerId,vendorData:s.id,workflowId:this.workflowId,personSecret:this.personSecret});
  if(r.status==='verified'){
   if(r.keys.some(k=>this.data.people[k]&&this.data.people[k]!==s.id)){s.status='duplicate';}
   else {for(const k of r.keys)this.data.people[k]=s.id;Object.assign(s,{status:'verified',nullifier:r.nullifier,digest:r.digest});}
  }else s.status=r.status;
  this.data.save();return s;
 }
 async refresh(s){if(!s.providerId)return s;return this.apply(s,await this.provider.decision(s.providerId));}
 validateWebhook(e){if(!['status.updated','data.updated'].includes(e.webhook_type)||e.environment!==this.environment||e.application_id!==this.applicationId||e.sandbox_scenario||e.session_kind==='business')throw Error('Unexpected webhook');const s=this.data.sessions[e.vendor_data];if(!s||s.providerId!==e.session_id||e.workflow_id!==this.workflowId)throw Error('Webhook application mismatch');if(typeof e.event_id!=='string'||!e.event_id||e.event_id.length>128)throw Error('Missing event ID');return s;}
 async webhook(e){const s=this.validateWebhook(e);if(this.data.events[e.event_id])return;await this.refresh(s);this.data.events[e.event_id]=true;this.data.save();}
 async attestation(s){await this.refresh(s);if(s.status!=='verified')throw Error('Identity approval is required');const issuedAt=this.now(),expiresAt=issuedAt+600;const message=proofMessage(this.program,this.config,s.wallet,s.nullifier,s.digest,issuedAt,expiresAt);return {nullifier:s.nullifier,proofDigest:s.digest,issuedAt,expiresAt,signature:sign(null,message,this.verifierKey).toString('base64'),publicKey:new web3.PublicKey(createPublicKey(this.verifierKey).export({format:'der',type:'spki'}).subarray(-32)).toBase58()};}
}

````

## FILE: heli/claim-service/app.js

````text
const $=id=>document.getElementById(id),key='heli-v20-claim-session';let cfg,session,provider,demoKey;
const mobileWallet=()=>/Android|iPhone|iPad/i.test(navigator.userAgent)&&!!(window.phantom?.solana??window.solflare??window.solana);
function walletEntry(){const noWallet=!(window.phantom?.solana??window.solflare??window.solana);show('connect',!noWallet||cfg.mode==='demo'||!/Android|iPhone|iPad/i.test(navigator.userAgent));show('phantom',noWallet&&cfg.mode!=='demo'&&/Android|iPhone|iPad/i.test(navigator.userAgent));$('phantom').textContent='Apply with Phantom';}
function browserHandoff(){const link=applicationLink(location.origin,session);$('browserLink').href=link;show('browserHandoff',true);say('Your wallet is connected. Continue this same application in Safari or Chrome for camera access.');}

const b64=a=>btoa(String.fromCharCode(...new Uint8Array(a)));
function say(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
function show(id,on){$(id).hidden=cfg?.mode==='identity'&&['enroll','claim','advance'].includes(id)?true:!on;if(id==='demoWallet'&&cfg?.mode==='identity'){$('introText').textContent='Test the connection between your Solana wallet and Didit identity verification. Free token distribution is not open.';$('flowTitle').textContent='Wallet & identity verification';$('flowBadge').textContent='Identity test';$('step3').textContent='Entitlement registration — not open';$('step4').textContent='Token claim — not open';}}
function save(){localStorage.setItem(key,JSON.stringify(session));}
async function api(path,body={}){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);try{const r=await fetch('/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:session?.id,token:session?.token,...body}),signal:controller.signal});const d=await r.json();if(!r.ok)throw Error(d.error??'Could not refresh your application.');return d;}catch(e){if(controller.signal.aborted)throw Error('The connection timed out. Press Refresh status to try again.');throw e;}finally{clearTimeout(timer);}}
async function connect(demo=false){if(demo){demoKey=await crypto.subtle.generateKey('Ed25519',false,['sign','verify']);provider={publicKey:new solanaWeb3.PublicKey(new Uint8Array(await crypto.subtle.exportKey('raw',demoKey.publicKey)))};}else{provider=window.phantom?.solana??window.solflare??window.solana;if(!provider)throw Error('Open this page inside your Solana wallet app.');await provider.connect();}
 session=await api('session',{wallet:provider.publicKey.toBase58()});const bytes=new TextEncoder().encode(session.message);const sig=demoKey?await crypto.subtle.sign('Ed25519',demoKey.privateKey,bytes):(await provider.signMessage(bytes,'utf8')).signature;const result=await api('authenticate',{signature:b64(sig)});session.verificationUrl=result.verificationUrl;save();$('wallet').textContent=session.wallet;show('connect',false);show('demoWallet',false);show('verify',true);show('refresh',true);$('step1').classList.add('done');say(cfg.mode==='demo'?'Test wallet connected. Continue with a fictional test identity.':'Wallet connected. Press Continue identity verification to finish your application.');}
function resultBox(title,detail,kind='pending'){show('applicationResult',true);$('applicationResult').className='application-result '+kind;$('resultTitle').textContent=title;$('resultDetail').textContent=detail;$('resultChecked').textContent=kind==='loading'?'Checking the application server…':'Last check: '+new Date().toLocaleTimeString();}
let checkingStatus=false;
async function status(interactive=false){if(checkingStatus)return;if(!session){resultBox('No application connected','Connect your wallet or open your private application link in this browser.','error');return;}checkingStatus=true;$('refresh').disabled=true;$('refresh').textContent='Checking status…';resultBox('Checking your application','Please wait for the latest result.','loading');try{const d=await api('status');if(d.verificationUrl){session.verificationUrl=d.verificationUrl;save();}$('wallet').textContent=d.wallet;show('verify',d.status==='verifying');show('enroll',d.status==='verified');show('advance',cfg.mode==='demo'&&d.status==='enrolled'&&d.eligibleAt>Date.now()/1000);show('claim',d.status==='enrolled'&&d.eligibleAt<=Date.now()/1000);show('refresh',true);show('connect',false);show('demoWallet',false);const texts={challenge:'Reconnect your wallet to prove ownership.',verifying:'Identity verification is pending.',review:'Your application is under review. No entitlement has been approved.',verified:'Identity accepted. Register your entitlement using your wallet.',enrolled:'Entitlement registered. Claim available: '+(d.eligibleAt?new Date(d.eligibleAt*1000).toLocaleString():'refresh status'),claimed:cfg.mode==='demo'?'Simulation complete: a 1,000 HELI claim was recorded. No tokens were sent.':'The on-chain receipt confirms your 1,000 HELI claim.',duplicate:'This verified identity already has another application. A second free entitlement is unavailable.',declined:'Identity verification was declined. No free entitlement was granted.',expired:'Identity verification expired. Start a new application.'};show('browserHandoff',mobileWallet()&&d.status==='verifying');if(mobileWallet()&&d.status==='verifying')$('browserLink').href=applicationLink(location.origin,session);if(cfg.mode==='identity'&&d.status==='verified')texts.verified='Identity verification accepted and bound to this wallet. Registration and token delivery are not open in this identity-only pilot.';const labels={challenge:'Wallet signature required',verifying:'Verification pending',review:'Under review',verified:'Identity approved',enrolled:'Entitlement registered',claimed:'Claim completed',duplicate:'Duplicate application',declined:'Application declined',expired:'Verification expired'};resultBox(labels[d.status]??'Status unavailable',texts[d.status]??'The server returned an unrecognized status. Try refreshing again.',['declined','duplicate','expired'].includes(d.status)?'rejected':['verified','enrolled','claimed'].includes(d.status)?'accepted':'pending');say(texts[d.status]??'Refresh to check your application.');['step1','step2','step3','step4'].forEach((id,i)=>$(id).classList.toggle('done',i===0||i===1&&['verified','enrolled','claimed'].includes(d.status)||i===2&&['enrolled','claimed'].includes(d.status)||i===3&&d.status==='claimed'));}catch(e){resultBox('Could not refresh status',e.message,'error');say(e.message,true);}finally{checkingStatus=false;$('refresh').disabled=false;$('refresh').textContent='Refresh status';if(interactive)$('applicationResult').scrollIntoView?.({behavior:'smooth',block:'center'});}}
async function transaction(action){provider=window.phantom?.solana??window.solflare??window.solana;if(!provider?.signTransaction)throw Error('Continue inside your Solana wallet app.');await provider.connect();if(provider.publicKey.toBase58()!==session.wallet)throw Error('Select the wallet used for this application.');const plan=await api('transaction',{action}),tx=solanaWeb3.Transaction.from(Uint8Array.from(atob(plan.transaction),c=>c.charCodeAt(0)));const signed=await provider.signTransaction(tx),r=await api('submit',{ticket:plan.ticket,transaction:b64(signed.serialize())});if(r.pending){say('Transaction submitted. Network confirmation is pending; refresh status.');return;}await status();}
function action(id,fn){$(id).onclick=async()=>{const b=$(id);b.disabled=true;try{await fn();}catch(e){say(e.message,true);}finally{b.disabled=false;}};}
action('connect',()=>connect());action('demoWallet',()=>connect(true));action('refresh',()=>status(true));
action('verify',async()=>{if(cfg.mode==='demo'){show('demoPerson',true);show('verify',false);return;}if(mobileWallet()){browserHandoff();return;}const u=new URL(session.verificationUrl);if(u.origin!=='https://verify.didit.me'||u.username||u.password)throw Error('Unexpected verification link');location.assign(u.href);});
action('demoVerify',async()=>{await api('demo/verify',{person:$('person').value});show('demoPerson',false);await status();});
action('enroll',async()=>{if(cfg.mode==='demo'){await api('demo/enroll');await status();}else await transaction('enroll');});action('advance',async()=>{await api('demo/advance');await status();});action('claim',async()=>{if(cfg.mode==='demo'){await api('demo/claim');await status();}else await transaction('claim');});
action('copyBrowserLink',async()=>{await navigator.clipboard.writeText(applicationLink(location.origin,session));say('Application link copied. Paste it into Safari or Chrome, then press Continue identity verification.');});
action('shareBrowserLink',async()=>{if(!navigator.share){await navigator.clipboard.writeText(applicationLink(location.origin,session));say('Link copied. Open it in Safari or Chrome.');return;}await navigator.share({title:'Continue your HELI application',url:applicationLink(location.origin,session)});});
action('reset',async()=>{localStorage.removeItem(key);location.replace('/');});
(async()=>{cfg=await(await fetch('/api/config')).json();$('mode').textContent=cfg.mode==='demo'?'Local demo':cfg.mode==='identity'?'Identity-only pilot':'Devnet pilot';$('notice').textContent=cfg.mode==='demo'?'Local simulation only. No real identity check, SOL payment or token delivery occurs. Use fictional test data.':cfg.mode==='identity'?'Real Didit identity verification only. No HELI entitlement, token transfer or SOL payment is enabled.':'Solana Devnet pilot. Test tokens only. The project pays transaction fees within its available budget.';show('demoWallet',cfg.mode==='demo');$('phantom').href='https://phantom.app/ul/browse/'+encodeURIComponent(location.origin+'/')+'?ref='+encodeURIComponent(location.origin);show('phantom',cfg.mode!=='demo'&&!window.phantom?.solana&&!window.solflare&&!window.solana);let transferred;try{transferred=applicationFromFragment(location.hash);}finally{if(location.hash.startsWith('#application='))history.replaceState(null,'',location.pathname);}try{session=transferred??JSON.parse(localStorage.getItem(key));}catch{session=null;}if(transferred)save();if(session)await status();else walletEntry();window.addEventListener('pageshow',()=>{if(session)status().catch(e=>say(e.message,true));});})().catch(e=>say(e.message,true));

````

## FILE: heli/claim-service/browser-handoff.js

````text
// Application credentials stay in a URL fragment, never a query or server log.
function handoffPayload(value) {
 if(!value || typeof value.id!=='string' || !/^[a-f0-9-]{36}$/i.test(value.id) || typeof value.token!=='string' || !/^[a-f0-9]{64}$/.test(value.token))throw Error('Invalid application link. Return to the wallet browser.');
 return {id:value.id,token:value.token};
}
function applicationLink(origin,session) {return origin+'/#application='+encodeURIComponent(JSON.stringify(handoffPayload(session)));}
function applicationFromFragment(fragment) {
 if(!fragment.startsWith('#application='))return null;
 return handoffPayload(JSON.parse(decodeURIComponent(fragment.slice(13))));
}
if(typeof module!=='undefined')module.exports={applicationLink,applicationFromFragment};

````

## FILE: heli/claim-service/chain.mjs

````text
import {createHash} from 'node:crypto';
import {SponsoredChain,decodeAccount} from '../mobile/solana.mjs';
const size=t=>t==='publicKey'?32:t==='bool'?1:typeof t==='string'?Number(t.slice(1))/8:t.array?size(t.array[0])*t.array[1]:NaN;
export class V20Chain extends SponsoredChain {
 async account(address,type){const a=await this.connection.getAccountInfo(address,'confirmed');if(!a)return null;
  const fields=this.idl.accounts.find(x=>x.name===type)?.type.fields;
  const expected=createHash('sha256').update('account:'+type).digest().subarray(0,8);
  const minimum=8+(fields??[]).reduce((n,f)=>n+size(f.type),0);
  if(!fields||!Number.isFinite(minimum)||!a.owner.equals(this.program)||a.data.length<minimum||!a.data.subarray(0,8).equals(expected))throw Error('Invalid HELI account');
  return decodeAccount(this.idl,type,a.data);
 }
 async status(wallet,nullifier){const credential=this.pda('human',Buffer.from(nullifier,'hex'));const c=await this.account(credential,'Credential');if(c&&(!c.active||c.owner!==wallet))throw Error('Identity credential is not active for this wallet');const r=await this.account(this.pda('launch-receipt',credential.toBuffer()),'LaunchReceipt');if(r&&(!c||!r.valid||r.owner!==wallet))throw Error('Application entitlement is unavailable');return r?{status:r.claimed?'claimed':'enrolled',eligibleAt:Number(r.eligible_at)}:{status:'verified'};}
}

````

## FILE: heli/claim-service/didit.mjs

````text
import {createHmac,timingSafeEqual} from 'node:crypto';
import {hash} from '../mobile/identity.mjs';
const BASE='https://verification.didit.me';
export function verifyWebhook(raw,headers,secret,now=Math.floor(Date.now()/1000),{allowTransportTest=false}={}) {
 const timestamp=headers['x-timestamp'],signature=headers['x-signature'];
 if(!/^\d+$/.test(timestamp??'')||Math.abs(now-Number(timestamp))>300||!/^([a-fA-F0-9]{64})$/.test(signature??''))throw Error('Invalid webhook signature');
 const expected=createHmac('sha256',secret).update(raw).digest();
 if(!timingSafeEqual(expected,Buffer.from(signature,'hex')))throw Error('Invalid webhook signature');
 const e=JSON.parse(raw);
 if(e.timestamp!==Number(timestamp)||(headers['x-didit-test-webhook']==='true'&&!allowTransportTest))throw Error('Invalid webhook envelope');
 return e;
}
export class Didit {
 constructor({apiKey,workflowId,callback,fetcher=fetch}){Object.assign(this,{apiKey,workflowId,callback,fetcher});}
 async request(path,body){const r=await this.fetcher(BASE+path,{method:body?'POST':'GET',headers:{'x-api-key':this.apiKey,'Content-Type':'application/json',Accept:'application/json'},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(15000)});if(!r.ok){const e=Error('Identity provider unavailable');e.httpStatus=r.status;throw e;}return r.json();}
 async create(id){const r=await this.request('/v3/session/',{workflow_id:this.workflowId,vendor_data:id,callback:this.callback,language:'en'});const u=new URL(r.url);if(u.origin!=='https://verify.didit.me'||u.username||u.password||r.vendor_data!==id||r.workflow_id!==this.workflowId||typeof r.session_id!=='string')throw Error('Invalid provider session');return {id:r.session_id,url:u.href};}
 decision(id){if(!/^[a-f0-9-]{36}$/i.test(id))throw Error('Invalid provider ID');return this.request('/v3/session/'+id+'/decision/');}
}
export function evaluateDecision(d,{sessionId,vendorData,workflowId,personSecret}) {
 if(d.session_id!==sessionId||d.vendor_data!==vendorData||d.workflow_id!==workflowId)throw Error('Decision does not match application');
 const states={'Not Started':'verifying','In Progress':'verifying','Awaiting User':'verifying','Resubmitted':'verifying','In Review':'review','Declined':'declined','Abandoned':'expired','Expired':'expired','Kyc Expired':'expired'};
 if(d.status!=='Approved')return {status:states[d.status]??'review'};
 const groups=['id_verifications','liveness_checks','face_matches'];
 if(groups.some(k=>!Array.isArray(d[k])||!d[k].length||d[k].some(x=>x.status!=='Approved'||!Array.isArray(x.warnings)||!Array.isArray(x.matches??[]))))return {status:'review'};
 if([...d.id_verifications,...d.liveness_checks].some(x=>!Array.isArray(x.matches)))return {status:'review'};
 const checks=groups.flatMap(k=>d[k]);
 // Conservative duplicate handling: review ANY cross-session match or warning.
 // No guessed similarity threshold and no invented provider-wide person ID.
 if(checks.some(x=>x.warnings.length||(x.matches??[]).length)|| (Array.isArray(d.warnings)&&d.warnings.length))return {status:'review'};
 const keys=[];
 for(const id of d.id_verifications){
  if(!Number.isInteger(id.age)||id.age<18||typeof id.issuing_state!=='string'||!id.issuing_state.trim()||typeof id.document_number!=='string'||!id.document_number.trim()||typeof id.document_type!=='string')return {status:'review'};
  const norm=x=>x.normalize('NFKC').trim().toUpperCase();
  const make=(kind,value)=>createHmac('sha256',personSecret).update(JSON.stringify(['HELI:DIDIT:V20',kind,norm(id.issuing_state),norm(value)])).digest('hex');
  keys.push(make('document:'+norm(id.document_type),id.document_number));
  if(typeof id.personal_number==='string'&&id.personal_number.trim())keys.push(make('national-person',id.personal_number));
 }
 return {status:'verified',keys:[...new Set(keys)],nullifier:hash(Buffer.from('HELI:DIDIT:NULLIFIER:V20\0'+keys[0])),digest:hash(Buffer.from(JSON.stringify(d)))};
}

````

## FILE: heli/claim-service/index.html

````text
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Claim your first share · HELI</title><link rel="stylesheet" href="/style.css"><script src="/web3.js" defer></script><script src="/browser-handoff.js" defer></script><script src="/app.js" defer></script></head><body><main><header><a href="https://heli-experiment.pages.dev/" class="brand">H <span>HELI</span></a><span id="mode" class="pill">Loading</span></header><section class="intro"><p class="eyebrow">INITIAL FREE ALLOCATION</p><h1>Your first share.<br><em>One person. One claim.</em></h1><p id="introText">1,000 HELI per accepted participant. Verify on your phone, register your entitlement and return after seven days.</p><div id="notice" class="notice">Public distribution is not open.</div></section><section class="card"><div class="card-heading"><h2 id="flowTitle">Verification &amp; claim</h2><span id="flowBadge" class="pill">1,000 HELI</span></div><ol><li id="step1">Connect your wallet</li><li id="step2">Verify your identity</li><li id="step3">Register your entitlement</li><li id="step4">Claim after seven days</li></ol><p id="status" role="status" aria-live="polite">Connect your own Solana wallet to begin.</p><section id="applicationResult" class="application-result" role="status" aria-live="polite" hidden><h3 id="resultTitle"></h3><p id="resultDetail"></p><p id="resultChecked" class="small"></p></section><p id="wallet" class="wallet"></p><p class="small">Start here: connect your wallet, then continue to identity verification. On a phone, use Phantom for the wallet step and Safari or Chrome for the camera step.</p><button id="connect">Start application · Connect wallet</button><a id="phantom" class="secondary" hidden>Open in Phantom</a><button id="demoWallet" class="secondary" hidden>Try with a temporary test wallet</button><button id="verify" hidden>Continue identity verification</button><section id="browserHandoff" class="handoff" hidden><h3>Continue in Safari or Chrome</h3><p>Your wallet is already connected. Camera verification works best outside the wallet browser.</p><a id="browserLink" class="secondary" target="_blank" rel="noopener noreferrer">Open this application in a browser</a><button id="copyBrowserLink" class="secondary">Copy application link</button><button id="shareBrowserLink" class="secondary">Share / open application link</button><p class="small">If Phantom keeps the link inside its app, copy it and paste into Safari or Chrome. Your application will be restored automatically. Keep this private link to yourself. Then press Continue identity verification.</p></section><div id="demoPerson" hidden><label for="person">Fictional test person code</label><input id="person" maxlength="80" placeholder="Example: test-person-1" autocomplete="off"><p class="small">Do not enter a real document number. Reusing this code with another wallet tests duplicate rejection.</p><button id="demoVerify">Simulate an approved result</button></div><button id="enroll" hidden>Register my entitlement</button><button id="advance" class="secondary" hidden>Simulate seven days passing</button><button id="claim" hidden>Claim 1,000 HELI</button><button id="refresh" class="secondary" hidden>Refresh status</button><button id="reset" class="text-button">Use another wallet / application</button></section><footer><p>Identity documents and face capture belong in Didit's verification flow. Never enter your wallet recovery phrase here.</p><p>This browser stores an application access token so you can return. Token delivery still requires the same wallet's signature. When switching browsers, use the private application link above to keep the same application. Clearing browser data removes this return shortcut.</p><a href="https://heli-experiment.pages.dev/#transparency">Read HELI's rules →</a></footer></main></body></html>

````

## FILE: heli/claim-service/server.mjs

````text
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {createPrivateKey,createPublicKey,generateKeyPairSync,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {web3} from '../mobile/deps.mjs';
import {storage} from './storage.mjs';
import {ClaimAdmission} from './admission.mjs';
import {Didit,verifyWebhook} from './didit.mjs';
import {V20Chain} from './chain.mjs';
import {WebhookQueue} from './webhook-queue.mjs';
const PROGRAM=readFileSync(new URL('../solana-v20/src/lib.rs',import.meta.url),'utf8').match(/declare_id!\("([^"]+)"\)/)[1];
export function createClaimServer({origin,admission,chain,data,mode='demo',webhookSecret,queue,now=()=>Math.floor(Date.now()/1000)}){
 const publicOrigin=new URL(origin);if(publicOrigin.origin!==origin||publicOrigin.username||publicOrigin.password|| (mode!=='demo'&&publicOrigin.protocol!=='https:')||(mode==='identity'&&chain))throw Error('Invalid public origin or identity-only chain');
 const counts=new Map(),statusTimes=new Map();
 const files={'/':['index.html','text/html; charset=utf-8'],'/browser-handoff.js':['browser-handoff.js','text/javascript; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8'],'/web3.js':['../solana/node_modules/@solana/web3.js/lib/index.iife.min.js','text/javascript']};
 return createServer(async(req,res)=>{
  const send=(code,value)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
  try{
   if(req.headers.host!==publicOrigin.host)return send(403,{error:'Unexpected host'});
   const path=new URL(req.url,origin).pathname;
   if(req.method==='GET'){
    if(path==='/api/config')return send(200,{mode,provider:'Didit',program:admission.program,amount:1000,waitDays:7,chainEnabled:!!chain});
    const file=files[path];if(!file)return send(404,{error:'Not found'});
    res.writeHead(200,{'Content-Type':file[1],'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"});return res.end(readFileSync(new URL(file[0],import.meta.url)));
   }
   if(req.method!=='POST'||req.headers['content-type']?.split(';')[0]!=='application/json')return send(403,{error:'Request rejected'});
   if(path!=='/webhooks/didit'&&req.headers.origin!==origin)return send(403,{error:'Request origin rejected'});
   const bucket=Math.floor(now()/60),counter=counts.get('global');if(!counter||counter.bucket!==bucket)counts.set('global',{bucket,n:0});if(++counts.get('global').n>120)return send(429,{error:'Too many requests. Please wait.'});
   let size=0;const chunks=[];for await(const c of req){size+=c.length;if(size>(path==='/webhooks/didit'?1_000_000:16000))return send(413,{error:'Request too large'});chunks.push(c);}const raw=Buffer.concat(chunks);
   if(path==='/webhooks/didit'){if(mode==='demo')return send(403,{error:'Live webhooks disabled'});const event=verifyWebhook(raw,req.headers,webhookSecret,now(),{allowTransportTest:true});if(req.headers['x-didit-test-webhook']==='true')return send(200,{ok:true,test:true,admissionApplied:false});if(queue)queue.enqueue(event);else await admission.webhook(event);return send(200,{ok:true});}
   const b=JSON.parse(raw);
   if(path==='/api/session')return send(200,admission.session(b.wallet));
   const s=admission.get(b.id,b.token);
   if(path==='/api/authenticate')return send(200,await admission.authenticate(s,b.signature));
   if(path==='/api/status'){
    if(s.providerId&&now()-(statusTimes.get(s.id)??0)>=15){await admission.refresh(s);statusTimes.set(s.id,now());}
    let result={status:s.status,wallet:s.wallet,verificationUrl:s.verificationUrl??null,eligibleAt:s.eligibleAt??null};
    if(chain&&s.status==='verified')Object.assign(result,await chain.status(s.wallet,s.nullifier));
    if(!chain&&s.demoClaimed)result.status='claimed';else if(!chain&&s.eligibleAt)result.status='enrolled';
    return send(200,result);
   }
   if(path==='/api/transaction'){if(!chain)throw Error('On-chain delivery is disabled in this demo');const proof=await admission.attestation(s);return send(200,await chain.prepare(s,b.action,proof));}
   if(path==='/api/submit'){if(!chain)throw Error('On-chain delivery is disabled in this demo');await admission.attestation(s);return send(200,await chain.submit({id:s.id,wallet:s.wallet},b.ticket,b.transaction));}
   if(mode==='demo'){
    if(path==='/api/demo/verify'){if(s.status!=='verifying')throw Error('Authenticate your wallet first');if(typeof b.person!=='string'||!b.person.trim()||b.person.length>80)throw Error('Enter a fictional test person code');const d={session_id:s.providerId,vendor_data:s.id,workflow_id:admission.workflowId,status:'Approved',id_verifications:[{status:'Approved',document_number:b.person.trim(),document_type:'Test',issuing_state:'TEST',age:30,warnings:[],matches:[]}],liveness_checks:[{status:'Approved',warnings:[],matches:[]}],face_matches:[{status:'Approved',warnings:[]}]};admission.provider.decisions.set(s.providerId,d);admission.apply(s,d);return send(200,{status:s.status});}
    if(path==='/api/demo/enroll'){if(s.status!=='verified'||s.eligibleAt)throw Error('No new entitlement');s.eligibleAt=now()+7*86400;data.save();return send(200,{ok:true});}
    if(path==='/api/demo/advance'){if(!s.eligibleAt||s.demoClaimed)throw Error('No waiting application');s.eligibleAt=now()-1;data.save();return send(200,{ok:true});}
    if(path==='/api/demo/claim'){if(!s.eligibleAt||s.eligibleAt>now()||s.demoClaimed)throw Error('Claim unavailable');s.demoClaimed=true;data.save();return send(200,{simulated:true,amount:1000});}
   }
   return send(404,{error:'Not found'});
  }catch(e){if(mode!=='demo')console.error(JSON.stringify({event:'request_rejected',providerHttpStatus:e.httpStatus??null,reason:['Invalid provider session','Identity provider unavailable','Wallet challenge expired','Decision does not match application'].includes(e.message)?e.message:'Request validation rejected'}));const allowed=['Application access denied','Wallet challenge expired','Identity approval is required','Claim unavailable','No new entitlement','Authenticate your wallet first'];send(400,{error:allowed.includes(e.message)?e.message:'Request could not be completed. Check your application status and try again.'});}
 });
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const env=process.env,mode=env.HELI_MODE??'demo',port=Number(env.PORT??8781);if(!['demo','identity','devnet'].includes(mode))throw Error('Only demo, identity or devnet is supported');
 const origin=env.HELI_CLAIM_PUBLIC_URL??'http://127.0.0.1:'+port;
 let provider,chain,verifierKey,personSecret,data;
 if(mode!=='demo'){
  for(const key of ['HELI_CLAIM_PUBLIC_URL','DIDIT_API_KEY','DIDIT_WEBHOOK_SECRET','DIDIT_WORKFLOW_ID','DIDIT_APPLICATION_ID','HELI_PERSON_HMAC_SECRET'])if(!env[key])throw Error('Missing '+key);
  if(env.HELI_DUPLICATE_POLICY_CONFIRMED!=='true')throw Error('Confirm published workflow duplicate review and 18+ policy');
  if(env.HELI_PERSON_HMAC_SECRET.length<32||env.DIDIT_WEBHOOK_SECRET.length<32)throw Error('Identity secrets must be at least 32 characters');
  provider=new Didit({apiKey:env.DIDIT_API_KEY,workflowId:env.DIDIT_WORKFLOW_ID,callback:origin+'/'});personSecret=env.HELI_PERSON_HMAC_SECRET;
 }
 if(mode==='identity')verifierKey=generateKeyPairSync('ed25519').privateKey;
 else if(mode==='devnet'){
  for(const key of ['HELI_CLAIM_PUBLIC_URL','DIDIT_API_KEY','DIDIT_WEBHOOK_SECRET','DIDIT_WORKFLOW_ID','DIDIT_APPLICATION_ID','HELI_PERSON_HMAC_SECRET','HELI_VERIFIER_KEY_FILE','HELI_SPONSOR_KEY_FILE','HELI_RPC_URL','HELI_PROGRAM_ID'])if(!env[key])throw Error('Missing '+key);
  if(env.HELI_DUPLICATE_POLICY_CONFIRMED!=='true')throw Error('Confirm published workflow duplicate face/document review and 18+ policy before enabling');
  if(env.HELI_PERSON_HMAC_SECRET.length<32||env.DIDIT_WEBHOOK_SECRET.length<32)throw Error('Identity secrets must be at least 32 characters');
  provider=new Didit({apiKey:env.DIDIT_API_KEY,workflowId:env.DIDIT_WORKFLOW_ID,callback:origin+'/'});verifierKey=createPrivateKey(readFileSync(env.HELI_VERIFIER_KEY_FILE));personSecret=env.HELI_PERSON_HMAC_SECRET;
  const connection=new web3.Connection(env.HELI_RPC_URL,'confirmed');if(await connection.getGenesisHash()!=='EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG')throw Error('Only Solana Devnet is allowed');
  const idl=JSON.parse(readFileSync(new URL('../solana-v20/idl.json',import.meta.url)));const p=await connection.getAccountInfo(new web3.PublicKey(env.HELI_PROGRAM_ID));if(!p?.executable)throw Error('HELI program is not deployed');
  const sponsor=web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(env.HELI_SPONSOR_KEY_FILE,'utf8'))));data=storage(fileURLToPath(new URL('./.state/claim.sqlite',import.meta.url)));chain=new V20Chain({program:env.HELI_PROGRAM_ID,idl,sponsor,connection,store:data,dailyCap:Number(env.HELI_DAILY_CAP_LAMPORTS??50_000_000)});
  if(!Number.isSafeInteger(chain.dailyCap)||chain.dailyCap<=0)throw Error('Invalid sponsor budget');
  if(verifierKey.asymmetricKeyType!=='ed25519')throw Error('Verifier must use Ed25519');const policy=await chain.account(chain.pda('identity-policy'),'IdentityPolicy');const verifier=new web3.PublicKey(createPublicKey(verifierKey).export({format:'der',type:'spki'}).subarray(-32));if(policy?.verifier!==verifier.toBase58()||sponsor.publicKey.equals(verifier))throw Error('Verifier policy is not configured correctly');
 }else if(mode==='demo'){
  verifierKey=generateKeyPairSync('ed25519').privateKey;personSecret='local-test-only-secret-not-for-production';provider={decisions:new Map(),async create(id){const pid=randomUUID();this.decisions.set(pid,{session_id:pid,vendor_data:id,workflow_id:env.DIDIT_WORKFLOW_ID??'local-demo',status:'Not Started'});return {id:pid,url:'https://verify.didit.me/session/local-demo-not-live'};},async decision(id){const d=this.decisions.get(id);if(!d)throw Error('Demo identity not completed');return d;}};
 }
 data??=storage(mode==='demo'?':memory:':fileURLToPath(new URL('./.state/claim.sqlite',import.meta.url)));
 const admission=new ClaimAdmission({program:env.HELI_PROGRAM_ID??PROGRAM,workflowId:env.DIDIT_WORKFLOW_ID??'local-demo',applicationId:env.DIDIT_APPLICATION_ID??'local-demo',provider,personSecret,verifierKey,data});
 const queue=mode==='demo'?null:new WebhookQueue({admission,data});
 const timer=queue?setInterval(()=>queue.step().catch(()=>{}),1000):null;
 const server=createClaimServer({origin,admission,chain,data,mode,queue,webhookSecret:env.DIDIT_WEBHOOK_SECRET});server.listen(port,'127.0.0.1',()=>console.log('HELI V20 claim service '+mode+' '+origin));for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{if(timer)clearInterval(timer);server.close(()=>{data.close();process.exit(0);});});
}

````

## FILE: heli/claim-service/start-identity.mjs

````text
// Run only after HTTPS destination and workflow policy have been confirmed.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('./.private/',import.meta.url),read=name=>readFileSync(new URL(name,root),'utf8').trim();
const origin=process.argv[2];if(!origin||new URL(origin).protocol!=='https:'||new URL(origin).origin!==origin)throw Error('Supply the verified HTTPS origin');
const secretFile=new URL('person-hmac.txt',root);if(!existsSync(secretFile))writeFileSync(secretFile,randomBytes(32).toString('hex'),{mode:0o600,flag:'wx'});
const policy=JSON.parse(read('workflow-confirmed.json'));if(!policy.confirmed||policy.editorWorkflowId!=='2856c2d4-eac4-45a9-b13d-09ebe05481f7'||policy.workflowId!=='a8a9365f-3306-4f9f-849a-4a565580f35d')throw Error('Check the live workflow policy and published API ID first');
const env={...process.env,HELI_MODE:'identity',PORT:'8782',HELI_CLAIM_PUBLIC_URL:origin,DIDIT_API_KEY:read('didit-api-key.txt'),DIDIT_WEBHOOK_SECRET:read('didit-webhook-secret.txt'),HELI_PERSON_HMAC_SECRET:read('person-hmac.txt'),DIDIT_WORKFLOW_ID:policy.workflowId,DIDIT_APPLICATION_ID:'ec9dac23-369c-4bba-8b13-82e3b8935f03',HELI_DUPLICATE_POLICY_CONFIRMED:'true'};
for(const key of ['DIDIT_API_KEY','DIDIT_WEBHOOK_SECRET','HELI_PERSON_HMAC_SECRET'])if(env[key].length<32)throw Error('Private credential is empty or incomplete: '+key);
const child=spawn(process.execPath,[fileURLToPath(new URL('./server.mjs',import.meta.url))],{env,stdio:'inherit',windowsHide:true});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exit(code??1));

````

## FILE: heli/claim-service/storage.mjs

````text
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,openSync,closeSync,unlinkSync} from 'node:fs';
import {dirname} from 'node:path';
export function storage(path=':memory:') {
 let lock;
 if(path!==':memory:'){mkdirSync(dirname(path),{recursive:true});lock=openSync(path+'.lock','wx',0o600);}
 const db=new DatabaseSync(path);db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS state(id INTEGER PRIMARY KEY CHECK(id=1),json TEXT NOT NULL)');
 const row=db.prepare('SELECT json FROM state WHERE id=1').get();
 const state=row?JSON.parse(row.json):{sessions:{},people:{},events:{},budgets:{},pending:{}};
 return Object.assign(state,{save(){db.prepare('INSERT INTO state(id,json) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json').run(JSON.stringify(state));},close(){db.close();if(lock!==undefined){closeSync(lock);unlinkSync(path+'.lock');lock=undefined;}}});
}

````

## FILE: heli/claim-service/style.css

````text
:root{color-scheme:dark;font-family:"Segoe UI",system-ui,sans-serif;color:#e6edf2;background:#080d12;--mint:#a3edcf;--muted:#98aab7}*{box-sizing:border-box}body{margin:0}main{max-width:620px;margin:auto;padding:28px 24px 48px}header{display:flex;justify-content:space-between;align-items:center;gap:18px}.brand{font-size:23px;text-decoration:none;color:var(--mint);font-weight:650}.brand span{color:#e6edf2;margin-left:10px}.pill{border:1px solid #ffffff24;border-radius:30px;font-size:11px;padding:6px 11px;white-space:nowrap;color:#b0c3cc}.intro{padding:48px 0 26px}.eyebrow{font-size:10px;letter-spacing:2px;color:var(--mint)}h1{font-size:clamp(32px,6vw,44px);line-height:1.14;letter-spacing:-1.6px;font-weight:500;margin:18px 0 24px}em{font-style:normal;color:var(--mint)}p{line-height:1.7;color:var(--muted);font-size:15px}.notice{padding:15px 18px;font-size:12px;line-height:1.65;border:1px solid #a3edcf25;background:#a3edcf08;border-radius:12px;color:#bcd4ca}.card{padding:28px;border:1px solid #ffffff20;background:linear-gradient(145deg,#14231e,#101820 65%);border-radius:22px}.card-heading{display:flex;justify-content:space-between;align-items:center;gap:12px}h2{font-size:20px;letter-spacing:-.5px;font-weight:500;margin:0}ol{padding:0;list-style:none;counter-reset:step;margin:30px 0}li{counter-increment:step;display:flex;align-items:center;gap:14px;font-size:13px;color:var(--muted);padding:12px 0;border-bottom:1px solid #ffffff10}li:before{content:counter(step,decimal-leading-zero);color:var(--mint);font-size:10px;width:28px;height:28px;background:#a3edcf07;border:1px solid #a3edcf20;border-radius:8px;display:grid;place-items:center}li.done{color:var(--mint)}li.done:before{content:'✓'}button,.secondary{width:100%;display:block;min-height:48px;border:1px solid transparent;border-radius:12px;padding:14px 16px;font:600 13px "Segoe UI",system-ui,sans-serif;background:var(--mint);color:#10281d;text-align:center;cursor:pointer;text-decoration:none;margin-top:12px}button:disabled{opacity:.5;cursor:wait}.secondary{border-color:#ffffff24;background:#ffffff04;color:#c0d0da}.text-button{background:transparent;color:var(--muted);font-size:11px;margin-top:18px}.wallet{font-size:11px;overflow-wrap:anywhere;padding:12px;background:#080d1266;border-radius:8px}.wallet:empty{display:none}label{font-size:12px;color:#c0d0da}input{width:100%;background:#080d12;border:1px solid #a3edcf30;color:#e6edf2;border-radius:8px;padding:13px;font:inherit;margin-top:10px}footer{padding:20px 5px}footer p,.small{font-size:11px;line-height:1.75}footer a{font-size:12px;color:var(--mint);text-decoration:none}a:focus-visible,button:focus-visible,input:focus-visible{outline:2px solid var(--mint);outline-offset:4px}[hidden]{display:none!important}#status{font-size:13px;color:#c8d6de}#status.error{color:#f3b2a7}@media(max-width:420px){main{padding:22px 18px}.card{padding:22px}.card-heading{align-items:flex-start}h2{font-size:18px}.intro{padding-top:38px}}

.handoff{margin-top:20px;padding:18px;border:1px solid #a3edcf40;border-radius:12px;background:#080d12}.handoff h3{font-size:17px;margin:0}.handoff p{font-size:13px}

.application-result{margin:18px 0;padding:20px;border:2px solid #dfbb6555;border-radius:14px;background:#dfbb6510}.application-result h3{margin:0;font-size:23px;color:#edcf8d}.application-result p{margin:10px 0 0;color:#d3dee5;font-size:13px}.application-result.rejected,.application-result.error{border-color:#f39e9e;background:#f39e9e12}.application-result.rejected h3,.application-result.error h3{color:#f7b6b6}.application-result.accepted{border-color:var(--mint);background:#a3edcf10}.application-result.accepted h3{color:var(--mint)}.application-result.loading{opacity:.75}

````

## FILE: heli/claim-service/tests/browser-handoff.test.mjs

````text
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const context={module:{exports:{}}};
runInNewContext(readFileSync(new URL('../browser-handoff.js',import.meta.url),'utf8'),context);
const {applicationLink,applicationFromFragment}=context.module.exports;
test('browser transfer preserves the existing application without exposing credentials in a request URL',()=>{
 const s={id:'4258fa7b-d285-4862-aec1-c372f08dda5f',token:'a'.repeat(64),wallet:'not-needed',verificationUrl:'not-transferred'};
 const u=new URL(applicationLink('https://pilot.example',s));
 assert.equal(u.search,'');assert.equal(u.pathname,'/');assert(!u.origin.includes(s.token));
 const restored=applicationFromFragment(u.hash);
 assert.equal(restored.id,s.id);assert.equal(restored.token,s.token);assert.equal(restored.wallet,undefined);
 assert(!u.href.includes('not-transferred'));
});
test('malformed browser transfer does not substitute application credentials',()=>{
 assert.equal(applicationFromFragment('#home'),null);
 for(const value of ['#application=bad','#application='+encodeURIComponent(JSON.stringify({id:'wrong',token:'a'.repeat(64)})),'#application='+encodeURIComponent(JSON.stringify({id:'4258fa7b-d285-4862-aec1-c372f08dda5f',token:'wrong'}))])assert.throws(()=>applicationFromFragment(value));
});
test('landing in a new browser restores the same authenticated application, clears the fragment and never creates another session',async()=>{
 const id='4258fa7b-d285-4862-aec1-c372f08dda5f',token='a'.repeat(64),stored=new Map(),nodes=new Map(),requests=[];
 let cleaned=false;
 const ctx={console,URL,Date,TextEncoder,AbortController,setTimeout,clearTimeout,navigator:{userAgent:'iPhone Safari'},window:{addEventListener(){}},location:{origin:'https://pilot.example',pathname:'/',hash:new URL(applicationLink('https://pilot.example',{id,token})).hash},history:{replaceState(){cleaned=true;}},localStorage:{getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,v)},document:{getElementById(k){if(!nodes.has(k))nodes.set(k,{hidden:false,textContent:'',classList:{toggle(){},add(){}}});return nodes.get(k);}},fetch:async(path,options)=>{
  requests.push(path);
  if(path==='/api/config')return {json:async()=>({mode:'identity'})};
  assert(cleaned,'fragment removed before application request');assert.equal(path,'/api/status');
  const body=JSON.parse(options.body);assert.equal(body.id,id);assert.equal(body.token,token);
  return {ok:true,json:async()=>({status:'verifying',wallet:'test-wallet',verificationUrl:'https://verify.didit.me/session/existing'})};
 }};
 runInNewContext(readFileSync(new URL('../browser-handoff.js',import.meta.url),'utf8'),ctx);
 await runInNewContext(readFileSync(new URL('../app.js',import.meta.url),'utf8'),ctx);
 assert.deepEqual(requests,['/api/config','/api/status']);
 assert.equal(JSON.parse(stored.get('heli-v20-claim-session')).verificationUrl,'https://verify.didit.me/session/existing');
 assert.equal(nodes.get('verify').hidden,false);assert.equal(nodes.get('connect').hidden,true);
});
test('Refresh displays a declined result and a failed check visibly, then recovers without creating a new application',async()=>{
 const nodes=new Map(),id='4258fa7b-d285-4862-aec1-c372f08dda5f',token='a'.repeat(64),stored=new Map([['heli-v20-claim-session',JSON.stringify({id,token})]]),requests=[];
 let fail=false;
 const ctx={console,URL,Date,TextEncoder,AbortController,setTimeout,clearTimeout,navigator:{userAgent:'Safari'},window:{addEventListener(){}},location:{origin:'https://pilot.example',pathname:'/',hash:''},history:{replaceState(){}},localStorage:{getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,v)},document:{getElementById(k){if(!nodes.has(k))nodes.set(k,{hidden:false,textContent:'',classList:{toggle(){},add(){}}});return nodes.get(k);}},fetch:async(path)=>{
  requests.push(path);if(path==='/api/config')return {json:async()=>({mode:'identity'})};
  assert.equal(path,'/api/status');if(fail)throw Error('Network unavailable');
  return {ok:true,json:async()=>({status:'declined',wallet:'test-wallet'})};
 }};
 runInNewContext(readFileSync(new URL('../browser-handoff.js',import.meta.url),'utf8'),ctx);
 await runInNewContext(readFileSync(new URL('../app.js',import.meta.url),'utf8'),ctx);
 assert.equal(nodes.get('resultTitle').textContent,'Application declined');assert.equal(nodes.get('applicationResult').hidden,false);
 assert.match(nodes.get('applicationResult').className,/rejected/);assert.match(nodes.get('resultChecked').textContent,/Last check:/);
 fail=true;await nodes.get('refresh').onclick();
 assert.equal(nodes.get('resultTitle').textContent,'Could not refresh status');assert.equal(nodes.get('resultDetail').textContent,'Network unavailable');assert.equal(nodes.get('refresh').disabled,false);
 fail=false;await nodes.get('refresh').onclick();assert.equal(nodes.get('resultTitle').textContent,'Application declined');
 assert(!requests.includes('/api/session'));assert(!requests.includes('/api/authenticate'));
});

````

## FILE: heli/claim-service/tests/claim.test.mjs

````text
import test from 'node:test';import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,createHmac,randomUUID} from 'node:crypto';
import {readFileSync,mkdtempSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {web3} from '../../mobile/deps.mjs';import {proofMessage} from '../../mobile/identity.mjs';
import {ClaimAdmission} from '../admission.mjs';import {Didit,verifyWebhook,evaluateDecision} from '../didit.mjs';import {storage} from '../storage.mjs';import {createClaimServer} from '../server.mjs';import {V20Chain} from '../chain.mjs';
const program='HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv',secret='test-secret-'.repeat(4),workflowId='workflow-test';
const wallet=k=>new web3.PublicKey(k.publicKey.export({format:'der',type:'spki'}).subarray(-32)).toBase58();
function decision(s,doc='TEST-DOC',extra={}){return {session_id:s.providerId,vendor_data:s.id,workflow_id:workflowId,status:'Approved',id_verifications:[{status:'Approved',age:30,document_number:doc,document_type:'Passport',issuing_state:'TEST',warnings:[],matches:[]}],liveness_checks:[{status:'Approved',warnings:[],matches:[]}],face_matches:[{status:'Approved',warnings:[]}],...extra};}
function fixture(){const data=storage(),verifier=generateKeyPairSync('ed25519'),results=new Map(),provider={async create(){return {id:randomUUID(),url:'https://verify.didit.me/session/test'};},async decision(id){return results.get(id);}};let now=2000;const a=new ClaimAdmission({program,workflowId,applicationId:'app-test',provider,personSecret:secret,verifierKey:verifier.privateKey,data,now:()=>now});return {a,data,provider,results,verifier,setTime:n=>now=n,async session(){const k=generateKeyPairSync('ed25519'),r=a.session(wallet(k)),s=a.get(r.id,r.token);await a.authenticate(s,sign(null,Buffer.from(r.message),k.privateKey).toString('base64'));return {s,r,k};}};}
test('wallet proof binds application; wrong wallet and expired challenges rejected',async()=>{const f=fixture(),k=generateKeyPairSync('ed25519'),r=f.a.session(wallet(k)),s=f.a.get(r.id,r.token);await assert.rejects(f.a.authenticate(s,sign(null,Buffer.from(r.message),generateKeyPairSync('ed25519').privateKey).toString('base64')));f.setTime(3000);await assert.rejects(f.a.authenticate(s,sign(null,Buffer.from(r.message),k.privateKey).toString('base64')),/expired/);assert.throws(()=>f.a.get(r.id,'wrong'));f.data.close();});
test('accepted identity signs exact V20 on-chain message, without disclosing documents',async()=>{const f=fixture(),{s}=await f.session(),d=decision(s);f.results.set(s.providerId,d);const p=await f.a.attestation(s);const message=proofMessage(program,f.a.config,s.wallet,p.nullifier,p.proofDigest,p.issuedAt,p.expiresAt);const {verify}=await import('node:crypto');assert(verify(null,message,f.verifier.publicKey,Buffer.from(p.signature,'base64')));assert(!JSON.stringify(f.data).includes('TEST-DOC'));assert(!JSON.stringify(p).includes('TEST-DOC'));f.data.close();});
test('same person keys across wallets and simultaneous result processing cannot earn twice',async()=>{const f=fixture(),one=await f.session(),two=await f.session();f.results.set(one.s.providerId,decision(one.s));f.results.set(two.s.providerId,decision(two.s));await Promise.all([f.a.refresh(one.s),f.a.refresh(two.s)]);assert.equal(one.s.status,'verified');assert.equal(two.s.status,'duplicate');await assert.rejects(f.a.attestation(two.s));f.data.close();});
test('different-document national number dedupes; separate family identities are accepted',async()=>{const f=fixture(),one=await f.session(),two=await f.session(),family=await f.session();for(const [item,doc,person] of [[one,'DOC-1','PERSON-1'],[two,'DOC-2','PERSON-1'],[family,'DOC-3','PERSON-2']]){const d=decision(item.s,doc);d.id_verifications[0].personal_number=person;f.a.apply(item.s,d);}assert.equal(one.s.status,'verified');assert.equal(two.s.status,'duplicate');assert.equal(family.s.status,'verified');f.data.close();});
for(const status of ['In Review','Declined','Expired','Kyc Expired','Unknown'])test(status+' never opens an entitlement',async()=>{const f=fixture(),{s}=await f.session();f.results.set(s.providerId,decision(s,'TEST',{status}));await assert.rejects(f.a.attestation(s));assert.notEqual(s.status,'verified');f.data.close();});
test('missing checks, missing duplicate evidence, warnings, face matches and underage stay in review',()=>{const s={id:'s',providerId:'p'};const check=d=>evaluateDecision(d,{sessionId:'p',vendorData:'s',workflowId,personSecret:secret});for(const mutate of [d=>d.liveness_checks=[],d=>delete d.liveness_checks[0].matches,d=>d.liveness_checks[0].matches=[{session_id:'older'}],d=>d.id_verifications[0].warnings=[{risk:'POSSIBLE_DUPLICATE'}],d=>d.id_verifications[0].age=17,d=>delete d.id_verifications[0].document_number]){const d=decision(s);mutate(d);assert.equal(check(d).status,'review');}});
test('session, vendor and workflow cannot be substituted',()=>{const s={id:'s',providerId:'p'};for(const field of ['session_id','vendor_data','workflow_id']){const d=decision(s);d[field]='other';assert.throws(()=>evaluateDecision(d,{sessionId:'p',vendorData:'s',workflowId,personSecret:secret}));}});
test('raw webhook HMAC verifies full payload, timestamp and rejects test/simple-only deliveries',()=>{const e={timestamp:2000,status:'Approved'},raw=Buffer.from(JSON.stringify(e)),headers={'x-timestamp':'2000','x-signature':createHmac('sha256',secret).update(raw).digest('hex')};assert.deepEqual(verifyWebhook(raw,headers,secret,2000),e);assert.throws(()=>verifyWebhook(Buffer.from(JSON.stringify({...e,status:'Declined'})),headers,secret,2000));assert.throws(()=>verifyWebhook(raw,headers,secret,2400));assert.throws(()=>verifyWebhook(raw,{...headers,'x-didit-test-webhook':'true'},secret,2000));assert.throws(()=>verifyWebhook(raw,{'x-timestamp':'2000','x-signature-simple':headers['x-signature']},secret,2000));});
test('webhook retries are idempotent and wrong application/environment are rejected',async()=>{const f=fixture(),{s}=await f.session();f.results.set(s.providerId,decision(s));const e={event_id:'event-1',webhook_type:'status.updated',environment:'live',application_id:'app-test',session_id:s.providerId,vendor_data:s.id,workflow_id:workflowId};await f.a.webhook(e);const nul=s.nullifier;await f.a.webhook(e);assert.equal(s.nullifier,nul);await assert.rejects(f.a.webhook({...e,application_id:'other'}));await assert.rejects(f.a.webhook({...e,environment:'sandbox'}));f.results.set(s.providerId,decision(s,'TEST',{status:'In Review'}));await assert.rejects(f.a.attestation(s));f.data.close();});
test('SQLite persists entitlements and enforces one service writer',()=>{const path=join(mkdtempSync(join(tmpdir(),'heli-claim-test-')),'state.sqlite'),one=storage(path);one.people.person='session';one.save();assert.throws(()=>storage(path));one.close();const two=storage(path);assert.equal(two.people.person,'session');two.close();});
test('provider session creation sends only internal ID and callback; untrusted URL rejected',async()=>{let request;const p=new Didit({apiKey:'TEST',workflowId,callback:'https://claim.example/',fetcher:async(url,options)=>{request={url,options};return {ok:true,json:async()=>({session_id:randomUUID(),vendor_data:'internal',workflow_id:workflowId,url:'https://verify.didit.me/session/test'})};}});await p.create('internal');const body=JSON.parse(request.options.body);assert.equal(body.vendor_data,'internal');assert(!JSON.stringify(body).includes('wallet'));p.fetcher=async()=>({ok:true,json:async()=>({url:'https://evil.example/'})});await assert.rejects(p.create('internal'));});
test('V20 decoder rejects wrong discriminator and truncated program-owned accounts',async()=>{const idl=JSON.parse(readFileSync(new URL('../../solana-v20/idl.json',import.meta.url)));const c=new V20Chain({program,idl,sponsor:web3.Keypair.generate(),store:storage(),connection:{getAccountInfo:async()=>({owner:new web3.PublicKey(program),data:Buffer.alloc(20)})}});await assert.rejects(c.account(c.pda('config'),'Config'),/Invalid HELI/);c.store.close();});
test('HTTP demo rejects forged origin, early/repeated claim and serves safe status',async()=>{const f=fixture(),server=createClaimServer({origin:'http://127.0.0.1:38781',admission:f.a,data:f.data,mode:'demo',now:()=>2000});await new Promise(r=>server.listen(38781,'127.0.0.1',r));try{const {s,r}=await f.session();f.results.set(s.providerId,decision(s));f.a.apply(s,decision(s));const post=async(path,b={},origin='http://127.0.0.1:38781')=>fetch('http://127.0.0.1:38781/api/'+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({...r,...b})});assert.equal((await post('demo/claim')).status,400);assert.equal((await post('demo/enroll')).status,200);assert.equal((await post('demo/claim')).status,400);assert.equal((await post('demo/advance')).status,200);assert.equal((await post('demo/claim')).status,200);assert.equal((await post('demo/claim')).status,400);assert.equal((await post('status',{},'https://evil.example')).status,403);assert.equal((await post('status')).status,200);assert.equal((await post('transaction',{action:'claim'})).status,400);}finally{await new Promise(r=>server.close(r));f.data.close();}});

````

## FILE: heli/claim-service/tests/identity.test.mjs

````text
import test from 'node:test';import assert from 'node:assert/strict';
import {WebhookQueue} from '../webhook-queue.mjs';import {createClaimServer} from '../server.mjs';import {storage} from '../storage.mjs';
import {createHmac} from 'node:crypto';
import {request} from 'node:http';
test('webhook queue durably acknowledges before provider lookup, excludes identity data and retries',async()=>{
 const data=storage(),event={event_id:'one',webhook_type:'status.updated',environment:'live',application_id:'app',session_id:'session',vendor_data:'application',workflow_id:'workflow',decision:{document_number:'PRIVATE-DOCUMENT'}};
 let now=100,calls=0,fail=true;
 const admission={validateWebhook(e){assert.equal(e.application_id,'app');},async webhook(e){calls++;if(fail)throw Error('provider down');data.events[e.event_id]=true;}};
 const q=new WebhookQueue({admission,data,now:()=>now});q.enqueue(event);q.enqueue(event);
 assert.equal(calls,0);assert.equal(Object.keys(data.webhookJobs).length,1);assert(!JSON.stringify(data).includes('PRIVATE-DOCUMENT'));
 await q.step();assert.equal(calls,1);assert(data.webhookJobs.one);await q.step();assert.equal(calls,1);
 now=111;fail=false;const restarted=new WebhookQueue({admission,data,now:()=>now});await restarted.step();assert.equal(calls,2);assert(!data.webhookJobs.one);
 restarted.enqueue(event);assert.equal(Object.keys(data.webhookJobs).length,0);data.close();
});
test('signed provider transport tests acknowledge without touching admission; forged tests fail',async()=>{
 const secret='transport-secret-'.repeat(3),origin='https://pilot.example';let admitted=0;
 const server=createClaimServer({origin,mode:'identity',admission:{program:'test'},webhookSecret:secret,queue:{enqueue(){admitted++;}},now:()=>2000});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  const url='http://127.0.0.1:'+server.address().port+'/webhooks/didit',body=JSON.stringify({timestamp:2000,status:'Approved'});
  const headers={Host:'pilot.example','Content-Type':'application/json','x-timestamp':'2000','x-signature':createHmac('sha256',secret).update(body).digest('hex'),'x-didit-test-webhook':'true'};
  const post=h=>new Promise((resolve,reject)=>{const req=request(url,{method:'POST',headers:h},res=>{let text='';res.on('data',c=>text+=c);res.on('end',()=>resolve({status:res.statusCode,json:JSON.parse(text)}));});req.on('error',reject);req.end(body);});
  const ok=await post(headers);assert.equal(ok.status,200);assert.deepEqual(ok.json,{ok:true,test:true,admissionApplied:false});assert.equal(admitted,0);
  const forged=await post({...headers,'x-signature':'0'.repeat(64)});assert.equal(forged.status,400);assert.equal(admitted,0);
 }finally{await new Promise(r=>server.close(r));}
});
test('identity-only mode requires HTTPS and cannot attach a token delivery backend',()=>{
 const admission={program:'test'};
 assert.throws(()=>createClaimServer({origin:'http://example.com',admission,mode:'identity'}));
 assert.throws(()=>createClaimServer({origin:'https://example.com',admission,mode:'identity',chain:{}}));
 const server=createClaimServer({origin:'https://example.com',admission,mode:'identity'});assert(server);server.close();
});

````

## FILE: heli/claim-service/tests/status-ui-preview.mjs

````text
// Local visual fixture only: no provider calls, wallet signatures or token delivery.
import {createClaimServer} from '../server.mjs';
const origin='http://127.0.0.1:8783',id='00000000-0000-4000-8000-000000000001',token='0'.repeat(64);
const session={id,wallet:'Fictional preview wallet',status:'declined'};
const admission={program:'local-ui-fixture',get(i,t){if(i!==id||t!==token)throw Error('Application access denied');return session;},session(){throw Error('Preview only');}};
const server=createClaimServer({origin,admission,mode:'demo'});
server.listen(8783,'127.0.0.1',()=>console.log('Local status UI fixture ready'));

````

## FILE: heli/claim-service/tests/svm_bridge.py

````text
"""Private stdio fixture: ephemeral local keys, V20 ELF, no public RPC/funds."""
import sys,json,base64,traceback
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'solana-v20/scripts'))
import svm_fixture as t
from bootstrap_v15 import bootstrap
f=bootstrap(t,with_policy=True)
print(json.dumps({'ready':True,'start':t.start,'sponsor':list(bytes(t.admin)),'verifier':list(bytes(f['verifier']))}),flush=True)
for line in sys.stdin:
 try:
  b=json.loads(line);method=b['method'];p=b.get('params',{})
  if method=='account':
   a=t.svm.get_account(t.Pubkey.from_string(p['address']))
   out=None if a is None else {'owner':str(a.owner),'data':base64.b64encode(a.data).decode(),'lamports':a.lamports,'executable':a.executable}
  elif method=='rent':out=t.svm.minimum_balance_for_rent_exemption(p['size'])
  elif method=='balance':
   a=t.svm.get_account(t.Pubkey.from_string(p['address']));out=a.lamports if a else 0
  elif method=='block':
   t.svm.expire_blockhash();out={'blockhash':str(t.svm.latest_blockhash()),'lastValidBlockHeight':999999999}
  elif method=='clock':t.clock(p['time']);out=True
  elif method=='send':
   tx=t.Transaction.from_bytes(base64.b64decode(p['transaction']));r=t.svm.send_transaction(tx)
   if isinstance(r,t.FailedTransactionMetadata):out={'failed':True,'logs':r.meta().logs()}
   else:out={'signature':str(tx.signatures[0]),'logs':r.logs()}
  elif method=='stop':break
  else:raise ValueError('Unknown fixture method')
  print(json.dumps({'result':out}),flush=True)
 except Exception:
  traceback.print_exc(file=sys.stderr);print(json.dumps({'error':'Local fixture failed'}),flush=True)

````

## FILE: heli/claim-service/tests/v20-svm.test.mjs

````text
import test from 'node:test';import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';import {createInterface} from 'node:readline';import {readFileSync,writeFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';import {createPrivateKey,generateKeyPairSync,sign,randomUUID} from 'node:crypto';
import {web3,spl} from '../../mobile/deps.mjs';import {V20Chain} from '../chain.mjs';import {ClaimAdmission} from '../admission.mjs';import {storage} from '../storage.mjs';
test('Didit-bound wallet → real V20 registration → seven-day claim in LiteSVM',async()=>{
 const child=spawn(process.env.HELI_TEST_PYTHON??'C:/Users/POLAT/AppData/Local/Programs/Python/Python313/python.exe',[fileURLToPath(new URL('svm_bridge.py',import.meta.url))],{stdio:['pipe','pipe','pipe']});
 let pending=[],lines=[],errors='';child.stderr.on('data',b=>errors+=b.toString());const reader=createInterface({input:child.stdout});reader.on('line',line=>{const value=JSON.parse(line);if(pending.length)pending.shift()(value);else lines.push(value);});const next=()=>lines.length?Promise.resolve(lines.shift()):new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Local SVM timeout: '+errors)),15000);pending.push(v=>{clearTimeout(timeout);resolve(v);});});
 const rpc=async(method,params={})=>{child.stdin.write(JSON.stringify({method,params})+'\n');const r=await next();if(r.error)throw Error(r.error);return r.result;};
 const data=storage();
 try{
  const ready=await next();assert(ready.ready);let now=ready.start;
  const sponsor=web3.Keypair.fromSecretKey(Uint8Array.from(ready.sponsor));const verifierKey=createPrivateKey({key:Buffer.concat([Buffer.from('302e020100300506032b657004220420','hex'),Buffer.from(ready.verifier.slice(0,32))]),format:'der',type:'pkcs8'});
  const program='HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv',idl=JSON.parse(readFileSync(new URL('../../solana-v20/idl.json',import.meta.url)));let lastResult;
  const connection={async getAccountInfo(k){const r=await rpc('account',{address:k.toBase58()});return r?{...r,owner:new web3.PublicKey(r.owner),data:Buffer.from(r.data,'base64')}:null;},getMinimumBalanceForRentExemption:size=>rpc('rent',{size}),getBalance:k=>rpc('balance',{address:k.toBase58()}),getLatestBlockhash:()=>rpc('block'),async getFeeForMessage(){return {value:15000};},async sendRawTransaction(bytes){lastResult=await rpc('send',{transaction:Buffer.from(bytes).toString('base64')});if(lastResult.failed)throw Error(JSON.stringify(lastResult.logs));return lastResult.signature;},async confirmTransaction(){return {value:{err:null}};}};
  const provider={async create(){return {id:randomUUID(),url:'https://verify.didit.me/session/local-fixture'};},async decision(id){return {session_id:id,vendor_data:session.id,workflow_id:'local-fixture',status:'Approved',id_verifications:[{status:'Approved',age:30,document_number:'FICTIONAL-SVM-PERSON',document_type:'Test',issuing_state:'TEST',warnings:[],matches:[]}],liveness_checks:[{status:'Approved',warnings:[],matches:[]}],face_matches:[{status:'Approved',warnings:[]}]};}};
  const admission=new ClaimAdmission({program,workflowId:'local-fixture',applicationId:'local-fixture',provider,personSecret:'ephemeral-local-fixture-secret-only',verifierKey,data,now:()=>now});
  const person=web3.Keypair.generate(),personKey=createPrivateKey({key:Buffer.concat([Buffer.from('302e020100300506032b657004220420','hex'),Buffer.from(person.secretKey.slice(0,32))]),format:'der',type:'pkcs8'});
  const output=admission.session(person.publicKey.toBase58()),session=admission.get(output.id,output.token);await admission.authenticate(session,sign(null,Buffer.from(output.message),personKey).toString('base64'));
  const chain=new V20Chain({program,idl,sponsor,connection,store:data,now:()=>now});assert.equal(await connection.getBalance(person.publicKey),0);
  let proof=await admission.attestation(session);const plan=await chain.prepare(session,'enroll',proof),tx=web3.Transaction.from(Buffer.from(plan.transaction,'base64'));tx.partialSign(person);await chain.submit(session,plan.ticket,tx.serialize().toString('base64'));
  let status=await chain.status(session.wallet,proof.nullifier);assert.equal(status.status,'enrolled');assert.equal(status.eligibleAt,now+7*86400);
  await assert.rejects(chain.prepare(session,'claim',proof),/bekleme/);
  now+=7*86400;await rpc('clock',{time:now});proof=await admission.attestation(session);const claim=await chain.prepare(session,'claim',proof),claimTx=web3.Transaction.from(Buffer.from(claim.transaction,'base64'));claimTx.partialSign(person);await chain.submit(session,claim.ticket,claimTx.serialize().toString('base64'));
  status=await chain.status(session.wallet,proof.nullifier);assert.equal(status.status,'claimed');const cfg=await chain.account(chain.pda('config'),'Config');const destination=spl.getAssociatedTokenAddressSync(new web3.PublicKey(cfg.mint),person.publicKey),token=await connection.getAccountInfo(destination);assert.equal(token.data.readBigUInt64LE(64),1000_000000n);assert.equal(await connection.getBalance(person.publicKey),0);await assert.rejects(chain.prepare(session,'claim',proof),/hakkı/);
  const repeat=web3.Keypair.generate(),repeatSession={...session,id:'another',wallet:repeat.publicKey.toBase58()};await assert.rejects(chain.prepare(repeatSession,'enroll',proof),/başka/);
  writeFileSync(new URL('../v20-claim-svm-verification.json',import.meta.url),JSON.stringify({checkedDate:'2026-10-02',scope:'Actual V20 ELF in local LiteSVM; synthetic provider decision, ephemeral keys, no public network',passed:true,checks:['wallet-bound provider approval','native Ed25519 credential verification','sponsored registration with zero-SOL applicant','seven-day wait enforced on chain','exact 1000 HELI to wallet-owned ATA','confirmed receipt','duplicate claim blocked','second-wallet identity reuse blocked','applicant SOL remains zero'],amountAtoms:'1000000000',programSourceHash:JSON.parse(readFileSync(new URL('../../solana-v20/compiled-source.json',import.meta.url))).source_sha256},null,2)+'\n');
 }finally{child.stdin.end(JSON.stringify({method:'stop'})+'\n');reader.close();child.kill();data.close();}
});

````

## FILE: heli/claim-service/webhook-queue.mjs

````text
// Persist only routing metadata. Never store the incoming decision/documents.
export class WebhookQueue {
 constructor({admission,data,now=()=>Math.floor(Date.now()/1000)}){Object.assign(this,{admission,data,now});data.webhookJobs??={};this.busy=false;}
 enqueue(event){
  this.admission.validateWebhook(event);
  if(this.data.events[event.event_id]||this.data.webhookJobs[event.event_id])return;
  const e=Object.fromEntries(['event_id','webhook_type','environment','application_id','session_id','vendor_data','workflow_id'].map(k=>[k,event[k]]));
  this.data.webhookJobs[e.event_id]={event:e,attempts:0,nextAt:this.now()};this.data.save();
 }
 async step(){
  if(this.busy)return;this.busy=true;
  try{
   const entry=Object.entries(this.data.webhookJobs).find(([,j])=>j.nextAt<=this.now());if(!entry)return;
   const [id,j]=entry;
   try{await this.admission.webhook(j.event);delete this.data.webhookJobs[id];}
   catch{j.attempts++;j.nextAt=this.now()+Math.min(3600,5*2**Math.min(j.attempts,10));}
   this.data.save();
  }finally{this.busy=false;}
 }
}

````

## FILE: heli/keeper/adapter.mjs

````text
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {web3,spl} from '../mobile/deps.mjs';import {decodeAccount,heliInstruction} from '../mobile/solana.mjs';import {plan} from './planner.mjs';
const LOADER=new web3.PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
const MANIFEST=new web3.PublicKey('MNFSTqtC93rEfYHB6hF82sKdZpUDFWkViLByLd1k1Ms');
const CLOCK=new web3.PublicKey('SysvarC1ock11111111111111111111111111111111');
export const DEVNET='EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
const sha=b=>createHash('sha256').update(b).digest('hex');
const allowed=new Set(['finalize_auction','finalize_launch','open_epoch','settle','close_constitution','observe_release_market']);
export function base58(bytes){let n=0n;for(const b of bytes)n=n*256n+BigInt(b);let out='';const a='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';while(n){out=a[Number(n%58n)]+out;n/=58n;}for(const b of bytes){if(b!==0)break;out='1'+out;}return out;}
export function verifyProgramBytes(account,{hash,length,authority}){
 if(!/^[0-9a-f]{64}$/.test(hash)||!Number.isSafeInteger(length)||length<=0||!(authority===null||typeof authority==='string'))throw Error('Invalid program pin');
 if(!account||!account.owner.equals(LOADER)||account.data.length<45+length||account.data.readUInt32LE(0)!==3||![0,1].includes(account.data[12]))throw Error('Untrusted program data');
 const actual=account.data[12]===1?new web3.PublicKey(account.data.subarray(13,45)).toBase58():null;
 if(actual!==authority||sha(account.data.subarray(45,45+length))!==hash||account.data.subarray(45+length).some(x=>x!==0))throw Error('Program hash or upgrade authority changed');
 return {slot:Number(account.data.readBigUInt64LE(4)),authority:actual};
}
export class SolanaAdapter{
 constructor({connection,program,payer=null,trust,reserve=5_000_000}){
  Object.assign(this,{connection,program:new web3.PublicKey(program),payer,trust,reserve});this.idl=JSON.parse(readFileSync(new URL('../solana-v20/idl.json',import.meta.url)));
  const compiled=JSON.parse(readFileSync(new URL('../solana-v20/compiled-source.json',import.meta.url)));const elf=readFileSync(new URL('../solana-v20/heli_core_v20.so',import.meta.url));
  if(sha(elf)!==compiled.binary_sha256)throw Error('Local ELF hash mismatch');this.heliPin={hash:compiled.binary_sha256,length:elf.length,authority:trust.heliUpgradeAuthority};
  if(!Object.hasOwn(trust,'heliUpgradeAuthority')||!Object.hasOwn(trust,'manifestUpgradeAuthority')||!trust.admin||!trust.verifier)throw Error('Explicit trust pins required');
  this.slot=0;this.programCache=new Map();
 }
 pda(...parts){return web3.PublicKey.findProgramAddressSync(parts.map(x=>typeof x==='string'?Buffer.from(x):x),this.program)[0];}
 async info(k,extra={}){const x=await this.connection.getAccountInfoAndContext(k,{commitment:'confirmed',minContextSlot:this.slot,...extra});this.slot=Math.max(this.slot,x.context.slot);return x.value;}
 async account(k,type){const x=await this.info(k);if(!x)return null;const discriminator=createHash('sha256').update('account:'+type).digest().subarray(0,8);if(!x.owner.equals(this.program)||x.data.length<8||!x.data.subarray(0,8).equals(discriminator))throw Error('Account owner or type mismatch');return decodeAccount(this.idl,type,x.data);}
 async checkProgram(program,pin,force=false){const p=await this.info(program);if(!p?.executable||!p.owner.equals(LOADER)||p.data.length!==36||p.data.readUInt32LE(0)!==2)throw Error('Program unavailable or unsupported loader');const address=new web3.PublicKey(p.data.subarray(4,36));if(!address.equals(web3.PublicKey.findProgramAddressSync([program.toBuffer()],LOADER)[0]))throw Error('Noncanonical ProgramData');const header=await this.info(address,{dataSlice:{offset:0,length:45}});if(!header?.owner.equals(LOADER)||header.data.length!==45)throw Error('ProgramData unavailable');const stamp=header.data.toString('hex'),cached=this.programCache.get(program.toBase58());if(!force&&cached?.stamp===stamp&&Date.now()-cached.at<3600000)return cached.result;const result=verifyProgramBytes(await this.info(address),pin);this.programCache.set(program.toBase58(),{stamp,at:Date.now(),result});return result;}
 async snapshot({forcePins=false}={}){
  if(await this.connection.getGenesisHash()!==DEVNET)throw Error('Keeper pilot permits Devnet only');
  await this.checkProgram(this.program,this.heliPin,forcePins);
  const config=await this.account(this.pda('config'),'Config');if(!config)throw Error('HELI is not initialized');
  const id=await this.account(this.pda('identity-policy'),'IdentityPolicy');
  if(config.admin!==this.trust.admin||id?.verifier!==this.trust.verifier)throw Error('Administrator or verifier pin changed');
  if(this.payer&&(config.admin===this.payer.publicKey.toBase58()||id.verifier===this.payer.publicKey.toBase58()||this.trust.heliUpgradeAuthority===this.payer.publicKey.toBase58()||this.trust.manifestUpgradeAuthority===this.payer.publicKey.toBase58()))throw Error('Keeper must use a wallet without administrative authority');
  if(config.manifest_bound){if(!this.trust.manifestHash||!Number.isSafeInteger(this.trust.manifestLength))throw Error('Manifest binary pin required');await this.checkProgram(MANIFEST,{hash:this.trust.manifestHash,length:this.trust.manifestLength,authority:this.trust.manifestUpgradeAuthority},forcePins);}
  const clock=await this.info(CLOCK);if(!clock||!clock.owner.equals(new web3.PublicKey('Sysvar1111111111111111111111111111111111111'))||clock.data.length!==40)throw Error('Invalid chain clock');
  const now=Number(clock.data.readBigInt64LE(32));const next=Number(config.last_settled_epoch)+1;
  const epoch=next<=720?await this.account(this.epoch(next).epoch,'Epoch'):null;
  const snapshot={config,now,epoch,auction:await this.account(this.pda('opening-auction'),'OpeningAuction'),policy:config.manifest_bound?await this.account(this.pda('release-policy'),'ReleasePolicy'):null};this.latestSnapshot=snapshot;this.snapshotTime=new Date().toISOString();return snapshot;
 }
 plan(s){return plan(s);}
 epoch(n){const seed=Buffer.alloc(2);seed.writeUInt16LE(n);return {epoch:this.pda('epoch',seed)};}
 instruction(job,s){
  if(!allowed.has(job.name))throw Error('Instruction outside keeper allowlist');
  const c=s.config,a={config:this.pda('config'),mint:c.mint,history:c.history,launch:this.pda('launch-claims'),market_inventory:this.pda('market-inventory'),auction:this.pda('opening-auction'),policy:this.pda('release-policy'),manifest_market:c.manifest_market,manifest_program:MANIFEST,token_program:spl.TOKEN_PROGRAM_ID,system_program:web3.SystemProgram.programId,rent:web3.SYSVAR_RENT_PUBKEY,payer:this.payer?.publicKey};
  for(const [i,n]of ['human','rewards','liquidity','founder'].entries())a[n]=this.pda('vault',Buffer.from([i]));
  a.release_reserve=a.human;a.management_stock=a.founder;
  if(job.number)Object.assign(a,this.epoch(job.number));
  const ix=heliInstruction(this.idl,this.program,job.name,job.name==='open_epoch'?{number:job.number}:{},a);
  if(ix.keys.some(k=>k.isSigner&&!k.pubkey.equals(this.payer.publicKey)))throw Error('Unexpected privileged signer');return ix;
 }
 async prepare(job,s){
  if(!this.payer)throw Error('Execution requires dedicated keeper key');
  const block=await this.connection.getLatestBlockhash({commitment:'confirmed',minContextSlot:this.slot});
  const tx=new web3.Transaction({feePayer:this.payer.publicKey,recentBlockhash:block.blockhash}).add(web3.ComputeBudgetProgram.setComputeUnitLimit({units:1_400_000}),this.instruction(job,s));
  tx.sign(this.payer);const raw=tx.serialize();if(raw.length>1232)throw Error('Keeper transaction too large');
  const simulation=await this.connection.simulateTransaction(tx);if(simulation.value.err)return {blocked:'Preflight rejected; no transaction sent'};
  const fee=(await this.connection.getFeeForMessage(tx.compileMessage(),'confirmed')).value;if(fee===null)throw Error('Fee estimate unavailable');
  let rent=0;if(job.name==='open_epoch')for(const size of [168])rent+=await this.connection.getMinimumBalanceForRentExemption(size);
  return {raw:raw.toString('base64'),signature:base58(tx.signature),lastValidBlockHeight:block.lastValidBlockHeight,cost:rent+fee,fee,rent};
 }
 async reserveFor(job,s,prepared){
  if(job.name!=='observe_release_market'||Number(s.config.last_settled_epoch)>=720)return this.reserve;
  // Preserve the next month's one epoch account + two one-signer maintenance fees.
  // No balance/treasury transfer occurs. Use current RPC rent, not an old V10 estimate.
  if(!this.nextEpochRent||Date.now()-this.nextEpochRent.at>=3600000){let rent=0;for(const size of [168])rent+=await this.connection.getMinimumBalanceForRentExemption(size);this.nextEpochRent={at:Date.now(),rent};}
  return this.reserve+this.nextEpochRent.rent+2*prepared.fee;
 }
 async send(raw){const tx=web3.Transaction.from(Buffer.from(raw,'base64'));if(!tx.verifySignatures()||!tx.feePayer.equals(this.payer.publicKey)||tx.instructions.length!==2||!tx.instructions[0].programId.equals(web3.ComputeBudgetProgram.programId)||!tx.instructions[1].programId.equals(this.program))throw Error('Journal transaction is invalid');const name=[...allowed].find(n=>tx.instructions[1].data.subarray(0,8).equals(createHash('sha256').update('global:'+n).digest().subarray(0,8)));if(!name)throw Error('Journal instruction not allowed');await this.snapshot({forcePins:true});const signature=await this.connection.sendRawTransaction(Buffer.from(raw,'base64'),{skipPreflight:false,maxRetries:0,minContextSlot:this.slot});if(signature!==base58(tx.signature))throw Error('RPC signature mismatch');return signature;}
 async status(signature){return (await this.connection.getSignatureStatuses([signature],{searchTransactionHistory:true})).value[0];}
 async height(){return this.connection.getBlockHeight('confirmed');}
 async balance(){return this.connection.getBalance(this.payer.publicKey,'confirmed');}
 async completed(job){const s=await this.snapshot();if(job.name==='open_epoch')return Boolean(await this.account(this.epoch(job.number).epoch,'Epoch'));if(job.name==='settle')return Number(s.config.last_settled_epoch)>=job.number;if(job.name==='finalize_launch')return s.config.launch_finalized;if(job.name==='finalize_auction')return Boolean(s.auction?.finalized);if(job.name==='close_constitution')return s.config.closed;if(job.name==='observe_release_market'&&s.policy&&Number(s.policy.count)>0)return Number(s.policy.times[(Number(s.policy.next)+23)%24])>=Number(job.key.split(':')[1])*3600;return false;}
 // Only maintenance operations may be replaced after blockhash expiry. All
 // financial/user/admin instructions are excluded. Init/settle/finalize guards
 // prevent duplicate allocations; cursor/observations advance monotonically.
 async safeToRetryExpired(job){if(!allowed.has(job.name))return false;await this.snapshot({forcePins:true});return true;}
}

````

## FILE: heli/keeper/calendar.mjs

````text
export const DAY=86400;
export function boundary(start,n){
 if(!Number.isSafeInteger(start)||!Number.isInteger(n)||n<0||n>720)throw Error('Invalid calendar');
 const anchor=new Date(start*1000),target=new Date(Date.UTC(anchor.getUTCFullYear(),anchor.getUTCMonth()+n,1,anchor.getUTCHours(),anchor.getUTCMinutes(),anchor.getUTCSeconds()));
 const max=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();
 target.setUTCDate(Math.min(anchor.getUTCDate(),max));return Math.floor(target.getTime()/1000);
}
export function completedMonths(start,now){let lo=0,hi=721;while(lo+1<hi){const mid=Math.floor((lo+hi)/2);if(boundary(start,mid)<=now)lo=mid;else hi=mid;}return now<start?0:lo;}

````

## FILE: heli/keeper/engine.mjs

````text
// Durable transaction identity: signature saved BEFORE submission. Uncertain
// outcomes stay pending while valid. After expiry only explicitly safe,
// allowlisted maintenance can be rebuilt following a fresh code/state check.
export class KeeperEngine {
 constructor({adapter,state,dryRun=true,dailyCap=50_000_000,now=()=>Date.now()}){Object.assign(this,{adapter,state,dryRun,dailyCap,now});}
 async step(){
  if(this.busy)throw Error('Keeper already running');this.busy=true;
  try{
   if(this.state.pending)return this.dryRun?{status:'dry-run-pending',signature:this.state.pending.signature}:await this.reconcile();
   const snapshot=await this.adapter.snapshot(),job=this.adapter.plan(snapshot);
   if(!job)return {status:'idle'};
   if(this.state.deferred?.key===job.key&&this.state.deferred.until>this.now())return {status:'backoff',job};
   if(this.dryRun)return {status:'dry-run',job};
   const prepared=await this.adapter.prepare(job,snapshot);
   if(prepared.blocked){this.state.deferred={key:job.key,until:this.now()+300000};this.state.save();return {status:'blocked',job,reason:prepared.blocked};}
   if(!Number.isSafeInteger(prepared.cost)||prepared.cost<0)throw Error('Invalid expense estimate');
   const day=Math.floor(this.now()/86400000).toString(),spent=this.state.budgets[day]??0;
   if(spent+prepared.cost>this.dailyCap)return {status:'budget-exhausted',job};
   const reserve=this.adapter.reserveFor?await this.adapter.reserveFor(job,snapshot,prepared):this.adapter.reserve;
   if(!Number.isSafeInteger(reserve)||reserve<0)throw Error('Invalid reserve');
   if(await this.adapter.balance()<prepared.cost+reserve)return {status:job.name==='observe_release_market'&&reserve>this.adapter.reserve?'essential-reserve':'insufficient-balance',job};
   this.state.budgets[day]=spent+prepared.cost;
   this.state.pending={...prepared,job,lastAttempt:this.now()};this.state.save();
   try{await this.adapter.send(prepared.raw);}catch{this.state.save();return {status:'uncertain',signature:prepared.signature};}
   return {status:'submitted',signature:prepared.signature,job};
  }finally{this.busy=false;}
 }
 async reconcile(){
  const p=this.state.pending,check=await this.adapter.status(p.signature);
  if(check){
   if(!['confirmed','finalized'].includes(check.confirmationStatus))return {status:'pending',signature:p.signature};
   this.state.last={job:p.job,signature:p.signature,failed:Boolean(check.err)};this.state.pending=null;
   if(check.err)this.state.deferred={key:p.job.key,until:this.now()+300000};
   this.state.save();return {status:check.err?'failed':'confirmed',...this.state.last};
  }
  const height=await this.adapter.height();
  if(height>p.lastValidBlockHeight){
   if(await this.adapter.completed(p.job)){this.state.last={job:p.job,signature:p.signature,observedOnChain:true};this.state.pending=null;this.state.save();return {status:'reconciled',...this.state.last};}
   if(this.adapter.safeToRetryExpired&&await this.adapter.safeToRetryExpired(p.job)){
    this.state.last={job:p.job,signature:p.signature,expiredMaintenanceRetry:true};this.state.pending=null;this.state.save();return {status:'expired-retry-safe',...this.state.last};
   }
   // RPC can omit historical signatures. Persist uncertainty for operator review.
   return {status:'expired-unknown',signature:p.signature,job:p.job};
  }
  if(this.now()-p.lastAttempt>=30000){p.lastAttempt=this.now();this.state.save();try{await this.adapter.send(p.raw);}catch{}}
  return {status:'pending',signature:p.signature};
 }
}

````

## FILE: heli/keeper/generate-key.mjs

````text
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';import {web3} from '../mobile/deps.mjs';
const directory=fileURLToPath(new URL('../solana/.keys/',import.meta.url)),path=directory+'heli-keeper-devnet.json';mkdirSync(directory,{recursive:true});
const wallet=existsSync(path)?web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path)))):web3.Keypair.generate();
if(!existsSync(path))writeFileSync(path,JSON.stringify(Array.from(wallet.secretKey)),{flag:'wx',mode:0o600});
console.log(JSON.stringify({publicKey:wallet.publicKey.toBase58(),keyFile:path,purpose:'Local Devnet maintenance fee wallet; no authority or funds assigned'}));

````

## FILE: heli/keeper/planner-bridge.mjs

````text
import {createInterface} from 'node:readline';import {plan} from './planner.mjs';
for await(const line of createInterface({input:process.stdin,crlfDelay:Infinity})){try{console.log(JSON.stringify({job:plan(JSON.parse(line))}));}catch(e){console.log(JSON.stringify({error:e.message}));}}

````

## FILE: heli/keeper/planner.mjs

````text
import {boundary,completedMonths} from './calendar.mjs';
// Decisions derive from confirmed chain state, never a remembered wall-clock schedule.
export function plan(s){
 const c=s.config,now=s.now,start=Number(c.start),last=Number(c.last_settled_epoch);
 if(!c.live||c.closed||c.paused)return null;
 if(s.auction&&!s.auction.finalized&&now>=start)return {name:'finalize_auction',key:'auction'};
 if(!c.launch_finalized&&now>=boundary(start,6))return {name:'finalize_launch',key:'launch'};
 const next=last+1,due=completedMonths(start,now),e=s.epoch;
 if(next<=720&&now>=boundary(start,next-1)){
  if(!e)return {name:'open_epoch',number:next,key:'open:'+next};
  if(Number(e.number)!==next||e.settled)throw Error('Inconsistent epoch state');
  if(next<=due){
   return {name:'settle',number:next,key:'settle:'+next};
  }
 }
 if(last===720&&now>=boundary(start,720))return {name:'close_constitution',key:'constitution'};
 if(c.manifest_bound&&!c.paused&&s.policy){
  const p=s.policy,lastIndex=(Number(p.next)+23)%24;
  if(Number(p.count)===0||now-Number(p.times[lastIndex])>=3600)return {name:'observe_release_market',key:'observe:'+Math.floor(now/3600)};
 }
 return null;
}

````

## FILE: heli/keeper/poll.mjs

````text
import {boundary} from './calendar.mjs';
// Fewer idle reads; wake at known deadlines instead of waiting another full interval.
export function pollDelay(result,s){
 if(['confirmed','reconciled','submitted','pending','uncertain','expired-retry-safe'].includes(result.status))return 2000;
 let delay=240000;
 if(!s?.config||s.config.closed||s.config.paused)return delay;
 const c=s.config,start=Number(c.start),next=Number(c.last_settled_epoch)+1,deadlines=[];
 if(s.auction&&!s.auction.finalized)deadlines.push(start);
 if(!c.launch_finalized)deadlines.push(boundary(start,6));
 if(next<=720){deadlines.push(boundary(start,next));if(!s.epoch)deadlines.push(boundary(start,next-1));}
 if(c.manifest_bound&&!c.paused&&s.policy&&Number(s.policy.count)>0)deadlines.push(Number(s.policy.times[(Number(s.policy.next)+23)%24])+3600);
 for(const t of deadlines)if(t>s.now)delay=Math.min(delay,(t-s.now)*1000);
 return Math.max(2000,delay);
}

````

## FILE: heli/keeper/run.mjs

````text
import {readFileSync,mkdirSync,openSync,closeSync,writeFileSync,renameSync,unlinkSync,existsSync} from 'node:fs';import {fileURLToPath} from 'node:url';import {web3} from '../mobile/deps.mjs';
import {KeeperEngine} from './engine.mjs';import {SolanaAdapter} from './adapter.mjs';
import {atomicJson} from './storage.mjs';import {chainTelemetry,sampleBalance} from './telemetry.mjs';
import {pollDelay} from './poll.mjs';
const args=process.argv.slice(2),execute=args.includes('--execute'),once=args.includes('--once');const path=args.find(x=>x.endsWith('.json'));if(!path)throw Error('Usage: node heli/keeper/run.mjs config.json [--once] [--execute]');
const config=JSON.parse(readFileSync(path)),program='HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv';
if(config.program!==program||!config.rpcUrl?.startsWith('https://'))throw Error('V20 and HTTPS RPC required');
if(!Number.isSafeInteger(config.dailyCapLamports)||config.dailyCapLamports<=0||!Number.isSafeInteger(config.reserveLamports)||config.reserveLamports<0)throw Error('Explicit expense caps required');
const root=fileURLToPath(new URL('./.state/',import.meta.url));mkdirSync(root,{recursive:true});const lock=root+'keeper.lock';
if(existsSync(lock)){const owner=JSON.parse(readFileSync(lock));try{process.kill(owner.pid,0);throw Error('Another keeper or reused PID holds lock');}catch(e){if(e.code!=='ESRCH')throw e;}unlinkSync(lock);}
const fd=openSync(lock,'wx',0o600);writeFileSync(fd,JSON.stringify({pid:process.pid}));closeSync(fd);
let stopped=false;const clean=()=>{if(!stopped){stopped=true;unlinkSync(lock);}};process.on('exit',clean);for(const s of ['SIGINT','SIGTERM'])process.on(s,()=>process.exit(0));
const legacy=root+'journal.json';if(existsSync(legacy)&&JSON.parse(readFileSync(legacy)).pending)throw Error('Reconcile the pending legacy transaction before switching to V20');
const statePath=root+'journal-v20.json',state=existsSync(statePath)?JSON.parse(readFileSync(statePath)): {pending:null,budgets:{}};
state.save=()=>atomicJson(statePath,state);
const payer=execute?web3.Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(config.keeperKeyFile)))):null;
const adapter=new SolanaAdapter({connection:new web3.Connection(config.rpcUrl,{commitment:'confirmed',confirmTransactionInitialTimeout:15000}),program,payer,trust:config.trust,reserve:config.reserveLamports});
const engine=new KeeperEngine({adapter,state,dryRun:!execute,dailyCap:config.dailyCapLamports});
let failures=0,waitMs=60000;
do{
 try{const result=await engine.step();await sampleBalance(adapter);failures=0;waitMs=pollDelay(result,adapter.latestSnapshot);const health={time:new Date().toISOString(),programVersion:'v20',mode:execute?'devnet-execute':'dry-run',...result,telemetry:chainTelemetry(adapter,state,config)};atomicJson(root+'health.json',health);console.log(JSON.stringify(health));if(once||!execute)break;}
 catch(e){failures++;const health={time:new Date().toISOString(),programVersion:'v20',mode:execute?'devnet-execute':'dry-run',status:'rpc-or-safety-stop',failures,telemetry:chainTelemetry(adapter,state,config)};atomicJson(root+'health.json',health);console.error(JSON.stringify(health));if(once||!execute)throw Error('Keeper stopped; inspect trusted configuration, RPC and chain state');}
 await new Promise(resolve=>setTimeout(resolve,failures?Math.min(60000,5000*2**Math.min(failures,4)):waitMs));
}while(!stopped);

````

## FILE: heli/keeper/storage.mjs

````text
import {openSync,writeFileSync,fsyncSync,closeSync,renameSync,unlinkSync,existsSync} from 'node:fs';
export function atomicJson(path,value){
 const temp=path+'.'+process.pid+'.tmp';let fd;
 try{fd=openSync(temp,'w',0o600);writeFileSync(fd,JSON.stringify(value,null,2));fsyncSync(fd);closeSync(fd);fd=undefined;renameSync(temp,path);}
 finally{if(fd!==undefined)closeSync(fd);if(existsSync(temp))unlinkSync(temp);}
}

````

## FILE: heli/keeper/telemetry.mjs

````text
import {completedMonths} from './calendar.mjs';
export function chainTelemetry(adapter,state,config){
 const s=adapter.latestSnapshot,c=s?.config,p=s?.policy;
 return {snapshotTime:adapter.snapshotTime??null,chainTime:s?.now??null,
 lastSettledMonth:c?Number(c.last_settled_epoch):null,
 overdueMonths:c?Math.max(0,completedMonths(Number(c.start),s.now)-Number(c.last_settled_epoch)):null,
 paused:c?.paused??null,closed:c?.closed??null,manifestBound:c?.manifest_bound??null,
 observationCount:p?Number(p.count):null,lastObservation:p&&Number(p.count)>0?Number(p.times[(Number(p.next)+23)%24]):null,
 balanceLamports:adapter.measuredBalance??null,balanceTime:adapter.balanceTime??null,
 reserveLamports:config.reserveLamports,dailyCapLamports:config.dailyCapLamports,
 reservedTodayLamports:state.budgets[Math.floor(Date.now()/86400000).toString()]??0};
}
export async function sampleBalance(adapter){
 if(!adapter.payer||adapter.balanceTime&&Date.now()-Date.parse(adapter.balanceTime)<60000)return;
 try{const b=await adapter.balance();if(!Number.isSafeInteger(b)||b<0)throw Error('Invalid balance');adapter.measuredBalance=b;adapter.balanceTime=new Date().toISOString();}catch{/* Monitoring cannot change a transaction result; the old reading becomes stale. */}
}

````

## FILE: heli/keeper/tests/keeper.test.mjs

````text
import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {readFileSync} from 'node:fs';
import {KeeperEngine} from '../engine.mjs';import {plan} from '../planner.mjs';import {boundary,completedMonths} from '../calendar.mjs';import {verifyProgramBytes,SolanaAdapter,base58} from '../adapter.mjs';import {web3} from '../../mobile/deps.mjs';import {decodeAccount} from '../../mobile/solana.mjs';
const start=Date.UTC(2026,0,31,12,34,56)/1000;
test('V20 observation reserve protects one epoch and two maintenance fees',async()=>{
 const p=web3.Keypair.generate(),pk=p.publicKey.toBase58(),sizes=[];
 const a=new SolanaAdapter({connection:{async getMinimumBalanceForRentExemption(n){sizes.push(n);return 2060160;}},program:'HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv',payer:p,trust:{admin:pk,verifier:pk,heliUpgradeAuthority:null,manifestUpgradeAuthority:null}});
 assert.equal(await a.reserveFor({name:'observe_release_market'},{config:{last_settled_epoch:1}},{fee:5000}),7070160);assert.deepEqual(sizes,[168]);
 assert.equal(await a.reserveFor({name:'observe_release_market'},{config:{last_settled_epoch:720}},{fee:5000}),5000000);
});
function snapshot(last=0){return {config:{live:true,closed:false,paused:false,start,last_settled_epoch:last,launch_finalized:true,cursor:start,manifest_bound:false},now:boundary(start,last+1),epoch:null,auction:{finalized:true},policy:null};}
function fixture({dryRun=false,cap=50000}={}){
 let now=1000,prepared=0,sent=[],chainStatus=null,expired=false,complete=false,saved=0;
 const state={pending:null,budgets:{},save(){saved++;}},job={name:'settle',number:1,key:'settle:1'};
 const adapter={reserve:0,async snapshot(){return {};},plan(){return job;},async prepare(){prepared++;return {raw:'same-signed-bytes',signature:'signature-1',lastValidBlockHeight:100,cost:10000};},async send(raw){assert(state.pending,'journal must be saved before send');assert(saved>0);sent.push(raw);},async balance(){return 1000000;},async status(){return chainStatus;},async height(){return expired?101:99;},async completed(){return complete;}};
 return {adapter,state,engine:new KeeperEngine({adapter,state,dryRun,dailyCap:cap,now:()=>now}),get prepared(){return prepared;},sent,setStatus(x){chainStatus=x;},expire(){expired=true;},complete(){complete=true;},advance(n){now+=n;}};
}
test('calendar keeps January 31 anchor and time through leap years and 60 years',()=>{assert.equal(new Date(boundary(start,1)*1000).toISOString(),'2026-02-28T12:34:56.000Z');assert.equal(new Date(boundary(start,2)*1000).toISOString(),'2026-03-31T12:34:56.000Z');assert.equal(new Date(boundary(start,25)*1000).toISOString(),'2028-02-29T12:34:56.000Z');assert.equal(completedMonths(start,boundary(start,720)),720);assert.equal(completedMonths(start,start-1),0);assert.equal(new Date(boundary(start,720)*1000).toISOString(),'2086-01-31T12:34:56.000Z');});
test('keeper recovers earliest month and does not skip missing periods',()=>{const s=snapshot();s.now=boundary(start,120);assert.equal(plan(s).name,'open_epoch');s.epoch={number:1,settled:false,registry_finalized:false};assert.equal(plan(s).name,'settle');assert.equal(plan(s).number,1);});
test('pause stops V20 monthly unlocks and observations',()=>{const s=snapshot();s.config.paused=true;assert.equal(plan(s),null);s.epoch={number:1,registry_finalized:true,settled:false};assert.equal(plan(s),null);});
test('free allocation reconciliation precedes missed market release periods',()=>{const s=snapshot(6);s.config.launch_finalized=false;assert.equal(plan(s).name,'finalize_launch');});
test('hourly observation never turns into a burst after an outage',()=>{const s=snapshot(13);s.now=boundary(start,13)+4*86400;s.epoch={number:14,settled:false,registry_finalized:false};s.config.manifest_bound=true;s.policy={count:24,next:0,times:Array(24).fill(s.now-3599)};assert.equal(plan(s),null);s.policy.times[23]=s.now-3600;assert.equal(plan(s).name,'observe_release_market');s.config.paused=true;assert.equal(plan(s),null);});
test('720 settled months close constitution once; closed state is idle',()=>{const s=snapshot(719);s.config.last_settled_epoch=720;s.now=boundary(start,720);assert.equal(plan(s).name,'close_constitution');s.config.closed=true;assert.equal(plan(s),null);});
test('dry-run cannot sign or send a transaction',async()=>{const f=fixture({dryRun:true});assert.equal((await f.engine.step()).status,'dry-run');assert.equal(f.prepared,0);assert.equal(f.sent.length,0);});
test('dry-run cannot resend a pending transaction left by execution mode',async()=>{const f=fixture({dryRun:true});f.state.pending={raw:'old-signed-bytes',signature:'old-signature'};assert.equal((await f.engine.step()).status,'dry-run-pending');assert.equal(f.sent.length,0);});
test('signature is durable before send and restart resends only identical bytes',async()=>{const f=fixture();assert.equal((await f.engine.step()).status,'submitted');f.advance(30001);const restart=new KeeperEngine({adapter:f.adapter,state:f.state,dryRun:false,now:()=>40000});assert.equal((await restart.step()).status,'pending');assert.equal(f.prepared,1);assert.deepEqual(f.sent,['same-signed-bytes','same-signed-bytes']);});
test('RPC timeout leaves same pending signature without another budget reservation',async()=>{const f=fixture();f.adapter.send=async()=>{throw Error('network timeout');};assert.equal((await f.engine.step()).status,'uncertain');await f.engine.step();assert.equal(f.prepared,1);assert.equal(f.state.budgets['0'],10000);});
test('confirmed chain error is recorded as failure and backoff applies',async()=>{const f=fixture();await f.engine.step();f.setStatus({confirmationStatus:'confirmed',err:{InstructionError:[1,'Custom']}});assert.equal((await f.engine.step()).status,'failed');assert.equal((await f.engine.step()).status,'backoff');});
test('expired unknown outcome does not issue a replacement transaction',async()=>{const f=fixture();await f.engine.step();f.expire();assert.equal((await f.engine.step()).status,'expired-unknown');assert.equal((await f.engine.step()).status,'expired-unknown');assert.equal(f.prepared,1);assert.equal(f.sent.length,1);});
test('expired allowlisted maintenance can recover after fresh code-pin check',async()=>{const f=fixture();f.adapter.safeToRetryExpired=async job=>job.name==='settle';await f.engine.step();f.expire();assert.equal((await f.engine.step()).status,'expired-retry-safe');assert.equal(f.state.pending,null);await f.engine.step();assert.equal(f.prepared,2);assert.equal(f.state.budgets['0'],20000);});
test('expired transaction can reconcile from independently observed completed action',async()=>{const f=fixture();await f.engine.step();f.expire();f.complete();assert.equal((await f.engine.step()).status,'reconciled');assert.equal(f.state.pending,null);});
test('budget or insufficient balance never sends; concurrent engines cannot enter one step',async()=>{const f=fixture({cap:9999});assert.equal((await f.engine.step()).status,'budget-exhausted');assert.equal(f.sent.length,0);const g=fixture();g.adapter.balance=async()=>0;assert.equal((await g.engine.step()).status,'insufficient-balance');assert.equal(g.sent.length,0);const h=fixture();const results=await Promise.allSettled([h.engine.step(),h.engine.step()]);assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal(h.sent.length,1);});
test('failed preflight does not burn sponsor budget or send',async()=>{const f=fixture();f.adapter.prepare=async()=>({blocked:'No market depth'});assert.equal((await f.engine.step()).status,'blocked');assert.deepEqual(f.state.budgets,{});assert.equal(f.sent.length,0);});
test('price observations cannot consume the essential monthly maintenance reserve',async()=>{const f=fixture();f.adapter.plan=()=>({name:'observe_release_market',key:'observe:1'});f.adapter.reserveFor=async()=>995000;assert.equal((await f.engine.step()).status,'essential-reserve');assert.equal(f.sent.length,0);assert.deepEqual(f.state.budgets,{});f.adapter.plan=()=>({name:'settle',key:'settle:1'});f.adapter.reserveFor=async()=>0;assert.equal((await f.engine.step()).status,'submitted');});
test('code hash, upgrade authority and trailing code mutation fail closed',()=>{const elf=Buffer.from('test code'),authority=web3.Keypair.generate().publicKey,data=Buffer.alloc(45+elf.length+20);data.writeUInt32LE(3);data[12]=1;authority.toBuffer().copy(data,13);elf.copy(data,45);const account={owner:new web3.PublicKey('BPFLoaderUpgradeab1e11111111111111111111111'),data};const pin={hash:createHash('sha256').update(elf).digest('hex'),length:elf.length,authority:authority.toBase58()};assert(verifyProgramBytes(account,pin));assert.throws(()=>verifyProgramBytes(account,{...pin,authority:null}));data[45]^=1;assert.throws(()=>verifyProgramBytes(account,pin));data[45]^=1;data[data.length-1]=1;assert.throws(()=>verifyProgramBytes(account,pin));});
test('keeper cannot build a privileged sale, pause, expense or transfer instruction',()=>{const payer=web3.Keypair.generate(),program='HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv',adapter=new SolanaAdapter({connection:{},program,payer,trust:{admin:payer.publicKey.toBase58(),verifier:payer.publicKey.toBase58(),heliUpgradeAuthority:null,manifestUpgradeAuthority:null}});for(const name of ['execute_release_sale','pause','execute_expense','transfer','finalize_registry','checkpoint_global'])assert.throws(()=>adapter.instruction({name},{}));});
test('real V20 IDL creates a one-signer monthly settlement and parses 256-level auction',()=>{const payer=web3.Keypair.generate(),pk=payer.publicKey.toBase58(),adapter=new SolanaAdapter({connection:{},program:'HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv',payer,trust:{admin:pk,verifier:pk,heliUpgradeAuthority:null,manifestUpgradeAuthority:null}}),s={config:{mint:pk,history:pk,manifest_market:pk}};const ix=adapter.instruction({name:'settle',number:2},s);assert(!ix.keys.some(x=>x.isSigner));const idl=JSON.parse(readFileSync(new URL('../../solana-v20/idl.json',import.meta.url)));const b=Buffer.alloc(8+8*5+1+4+8*256+8*3+2+8*2);b.writeUInt32LE(256,8+8*5+1);assert.equal(decodeAccount(idl,'OpeningAuction',b).demand.length,256);assert.equal(base58(Buffer.from([0,0,1])),'112');});

````

## FILE: heli/keeper/tests/test_v20_svm.py

````text
"""JS V20 planner AND adapter instructions against the compiled V20 ELF locally."""
import sys,json,subprocess,base64
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT.parent/'solana-v20/scripts'))
import svm_fixture as t
from bootstrap_v15 import bootstrap,epoch_accounts
bootstrap(t)
bridge=subprocess.Popen(['node',str(ROOT/'tests/v20-bridge.mjs')],stdin=subprocess.PIPE,stdout=subprocess.PIPE,text=True,encoding='utf-8')
settled=[];jobs=[]
def normalized(x):return {t.snake(k):v for k,v in x.items()}
def answer(paused=None):
 c=normalized(t.cfg());n=min(int(c['last_settled_epoch'])+1,720);ea=epoch_accounts(t,n)
 if paused is not None:c['paused']=paused
 s={'program':str(t.PROGRAM),'config':c,'now':t.svm.get_clock().unix_timestamp,'epoch':normalized(t.read(ea['epoch'],'Epoch')) if t.svm.get_account(ea['epoch']) else None,'auction':normalized(t.read(t.defaults['auction'],'OpeningAuction')),'policy':None}
 bridge.stdin.write(json.dumps(s)+'\n');bridge.stdin.flush();r=json.loads(bridge.stdout.readline());assert 'error' not in r,r
 return r
def drain():
 for _ in range(1500):
  r=answer();job=r['job']
  if not job:return
  before=t.cfg();supply=t.supply();base=t.released();inventory=t.amount(t.defaults['market_inventory'])
  ix=r['instruction'];instruction=t.Instruction(t.Pubkey.from_string(ix['program']),base64.b64decode(ix['data']),[t.meta(t.Pubkey.from_string(k['key']),k['writable'],k['signer']) for k in ix['keys']])
  t.send('JS V20 adapter '+job['key'],[instruction]);jobs.append(job)
  if job['name']=='settle':
   n=job['number'];e=t.read(epoch_accounts(t,n)['epoch'],'Epoch');cap=base*4_022_473_737_086_389//10**18
   t.check('month '+str(n)+' net release cap',e['capacity']==cap)
   t.check('month '+str(n)+' reserve to canonical market inventory',t.amount(t.defaults['market_inventory'])==inventory+e['humanBudget'] and t.cfg()['stocks'][0]==before['stocks'][0]-e['humanBudget'])
   t.check('month '+str(n)+' no mint burn staking or monthly free dividend',t.supply()==supply and e['burned']==0 and e['staking']==0 and e['perPerson']==0 and e['humanRemaining']==0)
   ea=epoch_accounts(t,n);t.check('month '+str(n)+' one epoch account only',t.svm.get_account(ea['epoch']) is not None and t.svm.get_account(ea['claim_vault']) is None and t.svm.get_account(ea['reward_vault']) is None)
   if n==1:t.check('first month exactly 20112.368685 HELI',e['humanBudget']==20_112_368_685)
   settled.append(n)
 raise AssertionError('keeper did not quiesce')
try:
 t.check('paused planner sends no monthly transaction',answer(True)['job'] is None)
 t.clock(t.boundary(10)+10*t.DAY);drain();t.check('ten missed months caught up sequentially',settled==list(range(1,11)))
 for n in range(11,721):
  t.clock(t.boundary(n));drain()
  if n%120==0:print('V20 keeper months:',n,flush=True)
 t.check('all 720 months settle once in order',settled==list(range(1,721)))
 t.check('constitution closed with no further automatic job',t.cfg()['closed'] and answer()['job'] is None)
 t.check('released unsold market inventory survives closure',t.amount(t.defaults['market_inventory'])>0)
 result={'version':'v20','all_passed':True,'months':720,'jobs':len(jobs),'checks_and_transactions':len(t.checks),'source_sha256':t.actual_source,'binary_sha256':t.actual_binary,'scope':'Local LiteSVM; actual JS planner and adapter plus compiled V20 ELF; synthetic quote/identity, no public deployment'}
 (ROOT/'v20-svm-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
finally:
 bridge.stdin.close();bridge.wait(timeout=10)

````

## FILE: heli/keeper/tests/v20-bridge.mjs

````text
import {createInterface} from 'node:readline';
import {SolanaAdapter} from '../adapter.mjs';
import {web3} from '../../mobile/deps.mjs';
for await(const line of createInterface({input:process.stdin})){
 try{
  const s=JSON.parse(line),pk=s.config.admin;
  const a=new SolanaAdapter({connection:{},program:s.program,payer:{publicKey:new web3.PublicKey(pk)},trust:{admin:pk,verifier:pk,heliUpgradeAuthority:null,manifestUpgradeAuthority:null}});
  const job=a.plan(s),ix=job?a.instruction(job,s):null;
  console.log(JSON.stringify({job,instruction:ix?{program:ix.programId.toBase58(),data:ix.data.toString('base64'),keys:ix.keys.map(k=>({key:k.pubkey.toBase58(),signer:k.isSigner,writable:k.isWritable}))}:null}));
 }catch(e){console.log(JSON.stringify({error:e.message}));}
}

````

## FILE: heli/manifest-integration/inventory_guard.mjs

````text
/**
 * Exact-atom accounting for the proposed HELI project-owned market inventory.
 * This is a local guard/model, not a Solana transaction or a Manifest CPI.
 */
export const HELI_UNIT = 1_000_000n;
export const FREE_CAP = 1_000_000n * HELI_UNIT;
export const FREE_PER_PERSON = 1_000n * HELI_UNIT;

function atoms(value, name) {
  if (typeof value !== 'bigint' || value < 0n || value > 18_446_744_073_709_551_615n) {
    throw new RangeError(`${name} must be nonnegative u64 atoms`);
  }
  return value;
}

function count(value, name) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 1_000) {
    throw new RangeError(`${name} must be an integer from 0 to 1000`);
  }
  return value;
}

export function planUnusedFreeRelease({ launchRemainingAtoms, launchVaultAtoms, people, claimed, finalized }) {
  if (finalized) throw new Error('Free remainder already finalized');
  const remaining = atoms(launchRemainingAtoms, 'launchRemainingAtoms');
  const vault = atoms(launchVaultAtoms, 'launchVaultAtoms');
  const enrolled = count(people, 'people');
  const paid = count(claimed, 'claimed');
  if (paid > enrolled || vault !== remaining) throw new Error('Free vault accounting mismatch');
  const outstanding = BigInt(enrolled - paid) * FREE_PER_PERSON;
  const expectedRemaining = FREE_CAP - BigInt(paid) * FREE_PER_PERSON;
  if (remaining !== expectedRemaining || remaining < outstanding) {
    throw new Error('Free entitlement accounting mismatch');
  }
  return Object.freeze({ reservedForPeopleAtoms: outstanding, releasableAtoms: remaining - outstanding });
}

export function planProjectAsk({
  marketInventoryAtoms, marketRemainingAtoms, auction, requestedAtoms,
  marketAddress, configuredMarketAddress, heliMint, configuredHeliMint,
  quoteMint, configuredQuoteMint,
}) {
  const inventory = atoms(marketInventoryAtoms, 'marketInventoryAtoms');
  const remaining = atoms(marketRemainingAtoms, 'marketRemainingAtoms');
  const requested = atoms(requestedAtoms, 'requestedAtoms');
  if (inventory !== remaining) throw new Error('Market inventory accounting mismatch');
  if (!auction?.finalized || !Array.isArray(auction.bids)) throw new Error('Opening auction must be finalized');
  if (!marketAddress || marketAddress !== configuredMarketAddress ||
      !heliMint || heliMint !== configuredHeliMint ||
      !quoteMint || quoteMint !== configuredQuoteMint) {
    throw new Error('Wrong HELI market or mint');
  }
  let allocated = 0n;
  let outstanding = 0n;
  for (const bid of auction.bids) {
    const allotment = atoms(bid.allocatedHeli, 'allocatedHeli') * HELI_UNIT;
    allocated += allotment;
    if (typeof bid.claimed !== 'boolean') throw new Error('Invalid auction claim status');
    if (!bid.claimed) outstanding += allotment;
  }
  if (allocated !== atoms(auction.soldHeli, 'soldHeli') * HELI_UNIT || outstanding > inventory) {
    throw new Error('Auction entitlement accounting mismatch');
  }
  const available = inventory - outstanding;
  if (requested === 0n || requested > available) throw new Error('Ask exceeds unreserved project inventory');
  return Object.freeze({ availableAtoms: available, reservedForAuctionAtoms: outstanding,
    askAtoms: requested, marketAddress });
}

````

## FILE: heli/manifest-integration/inventory_guard.test.mjs

````text
import test from 'node:test';
import assert from 'node:assert/strict';
import { HELI_UNIT, planUnusedFreeRelease, planProjectAsk } from './inventory_guard.mjs';

const U = HELI_UNIT;
const pair = { marketAddress: 'M', configuredMarketAddress: 'M', heliMint: 'H',
  configuredHeliMint: 'H', quoteMint: 'Q', configuredQuoteMint: 'Q' };

test('auction buyer claim is reserved before withdrawal; no double sale', () => {
  const auction = { finalized: true, soldHeli: 3_000_000n,
    bids: [{ allocatedHeli: 3_000_000n, claimed: false }] };
  const before = { ...pair, marketInventoryAtoms: 4_000_000n * U,
    marketRemainingAtoms: 4_000_000n * U, auction };
  assert.equal(planProjectAsk({ ...before, requestedAtoms: 1_000_000n * U }).availableAtoms, 1_000_000n * U);
  assert.throws(() => planProjectAsk({ ...before, requestedAtoms: 1_000_001n * U }), /exceeds/);
  const afterClaim = { ...before, marketInventoryAtoms: 1_000_000n * U,
    marketRemainingAtoms: 1_000_000n * U,
    auction: { ...auction, bids: [{ allocatedHeli: 3_000_000n, claimed: true }] } };
  assert.equal(planProjectAsk({ ...afterClaim, requestedAtoms: 1_000_000n * U }).availableAtoms, 1_000_000n * U);
});

test('an empty auction permits all 4m but never a second offer beyond the vault', () => {
  const input = { ...pair, marketInventoryAtoms: 4_000_000n * U,
    marketRemainingAtoms: 4_000_000n * U,
    auction: { finalized: true, soldHeli: 0n, bids: [] } };
  assert.equal(planProjectAsk({ ...input, requestedAtoms: 4_000_000n * U }).askAtoms, 4_000_000n * U);
  assert.throws(() => planProjectAsk({ ...input, marketInventoryAtoms: 0n,
    marketRemainingAtoms: 0n, requestedAtoms: 1n }), /exceeds/);
});

test('wrong market and inconsistent auction accounting fail closed', () => {
  const input = { ...pair, marketInventoryAtoms: 4_000_000n * U,
    marketRemainingAtoms: 4_000_000n * U,
    auction: { finalized: true, soldHeli: 1n, bids: [{ allocatedHeli: 1n, claimed: false }] },
    requestedAtoms: U };
  assert.throws(() => planProjectAsk({ ...input, marketAddress: 'X' }), /Wrong/);
  assert.throws(() => planProjectAsk({ ...input, marketRemainingAtoms: 3_000_000n * U }), /mismatch/);
  assert.throws(() => planProjectAsk({ ...input, auction: { ...input.auction, soldHeli: 2n } }), /mismatch/);
});

test('only unclaimed free entitlement stays reserved at month six', () => {
  const out = planUnusedFreeRelease({ launchRemainingAtoms: 900_000n * U,
    launchVaultAtoms: 900_000n * U, people: 300, claimed: 100, finalized: false });
  assert.equal(out.reservedForPeopleAtoms, 200_000n * U);
  assert.equal(out.releasableAtoms, 700_000n * U);
  assert.throws(() => planUnusedFreeRelease({ launchRemainingAtoms: 900_000n * U,
    launchVaultAtoms: 900_000n * U, people: 300, claimed: 301, finalized: false }), /integer|mismatch/);
  assert.throws(() => planUnusedFreeRelease({ launchRemainingAtoms: 900_000n * U,
    launchVaultAtoms: 900_000n * U, people: 300, claimed: 100, finalized: true }), /already finalized/);
});

````

## FILE: heli/manifest-integration/market_adapter.mjs

````text
/**
 * HELI's user-owned secondary trading route through an existing Manifest market.
 * This module builds instructions only. The user's wallet signs and submits them.
 * It does not control the HELI mint, the launch vault, or any private key.
 */

function address(value) {
  if (value && typeof value.toBase58 === 'function') return value.toBase58();
  if (typeof value === 'string') return value;
  throw new TypeError('Expected a Solana public key');
}

function positiveFinite(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number`);
  }
}

export async function loadHeliMarket({ connection, marketAddress, heliMint, quoteMint, Market }) {
  if (!connection || !marketAddress || !heliMint || !quoteMint || !Market) {
    throw new TypeError('Connection, market, HELI mint, quote mint, and SDK Market are required');
  }
  const market = await Market.loadFromAddress({ connection, address: marketAddress });
  if (address(market.baseMint()) !== address(heliMint) ||
      address(market.quoteMint()) !== address(quoteMint)) {
    throw new Error('Market token pair does not match the announced HELI/quote pair');
  }
  return market;
}

export function orderBook(market) {
  return {
    bids: market.bids(),
    asks: market.asks(),
    bestBid: market.bestBidPrice(),
    bestAsk: market.bestAskPrice(),
  };
}

export async function prepareWallet({ connection, marketAddress, walletPublicKey, ManifestClient }) {
  if (!walletPublicKey) throw new TypeError('Wallet public key is required');
  // The caller submits these setup instructions with the user's wallet. It must
  // also partial-sign with wrapperKeypair when the SDK returns one.
  return ManifestClient.getSetupIxs(connection, marketAddress, walletPublicKey);
}

export async function connectTrader({ connection, marketAddress, walletPublicKey, ManifestClient }) {
  if (!walletPublicKey) throw new TypeError('Wallet public key is required');
  return ManifestClient.getClientForMarketNoPrivateKey(
    connection, marketAddress, walletPublicKey,
  );
}

export async function limitOrderInstructions({ client, OrderType, side, quantityHeli, priceQuotePerHeli, orderId }) {
  if (side !== 'buy' && side !== 'sell') throw new RangeError('side must be buy or sell');
  positiveFinite(quantityHeli, 'quantityHeli');
  positiveFinite(priceQuotePerHeli, 'priceQuotePerHeli');
  if (!Number.isSafeInteger(orderId) || orderId < 0) {
    throw new RangeError('orderId must be a nonnegative safe integer');
  }
  if (!OrderType || OrderType.Limit === undefined) throw new TypeError('SDK OrderType.Limit is required');
  return client.placeOrderWithRequiredDepositIxs({
    numBaseTokens: quantityHeli,
    tokenPrice: priceQuotePerHeli,
    isBid: side === 'buy',
    lastValidSlot: 0,
    orderType: OrderType.Limit,
    clientOrderId: orderId,
  });
}

export function cancelOrderInstruction(client, orderId) {
  if (!Number.isSafeInteger(orderId) || orderId < 0) {
    throw new RangeError('orderId must be a nonnegative safe integer');
  }
  return client.cancelOrderIx(orderId);
}

export function withdrawAllInstructions(client) {
  return client.withdrawAllIx();
}

````

## FILE: heli/manifest-integration/market_adapter.test.mjs

````text
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadHeliMarket, orderBook, prepareWallet, connectTrader,
  limitOrderInstructions, cancelOrderInstruction, withdrawAllInstructions,
} from './market_adapter.mjs';

const key = (value) => ({ toBase58: () => value });
const market = {
  baseMint: () => key('HELI'), quoteMint: () => key('QUOTE'),
  bids: () => [{ price: 4 }], asks: () => [{ price: 5 }],
  bestBidPrice: () => 4, bestAskPrice: () => 5,
};
const Market = { loadFromAddress: async () => market };
const params = { connection: {}, marketAddress: key('MARKET'), heliMint: key('HELI'), quoteMint: key('QUOTE'), Market };

test('uses only the exact announced HELI/quote market', async () => {
  assert.equal(await loadHeliMarket(params), market);
  await assert.rejects(loadHeliMarket({ ...params, quoteMint: key('WRONG') }), /does not match/);
});

test('reads both sides and the best prices', () => {
  assert.deepEqual(orderBook(market), {
    bids: [{ price: 4 }], asks: [{ price: 5 }], bestBid: 4, bestAsk: 5,
  });
});

test('wallet setup and client creation use a public key, never a private key', async () => {
  const seen = [];
  const ManifestClient = {
    getSetupIxs: async (...args) => { seen.push(args); return { setupNeeded: true, instructions: ['seat'] }; },
    getClientForMarketNoPrivateKey: async (...args) => { seen.push(args); return 'client'; },
  };
  const input = { connection: params.connection, marketAddress: params.marketAddress,
    walletPublicKey: key('TRADER'), ManifestClient };
  assert.deepEqual(await prepareWallet(input), { setupNeeded: true, instructions: ['seat'] });
  assert.equal(await connectTrader(input), 'client');
  assert.deepEqual(seen[0], [params.connection, params.marketAddress, input.walletPublicKey]);
  assert.deepEqual(seen[1], seen[0]);
});

test('buy and sell are routed to the exchange limit-order instructions', async () => {
  const calls = [];
  const client = { placeOrderWithRequiredDepositIxs: async (p) => { calls.push(p); return ['deposit', 'order']; } };
  const OrderType = { Limit: 'limit' };
  const common = { client, OrderType, quantityHeli: 12, priceQuotePerHeli: 0.01, orderId: 7 };
  assert.deepEqual(await limitOrderInstructions({ ...common, side: 'buy' }), ['deposit', 'order']);
  assert.deepEqual(await limitOrderInstructions({ ...common, side: 'sell' }), ['deposit', 'order']);
  assert.equal(calls[0].isBid, true);
  assert.equal(calls[1].isBid, false);
  assert.equal(calls[1].numBaseTokens, 12);
  assert.equal(calls[1].tokenPrice, 0.01);
  assert.equal(calls[1].orderType, 'limit');
});

test('invalid orders cannot reach the exchange SDK', async () => {
  const client = { placeOrderWithRequiredDepositIxs: () => { throw new Error('unexpected'); } };
  const base = { client, OrderType: { Limit: 'limit' }, side: 'sell', quantityHeli: 1, priceQuotePerHeli: 1, orderId: 1 };
  await assert.rejects(limitOrderInstructions({ ...base, side: 'other' }), /side/);
  await assert.rejects(limitOrderInstructions({ ...base, quantityHeli: 0 }), /quantity/);
  await assert.rejects(limitOrderInstructions({ ...base, priceQuotePerHeli: NaN }), /price/);
  await assert.rejects(limitOrderInstructions({ ...base, orderId: -1 }), /orderId/);
});

test('cancel and withdraw are exchange instructions', () => {
  const client = { cancelOrderIx: (id) => `cancel:${id}`, withdrawAllIx: () => ['withdraw'] };
  assert.equal(cancelOrderInstruction(client, 9), 'cancel:9');
  assert.deepEqual(withdrawAllInstructions(client), ['withdraw']);
});

````

## FILE: heli/mobile/deps.mjs

````text
import { createRequire } from 'node:module';
const local = createRequire(import.meta.url);
const pilot = createRequire(new URL('../solana/package.json', import.meta.url));
function load(name) { try { return local(name); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; return pilot(name); } }
export const web3 = load('@solana/web3.js');
export const spl = load('@solana/spl-token');

````

## FILE: heli/mobile/identity.mjs

````text
import { createHash, createPublicKey, randomBytes, randomUUID, sign, verify } from 'node:crypto';
import { web3 } from './deps.mjs';
const SPKI = Buffer.from('302a300506032b6570032100','hex');
const PREFIX = Buffer.from('HELI_IDENTITY_V15\0');
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export function walletMessage(s) { return Buffer.from(`HELI telefon başvurusu\n${s.id}\n${s.wallet}\n${s.challenge}\n${s.flowId}\n${s.expiresAt}\n`); }
export function verifyWallet(wallet,message,signature) {
 const raw = new web3.PublicKey(wallet).toBuffer();
 const sig = Buffer.from(signature,'base64');
 if (sig.length !== 64 || !verify(null,message,{key:Buffer.concat([SPKI,raw]),format:'der',type:'spki'},sig)) throw Error('Cüzdan imzası geçersiz');
}
export function proofMessage(program,config,wallet,nullifier,digest,issuedAt,expiresAt) {
 const time=Buffer.alloc(16);time.writeBigInt64LE(BigInt(issuedAt));time.writeBigInt64LE(BigInt(expiresAt),8);
 return Buffer.concat([PREFIX,...[program,config,wallet].map(x=>new web3.PublicKey(x).toBuffer()),Buffer.from(nullifier,'hex'),Buffer.from(digest,'hex'),time]);
}
export function normalizeNullifier(n) {
 if(typeof n!=='string')throw Error('Kalıcı kişi kanıtı yok');
 let value;
 if(/^0x[0-9a-fA-F]{1,64}$/.test(n))value=BigInt(n);
 else if(/^[1-9][0-9]{0,77}$/.test(n))value=BigInt(n);
 else if(/^[0-9a-fA-F]{64}$/.test(n)&&/[a-fA-F]/.test(n))value=BigInt('0x'+n);
 else throw Error('Kalıcı kişi kanıtı yok');
 if(value<=0n||value>=(1n<<256n))throw Error('Kalıcı kişi kanıtı yok');
 return value.toString(16).padStart(64,'0');
}
export class Admission {
 constructor({program,flowId,environment='live',verifierKey,store,now=()=>Math.floor(Date.now()/1000)}) {
  this.program=program;this.config=web3.PublicKey.findProgramAddressSync([Buffer.from('config')],new web3.PublicKey(program))[0].toBase58();
  this.flowId=flowId;this.environment=environment;this.verifierKey=verifierKey;this.store=store;this.now=now;
 }
 session(wallet) {
  new web3.PublicKey(wallet);const now=this.now();const token=randomBytes(32).toString('hex');
  const s={id:randomUUID(),wallet,flowId:this.flowId,challenge:randomBytes(24).toString('hex'),createdAt:now,expiresAt:now+900,tokenHash:hash(token),status:'challenge'};
  this.store.sessions[s.id]=s;this.store.save();return {...s,token,message:walletMessage(s).toString(),tokenHash:undefined};
 }
 get(id,token) {const s=this.store.sessions[id];if (!s||typeof token!=='string'||hash(token)!==s.tokenHash) throw Error('Başvuru bulunamadı');return s;}
 authenticate(s,signature) {if(s.status!=='challenge'||this.now()>s.expiresAt) throw Error('Başvuru süresi doldu');verifyWallet(s.wallet,walletMessage(s),signature);s.walletSignature=signature;s.status='verifying';this.store.save();}
 // Live service calls only after Svix verifies untouched Self webhook bytes.
 verified(event,raw) {
  const s=this.store.sessions[event.external_uuid];if(!s||s.status==='challenge')throw Error('Bilinmeyen başvuru');
  if(event.type!=='verification.completed'||event.verification_id!==s.providerId||event.flow_id!==this.flowId||event.flow_version_id!==s.flowVersionId||event.environment!==this.environment||event.product!=='proof_of_human')throw Error('Sağlayıcı sonucu başvuruya ait değil');
  const digest=hash(raw);const prior=this.store.events[event.verification_id];
  if(prior){if(prior!==digest)throw Error('Çelişkili sağlayıcı sonucu');return s;}
  const at=Math.floor(Date.parse(event.verified_at)/1000);
  if(!Number.isFinite(at)||at<s.createdAt||at>s.expiresAt||at>this.now()+30)throw Error('Doğrulama zamanı geçersiz');
  if(event.status!=='valid'){s.status=event.status;this.store.events[event.verification_id]=digest;this.store.save();return s;}
  const nullifier=hash(Buffer.concat([Buffer.from('HELI:SELF:PERSON:V15\0'),Buffer.from(normalizeNullifier(event.nullifier),'hex')]));
  const existing=this.store.people[nullifier];if(existing&&existing!==s.wallet) {s.status='duplicate';this.store.events[event.verification_id]=digest;this.store.save();return s;}
  this.store.people[nullifier]=s.wallet;s.nullifier=nullifier;s.digest=digest;s.status='verified';
  this.store.events[event.verification_id]=digest;this.store.save();return s;
 }
 attestation(s) {
  if(s.status!=='verified'&&s.status!=='enrolled'&&s.status!=='claimed')throw Error('Kimlik doğrulaması bekleniyor');
  const issuedAt=this.now(),expiresAt=issuedAt+600;
  const message=proofMessage(this.program,this.config,s.wallet,s.nullifier,s.digest,issuedAt,expiresAt);
  const signature=sign(null,message,this.verifierKey);
  const publicKey=createPublicKey(this.verifierKey).export({format:'der',type:'spki'}).subarray(-32);
  return {nullifier:s.nullifier,proofDigest:s.digest,issuedAt,expiresAt,signature:signature.toString('base64'),publicKey:new web3.PublicKey(publicKey).toBase58()};
 }
}

````

## FILE: heli/mobile/solana.mjs

````text
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { web3, spl } from './deps.mjs';
import { proofMessage } from './identity.mjs';
const snake=s=>s.replace(/[A-Z]/g,x=>'_'+x.toLowerCase());
const disc=name=>createHash('sha256').update('global:'+name).digest().subarray(0,8);
const key=x=>new web3.PublicKey(x);
function encode(type,value) {
 if(type==='publicKey')return key(value).toBuffer();
 if(type==='bool')return Buffer.from([Number(value)]);
 if(typeof type==='string'){const b=Buffer.alloc(Number(type.slice(1))/8);let n=BigInt(value);if(n<0)n=(1n<<BigInt(b.length*8))+n;for(let i=0;i<b.length;i++){b[i]=Number(n&255n);n>>=8n;}if(n!==0n)throw Error('Sayı taşması');return b;}
 if(type.array)return Buffer.concat(value.map(v=>encode(type.array[0],v)));
 throw Error('Desteklenmeyen kodlama');
}
export function decodeAccount(idl,name,buffer) {
 const type=[...(idl.accounts??[]),...(idl.types??[])].find(x=>x.name===name)?.type;if(!type)throw Error('IDL hesabı yok');
 let offset=8;const out={};
 function decode(t){if(t==='publicKey'){const x=key(buffer.subarray(offset,offset+32)).toBase58();offset+=32;return x;}if(t==='bool')return Boolean(buffer[offset++]);if(typeof t==='string'){const size=Number(t.slice(1))/8;let n=0n;for(let i=0;i<size;i++)n|=BigInt(buffer[offset+i])<<BigInt(8*i);offset+=size;if(t[0]==='i'&&(n&(1n<<BigInt(size*8-1))))n-=1n<<BigInt(size*8);return n;}if(t.array)return Array.from({length:t.array[1]},()=>decode(t.array[0]));if(t.vec){const count=Number(decode('u32'));if(count>4096)throw Error('Hesap dizisi çok büyük');return Array.from({length:count},()=>decode(t.vec));}throw Error('Desteklenmeyen hesap türü');}
 for(const f of type.fields)out[snake(f.name)]=decode(f.type);return out;
}
export function heliInstruction(idl,program,name,args,accounts) {
 const i=idl.instructions.find(x=>snake(x.name)===name);if(!i)throw Error('Talimat IDL içinde yok');
 return new web3.TransactionInstruction({programId:key(program),data:Buffer.concat([disc(name),...i.args.map(f=>encode(f.type,args[snake(f.name)]))]),keys:i.accounts.map(a=>({pubkey:key(accounts[snake(a.name)]),isWritable:a.isMut,isSigner:a.isSigner}))});
}
export class SponsoredChain {
 constructor({program,idl,sponsor,connection,store,dailyCap=50_000_000,now=()=>Math.floor(Date.now()/1000)}){Object.assign(this,{program:key(program),idl,sponsor,connection,store,dailyCap,now});}
 pda(...parts){return web3.PublicKey.findProgramAddressSync(parts.map(x=>typeof x==='string'?Buffer.from(x):x),this.program)[0];}
 async account(address,type){const a=await this.connection.getAccountInfo(address,'confirmed');if(!a)return null;if(!a.owner.equals(this.program))throw Error('Yanlış hesap sahibi');return decodeAccount(this.idl,type,a.data);}
 async status(wallet,nullifier){const credential=this.pda('human',Buffer.from(nullifier,'hex'));const receipt=this.pda('launch-receipt',credential.toBuffer());const r=await this.account(receipt,'LaunchReceipt');return r?{status:r.claimed?'claimed':'enrolled',eligibleAt:Number(r.eligible_at)}:{status:'verified'};}
 async prepare(session,action,proof) {
  const previous=this.preparing??Promise.resolve();let release;
  this.preparing=new Promise(resolve=>{release=resolve;});
  await previous;
  try{return await this.prepareLocked(session,action,proof);}finally{release();}
 }
 async prepareLocked(session,action,proof) {
  if(!['enroll','claim'].includes(action))throw Error('Talimat izinli değil');
  const existing=Object.entries(this.store.pending).find(([,x])=>x.sessionId===session.id&&x.action===action&&!x.used&&x.expiresAt>this.now());
  if(existing)return {ticket:existing[0],transaction:existing[1].transaction};
  const person=key(session.wallet),config=this.pda('config');const cfg=await this.account(config,'Config');if(!cfg||!cfg.live||cfg.closed||cfg.paused)throw Error('Dağıtım şu anda açık değil');
  const policy=await this.account(this.pda('identity-policy'),'IdentityPolicy');if(!policy||policy.verifier!==proof.publicKey||policy.verifier===this.sponsor.publicKey.toBase58())throw Error('Kimlik doğrulayıcısı zincirdeki ayarla uyuşmuyor');
  const mint=key(cfg.mint),credential=this.pda('human',Buffer.from(proof.nullifier,'hex')),receipt=this.pda('launch-receipt',credential.toBuffer());
  const identity=await this.account(credential,'Credential'),r=await this.account(receipt,'LaunchReceipt');
  if(identity&&(identity.owner!==session.wallet||!identity.active||Buffer.from(identity.nullifier.map(Number)).toString('hex')!==proof.nullifier))throw Error('Bu kişi hakkı başka cüzdanda veya kapalı');
  const accounts={config,mint,credential,receipt,person,owner:person,wallet_identity:this.pda('id-wallet',person.toBuffer()),identity_policy:this.pda('identity-policy'),instructions:web3.SYSVAR_INSTRUCTIONS_PUBKEY,account_payer:this.sponsor.publicKey,system_program:web3.SystemProgram.programId,token_program:spl.TOKEN_PROGRAM_ID,launch:this.pda('launch-claims')};
  const instructions=[web3.ComputeBudgetProgram.setComputeUnitLimit({units:400_000})];let rent=0;
  if(action==='enroll') {
   if(r)throw Error('Başvuru zaten kayıtlı');
   if(!identity){const message=proofMessage(this.program,config,person,proof.nullifier,proof.proofDigest,proof.issuedAt,proof.expiresAt);instructions.push(web3.Ed25519Program.createInstructionWithPublicKey({publicKey:key(proof.publicKey).toBytes(),message,signature:Buffer.from(proof.signature,'base64')}));instructions.push(heliInstruction(this.idl,this.program,'issue_credential',{nullifier:Array.from(Buffer.from(proof.nullifier,'hex')),proof_digest:Array.from(Buffer.from(proof.proofDigest,'hex')),issued_at:proof.issuedAt,expires_at:proof.expiresAt},accounts));rent+=await this.connection.getMinimumBalanceForRentExemption(105);rent+=await this.connection.getMinimumBalanceForRentExemption(40);}
   instructions.push(heliInstruction(this.idl,this.program,'enroll_launch',{},accounts));rent+=await this.connection.getMinimumBalanceForRentExemption(50);
  } else {
   if(!identity||!r||!r.valid||r.claimed||r.owner!==session.wallet)throw Error('Teslimat hakkı yok');
   if(this.now()<Number(r.eligible_at))throw Error('Yedi günlük bekleme devam ediyor');
   const destination=spl.getAssociatedTokenAddressSync(mint,person);accounts.destination=destination;
   if(!await this.connection.getAccountInfo(destination)){instructions.push(spl.createAssociatedTokenAccountIdempotentInstruction(this.sponsor.publicKey,destination,person,mint));rent+=await this.connection.getMinimumBalanceForRentExemption(165);}
   instructions.push(heliInstruction(this.idl,this.program,'claim_launch',{},accounts));
  }
  const block=await this.connection.getLatestBlockhash('confirmed');const tx=new web3.Transaction({feePayer:this.sponsor.publicKey,recentBlockhash:block.blockhash}).add(...instructions);
  const fee=(await this.connection.getFeeForMessage(tx.compileMessage(),'confirmed')).value;if(fee===null)throw Error('İşlem ücreti hesaplanamadı');
  const cost=rent+fee,day=Math.floor(this.now()/86400).toString(),spent=this.store.budgets[day]??0;
  if(spent+cost>this.dailyCap)throw Error('Günlük masraf sınırına ulaşıldı');
  const balance=await this.connection.getBalance(this.sponsor.publicKey,'confirmed');if(balance<cost)throw Error('Dağıtımın işlem bütçesi yetersiz');
  tx.partialSign(this.sponsor);const transaction=tx.serialize({requireAllSignatures:false}).toString('base64');
  const ticket=createHash('sha256').update(tx.serializeMessage()).digest('hex');
  this.store.budgets[day]=spent+cost;this.store.pending[ticket]={sessionId:session.id,action,message:tx.serializeMessage().toString('base64'),transaction,block,cost,expiresAt:this.now()+90,used:false};this.store.save();
  return {ticket,transaction};
 }
 async submit(session,ticket,raw){
  const plan=this.store.pending[ticket];if(!plan||plan.sessionId!==session.id||plan.expiresAt<this.now())throw Error('İşlem planının süresi doldu');
  if(plan.used){if(plan.failed)throw Error('Zincir işlemi başarısız; yeni işlem hazırlayın');if(plan.signature)return {signature:plan.signature,pending:!plan.confirmed};throw Error('İşlem zaten gönderiliyor');}
  const bytes=Buffer.from(raw,'base64');if(bytes.length>1232)throw Error('İşlem boyutu geçersiz');const tx=web3.Transaction.from(bytes);
  if(tx.serializeMessage().toString('base64')!==plan.message||!tx.verifySignatures())throw Error('Değiştirilmiş veya imzasız işlem');
  // Persist submitted signature before confirmation; a timeout never resubmits a new payment.
  plan.used=true;this.store.save();
  try {plan.signature=await this.connection.sendRawTransaction(bytes,{skipPreflight:false,maxRetries:2});this.store.save();}
  catch(e){plan.used=false;this.store.save();throw e;}
  let result;
  try {result=await this.connection.confirmTransaction({signature:plan.signature,...plan.block},'confirmed');}
  catch(e){this.store.save();return {signature:plan.signature,pending:true};}
  if(result.value.err){plan.failed=true;this.store.save();throw Error('Zincir işlemi başarısız; yeni işlem hazırlayın');}
  plan.confirmed=true;session.status=plan.action==='claim'?'claimed':'enrolled';this.store.save();return {signature:plan.signature,pending:false};
 }
}

````

## FILE: heli/operations/app.mjs

````text
import {cashPlan} from './finance.mjs';
const el=id=>document.getElementById(id),amount=n=>n===null?'Bilinmiyor':n.toLocaleString('tr-TR',{maximumFractionDigits:6});
function card(label,value){const div=document.createElement('div'),small=document.createElement('small'),b=document.createElement('b');small.textContent=label;b.textContent=value;div.append(small,b);return div;}
function calculate(){try{const input={};for(const field of el('inputs').elements)if(field.name)input[field.name]=field.value===''?null:Number(field.value);const r=cashPlan(input);el('calculation').replaceChildren(card('Aylık bakım · SOL',amount(r.maintenanceSol)),card('Yeni başvurucular · SOL',amount(r.userSol)),card('SOL ihtiyacı · tampon dahil',amount(r.monthlySol)),card('Toplam aylık gider · karşılık',amount(r.totalQuoteCost)),card('Ayrı cüzdanlarla süre · ay',amount(r.separateWalletRunwayMonths)),card('Gelir sonrası aylık açık · karşılık',amount(r.monthlyShortfallQuote)));el('funding').textContent=r.unknownCosts.length?'Sunucu, RPC veya kişi başı kimlik gideri bilinmiyor. Bakım SOL hesabı gösteriliyor; toplam maliyet ve süre henüz tamamlanmadı.':`Bu varsayımlarla, ayrıca SOL dönüşümü yapılabilse toplam bütçe yaklaşık ${amount(r.conversionRunwayMonths)} ay dayanır. Bu dönüşüm kodu uygulanmış değildir. Aylık hesap SOL bakiyesi için de ayrıca yeterli olmalıdır.`;}catch{el('funding').textContent='Alanlara geçerli, sıfır veya pozitif tutarlar girin.';}}
async function refresh(){try{const r=await fetch('/api/status'),s=await r.json(),h=s.health,t=h?.telemetry;el('status').textContent=s.ready?'Devnet çalıştırıcısı güncel':s.severity==='critical'?'Hizmet hazır değil':'Kontrol gerekiyor';el('stamp').textContent=h?'Son durum: '+new Date(h.time).toLocaleString('tr-TR'):'Canlı çalıştırıcı henüz başlatılmadı.';el('alerts').replaceChildren(...s.alerts.map(a=>{const li=document.createElement('li');li.textContent=a.text;return li;}));el('month').textContent=t?.lastSettledMonth??'—';el('balance').textContent=Number.isSafeInteger(t?.balanceLamports)?amount(t.balanceLamports/1e9):'Ölçülmedi';el('reserved').textContent=Number.isSafeInteger(t?.reservedTodayLamports)?amount(t.reservedTodayLamports/1e9):'—';}catch{el('status').textContent='Durum ekranına erişilemiyor';}}
el('inputs').addEventListener('input',calculate);calculate();refresh();setInterval(refresh,15000);

````

## FILE: heli/operations/budget.py

````text
"""Transparent HELI cash sufficiency model; assumptions, not a price forecast."""
from dataclasses import dataclass
from math import ceil

LAMPORTS_PER_SOL = 1_000_000_000
MONTHS = 720
RENT_LAMPORTS_PER_BYTE_YEAR_FACTOR = 6_960  # local LiteSVM result: 2 * 3,480
PROGRAM_DATA_OVERHEAD = 45
EPOCH_RENT_LAMPORTS = 1_837_440 + 2 * 2_039_280  # epoch + two 165-byte token accounts
BASE_FEE_LAMPORTS_PER_SIGNATURE = 5_000  # current official Solana documentation


@dataclass(frozen=True)
class Budget:
    program_bytes: int
    sold_heli: int
    average_quote_per_heli: float
    quote_per_sol: float
    setup_extra_sol: float = 0
    yearly_offchain_quote: float = 0
    transactions_per_month: int = 3
    priority_fee_lamports_per_transaction: int = 0
    safety_multiplier: float = 1.25

    def calculate(self) -> dict:
        if self.program_bytes <= 0 or not 0 <= self.sold_heli <= 4_000_000:
            raise ValueError("Invalid program size or sold HELI")
        if self.average_quote_per_heli < 0 or self.quote_per_sol <= 0:
            raise ValueError("Prices must be nonnegative and SOL quote price must be positive")
        if self.setup_extra_sol < 0 or self.yearly_offchain_quote < 0 or self.transactions_per_month < 0:
            raise ValueError("Costs must be nonnegative")
        if self.priority_fee_lamports_per_transaction < 0 or self.safety_multiplier < 1:
            raise ValueError("Invalid priority fee or safety multiplier")

        program_rent_sol = (self.program_bytes + PROGRAM_DATA_OVERHEAD + 128) * RENT_LAMPORTS_PER_BYTE_YEAR_FACTOR / LAMPORTS_PER_SOL
        pre_sale_sol = program_rent_sol + self.setup_extra_sol
        epoch_rent_sol = MONTHS * EPOCH_RENT_LAMPORTS / LAMPORTS_PER_SOL
        network_fee_sol = MONTHS * self.transactions_per_month * (
            BASE_FEE_LAMPORTS_PER_SIGNATURE + self.priority_fee_lamports_per_transaction
        ) / LAMPORTS_PER_SOL
        future_sol = (epoch_rent_sol + network_fee_sol) * self.safety_multiplier
        offchain_quote = 60 * self.yearly_offchain_quote
        required_quote = future_sol * self.quote_per_sol + offchain_quote
        gross_quote = self.sold_heli * self.average_quote_per_heli
        return {
            "pre_sale_sol_estimate": round(pre_sale_sol, 6),
            "future_epoch_rent_sol": round(epoch_rent_sol, 6),
            "future_network_fee_sol": round(network_fee_sol, 6),
            "future_sol_with_buffer": round(future_sol, 6),
            "future_offchain_quote": round(offchain_quote, 6),
            "sale_proceeds_quote": round(gross_quote, 6),
            "reserve_needed_quote": round(required_quote, 6),
            "sale_coverage_ratio": round(gross_quote / required_quote, 4) if required_quote else None,
            "self_funded_after_sale": gross_quote >= required_quote,
            "minimum_average_quote_per_heli": round(required_quote / self.sold_heli, 9) if self.sold_heli else None,
        }


if __name__ == "__main__":
    import argparse, json
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--program-bytes", type=int, default=949_336)
    p.add_argument("--sold-heli", type=int, required=True)
    p.add_argument("--average-quote-per-heli", type=float, required=True)
    p.add_argument("--quote-per-sol", type=float, required=True)
    p.add_argument("--setup-extra-sol", type=float, default=0)
    p.add_argument("--yearly-offchain-quote", type=float, default=0)
    p.add_argument("--priority-fee-lamports", type=int, default=0)
    a = p.parse_args()
    print(json.dumps(Budget(
        program_bytes=a.program_bytes, sold_heli=a.sold_heli,
        average_quote_per_heli=a.average_quote_per_heli,
        quote_per_sol=a.quote_per_sol, setup_extra_sol=a.setup_extra_sol,
        yearly_offchain_quote=a.yearly_offchain_quote,
        priority_fee_lamports_per_transaction=a.priority_fee_lamports,
    ).calculate(), indent=2))

````

## FILE: heli/operations/cash-plan.mjs

````text
import {readFileSync} from 'node:fs';import {cashPlan} from './finance.mjs';
const file=process.argv[2];if(!file)throw Error('Usage: node heli/operations/cash-plan.mjs budget-input.json');
console.log(JSON.stringify(cashPlan(JSON.parse(readFileSync(file,'utf8'))),null,2));

````

## FILE: heli/operations/check-health.mjs

````text
// For an external supervisor, run on the keeper host. Non-zero exit means attention needed.
import {readFileSync} from 'node:fs';import {assess,publicHealth} from './health.mjs';
let health=null;try{health=publicHealth(JSON.parse(readFileSync(new URL('../keeper/.state/health.json',import.meta.url),'utf8')));}catch{}
const result=assess(health);console.log(JSON.stringify(result,null,2));process.exitCode=result.ready?0:2;

````

## FILE: heli/operations/finance.mjs

````text
// Cash model only. No price feed, swap, treasury withdrawal or token issuance.
export const defaults = Object.freeze({days:30,observationsPerDay:24,maintenanceTransactions:2,
 feeLamports:5000,priorityFeeLamports:0,epochRentLamports:2060160,
 applicants:0,applicantRentLamports:6069120,applicantFeeLamports:25000,bufferPercent:25,
 solBalance:0,solFloor:0.005,quoteBalance:0,quotePerSol:100,
 serverQuote:null,rpcQuote:null,identityQuotePerApplicant:null,otherQuote:0,
 monthlyCollectedRevenueQuote:0,volumeQuote:0,retainedFeeBps:0});
function nonnegative(n,key){if(typeof n!=='number'||!Number.isFinite(n)||n<0)throw Error('Invalid '+key);return n;}
export function cashPlan(input={}){
 const c={...defaults,...input};
 for(const [k,v]of Object.entries(c))if(!['serverQuote','rpcQuote','identityQuotePerApplicant'].includes(k)||v!==null)nonnegative(v,k);
 for(const k of ['days','observationsPerDay','maintenanceTransactions','feeLamports','priorityFeeLamports','epochRentLamports','applicants','applicantRentLamports','applicantFeeLamports','bufferPercent','retainedFeeBps'])if(!Number.isSafeInteger(c[k]))throw Error('Integer required: '+k);
 if(c.days<1||c.days>366||c.quotePerSol<=0||c.observationsPerDay>24||c.retainedFeeBps>10000||c.bufferPercent>1000)throw Error('Invalid planning range');
 const transactions=c.days*c.observationsPerDay+c.maintenanceTransactions;
 const maintenanceLamports=transactions*(c.feeLamports+c.priorityFeeLamports)+c.epochRentLamports;
 const userLamports=c.applicants*(c.applicantRentLamports+c.applicantFeeLamports+2*c.priorityFeeLamports);
 if(!Number.isSafeInteger(maintenanceLamports+userLamports))throw Error('Plan exceeds exact lamport range');
 const monthlySol=(maintenanceLamports+userLamports)/1e9*(1+c.bufferPercent/100);
 const unknownCosts=['serverQuote','rpcQuote',...(c.applicants?['identityQuotePerApplicant']:[])].filter(k=>c[k]===null);
 const knownOffchainQuote=(c.serverQuote??0)+(c.rpcQuote??0)+(c.identityQuotePerApplicant??0)*c.applicants+c.otherQuote;
 const revenueQuote=c.monthlyCollectedRevenueQuote; // volume is NOT already-collected revenue
 const solMonths=monthlySol?Math.max(0,c.solBalance-c.solFloor)/monthlySol:null;
 const quoteNet=knownOffchainQuote-revenueQuote;
 const quoteMonths=unknownCosts.length?null:quoteNet>0?c.quoteBalance/quoteNet:null;
 const totalQuoteCost=unknownCosts.length?null:knownOffchainQuote+monthlySol*c.quotePerSol;
 const breakEvenVolumeQuote=totalQuoteCost!==null&&c.retainedFeeBps>0?Math.max(0,totalQuoteCost-revenueQuote)/(c.retainedFeeBps/10000):null;
 const fundsIfConvertedQuote=c.quoteBalance+Math.max(0,c.solBalance-c.solFloor)*c.quotePerSol;
 const monthlyNetAfterConversion=totalQuoteCost===null?null:totalQuoteCost-revenueQuote;
 const conversionRunwayMonths=monthlyNetAfterConversion>0?fundsIfConvertedQuote/monthlyNetAfterConversion:null;
 const limited=[solMonths,quoteMonths].filter(x=>x!==null);
 return {assumptions:c,transactions,maintenanceSol:maintenanceLamports/1e9,userSol:userLamports/1e9,monthlySol,
 unknownCosts,knownOffchainQuote,totalQuoteCost,collectedRevenueQuote:revenueQuote,
 theoreticalFeeRevenueQuote:c.volumeQuote*c.retainedFeeBps/10000,breakEvenVolumeQuote,
 solMonths,quoteMonths,separateWalletRunwayMonths:unknownCosts.length?null:limited.length?Math.min(...limited):null,
 conversionRunwayMonths,conversionRequired:true,
 monthlyShortfallQuote:totalQuoteCost===null?null:Math.max(0,totalQuoteCost-revenueQuote)};
}

````

## FILE: heli/operations/health.mjs

````text
export function assess(health,{now=Date.now(),staleMs=300000}={}){
 const alerts=[];const add=(level,code,text)=>alerts.push({level,code,text});
 if(!health)return {ready:false,severity:'critical',alerts:[{level:'critical',code:'not-started',text:'Çalıştırıcıdan henüz durum alınmadı. Canlı hizmet başlamadı.'}]};
 const timestamp=Date.parse(health.time),age=now-timestamp;
 if(!Number.isFinite(timestamp)||age< -60000||age>staleMs)add('critical','stale','Hizmetin durum bilgisi güncel değil; süreç veya bağlantı durmuş olabilir.');
 if(health.mode!=='devnet-execute')add('warning','dry-run','Salt plan modu: zincire işlem gönderilmiyor.');
 const stops={'rpc-or-safety-stop':'Ağ veya güven kontrolü nedeniyle işlem gönderilemiyor.','insufficient-balance':'İşlem gideri cüzdanının bakiyesi yetersiz.','budget-exhausted':'Günlük gider tavanına ulaşıldı.','expired-unknown':'Eski işlemin sonucu belirsiz; operatör incelemesi gerekiyor.','failed':'Son işlem zincirde reddedildi.','uncertain':'Gönderilen işlemin yanıtı belirsiz; aynı imza izleniyor.'};
 if(stops[health.status])add(['uncertain'].includes(health.status)?'warning':'critical',health.status,stops[health.status]);
 if(health.status==='blocked'||health.status==='backoff')add('warning','waiting','Ön kontrol veya işlem reddinden sonra bekleniyor; gerçek gider aktarılmadığı varsayılmamalı.');
 if(health.status==='essential-reserve')add('warning','essential-reserve','Sonraki aylık bakımın SOL payı korunuyor; fiyat gözlemi gönderilmedi.');
 const t=health.telemetry;
 if(t?.overdueMonths>0)add('warning','backlog',`${t.overdueMonths} aylık kapanış sırada bekliyor.`);
 if(t?.manifestBound&&!t?.paused&&!t?.closed&&Number.isFinite(t?.lastObservation)&&t.chainTime-t.lastObservation>7200)add('warning','observation-gap','Fiyat gözlemlerinde iki saati aşan boşluk var; kilitli satışlar etkilenebilir.');
 if(t?.balanceLamports!==null&&Number.isSafeInteger(t?.balanceLamports)&&Number.isSafeInteger(t?.reserveLamports)&&t.balanceLamports<t.reserveLamports)add('critical','balance-floor','İşlem cüzdanı asgari bakiyenin altında.');
 if(t?.balanceTime&&now-Date.parse(t.balanceTime)>staleMs)add('warning','old-balance','Son cüzdan bakiyesi ölçümü güncel değil.');
 if(health.mode==='devnet-execute'&&!t?.snapshotTime)add('warning','no-chain-snapshot','Doğrulanmış zincir durumu henüz alınmadı.');
 if(health.mode==='devnet-execute'&&!t?.balanceTime)add('warning','no-balance','İşlem cüzdanının bakiyesi henüz ölçülmedi.');
 if(t?.snapshotTime&&now-Date.parse(t.snapshotTime)>staleMs)add('critical','old-chain-snapshot','Zincir durumunun son doğrulaması güncel değil.');
 const severity=alerts.some(a=>a.level==='critical')?'critical':alerts.length?'warning':'ok';
 return {ready:severity==='ok'&&health.mode==='devnet-execute',severity,alerts};
}
// Public monitoring exposes only explicit fields. Never export journal/config/raw errors.
export function publicHealth(h){
 if(!h)return null;const t=h.telemetry??{},out={};
 for(const k of ['snapshotTime','chainTime','lastSettledMonth','overdueMonths','paused','closed','manifestBound','observationCount','lastObservation','balanceLamports','balanceTime','reserveLamports','dailyCapLamports','reservedTodayLamports'])if(Object.hasOwn(t,k))out[k]=t[k];
 return {time:h.time,mode:h.mode,status:h.status,failures:h.failures??0,job:h.job?{name:h.job.name,number:h.job.number}:null,telemetry:out};
}

````

## FILE: heli/operations/index.html

````text
<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HELI · İşletim ve giderler</title><link rel="stylesheet" href="/style.css"><script type="module" src="/app.mjs"></script>
<main><header><span class="brand">HELI / İŞLETİM</span><span>Yalnız bu bilgisayarda · Devnet hazırlığı</span></header><h1>Sistem ne durumda,<br>bütçe ne kadar dayanır?</h1><p class="intro">Bu ekran işlem göndermez ve para aktarmaz. Hizmet durumu ile varsayımsal gider hesabını ayrı gösterir.</p>
<section class="service"><h2>Çalıştırıcı durumu</h2><strong id="status">Kontrol ediliyor…</strong><p id="stamp"></p><ul id="alerts"></ul><div class="grid"><div><small>Son kapanan ay</small><b id="month">—</b></div><div><small>Gider cüzdanı · ölçülen SOL</small><b id="balance">—</b></div><div><small>Bugün ayrılan gider hakkı · SOL</small><b id="reserved">—</b></div></div><p class="note">Ayrılan gider hakkı, gerçekleşmiş harcama değildir. Bilgisayar kapanırsa bu ekran da kapanır; dışarıdan izleme ayrıca kurulmalıdır.</p></section>
<section><h2>Gider ve süre hesabı</h2><p class="note">Aşağıdakiler örnek varsayımlardır; cüzdan/rezerv bakiyesi veya hizmet sağlayıcı fiyatı değildir. Örnek kur 100 karşılık birimi/SOL, güncel fiyat değildir. Bilinmeyen giderler girilmeden toplam süre hesaplanmaz.</p>
<form id="inputs" class="inputs">
<label>İşletime ayrılmış SOL<input name="solBalance" type="number" min="0" step="0.001" value="0.25"></label>
<label>Harcanabilir karşılık bütçesi<input name="quoteBalance" type="number" min="0" step="1" value="100"></label>
<label>Varsayımsal karşılık / SOL<input name="quotePerSol" type="number" min="0" step="1" value="100"></label>
<label>Aylık ücretsiz başvurucu<input name="applicants" type="number" min="0" step="1" value="0"></label>
<label>Sunucu gideri / ay<input name="serverQuote" type="number" min="0" step="0.01" placeholder="Bilinmiyor"></label>
<label>RPC gideri / ay<input name="rpcQuote" type="number" min="0" step="0.01" placeholder="Bilinmiyor"></label>
<label>Kimlik gideri / kişi<input name="identityQuotePerApplicant" type="number" min="0" step="0.01" placeholder="Bilinmiyor"></label>
<label>Diğer gider / ay<input name="otherQuote" type="number" min="0" step="0.01" value="0"></label>
<label>Gerçekten tahsil edilmiş gelir / ay<input name="monthlyCollectedRevenueQuote" type="number" min="0" step="0.01" value="0"></label>
</form><div id="calculation" class="grid"></div><p id="funding" class="note"></p><p class="note">V20 gider modeli: 30 gün, günde en çok 24 gözlem, ayda 2 bakım işlemi, tek 168 baytlık dönem hesabı ve %25 tampon. Başvurucunun ilk ücretsiz başvuru/teslimatı dahil; piyasa kurulumları, ilk açılış ve yayımlama gideri ayrıca hesaplanır. Staking ve aylık ücretsiz dağıtım yoktur. Karşılık bakiyesi kendiliğinden SOL'a dönüşmez. Manifest işlem hacmi, HELI'nin geliri sayılmaz.</p></section>
<footer>Canlı hizmet, bağımsız denetim ve gelir garantisi iddiası yoktur.</footer></main></html>

````

## FILE: heli/operations/server.mjs

````text
import {createServer} from 'node:http';import {readFileSync} from 'node:fs';import {pathToFileURL} from 'node:url';
import {assess,publicHealth} from './health.mjs';
export function operationsServer({readHealth=()=>{try{return JSON.parse(readFileSync(new URL('../keeper/.state/health.json',import.meta.url),'utf8'));}catch{return null;}}}={}){
 return createServer((req,res)=>{
  const send=(code,type,body)=>{res.writeHead(code,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'"});res.end(body);};
  if(req.method!=='GET')return send(405,'application/json','{"error":"read-only"}');
  const hostname=req.headers.host??'';if(!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(hostname))return send(403,'application/json','{"error":"local-only"}');
  const path=new URL(req.url,'http://127.0.0.1').pathname;
  if(['/api/status','/healthz'].includes(path)){let raw;try{raw=readHealth();}catch{raw=null;}const health=publicHealth(raw),status=assess(health);return send(path==='/healthz'&&!status.ready?503:200,'application/json; charset=utf-8',JSON.stringify({health,...status}));}
  const files={'/':['index.html','text/html'],'/app.mjs':['app.mjs','text/javascript'],'/finance.mjs':['finance.mjs','text/javascript'],'/style.css':['style.css','text/css']};
  if(!files[path])return send(404,'text/plain','Not found');
  const [file,type]=files[path];return send(200,type+'; charset=utf-8',readFileSync(new URL(file,import.meta.url)));
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const port=Number(process.env.HELI_OPERATIONS_PORT??8771);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid port');operationsServer().listen(port,'127.0.0.1',()=>console.log('HELI operations: http://127.0.0.1:'+port));}

````

## FILE: heli/operations/style.css

````text
:root{font:16px/1.6 system-ui,sans-serif;color:#e9eee7;background:#111a17;color-scheme:dark}*{box-sizing:border-box}body{margin:0}main{max-width:1100px;margin:auto;padding:32px 24px}header{display:flex;justify-content:space-between;gap:20px;font-size:12px;color:#aab6ad}.brand{letter-spacing:2px;color:#a9e28b}h1{font-size:clamp(32px,5vw,54px);line-height:1.14;letter-spacing:-2px;margin:40px 0 18px}h2{font-size:23px;margin:0 0 14px}.intro{color:#b7c4bd;max-width:680px}section{padding:28px;margin:28px 0;border:1px solid #34453b;border-radius:18px;background:#18231e}.service>strong{font-size:22px;color:#f2c677}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:22px 0}.grid>div{border:1px solid #3c5143;padding:18px;border-radius:12px;background:#1d2c24}small{display:block;color:#afbeb3}b{display:block;font-size:25px;color:#c4eda7;line-height:1.3;margin-top:12px}.note,#stamp{font-size:13px;color:#aab9af}.inputs{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}label{font-size:13px;color:#c4d0c7}input{display:block;width:100%;padding:12px;margin-top:6px;border:1px solid #516855;border-radius:8px;background:#101b14;color:white;font:inherit}input:focus{outline:2px solid #95d67b}li{margin:6px 0}footer{font-size:12px;color:#a3b0a7} @media(max-width:700px){.grid,.inputs{grid-template-columns:1fr}header{flex-direction:column}section{padding:20px}h1{letter-spacing:-1px}}

````

## FILE: heli/operations/test_budget.py

````text
import unittest
from budget import Budget


class BudgetTests(unittest.TestCase):
    def scenario(self, **kwargs):
        return Budget(program_bytes=949_336, sold_heli=1_000_000,
                      average_quote_per_heli=0.001, quote_per_sol=100,
                      **kwargs).calculate()

    def test_base_costs_and_coverage(self):
        r = self.scenario()
        self.assertAlmostEqual(r["pre_sale_sol_estimate"], 6.608583, places=5)
        self.assertAlmostEqual(r["future_epoch_rent_sol"], 4.25952)
        self.assertAlmostEqual(r["future_network_fee_sol"], 0.0108)
        self.assertTrue(r["self_funded_after_sale"])

    def test_zero_sales_cannot_fund_future(self):
        r = Budget(949_336, 0, 0.001, 100).calculate()
        self.assertFalse(r["self_funded_after_sale"])
        self.assertEqual(r["sale_proceeds_quote"], 0)
        self.assertIsNone(r["minimum_average_quote_per_heli"])

    def test_offchain_work_can_dominate_network_cost(self):
        r = self.scenario(yearly_offchain_quote=100)
        self.assertFalse(r["self_funded_after_sale"])
        self.assertEqual(r["future_offchain_quote"], 6000)

    def test_higher_priority_fee_increases_required_reserve(self):
        a = self.scenario()
        b = self.scenario(priority_fee_lamports_per_transaction=100_000)
        self.assertGreater(b["reserve_needed_quote"], a["reserve_needed_quote"])

    def test_never_fabricates_zero_cost(self):
        with self.assertRaises(ValueError):
            Budget(949_336, 1, 0.001, 0).calculate()


if __name__ == "__main__":
    unittest.main()

````

## FILE: heli/operations/tests/operations.test.mjs

````text
import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,readFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {once} from 'node:events';import {request} from 'node:http';
import {cashPlan} from '../finance.mjs';import {assess,publicHealth} from '../health.mjs';import {operationsServer} from '../server.mjs';import {atomicJson} from '../../keeper/storage.mjs';import {pollDelay} from '../../keeper/poll.mjs';import {chainTelemetry,sampleBalance} from '../../keeper/telemetry.mjs';
const now=Date.UTC(2026,8,30,12),stamp=new Date(now).toISOString();
function healthy(){return {time:stamp,mode:'devnet-execute',status:'idle',telemetry:{snapshotTime:stamp,balanceTime:stamp,balanceLamports:10000000,reserveLamports:5000000,overdueMonths:0,chainTime:now/1000,manifestBound:true,paused:false,closed:false,lastObservation:now/1000-3600}};}
test('V20 monthly rent and 720 observations are included with no users',()=>{const r=cashPlan({serverQuote:10,rpcQuote:0});assert.equal(r.transactions,722);assert.equal(r.maintenanceSol,0.00567016);assert.equal(r.monthlySol,0.0070877);assert.equal(r.collectedRevenueQuote,0);assert.equal(r.breakEvenVolumeQuote,null);});
test('zero fee market volume does not create treasury income',()=>{const r=cashPlan({serverQuote:10,rpcQuote:0,volumeQuote:1000000});assert.equal(r.theoreticalFeeRevenueQuote,0);assert.equal(r.collectedRevenueQuote,0);assert(r.monthlyShortfallQuote>0);});
test('unknown costs do not fabricate full coverage',()=>{const r=cashPlan({solBalance:100,quoteBalance:10000,applicants:1,serverQuote:0,rpcQuote:0});assert.equal(r.totalQuoteCost,null);assert.equal(r.separateWalletRunwayMonths,null);assert(r.unknownCosts.includes('identityQuotePerApplicant'));});
test('quote reserve alone cannot pay network SOL fees',()=>{const r=cashPlan({solBalance:0,quoteBalance:10000,serverQuote:10,rpcQuote:0});assert.equal(r.solMonths,0);assert.equal(r.separateWalletRunwayMonths,0);assert(r.conversionRunwayMonths>100);});
test('1000 sponsored first applicants include rent and two transactions plus native provider signature',()=>{const r=cashPlan({applicants:1000,serverQuote:0,rpcQuote:0,identityQuotePerApplicant:0});assert.equal(r.userSol,6.09412);assert.equal(r.monthlySol,(0.00567016+6.09412)*1.25);});
test('collected revenue and hypothetical fee potential stay separate',()=>{const r=cashPlan({serverQuote:10,rpcQuote:0,volumeQuote:100000,retainedFeeBps:10});assert.equal(r.theoreticalFeeRevenueQuote,100);assert.equal(r.collectedRevenueQuote,0);assert(r.monthlyShortfallQuote>0);});
test('invalid currency and overflow inputs fail instead of reporting cheap operation',()=>{for(const x of [{quoteBalance:-1},{applicants:0.5},{serverQuote:Infinity},{feeLamports:NaN},{applicants:1e10}])assert.throws(()=>cashPlan(x));});
test('not-started and dry-run are never a running live service',()=>{assert.equal(assess(null,{now}).ready,false);const h=healthy();h.mode='dry-run';assert.equal(assess(h,{now}).ready,false);assert.equal(assess(healthy(),{now}).ready,true);});
test('stale heartbeat, stale balance, backlog, gap and depleted budget raise alerts',()=>{const h=healthy();h.time=new Date(now-600001).toISOString();h.telemetry.balanceTime=h.time;h.telemetry.overdueMonths=2;h.telemetry.lastObservation=now/1000-7201;h.status='budget-exhausted';const r=assess(h,{now});assert.equal(r.ready,false);for(const code of ['stale','old-balance','backlog','observation-gap','budget-exhausted'])assert(r.alerts.some(x=>x.code===code));});
test('public monitor never exports keys, RPC credentials or raw signed transaction',()=>{const h={...healthy(),raw:'signed bytes',secret:'key',rpcUrl:'credential',job:{name:'settle',number:5,secret:'key'},telemetry:{...healthy().telemetry,config:'private'}};const s=JSON.stringify(publicHealth(h));for(const secret of ['signed bytes','credential','private','secret'])assert(!s.includes(secret));});
test('read-only health endpoint fails closed with missing keeper and rejects non-local Host',async()=>{const server=operationsServer({readHealth:()=>null});server.listen(0,'127.0.0.1');await once(server,'listening');try{const base='http://127.0.0.1:'+server.address().port;assert.equal((await fetch(base+'/healthz')).status,503);assert.equal((await fetch(base+'/api/status',{method:'POST'})).status,405);const foreign=await new Promise((resolve,reject)=>{const req=request(base+'/api/status',{headers:{Host:'example.com'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);req.end();});assert.equal(foreign,403);assert.equal((await (await fetch(base+'/api/status')).json()).ready,false);assert.equal((await fetch(base+'/../keeper/config.example.json')).status,404);}finally{server.close();await once(server,'close');}});
test('atomic journal replacement preserves valid JSON and no temp copy',()=>{const dir=mkdtempSync(join(tmpdir(),'heli-ops-'));try{const file=join(dir,'journal.json');atomicJson(file,{pending:{signature:'one'}});atomicJson(file,{pending:null});assert.deepEqual(JSON.parse(readFileSync(file)),{pending:null});assert.throws(()=>atomicJson(file,1n));assert.deepEqual(JSON.parse(readFileSync(file)),{pending:null});}finally{rmSync(dir,{recursive:true,force:true});}});
test('idle RPC polling drops to four minutes and wakes at the next price observation',()=>{const start=Date.UTC(2026,0,1)/1000,s={now:start+20,config:{start,last_settled_epoch:0,launch_finalized:true,manifest_bound:true},epoch:{registry_finalized:false},policy:{count:1,next:1,times:[start-3500]}};assert.equal(pollDelay({status:'idle'},s),80000);s.policy.times[0]=start;assert.equal(pollDelay({status:'idle'},s),240000);assert.equal(pollDelay({status:'pending'},s),2000);});
test('telemetry preserves last chain read time instead of masking an RPC outage',()=>{const a={snapshotTime:'2026-09-30T12:00:00Z',latestSnapshot:{now:now/1000,config:{start:now/1000,last_settled_epoch:0,manifest_bound:false}}};const r=chainTelemetry(a,{budgets:{}},{reserveLamports:5,dailyCapLamports:10});assert.equal(r.snapshotTime,a.snapshotTime);assert.equal(r.balanceLamports,null);});
test('a balance read failure keeps its old timestamp and does not change transactions',async()=>{const a={payer:{},measuredBalance:10,balanceTime:'2020-01-01T00:00:00Z',async balance(){throw Error('RPC secret error');}};await sampleBalance(a);assert.equal(a.measuredBalance,10);assert.equal(a.balanceTime,'2020-01-01T00:00:00Z');});

````

## FILE: heli/solana-v20/Cargo.toml

````text
[package]
name = "heli_core_v20"
version = "0.1.0"
edition = "2021"
[lib]
crate-type = ["cdylib", "lib"]
[features]
default = []
no-entrypoint = []
cpi = ["no-entrypoint"]
no-idl = []
no-log-ix-name = []
[dependencies]
anchor-lang = "=0.29.0"
anchor-spl = "=0.29.0"
[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1

````

## FILE: heli/solana-v20/scripts/bootstrap_v15.py

````text
"""Small genuine V15 fixture; no public chain or keys."""
import hashlib,struct
def bootstrap(t, auction_quantity=1000, with_policy=False):
 t.clock(t.start-14*t.DAY);q=t.allocate(82,t.TOKEN);t.defaults['quote_mint']=q
 t.send('TEST quote mint',[t.Instruction(t.TOKEN,b'\x14\x06'+bytes(t.admin.pubkey())+b'\x00',[t.meta(q,True)])])
 t.defaults.update(history=t.allocate(8+720*8*4),launch=t.pda(b'launch-claims'),market_inventory=t.pda(b'market-inventory'),auction=t.pda(b'opening-auction'),quote_escrow=t.pda(b'auction-quote'),sale_proceeds=t.pda(b'auction-proceeds'),identity_policy=t.pda(b'identity-policy'),instructions=t.INSTRUCTIONS_SYSVAR)
 t.call('initialize',{'start':t.start});verifier=t.Keypair();t.call('initialize_identity',{'verifier':verifier.pubkey()})
 if with_policy:
  t.defaults['policy']=t.pda(b'release-policy');t.call('initialize_release_policy',{'minimum_quote_depth':5000*t.U})
 for i,n in enumerate(['human','rewards','liquidity','founder']):t.call('create_vault',{'kind':i},{'vault':t.defaults[n]})
 t.call('genesis');t.call('prepare_auction_quote');t.call('open_auction',{'floor_quote_atoms_per_heli':100,'tick_size':50})
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

````

## FILE: heli/solana-v20/scripts/build.py

````text
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




````

## FILE: heli/solana-v20/scripts/devnet_readiness.mjs

````text
// Read-only public Devnet check. No key files, airdrops or transactions.
import {Connection,PublicKey} from '../../solana/node_modules/@solana/web3.js/lib/index.cjs.js';
import {stat,writeFile} from 'node:fs/promises';
const c=new Connection('https://api.devnet.solana.com','confirmed');
const wallet=new PublicKey('5rYen19dNmVAPf4664KhxWdLNEc4ZncScYFhe3V2ngYq');
const program=new PublicKey('HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv');
const genesis=await c.getGenesisHash();if(genesis!=='EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG')throw Error('Not Devnet');
const bytes=(await stat(new URL('../heli_core_v20.so',import.meta.url))).size;
const [balance,account,bufferRent,programDataRent,programRent]=await Promise.all([c.getBalance(wallet),c.getAccountInfo(program),c.getMinimumBalanceForRentExemption(bytes+37),c.getMinimumBalanceForRentExemption(bytes+45),c.getMinimumBalanceForRentExemption(36)]);
const report={checkedAt:new Date().toISOString(),cluster:'devnet',wallet:wallet.toBase58(),balanceSol:balance/1e9,program:program.toBase58(),programExecutable:account?.executable??false,binaryBytes:bytes,bufferRentSol:bufferRent/1e9,programDataRentSol:programDataRent/1e9,programAccountRentSol:programRent/1e9,minimumProgramRentSol:(programDataRent+programRent)/1e9,conservativePeakUploadAndDeploySol:(bufferRent+programDataRent+programRent)/1e9,note:'Exact-length upgradeable loader estimate; excludes transaction fees, state setup and additional allocation. Deposit is test SOL.'};
await writeFile(new URL('../devnet-readiness.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));

````

## FILE: heli/solana-v20/scripts/model_release.py

````text
"""Independent integer supply recurrence; price, demand and sales are not forecasts."""
from pathlib import Path
import json

UNIT=1_000_000;RATE=4_022_473_737_086_389;SCALE=10**18
def scenario(use_management):
    released=5_000_000*UNIT;market_stock=70_000_000*UNIT;management_stock=15_000_000*UNIT;points=[]
    for month in range(1,721):
        cap=released*RATE//SCALE
        permission=min(cap//5,management_stock) if 12<=month<720 else 0
        market=min(cap-permission,market_stock)
        management=min(permission,market//4) if use_management else 0
        released+=market+management;market_stock-=market;management_stock-=management
        assert market+management<=cap and market_stock>=0 and management_stock>=0
        assert released+market_stock+management_stock==90_000_000*UNIT
        if month in [1,2,3,6,12,120,360,720]:
            points.append({'month':month,'cap_HELI':cap/UNIT,'market_unlock_HELI':market/UNIT,'management_release_HELI':management/UNIT,'released_HELI':released/UNIT,'market_locked_HELI':market_stock/UNIT,'management_locked_HELI':management_stock/UNIT})
    return points
result={'rate_percent':RATE/SCALE*100,'initial_base_HELI':5_000_000,'scope':'Policy arithmetic only; not a price or demand forecast. Actual ELF acceptance separately verifies all 720 months.','with_full_management_capacity_use':scenario(True),'without_management_releases':scenario(False)}
(Path(__file__).resolve().parents[1]/'market-release-model.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result['with_full_management_capacity_use'][:3],indent=2))

````

## FILE: heli/solana-v20/scripts/prepare_acceptance.py

````text
from pathlib import Path

p=Path(__file__).resolve().parents[2]/'solana-v19/scripts/test_management_svm.py'
s=p.read_text(encoding='utf-8').replace('V19','V20')
s=s.replace("t.check('90M genesis includes 70M human and 15M management'", "t.check('90M genesis includes 70M market reserve and 15M management'")
s=s.replace("ma={'management_book'", "t.defaults['release_reserve']=t.defaults['human']\nma={'management_book'")
s=s.replace("act=ma|ea\n", "act=ma|ea\n",1)
start=s.index('for n in range(1,13):')
end=s.index('act=ma|ea\nfor h in range(24):',start)
s=s[:start]+'''# Initial allocation remains the only free entitlement.
t.clock(t.start)
launch=f['identity']|{'receipt':t.pda(b'launch-receipt',bytes(f['identity']['credential']))}
t.call('enroll_launch',acc=launch)
t.clock(t.start+7*t.DAY)
initial_wallet=t.amount(f['wallet'])
t.call('claim_launch',acc=launch)
t.check('only initial entitlement gives exactly 1000 free HELI',t.amount(f['wallet'])==initial_wallet+1000*t.U)
t.call('claim_launch',acc=launch,reject='calendar',label='initial free entitlement cannot be claimed twice')
first_cap=None
for n in range(1,13):
 ea=epoch_accounts(t,n);t.clock(t.boundary(n-1))
 if n>1:t.call('open_epoch',{'number':n},ea|{'payer':t.outsider.pubkey()})
 monthly=ma|ea
 if n==1:
  t.call('settle',acc=monthly,reject='calendar',label='monthly unlock cannot occur before month end')
  ac=f['identity']|ea|{'receipt':t.pda(b'receipt',bytes(ea['epoch']),bytes(f['identity']['credential']))}
  t.call('enroll',acc=ac,reject='Monthly free dividends are disabled',label='monthly free distribution explicitly rejected')
  # Earlier rejection does not leave a token entitlement behind.
  t.check('no monthly human receipt created',t.svm.get_account(ac['receipt']) is None)
  t.check('no monthly claim/reward SPL accounts created',t.svm.get_account(ea['claim_vault']) is None and t.svm.get_account(ea['reward_vault']) is None)
 before=t.cfg();inventory=t.amount(t.defaults['market_inventory']);supply=t.supply();released=t.released()
 cap=released*4_022_473_737_086_389//10**18
 management_budget=min(cap//5,before['stocks'][3]) if n>=12 and n<720 else 0
 expected=min(cap-management_budget,before['stocks'][0])
 t.clock(t.boundary(n))
 if n==1:
  wrong=t.token_account(t.defaults['mint'],t.admin.pubkey())
  t.call('settle',acc=monthly|{'market_inventory':wrong},reject='seeds',label='monthly release cannot go to arbitrary wallet')
 t.call('settle',acc=monthly)
 e=t.read(ea['epoch'],'Epoch')
 t.check('month '+str(n)+' exact unlock enters canonical sale inventory',t.amount(t.defaults['market_inventory'])==inventory+expected and t.cfg()['stocks'][0]==before['stocks'][0]-expected)
 t.check('month '+str(n)+' no mint no burn no person dividend',t.supply()==supply and e['burned']==0 and e['perPerson']==0 and e['people']==0 and e['humanRemaining']==0)
 t.check('month '+str(n)+' shared cap and authorized sale accounting',e['capacity']==cap and e['humanBudget']==expected and e['founderBudget']==management_budget and t.cfg()['saleAuthorized']==before['saleAuthorized']+expected)
 if n==1:
  first_cap=cap;t.check('first month starts from 5M and unlocks 20112.368685 HELI',cap==20_112_368_685)
  t.call('settle',acc=monthly,reject='calendar',label='same monthly unlock cannot be replayed')
 if n==2:t.check('next monthly base includes actual prior unlock',cap>first_cap and released==5_000_000*t.U+first_cap)
 if n==6:
  reserved_before=t.amount(t.defaults['market_inventory'])
  t.call('finalize_launch')
  t.check('only unassigned initial free stock joins market at six months',t.cfg()['launchRemaining']==0 and t.amount(t.defaults['market_inventory'])==reserved_before+999_000*t.U)
act=ma|ea
# An unlocked unsold order can be cancelled and re-offered without new release.
inv_before=t.amount(t.defaults['market_inventory']);reserve_before=t.cfg()['stocks'][0];epoch_before=t.read(ea['epoch'],'Epoch')['humanBudget']
seq=int.from_bytes(t.svm.get_account(m).data[144:152],'little')
t.call('place_project_ask',{'amount':20*t.U,'price_mantissa':10,'price_exponent':0})
t.call('cancel_project_ask',{'sequence':seq})
t.call('withdraw_project_heli',{'amount':20*t.U})
t.check('unsold inventory survives cancel and return without restoring locked reserve',t.amount(t.defaults['market_inventory'])==inv_before and t.cfg()['stocks'][0]==reserve_before and t.read(ea['epoch'],'Epoch')['humanBudget']==epoch_before)
t.check('all twelve unlocks occurred without any monthly participants',t.read(ea['epoch'],'Epoch')['people']==0)
''' + s[end:]
s=s.replace("max_total=e['perPerson']*e['people']//4", "max_total=min(e['humanBudget']//4,e['founderBudget'])")
s=s.replace("(t.ROOT/'management-svm-verification.json')", "(t.ROOT/'market-release-svm-verification.json')")
# Add late-calendar and pause acceptance before final report.
marker="result={'source_sha256'"
extra='''# A paused release must not move tokens; delayed settlement remains sequential.
ea13=epoch_accounts(t,13);t.call('open_epoch',{'number':13},ea13)
t.clock(t.boundary(13));t.call('pause',{'paused':True})
stock=t.cfg()['stocks'][0];inventory=t.amount(t.defaults['market_inventory'])
t.call('settle',acc=ma|ea13,reject='calendar',label='paused monthly unlock rejected')
t.check('pause preserves unlocked inventory and locked stock',t.cfg()['stocks'][0]==stock and t.amount(t.defaults['market_inventory'])==inventory)
t.call('pause',{'paused':False})
ea14=epoch_accounts(t,14);t.clock(t.boundary(14));t.call('open_epoch',{'number':14},ea14)
t.call('settle',acc=ma|ea14,reject='calendar',label='missed monthly periods cannot be skipped')
t.call('settle',acc=ma|ea13);t.call('settle',acc=ma|ea14)
t.check('late periods settle once in order with no human burn',t.cfg()['lastSettledEpoch']==14 and t.read(ea14['epoch'],'Epoch')['burned']==0)
'''
s=s.replace(marker,extra+marker)
(Path(__file__).resolve().parent/'test_market_release_svm.py').write_text(s,encoding='utf-8')
print('V20 genuine-program acceptance test prepared.')

````

## FILE: heli/solana-v20/scripts/svm_fixture.py

````text
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
defaults={'config':pda(b'config'),'mint':pda(b'mint'),'admin':admin.pubkey(),'payer':admin.pubkey(),'account_payer':admin.pubkey(),'owner':admin.pubkey(),'token_program':TOKEN,'system_program':SYSTEM,'rent':RENT,'market':pda(b'market')}
for i,n in enumerate(['human','rewards','liquidity','founder']):defaults[n]=pda(b'vault',bytes([i]))
for n in ['base_pool','quote_pool','quote_treasury','founder_quote']:defaults[n]=pda(n.replace('_','-').encode())
def instruction(name,arguments=None,accounts=None):
 d=INSTRUCTIONS[name];a=defaults| (accounts or {})
 data=hashlib.sha256(('global:'+name).encode()).digest()[:8]
 for f in d['args']:data+=encode(f['type'],(arguments or {})[snake(f['name'])])
 return Instruction(PROGRAM,data,[meta(a[snake(f['name'])],f['isMut'],f['isSigner']) for f in d['accounts']])
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


````

## FILE: heli/solana-v20/scripts/test_market_release_svm.py

````text
"""Actual V20/Manifest ELF acceptance test; run after compiling V20.
Fresh local ledger, synthetic quote mint/provider and no public transactions.
"""
import json,struct
import svm_fixture as t
from bootstrap_v15 import bootstrap,epoch_accounts

f=bootstrap(t,1_000_000,with_policy=True)
t.check('90M genesis includes 70M market reserve and 15M management',t.cfg()['stocks']==[70_000_000*t.U,0,0,15_000_000*t.U] and t.supply()==90_000_000*t.U)
t.check('no rewards or independent liquidity allocation',t.amount(t.defaults['rewards'])==0 and t.amount(t.defaults['liquidity'])==0)
MANIFEST=t.Pubkey.from_string('MNFSTqtC93rEfYHB6hF82sKdZpUDFWkViLByLd1k1Ms')
TOKEN22=t.Pubkey.from_string('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')
t.svm.add_program_from_file(MANIFEST,t.ROOT.parent/'manifest-integration/vendor-manifest/manifest-release-v3.0.24.so')
m=t.allocate(256,MANIFEST);q=t.defaults['quote_mint'];bv=t.Pubkey.find_program_address([b'vault',bytes(m),bytes(t.defaults['mint'])],MANIFEST)[0];qv=t.Pubkey.find_program_address([b'vault',bytes(m),bytes(q)],MANIFEST)[0]
t.send('initialize bound Manifest market',[t.Instruction(MANIFEST,b'\x00',[t.meta(t.admin.pubkey(),True,True),t.meta(m,True),t.meta(t.SYSTEM),t.meta(t.defaults['mint']),t.meta(q),t.meta(bv,True),t.meta(qv,True),t.meta(t.TOKEN),t.meta(TOKEN22)])])
t.defaults.update(manifest_market=m,manifest_program=MANIFEST,trader=t.pda(b'manifest-trader'),manifest_base=t.pda(b'manifest-heli'),manifest_quote=t.pda(b'manifest-quote'),base_vault=bv,quote_vault=qv)
t.call('bind_manifest_market',{'market_rent_lamports':10_000_000})
t.defaults['release_reserve']=t.defaults['human']
ma={'management_book':t.pda(b'management-book'),'management_trader':t.pda(b'management-trader'),'management_base':t.pda(b'management-base'),'management_quote':t.pda(b'management-quote'),'project_quote':t.defaults['sale_proceeds'],'management_stock':t.defaults['founder']}
t.call('initialize_management',{'quote_floor':5*t.U,'rent_lamports':10_000_000},ma)
ea=epoch_accounts(t,1);t.call('open_epoch',{'number':1},ea);act=ma|ea
t.call('management_release',{'amount':t.U},act,reject='calendar',label='management cannot release in first twelve months')
t.call('management_fund_quote',{'amount':t.U},act|{'admin':t.outsider.pubkey()},reject='has one',label='outsider cannot use project reserve')
t.call('management_order',{'amount':t.U,'base_deposit':0,'price_mantissa':1,'price_exponent':0,'is_bid':True},act|{'admin':t.outsider.pubkey()},reject='has one',label='outsider cannot place treasury orders')
t.call('set_liquidity_request',{'amount':1},reject='Liquidity inventory is disabled',label='no duplicate liquidity release budget')
start_quote=t.amount(t.defaults['sale_proceeds'])
t.call('management_fund_quote',{'amount':start_quote-5*t.U+1},act,reject='Collateral',label='quote reserve floor protects project cash')
t.call('management_fund_quote',{'amount':40*t.U},act)
t.check('liquidity bid funded only with actual project cash',t.amount(t.defaults['sale_proceeds'])==start_quote-40*t.U)
t.call('management_fund_quote',{'amount':t.U},act|{'quote_vault':bv},reject='Market',label='wrong market quote vault rejected before transfer')
t.check('wrong vault operation rolls back project funds',t.amount(t.defaults['sale_proceeds'])==start_quote-40*t.U)

def seat(owner):t.send('user seat',[t.Instruction(MANIFEST,b'\x01',[t.meta(owner.pubkey(),True,True),t.meta(m,True),t.meta(t.SYSTEM)])],[owner])
def deposit(owner,wallet,vault,mint,amount):
 t.send('user deposit',[t.Instruction(MANIFEST,b'\x02'+struct.pack('<Q',amount)+b'\x00',[t.meta(owner.pubkey(),False,True),t.meta(m,True),t.meta(wallet,True),t.meta(vault,True),t.meta(t.TOKEN),t.meta(mint)])],[owner])
def order(owner,amount,is_bid,mantissa=1,exponent=0):
 t.send('user funded limit order',[t.Instruction(MANIFEST,b'\x06\x00'+struct.pack('<II',0,1)+struct.pack('<QIbBIB',amount,mantissa,exponent,int(is_bid),0,0),[t.meta(owner.pubkey(),True,True),t.meta(m,True),t.meta(t.SYSTEM)])],[owner])
def management_order(amount,is_bid,deposit_base=0,mantissa=1,exponent=0):
 t.call('management_order',{'amount':amount,'base_deposit':deposit_base,'price_mantissa':mantissa,'price_exponent':exponent,'is_bid':is_bid},act)

seat(t.alice);deposit(t.alice,f['wallet'],bv,t.defaults['mint'],10*t.U);order(t.alice,10*t.U,False)
management_order(10*t.U,True)
t.call('management_withdraw',{'amount':10*t.U,'is_base':True},act)
t.check('management funded bid buys real HELI into working account',t.amount(ma['management_base'])==10*t.U)
t.check('buying existing HELI does not unlock treasury allocation',t.cfg()['stocks'][3]==15_000_000*t.U)
seat(t.bob);bq=t.token_account(q,t.bob.pubkey())
t.send('synthetic user quote collateral',[t.Instruction(t.TOKEN,b'\x07'+struct.pack('<Q',20_000*t.U),[t.meta(q,True),t.meta(bq,True),t.meta(t.admin.pubkey(),False,True)])])
deposit(t.bob,bq,qv,q,20_000*t.U);order(t.bob,10_000*t.U,True)
management_order(5*t.U,False,5*t.U)
t.call('management_withdraw',{'amount':5*t.U,'is_base':False},act)
t.check('management sale returns cash to project reserve',t.amount(t.defaults['sale_proceeds'])==start_quote-35*t.U)
seq=int.from_bytes(t.svm.get_account(m).data[144:152],'little')
management_order(5*t.U,False,5*t.U,mantissa=10)
t.call('management_cancel',{'sequence':seq},act)
t.call('management_withdraw',{'amount':5*t.U,'is_base':True},act)
t.check('cancellation returns working HELI without restocking locked allocation',t.amount(ma['management_base'])==5*t.U and t.cfg()['stocks'][3]==15_000_000*t.U and t.read(ma['management_book'],'ManagementBook')['totalReleased']==0)
private=t.token_account(q,t.admin.pubkey())
t.call('management_withdraw',{'amount':t.U,'is_base':False},act|{'project_quote':private},reject='seeds',label='management cash cannot be redirected to personal wallet')

# Initial allocation remains the only free entitlement.
t.clock(t.start)
launch=f['identity']|{'receipt':t.pda(b'launch-receipt',bytes(f['identity']['credential']))}
t.call('enroll_launch',acc=launch)
t.clock(t.start+7*t.DAY)
initial_wallet=t.amount(f['wallet'])
t.call('claim_launch',acc=launch)
t.check('only initial entitlement gives exactly 1000 free HELI',t.amount(f['wallet'])==initial_wallet+1000*t.U)
t.call('claim_launch',acc=launch,reject='calendar',label='initial free entitlement cannot be claimed twice')
first_cap=None
for n in range(1,13):
 ea=epoch_accounts(t,n);t.clock(t.boundary(n-1))
 if n>1:t.call('open_epoch',{'number':n},ea|{'payer':t.outsider.pubkey()})
 monthly=ma|ea
 if n==1:
  t.call('settle',acc=monthly,reject='calendar',label='monthly unlock cannot occur before month end')
  ac=f['identity']|ea|{'receipt':t.pda(b'receipt',bytes(ea['epoch']),bytes(f['identity']['credential']))}
  t.call('enroll',acc=ac,reject='Monthly free dividends are disabled',label='monthly free distribution explicitly rejected')
  # Earlier rejection does not leave a token entitlement behind.
  t.check('no monthly human receipt created',t.svm.get_account(ac['receipt']) is None)
  t.check('no monthly claim/reward SPL accounts created',t.svm.get_account(ea['claim_vault']) is None and t.svm.get_account(ea['reward_vault']) is None)
 before=t.cfg();inventory=t.amount(t.defaults['market_inventory']);supply=t.supply();released=t.released()
 cap=released*4_022_473_737_086_389//10**18
 management_budget=min(cap//5,before['stocks'][3]) if n>=12 and n<720 else 0
 expected=min(cap-management_budget,before['stocks'][0])
 t.clock(t.boundary(n))
 if n==1:
  wrong=t.token_account(t.defaults['mint'],t.admin.pubkey())
  t.call('settle',acc=monthly|{'market_inventory':wrong},reject='seeds',label='monthly release cannot go to arbitrary wallet')
 t.call('settle',acc=monthly)
 e=t.read(ea['epoch'],'Epoch')
 t.check('month '+str(n)+' exact unlock enters canonical sale inventory',t.amount(t.defaults['market_inventory'])==inventory+expected and t.cfg()['stocks'][0]==before['stocks'][0]-expected)
 t.check('month '+str(n)+' no mint no burn no person dividend',t.supply()==supply and e['burned']==0 and e['perPerson']==0 and e['people']==0 and e['humanRemaining']==0)
 t.check('month '+str(n)+' shared cap and authorized sale accounting',e['capacity']==cap and e['humanBudget']==expected and e['founderBudget']==management_budget and t.cfg()['saleAuthorized']==before['saleAuthorized']+expected)
 if n==1:
  first_cap=cap;t.check('first month starts from 5M and unlocks 20112.368685 HELI',cap==20_112_368_685)
  t.call('settle',acc=monthly,reject='calendar',label='same monthly unlock cannot be replayed')
 if n==2:t.check('next monthly base includes actual prior unlock',cap>first_cap and released==5_000_000*t.U+first_cap)
 if n==6:
  reserved_before=t.amount(t.defaults['market_inventory'])
  t.call('finalize_launch')
  t.check('only unassigned initial free stock joins market at six months',t.cfg()['launchRemaining']==0 and t.amount(t.defaults['market_inventory'])==reserved_before+999_000*t.U)
act=ma|ea
# An unlocked unsold order can be cancelled and re-offered without new release.
inv_before=t.amount(t.defaults['market_inventory']);reserve_before=t.cfg()['stocks'][0];epoch_before=t.read(ea['epoch'],'Epoch')['humanBudget']
seq=int.from_bytes(t.svm.get_account(m).data[144:152],'little')
t.call('place_project_ask',{'amount':20*t.U,'price_mantissa':10,'price_exponent':0})
t.call('cancel_project_ask',{'sequence':seq})
t.call('withdraw_project_heli',{'amount':20*t.U})
t.check('unsold inventory survives cancel and return without restoring locked reserve',t.amount(t.defaults['market_inventory'])==inv_before and t.cfg()['stocks'][0]==reserve_before and t.read(ea['epoch'],'Epoch')['humanBudget']==epoch_before)
t.check('all twelve unlocks occurred without any monthly participants',t.read(ea['epoch'],'Epoch')['people']==0)
act=ma|ea
for h in range(24):t.clock(t.boundary(12)+h*3600);t.call('observe_release_market')
t.call('management_release',{'amount':t.U},act)
t.check('new working capital consumes management quota once',t.cfg()['stocks'][3]==15_000_000*t.U-t.U and t.read(ea['epoch'],'Epoch')['founder']==t.U)
rs={'source':t.defaults['founder'],'trader':t.pda(b'release-trader',bytes([3])),'base':t.pda(b'release-base',bytes([3])),'quote':t.pda(b'release-quote',bytes([3])),'destination':t.defaults['sale_proceeds']}|ea
t.call('initialize_release_seat',{'kind':3,'rent_lamports':10_000_000},rs)
t.call('execute_release_sale',{'kind':3,'amount':t.U},rs|{'destination':private},reject='Market',label='legacy sale cannot bypass project revenue custody')
t.call('execute_release_sale',{'kind':3,'amount':t.U},rs)
t.check('liquidity and direct sale share one management counter',t.read(ea['epoch'],'Epoch')['founder']==2*t.U and t.cfg()['stocks'][3]==15_000_000*t.U-2*t.U)
e=t.read(ea['epoch'],'Epoch');max_total=min(e['humanBudget']//4,e['founderBudget'])
t.call('management_release',{'amount':max_total-2*t.U+1},act,reject='Quota',label='combined management operations cannot exceed actual release allowance')
seq=int.from_bytes(t.svm.get_account(m).data[144:152],'little')
management_order(t.U,False,t.U,mantissa=10);t.call('management_cancel',{'sequence':seq},act)
t.call('management_withdraw',{'amount':t.U,'is_base':True},act)
t.check('cancel and rewithdraw cannot reset monthly release allowance',t.read(ea['epoch'],'Epoch')['founder']==2*t.U and t.read(ma['management_book'],'ManagementBook')['totalReleased']==t.U)
t.clock(t.boundary(13))
t.call('management_release',{'amount':t.U},act,reject='calendar',label='previous month management permission expires')
# A paused release must not move tokens; delayed settlement remains sequential.
ea13=epoch_accounts(t,13);t.call('open_epoch',{'number':13},ea13)
t.clock(t.boundary(13));t.call('pause',{'paused':True})
stock=t.cfg()['stocks'][0];inventory=t.amount(t.defaults['market_inventory'])
t.call('settle',acc=ma|ea13,reject='calendar',label='paused monthly unlock rejected')
t.check('pause preserves unlocked inventory and locked stock',t.cfg()['stocks'][0]==stock and t.amount(t.defaults['market_inventory'])==inventory)
t.call('pause',{'paused':False})
ea14=epoch_accounts(t,14);t.clock(t.boundary(14));t.call('open_epoch',{'number':14},ea14)
t.call('settle',acc=ma|ea14,reject='calendar',label='missed monthly periods cannot be skipped')
t.call('settle',acc=ma|ea13);t.call('settle',acc=ma|ea14)
t.check('late periods settle once in order with no human burn',t.cfg()['lastSettledEpoch']==14 and t.read(ea14['epoch'],'Epoch')['burned']==0)
# Exercise the complete 720-month calendar and retention of unsold released stock.
for n in range(15,721):
 ea=epoch_accounts(t,n);t.clock(t.boundary(n-1));t.call('open_epoch',{'number':n},ea)
 before=t.cfg();cap=t.released()*4_022_473_737_086_389//10**18
 management_budget=min(cap//5,before['stocks'][3]) if n>=12 and n<720 else 0
 expected=min(cap-management_budget,before['stocks'][0])
 inventory=t.amount(t.defaults['market_inventory']);supply=t.supply()
 t.clock(t.boundary(n));t.call('settle',acc=ma|ea)
 e=t.read(ea['epoch'],'Epoch')
 assert t.amount(t.defaults['market_inventory'])==inventory+expected
 assert t.cfg()['stocks'][0]==before['stocks'][0]-expected
 assert t.supply()==supply and e['burned']==0 and e['capacity']==cap and e['founderBudget']==management_budget
t.check('all 720 months preserve the exact cap and never burn unsold monthly release',t.cfg()['lastSettledEpoch']==720)
remaining_locked=sum(t.cfg()['stocks']);sale_stock=t.amount(t.defaults['market_inventory']);mint_before=t.supply()
t.call('close_constitution')
t.check('60-year final burn touches only still-locked stock',t.supply()==mint_before-remaining_locked and t.amount(t.defaults['market_inventory'])==sale_stock and t.cfg()['stocks']==[0,0,0,0])
t.call('open_epoch',{'number':721},epoch_accounts(t,721),reject='calendar',label='no monthly unlock after the 720-month horizon')
seq=int.from_bytes(t.svm.get_account(m).data[144:152],'little')
t.call('place_project_ask',{'amount':20*t.U,'price_mantissa':10,'price_exponent':0})
t.call('cancel_project_ask',{'sequence':seq});t.call('withdraw_project_heli',{'amount':20*t.U})
t.check('unsold released inventory can still be offered and recovered after the horizon',t.amount(t.defaults['market_inventory'])==sale_stock)
quote_before=t.amount(t.defaults['sale_proceeds']);supply=t.supply()
t.call('place_project_ask',{'amount':t.U,'price_mantissa':1,'price_exponent':0})
t.call('withdraw_project_quote',{'amount':t.U})
t.check('released monthly sale inventory matches a funded buyer and proceeds stay in project reserve',t.amount(t.defaults['market_inventory'])==sale_stock-t.U and t.amount(t.defaults['sale_proceeds'])==quote_before+t.U and t.supply()==supply)
result={'source_sha256':t.actual_source,'binary_sha256':t.actual_binary,'checks_and_transactions':len(t.checks),'checks':t.checks,'all_passed':True,'calendar_months':720,'scope':'Real V20 and Manifest ELFs in local LiteSVM, synthetic quote/provider; not public deployment or audit.'}
(t.ROOT/'market-release-svm-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='checks'},indent=2))

````

## FILE: heli/solana-v20/src/accounts.rs

````text
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

````

## FILE: heli/solana-v20/src/auction.rs

````text
//! 256 price levels with per-wallet PDAs. No fixed bidder-count limit.
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint,Token,TokenAccount};
use crate::{Config,ErrorCode,UNIT,incoming,outgoing};
pub const LEVELS:usize=256;
pub const OFFER_HELI:u64=4_000_000;
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
 #[account(init,payer=admin,token::mint=quote_mint,token::authority=config,seeds=[b"auction-proceeds"],bump)] pub sale_proceeds:Box<Account<'info,TokenAccount>>,
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
 require!(ctx.accounts.config.live&&!ctx.accounts.config.closed&&!ctx.accounts.config.paused&&!a.finalized&&Clock::get()?.unix_timestamp<a.end-FREEZE_SECONDS&&qty>0&&qty<=OFFER_HELI&&!b.active&&!b.claimed,ErrorCode::State);
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


````

## FILE: heli/solana-v20/src/calendar.rs

````text
// Integer Gregorian calendar, UTC. Month boundaries always derive from the original anchor.
pub const DAY:i64=86400;
pub fn days(y:i64,m:i64,d:i64)->i64 {
 let y=y-if m<=2 {1}else{0}; let era=y.div_euclid(400);let yo=y-era*400;
 let mp=m+if m>2 {-3}else{9};let doy=(153*mp+2)/5+d-1;
 era*146097+yo*365+yo/4-yo/100+doy-719468
}
pub fn civil(z:i64)->(i64,i64,i64) {
 let z=z+719468;let era=z.div_euclid(146097);let doe=z-era*146097;
 let yo=(doe-doe/1460+doe/36524-doe/146096)/365;let y=yo+era*400;
 let doy=doe-(365*yo+yo/4-yo/100);let mp=(5*doy+2)/153;
 let d=doy-(153*mp+2)/5+1;let m=mp+if mp<10 {3}else{-9};
 (y+if m<=2 {1}else{0},m,d)
}
pub fn boundary(start:i64,n:u16)->i64 {
 let (y,m,d)=civil(start.div_euclid(DAY));let k=y*12+m-1+n as i64;
 let y=k.div_euclid(12);let m=k.rem_euclid(12)+1;
 let leap=y%4==0&&(y%100!=0||y%400==0);
 let max=match m {2=>if leap {29}else{28},4|6|9|11=>30,_=>31};
 days(y,m,d.min(max))*DAY+start.rem_euclid(DAY)
}
pub fn epoch(start:i64,now:i64)->u16 {
 if now<start{return 0;}let(mut lo,mut hi)=(0u16,721u16);
 while lo+1<hi {let mid=lo+(hi-lo)/2;if boundary(start,mid)<=now{lo=mid;}else{hi=mid;}}
 lo+1
}

````

## FILE: heli/solana-v20/src/economics.rs

````text
use anchor_lang::prelude::*;
use crate::ErrorCode;
pub const UNIT:u64=1_000_000;
pub const RATE:u128=4_022_473_737_086_389;
pub const SCALE:u128=1_000_000_000_000_000_000;
pub fn muldiv(a:u128,b:u128,d:u128)->Result<u128>{require!(d>0,ErrorCode::Math);Ok(a.checked_mul(b).ok_or(ErrorCode::Math)?/d)}
pub fn capacity(supply:u64,stocks:[u64;4])->Result<u64>{let u=stocks.iter().try_fold(0u64,|s,x|s.checked_add(*x)).ok_or(ErrorCode::Math)?;let r=supply.checked_sub(u).ok_or(ErrorCode::Collateral)?;Ok(muldiv(r as u128,RATE,SCALE)? as u64)}
pub fn swap_output(x:u64,y:u64,amount:u64)->Result<u64>{let net=muldiv(amount as u128,997,1000)?;Ok(muldiv(y as u128,net,x as u128+net)? as u64)}
pub fn impact_ok(x:u64,y:u64,amount:u64)->Result<bool>{if x==0||y==0{return Ok(false);}let out=swap_output(x,y,amount)?;
 Ok((y-out) as u128*x as u128*10000>=y as u128*(x as u128+amount as u128)*9800)}
pub fn founder_market_limit(x:u64,y:u64,max:u64)->Result<u64>{if y<5000*UNIT{return Ok(0);}let(mut lo,mut hi)=(0,max);
 while lo<hi {let a=lo+(hi-lo+1)/2;let out=swap_output(x,y,a)?;if impact_ok(x,y,a)?&&y-out>=5000*UNIT&&out>0{lo=a;}else{hi=a-1;}}
 Ok(lo)
}

````

## FILE: heli/solana-v20/src/identity.rs

````text
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


````

## FILE: heli/solana-v20/src/lib.rs

````text
// HELI v20 monthly market release draft. Unaudited; no public deployment.
use anchor_lang::prelude::*;
use anchor_spl::token::{self,Mint,Token,TokenAccount,MintTo,Transfer,Burn,SetAuthority};
use anchor_spl::token::spl_token::instruction::AuthorityType;
mod calendar; mod economics; mod auction; mod manifest_bridge; mod identity; mod release; mod management; mod market_release;
use calendar::{DAY,boundary,epoch}; use economics::*;
use auction::*;
use manifest_bridge::*; use identity::*; use release::*;
use management::*; use market_release::*;
declare_id!("HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv");

#[program]
pub mod heli_core_v20 {
 use super::*;
 pub fn calendar_boundary(ctx:Context<ReadConfig>,number:u16)->Result<()> {require!(number<=720,ErrorCode::Time);emit!(CalendarBoundary{number,timestamp:boundary(ctx.accounts.config.start,number)});Ok(())}
 pub fn initialize(ctx:Context<Initialize>,start:i64)->Result<()> {
  let now=Clock::get()?.unix_timestamp;require!(start>=now+7*DAY&&start<=now+30*DAY,ErrorCode::Time);
  require!(ctx.accounts.quote_mint.decimals==6||ctx.accounts.quote_mint.decimals==9,ErrorCode::State);
  let c=&mut ctx.accounts.config;c.admin=ctx.accounts.admin.key();c.mint=ctx.accounts.mint.key();c.quote_mint=ctx.accounts.quote_mint.key();c.history=ctx.accounts.history.key();c.start=start;c.cursor=start;c.bump=ctx.bumps.config;
  c.stocks=[70_000_000*UNIT,0,0,15_000_000*UNIT];c.apr_bps=0;c.launch_per_person=1_000*UNIT;c.launch_remaining=1_000_000*UNIT;c.market_remaining=4_000_000*UNIT;c.sale_authorized=4_000_000*UNIT;
  ctx.accounts.history.load_init()?;Ok(())
 }
 pub fn create_vault(ctx:Context<CreateVault>,kind:u8)->Result<()> {require!(kind<4&&!ctx.accounts.config.live&&!ctx.accounts.config.closed,ErrorCode::State);ctx.accounts.config.vault_mask|=1<<kind;Ok(())}
 pub fn genesis(ctx:Context<Genesis>)->Result<()> {
  let c=&ctx.accounts.config;require!(!c.live&&!c.closed&&c.vault_mask==15&&ctx.accounts.mint.supply==0,ErrorCode::State);
  let bump=[c.bump];let seeds:&[&[u8]]=&[b"config",&bump];let sign=&[seeds];
  token::mint_to(CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(),MintTo{mint:ctx.accounts.mint.to_account_info(),to:ctx.accounts.launch.to_account_info(),authority:c.to_account_info()},sign),100_000_000*UNIT)?;
  for(v,a)in[(&ctx.accounts.human,70_000_000*UNIT),(&ctx.accounts.rewards,0),(&ctx.accounts.liquidity,0),(&ctx.accounts.founder,15_000_000*UNIT)] {
   outgoing(ctx.accounts.token_program.to_account_info(),ctx.accounts.launch.to_account_info(),v.to_account_info(),c.to_account_info(),c.bump,a)?;
  }
  outgoing(ctx.accounts.token_program.to_account_info(),ctx.accounts.launch.to_account_info(),ctx.accounts.market_inventory.to_account_info(),c.to_account_info(),c.bump,4_000_000*UNIT)?;
  token::burn(CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(),Burn{mint:ctx.accounts.mint.to_account_info(),from:ctx.accounts.launch.to_account_info(),authority:c.to_account_info()},sign),10_000_000*UNIT)?;
  token::set_authority(CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(),SetAuthority{current_authority:c.to_account_info(),account_or_mint:ctx.accounts.mint.to_account_info()},sign),AuthorityType::MintTokens,None)?;
  ctx.accounts.config.live=true;Ok(())
 }
 pub fn initialize_identity(ctx:Context<InitializeIdentity>,verifier:Pubkey)->Result<()> {identity::initialize(ctx,verifier)}
 pub fn issue_credential(ctx:Context<IssueCredential>,nullifier:[u8;32],proof_digest:[u8;32],issued_at:i64,expires_at:i64)->Result<()> {
  identity::verify_admission(&ctx.accounts.instructions.to_account_info(),&ctx.accounts.identity_policy,&ctx.accounts.config.key(),&ctx.accounts.person.key(),&nullifier,&proof_digest,issued_at,expires_at)?;
  require!(ctx.accounts.config.live&&!ctx.accounts.config.closed&&nullifier!=[0;32]&&proof_digest!=[0;32],ErrorCode::State);
  let p=&mut ctx.accounts.credential;p.owner=ctx.accounts.person.key();p.nullifier=nullifier;p.proof_digest=proof_digest;p.active=true;
  ctx.accounts.wallet_identity.credential=p.key();Ok(())
 }
 pub fn enroll_launch(ctx:Context<EnrollLaunch>)->Result<()> {
  let c=&mut ctx.accounts.config;let now=Clock::get()?.unix_timestamp;
  require!(c.live&&!c.closed&&!c.paused&&!c.launch_finalized&&now>=c.start&&now<boundary(c.start,6)-7*DAY,ErrorCode::Time);
  require!(ctx.accounts.credential.active&&ctx.accounts.credential.owner==ctx.accounts.person.key()&&c.launch_people<1000,ErrorCode::Identity);
  c.launch_people+=1;let r=&mut ctx.accounts.receipt;r.owner=ctx.accounts.person.key();r.valid=true;r.eligible_at=now.checked_add(7*DAY).ok_or(ErrorCode::Math)?;Ok(())
 }
 pub fn dispute_launch(ctx:Context<DisputeLaunch>)->Result<()> {
  let c=&mut ctx.accounts.config;require!(!c.launch_finalized&&Clock::get()?.unix_timestamp<boundary(c.start,6)&&ctx.accounts.receipt.valid&&!ctx.accounts.receipt.claimed,ErrorCode::Time);
  ctx.accounts.receipt.valid=false;c.launch_people=c.launch_people.checked_sub(1).ok_or(ErrorCode::Math)?;Ok(())
 }
 pub fn finalize_launch(ctx:Context<RegistryLaunch>)->Result<()> {
  let c=&mut ctx.accounts.config;require!(c.live&&!c.closed&&!c.launch_finalized&&Clock::get()?.unix_timestamp>=boundary(c.start,6),ErrorCode::Time);
  require!(ctx.accounts.launch.amount>=c.launch_remaining&&c.launch_remaining>=launch_reserved(c)?,ErrorCode::Collateral);
  let reserved=launch_reserved(c)?;let unused=c.launch_remaining.checked_sub(reserved).ok_or(ErrorCode::Math)?;
  outgoing(ctx.accounts.token_program.to_account_info(),ctx.accounts.launch.to_account_info(),ctx.accounts.market_inventory.to_account_info(),c.to_account_info(),c.bump,unused)?;
  c.launch_remaining=reserved;c.market_remaining=c.market_remaining.checked_add(unused).ok_or(ErrorCode::Math)?;
  c.sale_authorized=c.sale_authorized.checked_add(unused).ok_or(ErrorCode::Math)?;
  c.launch_finalized=true;Ok(())
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
 pub fn initialize_management(ctx:Context<InitializeManagement>,quote_floor:u64,rent_lamports:u64)->Result<()> {management::initialize(ctx,quote_floor,rent_lamports)}
 pub fn management_fund_quote(ctx:Context<ManagementAction>,amount:u64)->Result<()> {management::fund_quote(ctx,amount)}
 pub fn management_release(ctx:Context<ManagementAction>,amount:u64)->Result<()> {management::release(ctx,amount)}
 pub fn management_order(ctx:Context<ManagementAction>,amount:u64,base_deposit:u64,price_mantissa:u32,price_exponent:i8,is_bid:bool)->Result<()> {management::order(ctx,amount,base_deposit,price_mantissa,price_exponent,is_bid)}
 pub fn management_cancel(ctx:Context<ManagementAction>,sequence:u64)->Result<()> {management::cancel(ctx,sequence)}
 pub fn management_withdraw(ctx:Context<ManagementAction>,amount:u64,is_base:bool)->Result<()> {management::withdraw(ctx,amount,is_base)}
 pub fn initialize_fee_vaults(ctx:Context<InitializeFeeVaults>,monthly_cap:u64,reserve:u64)->Result<()> {
  require!(ctx.accounts.config.live&&!ctx.accounts.config.closed&&monthly_cap>0,ErrorCode::State);
  let o=&mut ctx.accounts.operations;o.monthly_cap=monthly_cap;o.reserve=reserve;
  Ok(())
 }
 pub fn contribute_quote(ctx:Context<ContributeQuote>,amount:u64)->Result<()> {
  require!(ctx.accounts.config.live&&!ctx.accounts.config.closed&&amount>0,ErrorCode::State);
  let o=&mut ctx.accounts.operations;
  let next_earned=o.earned_total.checked_add(amount).ok_or(ErrorCode::Math)?;
  let next_donated=o.donated_total.checked_add(amount).ok_or(ErrorCode::Math)?;
  incoming(ctx.accounts.token_program.to_account_info(),ctx.accounts.contributor_quote.to_account_info(),
   ctx.accounts.fee_quote.to_account_info(),ctx.accounts.contributor.to_account_info(),amount)?;
  o.earned_total=next_earned;o.donated_total=next_donated;
  emit!(QuoteContribution{contributor:ctx.accounts.contributor.key(),amount});Ok(())
 }
 pub fn allocate_auction_proceeds(ctx:Context<AllocateAuctionProceeds>,amount:u64)->Result<()> {
  require!(ctx.accounts.config.live&&!ctx.accounts.config.closed&&ctx.accounts.auction.finalized&&amount>0,ErrorCode::State);
  let o=&mut ctx.accounts.operations;
  let next_earned=o.earned_total.checked_add(amount).ok_or(ErrorCode::Math)?;
  let next_allocated=o.sale_allocated_total.checked_add(amount).ok_or(ErrorCode::Math)?;
  require!(ctx.accounts.sale_proceeds.amount>=amount,ErrorCode::Collateral);
  outgoing(ctx.accounts.token_program.to_account_info(),ctx.accounts.sale_proceeds.to_account_info(),
   ctx.accounts.fee_quote.to_account_info(),ctx.accounts.config.to_account_info(),ctx.accounts.config.bump,amount)?;
  o.earned_total=next_earned;o.sale_allocated_total=next_allocated;
  emit!(AuctionProceedsAllocated{amount});Ok(())
 }
 pub fn propose_expense(ctx:Context<ProposeExpense>,nonce:u64,amount:u64,purpose:[u8;32])->Result<()> {
  let o=&mut ctx.accounts.operations;
  require!(ctx.accounts.proposer.key()==ctx.accounts.config.admin&&nonce==o.next_nonce&&amount>0&&amount<=o.monthly_cap&&purpose!=[0;32],ErrorCode::Quota);
  let now=Clock::get()?.unix_timestamp;
  let p=&mut ctx.accounts.expense;p.destination=ctx.accounts.destination.key();p.proposer=ctx.accounts.proposer.key();p.purpose=purpose;p.amount=amount;
  p.ready_at=now.checked_add(7*DAY).ok_or(ErrorCode::Math)?;p.nonce=nonce;
  o.next_nonce=o.next_nonce.checked_add(1).ok_or(ErrorCode::Math)?;Ok(())
 }
 pub fn execute_expense(mut ctx:Context<ExecuteExpense>)->Result<()> {
  let a=&mut ctx.accounts;let now=Clock::get()?.unix_timestamp;
  require!(!a.expense.paid&&now>=a.expense.ready_at,ErrorCode::Time);
  let window=epoch(a.config.start,now);
  if a.operations.window!=window {a.operations.window=window;a.operations.spent_in_window=0;}
  let amount=a.expense.amount;
  require!(a.operations.spent_in_window.checked_add(amount).ok_or(ErrorCode::Math)?<=a.operations.monthly_cap,ErrorCode::Quota);
  let available=a.operations.earned_total.checked_sub(a.operations.spent_total).ok_or(ErrorCode::Math)?;
  let needed=amount.checked_add(a.operations.reserve).ok_or(ErrorCode::Math)?;
  require!(available>=needed&&a.fee_quote.amount>=needed,ErrorCode::Collateral);
  outgoing(a.token_program.to_account_info(),a.fee_quote.to_account_info(),a.destination.to_account_info(),a.config.to_account_info(),a.config.bump,amount)?;
  a.operations.spent_total=a.operations.spent_total.checked_add(amount).ok_or(ErrorCode::Math)?;
  a.operations.spent_in_window=a.operations.spent_in_window.checked_add(amount).ok_or(ErrorCode::Math)?;
  a.expense.paid=true;
  emit!(ExpenseExecuted{nonce:a.expense.nonce,destination:a.expense.destination,amount,purpose:a.expense.purpose});
  Ok(())
 }
 pub fn claim_launch(ctx:Context<ClaimLaunch>)->Result<()> {
  require!(ctx.accounts.receipt.valid&&!ctx.accounts.receipt.claimed&&Clock::get()?.unix_timestamp>=ctx.accounts.receipt.eligible_at,ErrorCode::Time);
  let a=ctx.accounts.config.launch_per_person;outgoing(ctx.accounts.token_program.to_account_info(),ctx.accounts.launch.to_account_info(),ctx.accounts.destination.to_account_info(),ctx.accounts.config.to_account_info(),ctx.accounts.config.bump,a)?;
  ctx.accounts.config.launch_remaining=ctx.accounts.config.launch_remaining.checked_sub(a).ok_or(ErrorCode::Math)?;ctx.accounts.config.launch_claimed=ctx.accounts.config.launch_claimed.checked_add(1).ok_or(ErrorCode::Math)?;ctx.accounts.receipt.claimed=true;Ok(())
 }
 pub fn open_epoch(ctx:Context<OpenMarketEpoch>,number:u16)->Result<()> {market_release::open(ctx,number)}
 pub fn enroll(_ctx:Context<Enroll>)->Result<()> {err!(ErrorCode::MonthlyDividendDisabled)}
 pub fn dispute_entry(_ctx:Context<DisputeEntry>)->Result<()> {err!(ErrorCode::MonthlyDividendDisabled)}
 pub fn finalize_registry(_ctx:Context<Registry>)->Result<()> {err!(ErrorCode::MonthlyDividendDisabled)}
 pub fn pause(ctx:Context<Admin>,paused:bool)->Result<()> {ctx.accounts.config.paused=paused;Ok(())}
 pub fn schedule_apr(_ctx:Context<Admin>,bps:u16)->Result<()> {
  // Retained as a rejecting instruction for old clients. No runtime rate setter.
  let _=bps;err!(ErrorCode::StakingDisabled)
 }
 pub fn set_liquidity_request(_ctx:Context<Admin>,amount:u64)->Result<()> {let _=amount;err!(ErrorCode::LiquidityDisabled)}
 pub fn checkpoint_global(ctx:Context<GlobalCheckpoint>)->Result<()> {
  let mut b=ctx.accounts.history.load_mut()?;advance_global(&mut ctx.accounts.config,&mut b,Clock::get()?.unix_timestamp)?;Ok(())
 }
 // No new positions or deposits. Legacy principal/reward recovery stays available.
 pub fn open_stake(_ctx:Context<OpenStake>)->Result<()> {err!(ErrorCode::StakingDisabled)}
 pub fn checkpoint_stake(ctx:Context<Stake>)->Result<()> {sync_stake(ctx.accounts, false)?;Ok(())}
 pub fn stake(_ctx:Context<Stake>,amount:u64)->Result<()> {let _=amount;err!(ErrorCode::StakingDisabled)}
 pub fn request_exit(ctx:Context<Stake>)->Result<()> {
  require!(ctx.accounts.stake.principal>0&&ctx.accounts.stake.exit_at==0,ErrorCode::State);ctx.accounts.stake.exit_at=Clock::get()?.unix_timestamp.checked_add(7*DAY).ok_or(ErrorCode::Math)?;Ok(())
 }
 pub fn withdraw(ctx:Context<Stake>)->Result<()> {
  require!(ctx.accounts.stake.principal>0&&ctx.accounts.stake.exit_at>0&&Clock::get()?.unix_timestamp>=ctx.accounts.stake.exit_at,ErrorCode::Time);sync_stake(ctx.accounts,true)?;
  let amount=ctx.accounts.stake.principal;outgoing(ctx.accounts.token_program.to_account_info(),ctx.accounts.stake_vault.to_account_info(),ctx.accounts.wallet.to_account_info(),ctx.accounts.config.to_account_info(),ctx.accounts.config.bump,amount)?;
  ctx.accounts.config.principal=ctx.accounts.config.principal.checked_sub(amount).ok_or(ErrorCode::Math)?;ctx.accounts.stake.principal=0;ctx.accounts.stake.exit_at=0;Ok(())
 }
 pub fn settle(ctx:Context<SettleMarket>)->Result<()> {market_release::settle(ctx)}
 pub fn claim_human(_ctx:Context<ClaimHuman>)->Result<()> {err!(ErrorCode::MonthlyDividendDisabled)}
 pub fn claim_reward(ctx:Context<ClaimReward>)->Result<()> {
  require!(ctx.accounts.epoch.settled,ErrorCode::State);let now=Clock::get()?.unix_timestamp;
  let mut global=ctx.accounts.history.load_mut()?;advance_global(&mut ctx.accounts.config,&mut global,now)?;
  let mut user=ctx.accounts.user_history.load_mut()?;advance_user(&ctx.accounts.config,&mut ctx.accounts.stake,&mut user,&global,now)?;
  let i=ctx.accounts.epoch.number as usize-1;require!(ctx.accounts.stake.cursor>=global.cutoff[i]&&!claimed(&user,i),ErrorCode::Checkpoint);
  let a=muldiv(weight(&user.low,&user.high,i),global.rate[i] as u128,SCALE)? as u64;require!(a<=ctx.accounts.epoch.reward_remaining,ErrorCode::Collateral);
  outgoing(ctx.accounts.token_program.to_account_info(),ctx.accounts.reward_vault.to_account_info(),ctx.accounts.destination.to_account_info(),ctx.accounts.config.to_account_info(),ctx.accounts.config.bump,a)?;
  user.claimed[i/64]|=1u64<<(i%64);ctx.accounts.epoch.reward_remaining-=a;Ok(())
 }
 pub fn close_constitution(ctx:Context<Close>)->Result<()> {
  if ctx.accounts.config.closed{return Ok(());}require!(ctx.accounts.config.live&&Clock::get()?.unix_timestamp>=boundary(ctx.accounts.config.start,720),ErrorCode::Time);
  let bump=[ctx.accounts.config.bump];let seeds:&[&[u8]]=&[b"config",&bump];
  // The separate market inventory must first be reconciled by finalize_launch.
  require!(ctx.accounts.config.launch_finalized&&ctx.accounts.config.last_settled_epoch==720,ErrorCode::State);
  for(i,v)in[&ctx.accounts.human,&ctx.accounts.rewards,&ctx.accounts.liquidity,&ctx.accounts.founder].iter().enumerate(){let a=ctx.accounts.config.stocks[i];if a>0 {token::burn(CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(),Burn{mint:ctx.accounts.mint.to_account_info(),from:v.to_account_info(),authority:ctx.accounts.config.to_account_info()},&[seeds]),a)?;}}
  ctx.accounts.config.stocks=[0;4];ctx.accounts.config.closed=true;ctx.accounts.config.live=false;Ok(())
 }
}

fn incoming<'a>(program:AccountInfo<'a>,from:AccountInfo<'a>,to:AccountInfo<'a>,owner:AccountInfo<'a>,amount:u64)->Result<()> {if amount>0 {token::transfer(CpiContext::new(program,Transfer{from,to,authority:owner}),amount)?;}Ok(())}
fn launch_reserved(c:&Config)->Result<u64>{let n=c.launch_people.checked_sub(c.launch_claimed).ok_or(ErrorCode::Math)?;Ok(c.launch_per_person.checked_mul(n as u64).ok_or(ErrorCode::Math)?)}
fn outgoing<'a>(program:AccountInfo<'a>,from:AccountInfo<'a>,to:AccountInfo<'a>,authority:AccountInfo<'a>,bump:u8,amount:u64)->Result<()> {if amount>0 {let b=[bump];let seeds:&[&[u8]]=&[b"config",&b];token::transfer(CpiContext::new_with_signer(program,Transfer{from,to,authority},&[seeds]),amount)?;}Ok(())}
fn weight(lo:&[u64;720],hi:&[u64;720],i:usize)->u128 {lo[i] as u128|((hi[i] as u128)<<64)}
fn add_weight(lo:&mut[u64;720],hi:&mut[u64;720],i:usize,a:u128)->Result<()> {let w=weight(lo,hi,i).checked_add(a).ok_or(ErrorCode::Math)?;lo[i]=w as u64;hi[i]=(w>>64)as u64;Ok(())}
fn advance_global(c:&mut Config,b:&mut GlobalBook,now:i64)->Result<()> {
 let target=now.min(boundary(c.start,720)).max(c.start);
 for _ in 0..8 {if c.cursor>=target{break;}let n=epoch(c.start,c.cursor);require!(n>=1&&n<=720,ErrorCode::Time);let end=boundary(c.start,n).min(target);let i=n as usize-1;let effective=if b.cutoff[i]>0 {end.min(b.cutoff[i])}else{end};let dt=(effective-c.cursor).max(0)as u128;
  let a=(c.principal as u128).checked_mul(dt).ok_or(ErrorCode::Math)?;add_weight(&mut b.low,&mut b.high,i,a)?;c.cursor=end;}
 Ok(())
}
fn advance_user(c:&Config,s:&mut StakePosition,u:&mut UserBook,g:&GlobalBook,now:i64)->Result<()> {
 let target=now.min(boundary(c.start,720)).max(c.start);
 for _ in 0..8 {if s.cursor>=target{break;}let n=epoch(c.start,s.cursor);require!(n>=1&&n<=720,ErrorCode::Time);let end=boundary(c.start,n).min(target);let i=n as usize-1;let effective=if g.cutoff[i]>0 {end.min(g.cutoff[i])}else{end};let a=(s.principal as u128).checked_mul((effective-s.cursor).max(0)as u128).ok_or(ErrorCode::Math)?;add_weight(&mut u.low,&mut u.high,i,a)?;s.cursor=end;}
 Ok(())
}
fn sync_stake(a:&mut Stake,require_caught:bool)->Result<()> {let now=Clock::get()?.unix_timestamp;let mut g=a.history.load_mut()?;advance_global(&mut a.config,&mut g,now)?;let mut u=a.user_history.load_mut()?;advance_user(&a.config,&mut a.stake,&mut u,&g,now)?;
 if require_caught {let target=now.min(boundary(a.config.start,720)).max(a.config.start);require!(a.config.cursor==target&&a.stake.cursor==target,ErrorCode::Checkpoint);}Ok(())}
fn claimed(u:&UserBook,i:usize)->bool {u.claimed[i/64]&(1u64<<(i%64))!=0}
fn observe(m:&mut Market,x:u64,y:u64,now:i64)->Result<()> {
 require!(m.seeded&&x>0&&y>0&&now>=m.last,ErrorCode::Market);let price=muldiv(y as u128,UNIT as u128,x as u128)?;
 m.cumulative=m.cumulative.checked_add(price.checked_mul((now-m.last)as u128).ok_or(ErrorCode::Math)?).ok_or(ErrorCode::Math)?;m.last=now;
 if m.samples.last().map(|p|now-p.time>=DAY).unwrap_or(true){if m.samples.len()>=32 {m.samples.remove(0);}m.samples.push(Observation{time:now,cumulative:m.cumulative});}Ok(())
}
fn market_ready(m:&Market,x:u64,y:u64,now:i64)->Result<bool> {
 if x==0||y<5000*UNIT{return Ok(false);}let p=m.samples.iter().rev().find(|p|p.time<=now-30*DAY&&p.time>=now-31*DAY);
 if let Some(p)=p {let avg=(m.cumulative-p.cumulative)/(now-p.time)as u128;let spot=muldiv(y as u128,UNIT as u128,x as u128)?;Ok(avg>0&&spot*10000>=avg*8000)}else{Ok(false)}
}
#[account] pub struct Config {pub admin:Pubkey,pub mint:Pubkey,pub quote_mint:Pubkey,pub history:Pubkey,pub start:i64,pub cursor:i64,pub stocks:[u64;4],pub principal:u64,pub lp_requested:u64,pub apr_bps:u16,pub pending_apr:u16,pub apr_effective:u16,pub bump:u8,pub vault_mask:u8,pub live:bool,pub closed:bool,pub paused:bool,pub last_settled_epoch:u16,pub launch_people:u32,pub launch_claimed:u32,pub launch_finalized:bool,pub launch_per_person:u64,pub launch_remaining:u64,pub market_remaining:u64,pub sale_authorized:u64,pub sale_total_sold:u64,pub sale_order:Pubkey,pub meteora_instruction_hash:[u8;32],pub meteora_committed_at:i64,pub meteora_pool:Pubkey,pub meteora_listed:bool,pub dlmm_pair:Pubkey,pub dlmm_committed_at:i64,pub dlmm_floor_bin:i32,pub dlmm_heli_is_x:bool,pub dlmm_listed:bool,pub dlmm_active_id:i32,pub dlmm_bin_step:u16,pub dlmm_base_factor:u16,pub dlmm_pool_created:bool,pub manifest_market:Pubkey,pub manifest_trader_bump:u8,pub manifest_bound:bool,pub manifest_base_deposited:u64,pub manifest_base_returned:u64,pub manifest_quote_withdrawn:u64}
#[account] pub struct Operations {pub monthly_cap:u64,pub reserve:u64,pub window:u16,pub spent_in_window:u64,pub earned_total:u64,pub spent_total:u64,pub next_nonce:u64,pub donated_total:u64,pub sale_allocated_total:u64}
#[account] pub struct Expense {pub destination:Pubkey,pub proposer:Pubkey,pub purpose:[u8;32],pub amount:u64,pub ready_at:i64,pub nonce:u64,pub paid:bool}
#[event] pub struct ExpenseExecuted {pub nonce:u64,pub destination:Pubkey,pub amount:u64,pub purpose:[u8;32]}
#[event] pub struct QuoteContribution {pub contributor:Pubkey,pub amount:u64}
#[event] pub struct AuctionProceedsAllocated {pub amount:u64}
#[event] pub struct CalendarBoundary {pub number:u16,pub timestamp:i64}
#[account] pub struct Epoch {pub number:u16,pub people:u32,pub per_person:u64,pub human_remaining:u64,pub reward_remaining:u64,pub capacity:u64,pub human_budget:u64,pub staking:u64,pub liquidity:u64,pub founder:u64,pub burned:u64,pub quote_lp:u64,pub quote_founder:u64,pub settled:bool,pub registry_finalized:bool,pub bump:u8,pub liquidity_budget:u64,pub founder_budget:u64}
#[account] pub struct Credential {pub owner:Pubkey,pub nullifier:[u8;32],pub proof_digest:[u8;32],pub active:bool}
#[account] pub struct DlmmOrderReceipt {pub order:Pubkey,pub bin_id:i32,pub amount:u64,pub placed_at:i64,pub closed:bool}
#[account] pub struct WalletIdentity {pub credential:Pubkey}
#[account] pub struct Receipt {pub owner:Pubkey,pub valid:bool,pub claimed:bool}
#[account] pub struct LaunchReceipt {pub owner:Pubkey,pub valid:bool,pub claimed:bool,pub eligible_at:i64}
#[account] pub struct StakePosition {pub owner:Pubkey,pub history:Pubkey,pub principal:u64,pub cursor:i64,pub exit_at:i64}
#[account] pub struct Market {pub seeded:bool,pub last:i64,pub cumulative:u128,pub samples:Vec<Observation>}
#[derive(AnchorSerialize,AnchorDeserialize,Clone)] pub struct Observation {pub time:i64,pub cumulative:u128}
// Large histories use external rent-funded zero accounts and in-place access. No 10KB CPI allocation.
#[account(zero_copy(unsafe))] #[repr(C)] pub struct GlobalBook {pub low:[u64;720],pub high:[u64;720],pub cutoff:[i64;720],pub rate:[u64;720]}
#[account(zero_copy(unsafe))] #[repr(C)] pub struct UserBook {pub low:[u64;720],pub high:[u64;720],pub claimed:[u64;12]}
#[error_code] pub enum ErrorCode {#[msg("Invalid state")]State,#[msg("Invalid calendar window")]Time,#[msg("Quota exceeded")]Quota,#[msg("Invalid credential")]Identity,#[msg("Arithmetic error")]Math,#[msg("Collateral deficit")]Collateral,#[msg("Checkpoint required")]Checkpoint,#[msg("Market guard rejected")]Market,#[msg("Staking policy is fixed")]FixedStakingPolicy,#[msg("Staking is disabled")]StakingDisabled,#[msg("Liquidity inventory is disabled")]LiquidityDisabled,#[msg("Monthly free dividends are disabled; only the initial allocation is free")]MonthlyDividendDisabled}

// Account validation is kept in one source file for reproducible Playground builds.
include!("accounts.rs");


````

## FILE: heli/solana-v20/src/management.rs

````text
//! Single-manager project treasury on the bound Manifest market.
//! New treasury releases consume the legacy founder epoch budget exactly once.
//! Market collateral, cancelled orders and purchased HELI never refill locked stock.
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{instruction::{AccountMeta,Instruction},program::{invoke,invoke_signed},system_instruction};
use anchor_spl::token::{self,Mint,Token,TokenAccount,Transfer};
use crate::{Config,Epoch,ErrorCode,UNIT,boundary,outgoing,manifest_bridge::check_market,release::{ReleasePolicy,reference_price,top_bid}};

#[account]
pub struct ManagementBook {pub quote_floor:u64,pub total_released:u64,pub quote_funded:u64,pub quote_returned:u64,pub trader_bump:u8}

#[derive(Accounts)]
pub struct InitializeManagement<'info>{
 #[account(seeds=[b"config"],bump=config.bump,has_one=admin)] pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)] pub mint:Box<Account<'info,Mint>>,
 #[account(address=config.quote_mint)] pub quote_mint:Box<Account<'info,Mint>>,
 #[account(init,payer=admin,space=8+33,seeds=[b"management-book"],bump)] pub management_book:Box<Account<'info,ManagementBook>>,
 /// CHECK: Fixed System-owned signer PDA; Manifest seat is claimed by CPI.
 #[account(init,payer=admin,space=0,owner=system_program.key(),seeds=[b"management-trader"],bump)] pub management_trader:UncheckedAccount<'info>,
 #[account(init,payer=admin,token::mint=mint,token::authority=management_trader,seeds=[b"management-base"],bump)] pub management_base:Box<Account<'info,TokenAccount>>,
 #[account(init,payer=admin,token::mint=quote_mint,token::authority=management_trader,seeds=[b"management-quote"],bump)] pub management_quote:Box<Account<'info,TokenAccount>>,
 /// CHECK: Bound market, owner, mints, program and header checked before CPI.
 #[account(mut,address=config.manifest_market)] pub manifest_market:UncheckedAccount<'info>,
 /// CHECK: Executable pinned Manifest program checked by check_market.
 pub manifest_program:UncheckedAccount<'info>,
 #[account(mut)] pub admin:Signer<'info>,pub token_program:Program<'info,Token>,pub system_program:Program<'info,System>,pub rent:Sysvar<'info,Rent>,
}

pub fn initialize(mut ctx:Context<InitializeManagement>,quote_floor:u64,rent_lamports:u64)->Result<()> {
 let a=&mut ctx.accounts;require!(a.config.live&&!a.config.closed&&a.config.manifest_bound&&rent_lamports>=1_000_000&&rent_lamports<=100_000_000,ErrorCode::State);
 check_market(&a.manifest_market.to_account_info(),&a.manifest_program.to_account_info(),&a.config.mint,&a.config.quote_mint)?;
 invoke(&system_instruction::transfer(&a.admin.key(),&a.management_trader.key(),rent_lamports),&[a.admin.to_account_info(),a.management_trader.to_account_info(),a.system_program.to_account_info()])?;
 let bump=[ctx.bumps.management_trader];let sign:&[&[u8]]=&[b"management-trader",&bump];
 let ix=Instruction{program_id:a.manifest_program.key(),data:vec![1],accounts:vec![AccountMeta::new(a.management_trader.key(),true),AccountMeta::new(a.manifest_market.key(),false),AccountMeta::new_readonly(a.system_program.key(),false)]};
 invoke_signed(&ix,&[a.management_trader.to_account_info(),a.manifest_market.to_account_info(),a.system_program.to_account_info(),a.manifest_program.to_account_info()],&[sign])?;
 a.management_book.quote_floor=quote_floor;a.management_book.trader_bump=ctx.bumps.management_trader;Ok(())
}

#[derive(Accounts)]
pub struct ManagementAction<'info>{
 #[account(mut,seeds=[b"config"],bump=config.bump,has_one=admin)] pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)] pub mint:Box<Account<'info,Mint>>,
 #[account(address=config.quote_mint)] pub quote_mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"management-book"],bump)] pub management_book:Box<Account<'info,ManagementBook>>,
 #[account(mut,seeds=[b"management-trader"],bump=management_book.trader_bump)] pub management_trader:SystemAccount<'info>,
 #[account(mut,seeds=[b"management-base"],bump,token::mint=mint,token::authority=management_trader)] pub management_base:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"management-quote"],bump,token::mint=quote_mint,token::authority=management_trader)] pub management_quote:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"auction-proceeds"],bump,token::mint=quote_mint,token::authority=config)] pub project_quote:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"vault",&[3u8]],bump,token::mint=mint,token::authority=config)] pub management_stock:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"epoch",&epoch.number.to_le_bytes()],bump=epoch.bump)] pub epoch:Box<Account<'info,Epoch>>,
 #[account(seeds=[b"release-policy"],bump)] pub policy:Box<Account<'info,ReleasePolicy>>,
 /// CHECK: Bound market and its canonical vaults are checked for every operation.
 #[account(mut,address=config.manifest_market)] pub manifest_market:UncheckedAccount<'info>,
 /// CHECK: Pinned Manifest executable checked by check_market.
 pub manifest_program:UncheckedAccount<'info>,
 /// CHECK: Canonical market base vault checked by market().
 #[account(mut)] pub base_vault:UncheckedAccount<'info>,
 /// CHECK: Canonical market quote vault checked by market().
 #[account(mut)] pub quote_vault:UncheckedAccount<'info>,
 #[account(mut)] pub admin:Signer<'info>,pub token_program:Program<'info,Token>,pub system_program:Program<'info,System>,
}

fn market(a:&ManagementAction)->Result<()> {
 require!(a.config.manifest_bound,ErrorCode::Market);
 let(b,q)=check_market(&a.manifest_market.to_account_info(),&a.manifest_program.to_account_info(),&a.config.mint,&a.config.quote_mint)?;
 require_keys_eq!(a.base_vault.key(),b,ErrorCode::Market);require_keys_eq!(a.quote_vault.key(),q,ErrorCode::Market);Ok(())
}
fn active(a:&ManagementAction)->Result<()> {require!(a.config.live&&!a.config.closed&&!a.config.paused,ErrorCode::State);market(a)}
fn invoke_management<'a>(a:&ManagementAction<'a>,data:Vec<u8>,metas:Vec<AccountMeta>,mut infos:Vec<AccountInfo<'a>>)->Result<()> {
 let bump=[a.management_book.trader_bump];let sign:&[&[u8]]=&[b"management-trader",&bump];
 infos.push(a.manifest_program.to_account_info());invoke_signed(&Instruction{program_id:a.manifest_program.key(),data,accounts:metas},&infos,&[sign])?;Ok(())
}
fn deposit_or_withdraw(a:&ManagementAction,base:bool,amount:u64,tag:u8)->Result<()> {
 let(wallet,vault,mint)=if base {(a.management_base.to_account_info(),a.base_vault.to_account_info(),a.mint.to_account_info())}else{(a.management_quote.to_account_info(),a.quote_vault.to_account_info(),a.quote_mint.to_account_info())};
 let mut data=vec![tag];data.extend_from_slice(&amount.to_le_bytes());data.push(0);
 invoke_management(a,data,vec![AccountMeta::new_readonly(a.management_trader.key(),true),AccountMeta::new(a.manifest_market.key(),false),AccountMeta::new(wallet.key(),false),AccountMeta::new(vault.key(),false),AccountMeta::new_readonly(a.token_program.key(),false),AccountMeta::new_readonly(mint.key(),false)],vec![a.management_trader.to_account_info(),a.manifest_market.to_account_info(),wallet,vault,a.token_program.to_account_info(),mint])
}

pub fn fund_quote(mut ctx:Context<ManagementAction>,amount:u64)->Result<()> {
 let a=&mut ctx.accounts;active(a)?;require!(amount>0,ErrorCode::Quota);
 let needed=amount.checked_add(a.management_book.quote_floor).ok_or(ErrorCode::Math)?;require!(a.project_quote.amount>=needed,ErrorCode::Collateral);
 outgoing(a.token_program.to_account_info(),a.project_quote.to_account_info(),a.management_quote.to_account_info(),a.config.to_account_info(),a.config.bump,amount)?;
 deposit_or_withdraw(a,false,amount,2)?;
 a.management_book.quote_funded=a.management_book.quote_funded.checked_add(amount).ok_or(ErrorCode::Math)?;Ok(())
}

pub fn release(mut ctx:Context<ManagementAction>,amount:u64)->Result<()> {
 let a=&mut ctx.accounts;active(a)?;let now=Clock::get()?;let e=&a.epoch;let c=&a.config;
 require!(amount>0&&e.settled&&e.number>=12&&e.number<720&&e.number==c.last_settled_epoch&&now.unix_timestamp>=boundary(c.start,e.number)&&now.unix_timestamp<boundary(c.start,e.number+1),ErrorCode::Time);
 let used=e.founder.checked_add(amount).ok_or(ErrorCode::Math)?;
 let non_management=e.human_budget as u128;
 require!(used<=e.founder_budget&&used<=e.capacity/5&&used as u128*4<=non_management&&amount<=c.stocks[3]&&a.management_stock.amount>=c.stocks[3],ErrorCode::Quota);
 let ref_price=reference_price(&a.policy,now.unix_timestamp)?;let(price,depth)=top_bid(&a.manifest_market.to_account_info(),&now)?;
 require!(price as u128*100>=ref_price as u128*98&&price as u128*100<=ref_price as u128*102&&amount<=depth/50&&price as u128*depth as u128/UNIT as u128>=a.policy.minimum_quote_depth as u128,ErrorCode::Market);
 outgoing(a.token_program.to_account_info(),a.management_stock.to_account_info(),a.management_base.to_account_info(),c.to_account_info(),c.bump,amount)?;
 a.config.stocks[3]-=amount;a.epoch.founder=used;
 require!(a.epoch.human_budget as u128+a.epoch.staking as u128+a.epoch.liquidity as u128+used as u128<=a.epoch.capacity as u128,ErrorCode::Quota);
 a.management_book.total_released=a.management_book.total_released.checked_add(amount).ok_or(ErrorCode::Math)?;
 // Withdrawal/cancellation never reverses this release or refills this epoch's budget.
 Ok(())
}

pub fn order(ctx:Context<ManagementAction>,amount:u64,base_deposit:u64,mantissa:u32,exponent:i8,is_bid:bool)->Result<()> {
 let a=&ctx.accounts;active(a)?;require!(amount>0&&mantissa>0&&exponent>=-18&&exponent<=18&&(!is_bid||base_deposit==0),ErrorCode::Quota);
 if base_deposit>0 {require!(base_deposit<=a.management_base.amount,ErrorCode::Collateral);deposit_or_withdraw(a,true,base_deposit,2)?;}
 let mut data=vec![6,0];data.extend_from_slice(&0u32.to_le_bytes());data.extend_from_slice(&1u32.to_le_bytes());
 data.extend_from_slice(&amount.to_le_bytes());data.extend_from_slice(&mantissa.to_le_bytes());data.push(exponent as u8);data.push(is_bid as u8);data.extend_from_slice(&0u32.to_le_bytes());data.push(0);
 invoke_management(a,data,vec![AccountMeta::new(a.management_trader.key(),true),AccountMeta::new(a.manifest_market.key(),false),AccountMeta::new_readonly(a.system_program.key(),false)],vec![a.management_trader.to_account_info(),a.manifest_market.to_account_info(),a.system_program.to_account_info()])
}
pub fn cancel(ctx:Context<ManagementAction>,sequence:u64)->Result<()> {
 let a=&ctx.accounts;market(a)?;let mut data=vec![6,0];data.extend_from_slice(&1u32.to_le_bytes());data.extend_from_slice(&sequence.to_le_bytes());data.push(0);data.extend_from_slice(&0u32.to_le_bytes());
 invoke_management(a,data,vec![AccountMeta::new(a.management_trader.key(),true),AccountMeta::new(a.manifest_market.key(),false),AccountMeta::new_readonly(a.system_program.key(),false)],vec![a.management_trader.to_account_info(),a.manifest_market.to_account_info(),a.system_program.to_account_info()])
}
pub fn withdraw(mut ctx:Context<ManagementAction>,amount:u64,is_base:bool)->Result<()> {
 let a=&mut ctx.accounts;market(a)?;require!(amount>0,ErrorCode::Quota);deposit_or_withdraw(a,is_base,amount,3)?;
 if !is_base {
  let bump=[a.management_book.trader_bump];let sign:&[&[u8]]=&[b"management-trader",&bump];
  token::transfer(CpiContext::new_with_signer(a.token_program.to_account_info(),Transfer{from:a.management_quote.to_account_info(),to:a.project_quote.to_account_info(),authority:a.management_trader.to_account_info()},&[sign]),amount)?;
  a.management_book.quote_returned=a.management_book.quote_returned.checked_add(amount).ok_or(ErrorCode::Math)?;
 }
 // HELI remains in management_base as already-released working inventory.
 Ok(())
}

````

## FILE: heli/solana-v20/src/manifest_bridge.rs

````text
//! Direct, program-owned Manifest core seat. Pinned to Manifest v3.0.24.
//! Pilot only. Raw CPI bytes and market layout must be rechecked on upgrade.
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{instruction::{AccountMeta,Instruction},program::{invoke,invoke_signed},pubkey,system_instruction};
use anchor_spl::token::{self,Mint,Token,TokenAccount,Transfer};
use crate::{Config,ErrorCode,OpeningAuction,UNIT,outgoing};

const MANIFEST:Pubkey=pubkey!("MNFSTqtC93rEfYHB6hF82sKdZpUDFWkViLByLd1k1Ms");
const MARKET_DISCRIMINANT:u64=4859840929024028656;

pub(crate) fn check_market(market:&AccountInfo,program:&AccountInfo,heli:&Pubkey,quote:&Pubkey)->Result<(Pubkey,Pubkey)> {
 require_keys_eq!(program.key(),MANIFEST,ErrorCode::Market);
 require!(program.executable&&market.owner==&MANIFEST,ErrorCode::Market);
 let data=market.try_borrow_data()?;
 require!(data.len()>=256&&data[0..8]==MARKET_DISCRIMINANT.to_le_bytes()&&data[8]==0&&data[9]==6&&
   data[16..48]==heli.to_bytes()&&data[48..80]==quote.to_bytes(),ErrorCode::Market);
 let base=Pubkey::find_program_address(&[b"vault",market.key().as_ref(),heli.as_ref()],&MANIFEST).0;
 let quote_vault=Pubkey::find_program_address(&[b"vault",market.key().as_ref(),quote.as_ref()],&MANIFEST).0;
 require!(data[80..112]==base.to_bytes()&&data[112..144]==quote_vault.to_bytes(),ErrorCode::Market);
 Ok((base,quote_vault))
}

fn cpi<'a>(program:AccountInfo<'a>,accounts:&[AccountInfo<'a>],metas:Vec<AccountMeta>,data:Vec<u8>,bump:u8)->Result<()> {
 let ix=Instruction{program_id:MANIFEST,accounts:metas,data};
 let seed=[bump];let signer:&[&[u8]]=&[b"manifest-trader",&seed];
 let mut infos=accounts.to_vec();infos.push(program);
 invoke_signed(&ix,&infos,&[signer])?;Ok(())
}

fn manifest_data(tag:u8,amount:u64)->Vec<u8>{let mut d=vec![tag];d.extend_from_slice(&amount.to_le_bytes());d.push(0);d}
fn update_data(cancel:Option<u64>,order:Option<(u64,u32,i8)>)->Vec<u8>{
 let mut d=vec![6,0]; // BatchUpdate, no trader-index hint.
 d.extend_from_slice(&(if cancel.is_some(){1u32}else{0}).to_le_bytes());
 if let Some(s)=cancel {d.extend_from_slice(&s.to_le_bytes());d.push(0);}
 d.extend_from_slice(&(if order.is_some(){1u32}else{0}).to_le_bytes());
 if let Some((amount,mantissa,exponent))=order {
  d.extend_from_slice(&amount.to_le_bytes());d.extend_from_slice(&mantissa.to_le_bytes());
  d.push(exponent as u8);d.push(0); // Ask; is_bid=false.
  d.extend_from_slice(&0u32.to_le_bytes());d.push(0); // No expiry; limit order.
 }
 d
}

#[derive(Accounts)]
pub struct BindManifestMarket<'info> {
 #[account(mut,seeds=[b"config"],bump=config.bump,has_one=admin)] pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)] pub mint:Box<Account<'info,Mint>>,
 #[account(address=config.quote_mint)] pub quote_mint:Box<Account<'info,Mint>>,
 /// CHECK: owner, discriminant, mints and vaults are checked by check_market.
 #[account(mut)] pub manifest_market:UncheckedAccount<'info>,
 /// CHECK: checked against the pinned Manifest ID and executable flag.
 pub manifest_program:UncheckedAccount<'info>,
 /// CHECK: Seeds and System owner create a zero-data PDA used only as a Manifest CPI signer.
 #[account(init,payer=admin,space=0,owner=system_program.key(),seeds=[b"manifest-trader"],bump)] pub trader:UncheckedAccount<'info>,
 #[account(init,payer=admin,token::mint=mint,token::authority=trader,seeds=[b"manifest-heli"],bump)] pub manifest_base:Box<Account<'info,TokenAccount>>,
 #[account(init,payer=admin,token::mint=quote_mint,token::authority=trader,seeds=[b"manifest-quote"],bump)] pub manifest_quote:Box<Account<'info,TokenAccount>>,
 #[account(mut)] pub admin:Signer<'info>,
 pub token_program:Program<'info,Token>,pub system_program:Program<'info,System>,pub rent:Sysvar<'info,Rent>,
}

pub fn bind(ctx:Context<BindManifestMarket>,market_rent_lamports:u64)->Result<()> {
 let a=&ctx.accounts;let c=&a.config;
 require!(c.live&&!c.closed&&!c.manifest_bound&&!c.dlmm_listed&&!c.meteora_listed&&
   market_rent_lamports>=1_000_000&&market_rent_lamports<=100_000_000,ErrorCode::Market);
 check_market(&a.manifest_market.to_account_info(),&a.manifest_program.to_account_info(),&c.mint,&c.quote_mint)?;
 invoke(&system_instruction::transfer(&a.admin.key(),&a.trader.key(),market_rent_lamports),
   &[a.admin.to_account_info(),a.trader.to_account_info(),a.system_program.to_account_info()])?;
 let metas=vec![AccountMeta::new(a.trader.key(),true),AccountMeta::new(a.manifest_market.key(),false),
   AccountMeta::new_readonly(a.system_program.key(),false)];
 cpi(a.manifest_program.to_account_info(),&[a.trader.to_account_info(),a.manifest_market.to_account_info(),
   a.system_program.to_account_info()],metas,vec![1],ctx.bumps.trader)?;
 let market_key=a.manifest_market.key();let c=&mut ctx.accounts.config;c.manifest_market=market_key;
 c.manifest_trader_bump=ctx.bumps.trader;c.manifest_bound=true;Ok(())
}

#[derive(Accounts)]
pub struct PlaceProjectAsk<'info> {
 #[account(mut,seeds=[b"config"],bump=config.bump,has_one=admin)] pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)] pub mint:Box<Account<'info,Mint>>,
 #[account(seeds=[b"opening-auction"],bump)] pub auction:Box<Account<'info,OpeningAuction>>,
 #[account(mut,seeds=[b"market-inventory"],bump,token::mint=mint,token::authority=config)] pub market_inventory:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"manifest-heli"],bump,token::mint=mint,token::authority=trader)] pub manifest_base:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"manifest-trader"],bump=config.manifest_trader_bump)] pub trader:SystemAccount<'info>,
 /// CHECK: bound address and Manifest header checked at runtime.
 #[account(mut,address=config.manifest_market)] pub manifest_market:UncheckedAccount<'info>,
 /// CHECK: checked against fixed program ID and executable flag.
 pub manifest_program:UncheckedAccount<'info>,
 /// CHECK: verified PDA of bound Manifest market and HELI mint.
 #[account(mut)] pub base_vault:UncheckedAccount<'info>,
 #[account(mut)] pub admin:Signer<'info>,
 pub token_program:Program<'info,Token>,pub system_program:Program<'info,System>,
}

pub fn place_ask(ctx:Context<PlaceProjectAsk>,amount:u64,mantissa:u32,exponent:i8)->Result<()> {
 let a=&ctx.accounts;let c=&a.config;
 require!((c.live||c.closed)&&!c.paused&&c.manifest_bound&&a.auction.finalized&&
   amount>0&&mantissa>0&&exponent>=-18&&exponent<=18&&
   a.market_inventory.amount>=c.market_remaining,ErrorCode::Market);
 let (base,_)=check_market(&a.manifest_market.to_account_info(),&a.manifest_program.to_account_info(),&c.mint,&c.quote_mint)?;
 require_keys_eq!(a.base_vault.key(),base,ErrorCode::Market);
 let unclaimed=a.auction.reserved_atoms;
 // Anyone can send SPL tokens here. Gifts must neither halt trading nor
 // enlarge constitutionally authorized inventory.
 let available=c.market_remaining.checked_sub(unclaimed).ok_or(ErrorCode::Collateral)?;
 require!(amount<=available,ErrorCode::Collateral);
 outgoing(a.token_program.to_account_info(),a.market_inventory.to_account_info(),a.manifest_base.to_account_info(),
   c.to_account_info(),c.bump,amount)?;
 let deposit=vec![AccountMeta::new_readonly(a.trader.key(),true),AccountMeta::new(a.manifest_market.key(),false),
   AccountMeta::new(a.manifest_base.key(),false),AccountMeta::new(a.base_vault.key(),false),
   AccountMeta::new_readonly(a.token_program.key(),false),AccountMeta::new_readonly(a.mint.key(),false)];
 cpi(a.manifest_program.to_account_info(),&[a.trader.to_account_info(),a.manifest_market.to_account_info(),
   a.manifest_base.to_account_info(),a.base_vault.to_account_info(),a.token_program.to_account_info(),a.mint.to_account_info()],
   deposit,manifest_data(2,amount),c.manifest_trader_bump)?;
 let update=vec![AccountMeta::new(a.trader.key(),true),AccountMeta::new(a.manifest_market.key(),false),
   AccountMeta::new_readonly(a.system_program.key(),false)];
 cpi(a.manifest_program.to_account_info(),&[a.trader.to_account_info(),a.manifest_market.to_account_info(),
   a.system_program.to_account_info()],update,update_data(None,Some((amount,mantissa,exponent))),c.manifest_trader_bump)?;
 let c=&mut ctx.accounts.config;c.market_remaining=c.market_remaining.checked_sub(amount).ok_or(ErrorCode::Math)?;
 c.manifest_base_deposited=c.manifest_base_deposited.checked_add(amount).ok_or(ErrorCode::Math)?;Ok(())
}

#[derive(Accounts)]
pub struct CancelProjectAsk<'info> {
 #[account(seeds=[b"config"],bump=config.bump,has_one=admin)] pub config:Box<Account<'info,Config>>,
 #[account(mut,seeds=[b"manifest-trader"],bump=config.manifest_trader_bump)] pub trader:SystemAccount<'info>,
 /// CHECK: fixed bound market is validated in cancel_ask.
 #[account(mut,address=config.manifest_market)] pub manifest_market:UncheckedAccount<'info>,
 /// CHECK: pinned program checked in cancel_ask.
 pub manifest_program:UncheckedAccount<'info>,
 #[account(mut)] pub admin:Signer<'info>,pub system_program:Program<'info,System>,
}

pub fn cancel_ask(ctx:Context<CancelProjectAsk>,sequence:u64)->Result<()> {
 let a=&ctx.accounts;let c=&a.config;require!(c.manifest_bound,ErrorCode::Market);
 check_market(&a.manifest_market.to_account_info(),&a.manifest_program.to_account_info(),&c.mint,&c.quote_mint)?;
 let metas=vec![AccountMeta::new(a.trader.key(),true),AccountMeta::new(a.manifest_market.key(),false),
   AccountMeta::new_readonly(a.system_program.key(),false)];
 cpi(a.manifest_program.to_account_info(),&[a.trader.to_account_info(),a.manifest_market.to_account_info(),
   a.system_program.to_account_info()],metas,update_data(Some(sequence),None),c.manifest_trader_bump)
}

#[derive(Accounts)]
pub struct WithdrawProjectHeli<'info> {
 #[account(mut,seeds=[b"config"],bump=config.bump,has_one=admin)] pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)] pub mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"manifest-trader"],bump=config.manifest_trader_bump)] pub trader:SystemAccount<'info>,
 #[account(mut,seeds=[b"manifest-heli"],bump,token::mint=mint,token::authority=trader)] pub manifest_base:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"market-inventory"],bump,token::mint=mint,token::authority=config)] pub market_inventory:Box<Account<'info,TokenAccount>>,
 /// CHECK: fixed bound market checked in withdraw_heli.
 #[account(mut,address=config.manifest_market)] pub manifest_market:UncheckedAccount<'info>,
 /// CHECK: pinned program checked in withdraw_heli.
 pub manifest_program:UncheckedAccount<'info>,
 /// CHECK: verified base vault PDA.
 #[account(mut)] pub base_vault:UncheckedAccount<'info>,
 #[account(mut)] pub admin:Signer<'info>,pub token_program:Program<'info,Token>,
}

pub fn withdraw_heli(ctx:Context<WithdrawProjectHeli>,amount:u64)->Result<()> {
 let a=&ctx.accounts;let c=&a.config;require!(c.manifest_bound&&amount>0,ErrorCode::Market);
 let (base,_)=check_market(&a.manifest_market.to_account_info(),&a.manifest_program.to_account_info(),&c.mint,&c.quote_mint)?;
 require_keys_eq!(a.base_vault.key(),base,ErrorCode::Market);
 let metas=vec![AccountMeta::new_readonly(a.trader.key(),true),AccountMeta::new(a.manifest_market.key(),false),
   AccountMeta::new(a.manifest_base.key(),false),AccountMeta::new(a.base_vault.key(),false),
   AccountMeta::new_readonly(a.token_program.key(),false),AccountMeta::new_readonly(a.mint.key(),false)];
 cpi(a.manifest_program.to_account_info(),&[a.trader.to_account_info(),a.manifest_market.to_account_info(),
   a.manifest_base.to_account_info(),a.base_vault.to_account_info(),a.token_program.to_account_info(),a.mint.to_account_info()],
   metas,manifest_data(3,amount),c.manifest_trader_bump)?;
 let seed=[c.manifest_trader_bump];let sign:&[&[u8]]=&[b"manifest-trader",&seed];
 token::transfer(CpiContext::new_with_signer(a.token_program.to_account_info(),Transfer{
   from:a.manifest_base.to_account_info(),to:a.market_inventory.to_account_info(),authority:a.trader.to_account_info()},&[sign]),amount)?;
 let c=&mut ctx.accounts.config;c.market_remaining=c.market_remaining.checked_add(amount).ok_or(ErrorCode::Math)?;
 c.manifest_base_returned=c.manifest_base_returned.checked_add(amount).ok_or(ErrorCode::Math)?;Ok(())
}

#[derive(Accounts)]
pub struct WithdrawProjectQuote<'info> {
 #[account(mut,seeds=[b"config"],bump=config.bump,has_one=admin)] pub config:Box<Account<'info,Config>>,
 #[account(address=config.quote_mint)] pub quote_mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"manifest-trader"],bump=config.manifest_trader_bump)] pub trader:SystemAccount<'info>,
 #[account(mut,seeds=[b"manifest-quote"],bump,token::mint=quote_mint,token::authority=trader)] pub manifest_quote:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"auction-proceeds"],bump,token::mint=quote_mint,token::authority=config)] pub sale_proceeds:Box<Account<'info,TokenAccount>>,
 /// CHECK: fixed bound market checked in withdraw_quote.
 #[account(mut,address=config.manifest_market)] pub manifest_market:UncheckedAccount<'info>,
 /// CHECK: pinned program checked in withdraw_quote.
 pub manifest_program:UncheckedAccount<'info>,
 /// CHECK: verified quote vault PDA.
 #[account(mut)] pub quote_vault:UncheckedAccount<'info>,
 #[account(mut)] pub admin:Signer<'info>,pub token_program:Program<'info,Token>,
}

pub fn withdraw_quote(ctx:Context<WithdrawProjectQuote>,amount:u64)->Result<()> {
 let a=&ctx.accounts;let c=&a.config;require!(c.manifest_bound&&amount>0,ErrorCode::Market);
 let (_,quote)=check_market(&a.manifest_market.to_account_info(),&a.manifest_program.to_account_info(),&c.mint,&c.quote_mint)?;
 require_keys_eq!(a.quote_vault.key(),quote,ErrorCode::Market);
 let metas=vec![AccountMeta::new_readonly(a.trader.key(),true),AccountMeta::new(a.manifest_market.key(),false),
   AccountMeta::new(a.manifest_quote.key(),false),AccountMeta::new(a.quote_vault.key(),false),
   AccountMeta::new_readonly(a.token_program.key(),false),AccountMeta::new_readonly(a.quote_mint.key(),false)];
 cpi(a.manifest_program.to_account_info(),&[a.trader.to_account_info(),a.manifest_market.to_account_info(),
   a.manifest_quote.to_account_info(),a.quote_vault.to_account_info(),a.token_program.to_account_info(),a.quote_mint.to_account_info()],
   metas,manifest_data(3,amount),c.manifest_trader_bump)?;
 let seed=[c.manifest_trader_bump];let sign:&[&[u8]]=&[b"manifest-trader",&seed];
 token::transfer(CpiContext::new_with_signer(a.token_program.to_account_info(),Transfer{
   from:a.manifest_quote.to_account_info(),to:a.sale_proceeds.to_account_info(),authority:a.trader.to_account_info()},&[sign]),amount)?;
 let c=&mut ctx.accounts.config;c.manifest_quote_withdrawn=c.manifest_quote_withdrawn.checked_add(amount).ok_or(ErrorCode::Math)?;Ok(())
}

````

## FILE: heli/solana-v20/src/market_release.rs

````text
//! Monthly sale inventory: only the separate initial 1M allocation is free.
//! Vault 0 and Epoch.human_budget are legacy layout names, not human entitlements.
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint,Token,TokenAccount};
use crate::{Config,Epoch,ErrorCode,outgoing,capacity};
use crate::calendar::boundary;

#[derive(Accounts)]
#[instruction(number:u16)]
pub struct OpenMarketEpoch<'info> {
 #[account(seeds=[b"config"],bump=config.bump)] pub config:Box<Account<'info,Config>>,
 #[account(init,payer=payer,space=8+160,seeds=[b"epoch".as_ref(),&number.to_le_bytes()],bump)] pub epoch:Box<Account<'info,Epoch>>,
 #[account(mut)] pub payer:Signer<'info>,
 pub system_program:Program<'info,System>,
}

#[derive(Accounts)]
pub struct SettleMarket<'info> {
 #[account(mut,seeds=[b"config"],bump=config.bump)] pub config:Box<Account<'info,Config>>,
 #[account(address=config.mint)] pub mint:Box<Account<'info,Mint>>,
 #[account(mut,seeds=[b"epoch".as_ref(),&epoch.number.to_le_bytes()],bump=epoch.bump)] pub epoch:Box<Account<'info,Epoch>>,
 #[account(mut,seeds=[b"vault".as_ref(),&[0]],bump,token::mint=mint,token::authority=config)] pub release_reserve:Box<Account<'info,TokenAccount>>,
 #[account(seeds=[b"vault".as_ref(),&[3]],bump,token::mint=mint,token::authority=config)] pub management_stock:Box<Account<'info,TokenAccount>>,
 #[account(mut,seeds=[b"market-inventory"],bump,token::mint=mint,token::authority=config)] pub market_inventory:Box<Account<'info,TokenAccount>>,
 pub token_program:Program<'info,Token>,
}

pub fn open(ctx:Context<OpenMarketEpoch>,number:u16)->Result<()> {
 let c=&ctx.accounts.config;
 require!(c.live&&!c.closed&&!c.paused&&number>=1&&number<=720&&Clock::get()?.unix_timestamp>=boundary(c.start,number-1),ErrorCode::Time);
 let e=&mut ctx.accounts.epoch;e.number=number;e.bump=ctx.bumps.epoch;
 // No monthly person register or claim/reward token accounts are needed.
 e.registry_finalized=true;Ok(())
}

pub fn settle(mut ctx:Context<SettleMarket>)->Result<()> {
 let a=&mut ctx.accounts;let c=&a.config;let n=a.epoch.number;
 require!(c.live&&!c.closed&&!c.paused&&!a.epoch.settled&&Clock::get()?.unix_timestamp>=boundary(c.start,n)&&n==c.last_settled_epoch.checked_add(1).ok_or(ErrorCode::Math)?,ErrorCode::Time);
 require!(c.stocks[1]==0&&c.stocks[2]==0&&a.release_reserve.amount>=c.stocks[0]&&a.management_stock.amount>=c.stocks[3]&&a.market_inventory.amount>=c.market_remaining,ErrorCode::Collateral);
 let cap=capacity(a.mint.supply,c.stocks)?;
 // Same common monetary cap. Management release permissions expire; no separate liquidity budget.
 let management_budget=if n>=12&&n<720 {(cap/5).min(c.stocks[3])}else{0};
 let market_release=cap.checked_sub(management_budget).ok_or(ErrorCode::Math)?.min(c.stocks[0]);
 let inventory=c.market_remaining.checked_add(market_release).ok_or(ErrorCode::Math)?;
 let authorized=c.sale_authorized.checked_add(market_release).ok_or(ErrorCode::Math)?;
 outgoing(a.token_program.to_account_info(),a.release_reserve.to_account_info(),a.market_inventory.to_account_info(),c.to_account_info(),c.bump,market_release)?;
 let c=&mut a.config;c.stocks[0]-=market_release;c.market_remaining=inventory;c.sale_authorized=authorized;c.last_settled_epoch=n;
 let e=&mut a.epoch;e.settled=true;e.capacity=cap;e.human_budget=market_release;e.founder_budget=management_budget;
 e.people=0;e.per_person=0;e.human_remaining=0;e.reward_remaining=0;e.burned=0;e.staking=0;e.liquidity=0;e.liquidity_budget=0;e.founder=0;
 emit!(MonthlyMarketRelease{number:n,capacity:cap,released:market_release,management_budget});
 Ok(())
}

#[event]
pub struct MonthlyMarketRelease {pub number:u16,pub capacity:u64,pub released:u64,pub management_budget:u64}

````

## FILE: heli/solana-v20/src/release.rs

````text
//! Atomic demand-driven sale of locked inventory on the bound Manifest market.
//! Top-of-book observations reduce flash manipulation; sustained wash markets remain a risk.
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{instruction::{AccountMeta,Instruction},program::{invoke,invoke_signed},system_instruction};
use anchor_spl::token::{self,Mint,Token,TokenAccount,Transfer};
use crate::{Config,Epoch,ErrorCode,UNIT,SCALE,boundary,outgoing,manifest_bridge::check_market};
#[account]
pub struct ReleasePolicy {pub minimum_quote_depth:u64,pub count:u8,pub next:u8,pub prices:[u64;24],pub times:[i64;24]}
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
 #[account(init,payer=admin,token::mint=mint,token::authority=trader,seeds=[b"release-base".as_ref(),&[kind]],bump)] pub base:Box<Account<'info,TokenAccount>>,
 #[account(init,payer=admin,token::mint=quote_mint,token::authority=trader,seeds=[b"release-quote".as_ref(),&[kind]],bump)] pub quote:Box<Account<'info,TokenAccount>>,
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
}
pub(crate) fn top_bid(market:&AccountInfo,now:&Clock)->Result<(u64,u64)> {
 let d=market.try_borrow_data()?;require!(d.len()>=256,ErrorCode::Market);
 let idx=u32::from_le_bytes(d[160..164].try_into().unwrap())as usize;
 require!(idx!=u32::MAX as usize&&idx%80==0,ErrorCode::Market);let at=256usize.checked_add(idx).ok_or(ErrorCode::Math)?;
 require!(at+80<=d.len(),ErrorCode::Market);let v=&d[at+16..at+80];
 let raw=u128::from_le_bytes(v[0..16].try_into().unwrap());let qty=u64::from_le_bytes(v[16..24].try_into().unwrap());
 let last=u32::from_le_bytes(v[36..40].try_into().unwrap());
 require!(v[40]==1&&v[41]!=3&&(last==0||last as u64>=now.slot)&&qty>0,ErrorCode::Market);
 let price=raw.checked_mul(UNIT as u128).ok_or(ErrorCode::Math)?/SCALE;
 require!(price>0&&price<=u64::MAX as u128,ErrorCode::Market);Ok((price as u64,qty))
}
pub fn observe(ctx:Context<ObserveReleaseMarket>)->Result<()>{
 let c=&ctx.accounts.config;require!(c.live&&!c.closed&&c.manifest_bound,ErrorCode::State);
 check_market(&ctx.accounts.manifest_market.to_account_info(),&ctx.accounts.manifest_program.to_account_info(),&c.mint,&c.quote_mint)?;
 let now=Clock::get()?;let(price,depth)=top_bid(&ctx.accounts.manifest_market.to_account_info(),&now)?;
 let p=&mut ctx.accounts.policy;
 require!((depth as u128*price as u128)/UNIT as u128>=p.minimum_quote_depth as u128,ErrorCode::Market);
 if p.count>0 {
  let last=(p.next as usize+23)%24;let dt=now.unix_timestamp-p.times[last];
  require!(dt>=3600,ErrorCode::Time);
  if dt>7200 {p.count=0;p.next=0;}
 }
 let i=p.next as usize;p.prices[i]=price;p.times[i]=now.unix_timestamp;p.next=((i+1)%24)as u8;p.count=(p.count+1).min(24);Ok(())
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
 let reference=reference_price(&a.policy,now.unix_timestamp)?;let(price,depth)=top_bid(&a.manifest_market.to_account_info(),&now)?;
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



````

## FILE: heli/website/app.js

````text
const pages = [...document.querySelectorAll('[data-page]')];
const navLinks = [...document.querySelectorAll('[data-nav]')];
const titles = { home: 'HELI · How should money begin?', allocation: 'Claim your free share · HELI', transparency: 'Transparency · HELI' };
const legacy = { ana: 'home', basvuru: 'allocation', seffaflik: 'transparency' };
function route() {
  const raw = window.location.hash.slice(1);
  if (raw === 'content' || raw === 'icerik') return;
  const candidate = legacy[raw] || raw;
  const anchor = document.getElementById(candidate);
  const current = Object.hasOwn(titles, candidate) ? candidate : 'home';
  for (const page of pages) page.hidden = page.dataset.page !== current;
  for (const link of navLinks) {
    if (link.dataset.nav === current) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  document.title = titles[current];
  if (anchor && !anchor.matches('[data-page]') && anchor.closest('[data-page="home"]')) anchor.scrollIntoView({ behavior: 'instant', block: 'start' });
  else window.scrollTo({ top: 0, behavior: 'instant' });
}
window.addEventListener('hashchange', route);
route();
const checks = document.getElementById('checks');
const output = document.getElementById('cost');
const note = document.getElementById('cost-note');
function calculate() {
  const number = checks.valueAsNumber;
  if (!Number.isFinite(number) || !Number.isInteger(number) || number < 0 || number > 1000000) {
    output.textContent = 'Enter a valid number';
    note.textContent = 'Use a whole number between 0 and 1,000,000.';
    checks.setAttribute('aria-invalid', 'true');
    return;
  }
  checks.removeAttribute('aria-invalid');
  const cents = Math.max(0, number - 500) * 33;
  output.textContent = (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';
  note.textContent = 'Assuming the full free allowance is available for each check.';
}
checks.addEventListener('input', calculate);
calculate();

const yearSlider = document.getElementById('supply-year');
const point = year => ({x: 20 + year / 60 * 560, y: 215 - (5 * 18 ** (year / 60)) / 90 * 195});
const points = Array.from({length: 121}, (_, i) => point(i / 2));
const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
document.getElementById('supply-line').setAttribute('d', line);
document.getElementById('supply-area').setAttribute('d', `${line} L580 215 L20 215 Z`);
function exploreSupply() {
  const year = Number(yearSlider.value);
  const supply = (5 * 18 ** (year / 60));
  const selected = point(year);
  document.getElementById('supply-value').textContent = `${supply.toFixed(2)}M`;
  document.getElementById('year-value').textContent = year;
  document.getElementById('slider-year').textContent = year;
  document.getElementById('supply-marker').setAttribute('cx', selected.x.toFixed(2));
  document.getElementById('supply-marker').setAttribute('cy', selected.y.toFixed(2));
  yearSlider.setAttribute('aria-valuetext', `Year ${year}: ${supply.toFixed(2)} million HELI, conditional no-burn ceiling`);
}
yearSlider.addEventListener('input', exploreSupply);
exploreSupply();

const allocationDetails = {
  human: { kicker: 'MONTHLY MARKET SUPPLY', title: 'Market Release Reserve', amount: '70M', share: '77.78%', copy: 'This locked reserve releases tokens into sale inventory after each month ends. Only the separate initial 1 million allocation is free; buyers purchase these monthly tokens on the market.', rule: 'The monthly cap is approximately 0.402247% of released, unburned supply, starting from a 5 million base. First cap: about 20,112 HELI. Management shares the same cap. Unsold inventory waits for buyers, with no monthly burn.' },
  treasury: { kicker: 'SALES & LIQUIDITY', title: 'Management Treasury', amount: '15M', share: '16.67%', copy: 'One manager can sell released treasury tokens and place funded buy and sell orders to provide liquidity. Sale proceeds remain in the project reserve.', rule: 'New treasury releases are locked for the first 12 months. Sales and new liquidity inventory then share one capped release budget.' },
  market: { kicker: 'INITIAL MARKET INVENTORY', title: 'Initial market', amount: '4M', share: '4.44%', copy: 'Allocated to market purchases at launch. Funded auction bids establish the opening price; matching buy and sell orders determine subsequent prices.', rule: 'There is no HELI purchase limit per buyer. Unsold inventory waits for buyers; an allocation does not mean it has already been sold.' },
  free: { kicker: 'EQUAL INITIAL ENTITLEMENT', title: 'Initial free allocation', amount: '1M', share: '1.11%', copy: 'Up to 1,000 verified people can each receive 1,000 HELI once. This is the only free token allocation; monthly market releases are sold to buyers.', rule: 'After six months, unassigned tokens move to sale inventory to await buyers. Earned but unclaimed entitlements remain protected.' }
};
function selectAllocation(key) {
  const item = allocationDetails[key];
  if (!item) return;
  for (const control of document.querySelectorAll('[data-allocation]')) control.setAttribute('aria-pressed', String(control.dataset.allocation === key));
  for (const field of ['kicker', 'title', 'amount', 'share', 'copy', 'rule']) document.getElementById(`allocation-detail-${field}`).textContent = item[field];
  document.getElementById('treasury-composition').hidden = key !== 'treasury';
}
for (const control of document.querySelectorAll('[data-allocation]')) {
  control.addEventListener('click', () => selectAllocation(control.dataset.allocation));
  if (control.tagName.toLowerCase() === 'g') control.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectAllocation(control.dataset.allocation); }
  });
}

````

## FILE: heli/website/apply.html

````text
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Start your application · HELI</title><link rel="icon" href="favicon.svg"><link rel="stylesheet" href="style.css"></head><body><header class="site-header"><a class="brand" href="/"><span class="brand-icon">H</span>HELI</a><nav><a href="/#allocation">Allocation rules</a></nav></header><main id="content"><section class="section-space" aria-labelledby="apply-title"><p class="eyebrow">OFFICIAL HELI APPLICATION ENTRY</p><h1 id="apply-title">Start with your wallet.</h1><p class="lede">This is the identity pilot for HELI's initial free allocation. It does not distribute tokens yet.</p><article class="panel application-card"><h2>Wallet → identity → application result</h2><ol class="steps"><li><span>01</span><div><h3>Connect your wallet</h3><p>Connect Phantom and sign a wallet ownership message. No SOL payment is requested.</p></div></li><li><span>02</span><div><h3>Complete identity verification</h3><p>Use Didit's document and face checks. On a phone, move to Safari or Chrome using your private application link if the wallet browser cannot use your camera.</p></div></li><li><span>03</span><div><h3>See your result</h3><p>Return to the application and press Refresh status. Approved, declined, pending and review results are displayed clearly.</p></div></li></ol><div class="claim-unavailable"><div><strong>Temporary test service · No token delivery</strong><p>The pilot currently runs on a project computer. It can be offline when that computer or its temporary connection stops. Permanent application hosting is still pending.</p></div></div><a class="button primary" href="https://practical-wallet-magnet-months.trycloudflare.com/" rel="noreferrer">Continue to identity pilot →</a><p class="small">Only continue if you intend to test identity verification. Never share your wallet recovery phrase or private application link. Completing this pilot does not grant or send HELI.</p><a class="text-link" href="/#allocation">Back to HELI allocation rules →</a></article></section></main></body></html>
````

## FILE: heli/website/index.html

````text
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="HELI is an experimental monetary system on Solana, with open supply rules and an equal initial free allocation. Explore its design and pilot status.">
  <meta name="theme-color" content="#080d12"><title>HELI · How should money begin?</title>
  <link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="style.css"><script src="app.js" defer></script>
</head>
<body>
<a class="skip" href="#content">Skip to content</a>
<header class="site-header"><a class="brand" href="#home" aria-label="HELI home"><span class="brand-icon" aria-hidden="true">H</span>HELI<span class="brand-sub">MONETARY EXPERIMENT</span></a><nav aria-label="Main navigation"><a href="#home" data-nav="home">About HELI</a><a href="#allocation" data-nav="allocation" class="nav-claim">Claim HELI <span aria-hidden="true">↗</span></a><a href="#transparency" data-nav="transparency">Transparency</a></nav></header>
<main id="content">
<section data-page="home" id="home" class="page">
  <div class="hero">
    <div class="hero-copy"><p class="eyebrow"><span class="status-dot"></span> A MONETARY EXPERIMENT ON SOLANA</p><h1>How should<br><span>money begin?</span></h1><p class="lede">HELI starts with a simple idea: give people an equal first share, then let new supply enter under rules everyone can inspect. A monetary experiment on Solana, built to be tested in public.</p><div class="actions"><a class="button primary" href="#allocation">Explore your free share <span aria-hidden="true">↗</span></a><a class="text-link" href="#transparency">Read the constitution <span aria-hidden="true">→</span></a></div><p class="hero-status"><span class="status-dot"></span> In development · Trading and distribution are not live</p></div>
    <div class="orbit-art" aria-hidden="true"><div class="orbital-halo"></div><div class="orbit orbit-a"></div><div class="orbit orbit-b"></div><div class="orbit orbit-c"></div><div class="token-disc"><svg viewBox="0 0 200 200"><path d="M58 48h22v41h40V48h22v104h-22v-41H80v41H58z" fill="currentColor"/></svg></div><span class="orbit-label top-label">HELI / OPEN MONETARY RULES</span><span class="orbit-label bottom-label">A STARTING SHARE. AN OPEN MARKET.</span><span class="spark spark-one"></span><span class="spark spark-two"></span></div>
  </div>
  <section class="claim-callout" aria-labelledby="claim-callout-title"><div class="claim-icon" aria-hidden="true">H</div><div class="claim-callout-copy"><p class="eyebrow">INITIAL FREE ALLOCATION</p><h2 id="claim-callout-title">Your first 1,000 HELI.</h2><p>1 million HELI reserved for up to 1,000 verified people. One equal share per person.</p><span class="claim-status">Identity pilot available · Token delivery closed</span></div><a class="button primary" href="apply.html">Start application test <span aria-hidden="true">→</span></a></section>
  <div class="hero-metrics" aria-label="Planned design parameters"><div><span>Maximum supply after initial burn</span><strong>90M <small>HELI</small></strong></div><div><span>Initial release base</span><strong>5M <small>HELI</small></strong></div><div><span>Conditional release horizon</span><strong>60 <small>years</small></strong></div><p>Design parameters, not live network balances.</p></div>
  <section class="story section-space" id="story"><div><p class="eyebrow">WHY HELI EXISTS</p><h2>A different starting<br>point for money.</h2></div><div class="story-copy"><p class="large-copy">An equal first share. A supply rule for what comes next.</p><p>HELI brings the idea of helicopter money to a small Solana experiment: 1 million tokens reserved for an equal, one-time free allocation. Another 4 million form the initial market inventory. The question is whether a community can build an economy around that starting point.</p><p>Later supply comes from a 70 million token reserve, released into sale inventory within a published monthly cap. Those tokens are sold, not given away. HELI does not yet have an established payment network; testing real demand and use is part of the experiment.</p><a class="text-link" href="#allocation">How the initial allocation works <span aria-hidden="true">→</span></a></div></section>
  <section class="mechanism section-space"><div class="section-heading"><div><p class="eyebrow">THE SYSTEM, IN FOUR PARTS</p><h2>The idea, made concrete.</h2></div><p class="section-aside">A limited supply is only the beginning.<br>How it enters circulation matters.</p></div><div class="mechanism-grid"><article><span class="number">01 / DISTRIBUTION</span><div class="mechanism-symbol" aria-hidden="true">◉ <span>◉</span> ◉</div><h3>An equal starting share</h3><p>One million HELI is reserved for up to 1,000 verified people: 1,000 HELI each. Four million HELI is allocated to market purchases.</p><a href="#allocation" class="text-link">Explore distribution →</a></article><article><span class="number">02 / MONETARY RULE</span><div class="mechanism-symbol rule-symbol" aria-hidden="true">0.402247<small>%</small></div><h3>A rule for new releases</h3><p>Monthly release capacity follows the amount already released and not burned. The initial base is 5 million HELI. Management permissions share this cap and expire each month.</p><a href="#supply-path" class="text-link">Explore the release path →</a></article><article><span class="number">03 / MONTHLY MARKET SUPPLY</span><div class="mechanism-symbol" aria-hidden="true">↙ <span>↓</span> ↘</div><h3>Supply opens over time</h3><p>A 70 million HELI reserve releases sale inventory at monthly boundaries, starting after the first month. It follows the shared supply cap; it is not a free dividend.</p><a href="#transparency" class="text-link">Read the release rules →</a></article><article><span class="number">04 / PRICE DISCOVERY</span><div class="mechanism-symbol" aria-hidden="true">↗ <span>↘</span></div><h3>The market sets the price</h3><p>An opening auction establishes the first traded price. After launch, buy and sell orders determine what people pay.</p><a href="#market-design" class="text-link">Read the market design →</a></article></div></section>
  <section class="distribution-section section-space"><div><p class="eyebrow">THE FIRST 5 MILLION</p><h2>One launch.<br>Two ways to participate.</h2><p class="section-description">An equal free allocation and an open market. Neither changes the total initial allocation.</p><a href="#allocation" class="text-link">See eligibility and timing →</a></div><div class="distribution-visual"><div class="distribution-bar" role="img" aria-label="20 percent of the initial five million HELI for free allocation and 80 percent for market purchases"><span class="free-segment">20%</span><span class="market-segment">80%</span></div><article><span class="allocation-dot free-dot"></span><div><h3>Initial free allocation</h3><p>Up to 1,000 people · 1,000 HELI each</p></div><strong>1M</strong></article><article><span class="allocation-dot market-dot"></span><div><h3>Market allocation</h3><p>No purchase limit per buyer</p></div><strong>4M</strong></article><p class="small">Unassigned free tokens move to sale inventory after the initial six-month period. They wait for buyers; they are not burned. Earned but unclaimed allocations stay protected.</p></div></section>
  <section class="allocation-map section-space" id="token-allocation" aria-labelledby="allocation-map-title">
    <div class="section-heading"><div><p class="eyebrow">WHERE EVERY HELI BELONGS</p><h2 id="allocation-map-title">90 million.<br>Four destinations.</h2></div><p class="section-aside">Bubble area represents each allocation.<br>Select a bubble to explore its purpose.</p></div>
    <div class="allocation-map-layout">
      <div class="allocation-map-visual">
        <svg class="allocation-bubbles" viewBox="0 0 900 590" aria-labelledby="bubbles-title bubbles-description">
          <title id="bubbles-title">Planned HELI allocation after the initial burn</title><desc id="bubbles-description">Market Release Reserve: 70 million, 77.78 percent. Management Treasury: 15 million, 16.67 percent. Initial market: 4 million, 4.44 percent. Initial free allocation: 1 million, 1.11 percent. Circle areas are proportional to amounts. These are planned allocations, not live balances.</desc>
          <defs><radialGradient id="bubble-human" cx="30%" cy="25%" r="85%"><stop offset="0" stop-color="#b7f9dd"/><stop offset="1" stop-color="#467e69"/></radialGradient><radialGradient id="bubble-treasury" cx="30%" cy="25%" r="85%"><stop offset="0" stop-color="#b2c5f6"/><stop offset="1" stop-color="#505a97"/></radialGradient><radialGradient id="bubble-market" cx="30%" cy="25%" r="85%"><stop offset="0" stop-color="#efcf97"/><stop offset="1" stop-color="#9e794a"/></radialGradient><radialGradient id="bubble-free" cx="30%" cy="25%" r="85%"><stop offset="0" stop-color="#eec6e2"/><stop offset="1" stop-color="#a47198"/></radialGradient></defs>
          <g class="allocation-bubble" data-allocation="human" role="button" tabindex="0" aria-label="Market Release Reserve, 70 million HELI, 77.78 percent" aria-pressed="false"><circle cx="250" cy="295" r="240" fill="url(#bubble-human)"/><text x="250" y="259" class="bubble-name">Market release reserve</text><text x="250" y="330" class="bubble-amount large">70M</text><text x="250" y="370" class="bubble-percent">77.78%</text></g>
          <g class="allocation-bubble" data-allocation="treasury" role="button" tabindex="0" aria-label="Management Treasury, 15 million HELI, 16.67 percent" aria-pressed="true"><circle cx="686" cy="216" r="111.0984" fill="url(#bubble-treasury)"/><text x="686" y="174" class="bubble-name medium">Management</text><text x="686" y="195" class="bubble-name medium">Treasury</text><text x="686" y="246" class="bubble-amount">15M</text><text x="686" y="274" class="bubble-percent medium">16.67%</text></g>
          <g class="allocation-bubble" data-allocation="market" role="button" tabindex="0" aria-label="Initial market, 4 million HELI, 4.44 percent" aria-pressed="false"><circle cx="617" cy="432" r="57.3710" fill="url(#bubble-market)"/><text x="617" y="438" class="bubble-amount small">4M</text><text x="617" y="458" class="bubble-percent small">4.44%</text></g>
          <g class="allocation-bubble" data-allocation="free" role="button" tabindex="0" aria-label="Initial free allocation, 1 million HELI, 1.11 percent" aria-pressed="false"><circle cx="787" cy="448" r="28.6855" fill="url(#bubble-free)"/><text x="787" y="454" class="bubble-amount tiny">1M</text></g>
        </svg>
        <div class="allocation-legend" aria-label="Select an allocation"><button data-allocation="human" aria-pressed="false"><i class="human-swatch" aria-hidden="true"></i>Market release reserve <span>70M</span></button><button data-allocation="treasury" aria-pressed="true"><i class="treasury-swatch" aria-hidden="true"></i>Management Treasury <span>15M</span></button><button data-allocation="market" aria-pressed="false"><i class="market-swatch" aria-hidden="true"></i>Initial market <span>4M</span></button><button data-allocation="free" aria-pressed="false"><i class="free-swatch" aria-hidden="true"></i>Initial free allocation <span>1M</span></button></div>
      </div>
      <aside class="allocation-detail" aria-live="polite" aria-atomic="true">
        <p class="eyebrow" id="allocation-detail-kicker">SALES &amp; LIQUIDITY</p><h3 id="allocation-detail-title">Management Treasury</h3><div class="allocation-detail-number"><strong id="allocation-detail-amount">15M</strong><span>HELI · <span id="allocation-detail-share">16.67%</span> of 90M</span></div><p id="allocation-detail-copy">One manager can sell released treasury tokens and place funded buy and sell orders to provide liquidity. Sale proceeds remain in the project reserve.</p>
        <div class="treasury-composition" id="treasury-composition"><span class="number">HOW THE 15M WAS COMBINED</span><div><span><b>5M</b>Former founder</span><span><b>5M</b>Former liquidity</span><span><b>5M</b>Former staking</span></div><p>These are parts of the same 15M allocation, not additional tokens.</p></div>
        <p class="allocation-detail-rule" id="allocation-detail-rule">New treasury releases are locked for the first 12 months. Sales and new liquidity inventory then share one capped release budget.</p>
      </aside>
    </div>
    <p class="allocation-map-footnote">100M initial mint − 10M initial burn = 90M planned supply. Vault allocations are not all circulating at launch. Staking is cancelled; there is no separate staking or liquidity allocation. These figures are design parameters, not live wallet balances.</p>
  </section>
  <section class="supply-section section-space" id="supply-path"><div class="section-heading"><div><p class="eyebrow">A RULE YOU CAN EXPLORE</p><h2>A 60-year horizon.<br>No unlimited minting.</h2></div><p class="section-aside">More time permits more supply.<br>It does not guarantee more demand.</p></div><div class="supply-layout"><div class="supply-explainer"><p>The plan starts with 100 million minted HELI and an immediate 10 million burn. The remaining 90 million is divided between initial circulation and locked vaults.</p><p>The shared monthly release ceiling is approximately <strong>0.402247%</strong> of HELI already released and not burned. With the initial 5 million base, the first cap is about 20,112 HELI. The 70 million reserve funds sale inventory within this cap; it is not the percentage calculation base. Burns reduce future capacity.</p><div class="formula">MONTHLY CAP <span>= released, unburned HELI × 0.402247%</span></div><p class="small">The illustrated path assumes every monthly allowance is fully used and no further HELI is burned. This is a conditional ceiling, not a price forecast or guaranteed release schedule.</p></div><div class="supply-tool"><div class="chart-top"><span>Illustrative no-burn ceiling</span><span class="pill neutral">Design model</span></div><div class="chart-value"><output id="supply-value" for="supply-year">90.00M</output><span>HELI at year <output id="year-value" for="supply-year">60</output></span></div><svg id="supply-chart" viewBox="0 0 600 230" role="img" aria-labelledby="chart-title chart-desc"><title id="chart-title">HELI illustrative supply ceiling</title><desc id="chart-desc">The conditional ceiling grows from 5 million to 90 million over 60 years if every monthly allowance is used and no further HELI is burned.</desc><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a3edcf" stop-opacity=".32"/><stop offset="100%" stop-color="#a3edcf" stop-opacity="0"/></linearGradient></defs><path class="chart-grid" d="M20 20H580 M20 85H580 M20 150H580 M20 215H580"/><path id="supply-area" fill="url(#chart-fill)"/><path id="supply-line" fill="none" stroke="#a3edcf" stroke-width="3"/><circle id="supply-marker" r="6" fill="#e5fff2" stroke="#101b20" stroke-width="3"/></svg><div class="chart-axis"><span>Launch · 5M</span><span>Year 60 · 90M</span></div><label for="supply-year">Explore a year <span id="slider-year">60</span></label><input id="supply-year" type="range" min="0" max="60" step="1" value="60"><p class="small">Calculated from 5M × 18<sup>year / 60</sup>. Actual releases can be lower.</p></div></div></section>
  <section class="market-section section-space" id="market-design"><div class="market-heading"><p class="eyebrow">PRICE DISCOVERY</p><h2>From the opening auction<br>to an open market.</h2><p class="section-description">HELI's value will come from the prices participants agree to trade at. The supply rule does not set or stabilize the token's price.</p></div><div class="market-flow"><article><span class="number">BEFORE OPENING</span><h3>Submit bids</h3><p>The opening minimum price and auction parameters are announced in advance. Buyers submit funded bids.</p></article><span class="flow-arrow" aria-hidden="true">→</span><article><span class="number">AT OPENING</span><h3>Discover a clearing price</h3><p>Accepted bids determine the auction price and allocations. Unused bid funds are available for refund.</p></article><span class="flow-arrow" aria-hidden="true">→</span><article><span class="number">AFTER OPENING</span><h3>Buy, sell, hold</h3><p>Trading moves to the planned Solana order book. Matching buy and sell orders determine market prices.</p></article></div><div class="market-note"><span class="status-dot"></span><p>Market integration is being tested. The quote asset, dates and live addresses will be published when confirmed.</p></div></section>
  <section class="guardrails section-space"><div><p class="eyebrow">BUILT INTO THE DESIGN</p><h2>Restrictions where<br>they matter.</h2><p class="section-description">Free allocation rules protect the starting share. Vault rules govern later supply.</p></div><div class="guardrail-list"><article><span>01</span><div><h3>One person, one initial entitlement</h3><p>Document and liveness checks are intended to make repeat claims difficult. Separate family members can participate in their own right.</p></div></article><article><span>02</span><div><h3>Management releases are constrained</h3><p>The 15 million HELI Management Treasury has one manager. New treasury releases remain locked for 12 months and later share one capped budget for sales and liquidity.</p></div></article><article><span>03</span><div><h3>Project revenue stays with the project</h3><p>Staking is cancelled. Its former allocation and the former market-support inventory are combined in the Management Treasury. Treasury sales return the quote asset to the project reserve.</p></div></article></div></section>
  <section class="progress-section section-space"><div class="section-heading"><div><p class="eyebrow">PROGRESS, IN THE OPEN</p><h2>See what is ready.<br>See what comes next.</h2></div><a href="#transparency" class="button secondary">View transparency →</a></div><div class="progress-grid"><article><span class="pill">Locally tested</span><h3>Solana program</h3><p>The experimental program has run in a local Solana simulator. Devnet and mainnet deployment are pending.</p></article><article><span class="pill">Pilot tested</span><h3>Identity verification</h3><p>A real first application was accepted. A repeat application was flagged for review. Further acceptance tests remain.</p></article><article><span class="pill neutral">Next milestone</span><h3>Connected public pilot</h3><p>Bring the wallet, identity result, sponsored transaction and token claim together, then test on Devnet.</p></article></div><p class="small">Status as of October 2, 2026. No live token address, market price, reserves or independent audit are claimed.</p></section>
  <section class="closing"><p class="eyebrow">HELP SHAPE THE EXPERIMENT</p><h2>A small beginning.<br>An open question.</h2><p>Can an equal first share and a predictable supply rule support a useful monetary community? Explore the design, challenge the assumptions and follow the development.</p><div class="actions"><a class="button primary" href="#transparency">Explore the constitution ↗</a><a class="button secondary" href="https://github.com/patrickgt966-art/heli-experiment" target="_blank" rel="noopener noreferrer">Follow on GitHub ↗</a></div><p class="small">HELI is an experimental monetary project. Its price may fall, and liquidity or operating revenue is not guaranteed.</p></section>
</section>
<section data-page="allocation" id="allocation" class="page" hidden>
  <div class="claim-page-heading"><div><p class="eyebrow">THE INITIAL HELI DISTRIBUTION</p><h1>Your first share.<br><span>One person. One claim.</span></h1><p class="lede">The first 1 million HELI is reserved for an equal, one-time free allocation. Complete identity verification on your phone when applications open.</p></div><div class="claim-amount-card"><span>PLANNED SHARE PER PERSON</span><strong>1,000 <small>HELI</small></strong><p>Up to 1,000 verified participants</p><span class="claim-status">Identity pilot available · Token delivery closed</span></div></div>
  <div class="claim-summary" aria-label="Allocation terms"><div><span>Free allocation pool</span><strong>1,000,000 HELI</strong></div><div><span>Entitlement</span><strong>Once per person</strong></div><div><span>After valid registration</span><strong>7-day waiting period</strong></div></div>
  <div class="application-layout"><article class="panel application-card"><div class="application-heading"><div><p class="eyebrow">VERIFICATION &amp; CLAIM</p><h2>Everything from your phone.</h2></div><span class="pill neutral">Identity pilot</span></div><p>This is the official place to find HELI's free-allocation application. Start the wallet and identity pilot from this page. Public token distribution will open only after the complete delivery flow is ready.</p><ol class="steps"><li><span>01</span><div><h3>Connect your Solana wallet</h3><p>Your own wallet will receive the allocation. Never share its recovery phrase or private key.</p></div></li><li><span>02</span><div><h3>Verify your identity</h3><p>Complete Didit's document and face liveness checks on your phone. Document images are handled by the verification provider, not collected by this static website.</p></div></li><li><span>03</span><div><h3>Receive an application decision</h3><p>Only an accepted, unique-person registration can establish an entitlement. A review warning does not automatically approve a claim.</p></div></li><li><span>04</span><div><h3>Claim 1,000 HELI</h3><p>After the planned seven-day waiting period for a valid registration, approve delivery to your wallet.</p></div></li></ol><div class="claim-unavailable"><span class="status-dot"></span><div><strong>Identity testing is available. Token claims are closed.</strong><p>The application test connects your wallet to Didit and displays its result. Registration and coin delivery are not enabled.</p></div></div><a class="button primary" href="apply.html">Start application test <span aria-hidden="true">→</span></a><p class="small application-privacy">Continue through the HELI application page. Identity capture takes place in Didit; HELI never asks for your wallet recovery phrase.</p></article><aside><article class="panel eligibility-card"><p class="eyebrow">BEFORE YOU START</p><h2>A share for each person.</h2><ul><li>One free entitlement per verified person.</li><li>Separate family members can apply in their own right.</li><li>Buying HELI does not require applying for this free share; trading service terms still apply.</li><li>Only this initial pool is free. Monthly releases are sale inventory.</li></ul><a class="text-link" href="#transparency">Read the allocation rules →</a></article><article class="panel result-card"><p class="eyebrow">IDENTITY PILOT</p><h3>Tested with one person.</h3><dl><div><dt>First passport application</dt><dd>Approved</dd></div><div><dt>Repeat application</dt><dd>In Review</dd></div></dl><p>The repeat produced possible duplicate-person and duplicate-face warnings. Different-document and separate-family-member tests remain.</p><p class="small">A pilot result does not establish protection against every attack.</p></article></aside></div>
  <section class="faq"><h2>Before applying</h2><details><summary>Will unallocated initial HELI be burned?</summary><p>No. At the end of the first six-month period, tokens not reserved for anyone will move into sale inventory to await buyers. Earned but unclaimed entitlements will remain protected. Monthly released sale inventory also waits for buyers; it is not burned for being unsold.</p></details><details><summary>Is identity verification required to buy HELI?</summary><p>In HELI's design, identity verification is for the free entitlement. Market purchases do not require registration for HELI's free allocation. The trading service's own terms still apply.</p></details><details><summary>Are monthly releases free distributions?</summary><p>No. Only the initial 1 million HELI is reserved for free distribution. The separate 70 million HELI reserve releases tokens into sale inventory each month, within the shared supply cap. Buyers purchase those tokens on the market.</p></details></section>
</section>
<section data-page="transparency" id="transparency" class="page" hidden>
  <div class="page-intro"><p class="eyebrow">TRANSPARENCY</p><h1>Read the rules.<br><span>Assess the progress.</span></h1><p class="lede">Planned allocations are shown separately from values actually measured on a live network.</p></div>
  <div class="transparency-grid"><article class="panel"><div class="section-heading"><h2>Planned supply</h2><span class="pill neutral">Design</span></div><table><caption class="sr-only">HELI allocations after the initial burn</caption><thead><tr><th scope="col">Allocation</th><th scope="col">HELI</th></tr></thead><tbody><tr><td>Initial free allocation</td><td>1,000,000</td></tr><tr><td>Initial market inventory</td><td>4,000,000</td></tr><tr><td>Monthly Market Release Reserve</td><td>70,000,000</td></tr><tr><td>HELI Management Treasury</td><td>15,000,000</td></tr></tbody><tfoot><tr><th scope="row">Maximum supply</th><td>90,000,000</td></tr></tfoot></table><p class="small">HELI held in a vault is neither sold inventory nor cash revenue.</p><a class="text-link" href="#token-allocation">Explore the allocation bubbles →</a></article><article class="panel"><h2>Live network details</h2><dl class="network-list"><div><dt>Official token address</dt><dd>Not published yet</dd></div><div><dt>Live market address</dt><dd>Not available yet</dd></div><div><dt>Opening minimum price</dt><dd>Not finalized</dd></div><div><dt>Reserve / operating balances</dt><dd>No live measurement</dd></div><div><dt>Independent security review</dt><dd>Pending</dd></div></dl><p class="note">The HELI program has been tested in a local Solana simulator. Local test results are not a Devnet or mainnet deployment.</p><a class="text-link" href="https://github.com/patrickgt966-art/heli-experiment" target="_blank" rel="noopener noreferrer">Read the project introduction on GitHub</a></article></div>
  <section class="panel rules"><h2>The monetary constitution: core rules</h2><div class="rules-grid"><article><h3>Monthly releases</h3><p>The shared cap is calculated from HELI already released and not burned. The monthly cap follows the original 60-year monetary rule. All remaining allocations can participate within their release rules, restoring a 90 million conditional ceiling. Staking has no separate allocation.</p></article><article><h3>Monthly market supply</h3><p>The 70 million HELI reserve releases tokens into sale inventory after each month ends, starting with month one. The rate applies to supply already released and not burned, beginning from 5 million. No monthly free entitlement or participant-count formula applies. Unsold released inventory waits for buyers; it is not burned each month.</p></article><article><h3>Management restrictions</h3><p>No new Management Treasury releases during the first 12 months. Afterward, sales and new liquidity inventory share at most 20% of monthly capacity, further limited to one quarter of actual releases outside the treasury. Market checks still apply.</p></article><article><h3>Sales, liquidity and project reserves</h3><p>The Management Treasury combines the original founder, market-support and former staking allocations: 15 million HELI in total. One manager can direct sales and funded buy/sell orders on the same market. Sale revenue stays in the project reserve; buying HELI requires actual quote funds. Returning or cancelling an order does not create a new release allowance.</p><p class="small">The V20 program passed 1,606 local checks and transactions, including the complete 720-month release calendar. It is not deployed, live liquidity, guaranteed buybacks or a guaranteed token price.</p></article></div><a class="button secondary" href="heli-rules.txt" download>Download the experiment rules</a></section>
  <section class="panel cost-panel"><div><p class="eyebrow">WEBSITE AND IDENTITY COSTS</p><h2>Start small.</h2><p>The static website can start on free hosting. A custom domain is optional. Identity checks incur usage charges after free allowances are exhausted.</p><p class="small">This estimate covers four Didit checks only. Solana account deposits, transaction fees, servers, databases and maintenance are excluded.</p></div><div class="calculator"><label for="checks">Complete identity attempts per month</label><input type="number" id="checks" min="0" max="1000000" step="1" value="500" inputmode="numeric"><output id="cost" for="checks" aria-live="polite">0.00 USD</output><p id="cost-note">Assuming the full free allowance is available for each check.</p><p class="small">First 500 checks per feature free; afterward, the four checks total $0.33 per complete attempt. Retries also count. This website does not read the account's remaining allowance.</p><a class="text-link" href="https://help.didit.me/getting-started/free-plan" target="_blank" rel="noopener noreferrer">Didit's current pricing terms</a></div></section>
  <section class="faq"><h2>What remains to be completed</h2><details open><summary>What is needed before live free distribution?</summary><p>Bind Didit results to the correct wallet, enforce one entitlement per person, test application and delivery on a phone using Devnet, fund transaction sponsorship, finalize retention and appeal policies, and complete an independent code review.</p></details><details><summary>If hosting is free, is the whole system free?</summary><p>No. On-chain transactions and accounts require SOL. Free hosting and identity allowances have limits. Demand or sale proceeds are not guaranteed to cover operating costs.</p></details></section>
</section>
</main>
<footer><div><a class="brand" href="#home"><span class="brand-icon" aria-hidden="true">H</span>HELI</a><p>A monetary experiment on Solana.<br>How should money begin?</p></div><div class="footer-links"><a href="#home">About HELI</a><a href="#allocation">Claim HELI</a><a href="#transparency">Transparency</a><a href="heli-rules.txt" download>Experiment rules ↓</a><a href="https://github.com/patrickgt966-art/heli-experiment" target="_blank" rel="noopener noreferrer">GitHub ↗</a></div><div class="footer-bottom"><span>© 2026 HELI Experiment</span><span>Development stage · No live distribution or trading</span></div></footer>
</body></html>

````

## FILE: heli/website/server.mjs

````text
import http from 'node:http';
import { readFile } from 'node:fs/promises';
const allowed = new Map([['/','index.html'],['/index.html','index.html'],['/apply.html','apply.html'],['/style.css','style.css'],['/app.js','app.js'],['/favicon.svg','favicon.svg'],['/heli-rules.txt','heli-rules.txt']]);
const types = { html:'text/html; charset=utf-8', css:'text/css; charset=utf-8', js:'text/javascript; charset=utf-8', svg:'image/svg+xml', txt:'text/plain; charset=utf-8' };
const server = http.createServer(async (req,res) => {
  const file = allowed.get(new URL(req.url,'http://127.0.0.1').pathname);
  if (!file || !['GET','HEAD'].includes(req.method)) { res.writeHead(404); res.end('Not found'); return; }
  try {
    const bytes = await readFile(new URL(file,import.meta.url));
    res.writeHead(200,{'Content-Type':types[file.split('.').pop()],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"});
    res.end(req.method==='HEAD'?undefined:bytes);
  } catch { res.writeHead(500); res.end('Unavailable'); }
});
server.listen(8780,'127.0.0.1',()=>console.log('HELI site preview: http://127.0.0.1:8780/'));

````

## FILE: heli/website/style.css

````text
:root{color-scheme:dark;--navy:#e5edf4;--muted:#95a5b3;--lime:#a3edcf;--border:#ffffff16;--paper:#080d12;--surface:#10181f;--mint:#a3edcf}*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:110px}body{margin:0;background:var(--paper);color:var(--navy);font-family:"Segoe UI",Arial,sans-serif;font-size:16px;line-height:1.65;-webkit-font-smoothing:antialiased}a{color:inherit;text-underline-offset:5px}button,input{font:inherit}a,button,input,summary{outline-offset:5px}a:focus-visible,button:focus-visible,input:focus-visible,summary:focus-visible{outline:2px solid var(--mint)}p{margin:0 0 20px}h1,h2,h3{font-weight:500;line-height:1.12;margin:0;letter-spacing:-.055em}h2{font-size:clamp(34px,4.1vw,54px);margin-bottom:22px}h3{font-size:22px;letter-spacing:-.035em;margin-bottom:14px}.eyebrow{font-size:11px;font-weight:650;letter-spacing:2px;color:var(--mint);margin-bottom:22px}.small{font-size:13px;color:var(--muted);line-height:1.65}.site-header{position:relative;z-index:5;max-width:1180px;margin:24px auto 0;display:flex;align-items:center;justify-content:space-between;gap:24px;border:1px solid #ffffff1d;background:linear-gradient(150deg,#1c2731d9,#0a1119e6);border-radius:50px;padding:14px 24px;box-shadow:inset 0 1px #ffffff0c}.brand{display:inline-flex;align-items:center;gap:10px;text-decoration:none;font-size:25px;font-weight:750;letter-spacing:-1px}.brand-icon{height:34px;width:34px;border:1px solid #a3edcf5c;background:linear-gradient(140deg,#a3edcf1c,#a3edcf04);color:var(--mint);display:grid;place-items:center;border-radius:50%;font-size:22px;font-weight:500}.brand-sub{font-size:9px;letter-spacing:1.5px;color:var(--muted);margin-left:12px;font-weight:600}nav{display:flex;gap:28px;align-items:center}nav a{font-size:14px;color:var(--muted);text-decoration:none;font-weight:550;padding:8px 0;white-space:nowrap}nav a[aria-current=page],nav a:hover{color:#e9fff5}nav a:last-child{border:1px solid #ffffff20;border-radius:30px;padding:9px 17px;background:#ffffff05}main{max-width:1260px;padding:0 40px;margin:auto}.page[hidden]{display:none}.page{padding:36px 0 90px}.hero{display:grid;grid-template-columns:1.2fr 1fr;min-height:535px;align-items:center;gap:24px;padding-top:15px}.hero-copy{position:relative;z-index:2}.hero h1{font-size:clamp(44px,5.2vw,72px);letter-spacing:-.065em;line-height:1.08;margin-bottom:28px;white-space:nowrap}.hero h1 span{color:var(--mint)}.lede{font-size:18px;color:#aebbc7;max-width:570px;line-height:1.75;margin-bottom:30px}.actions{display:flex;flex-wrap:wrap;align-items:center;gap:26px}.button{min-height:48px;padding:12px 24px;border-radius:32px;display:inline-flex;align-items:center;justify-content:center;gap:18px;font-size:14px;font-weight:600;text-decoration:none;border:1px solid transparent;transition:background .2s,transform .2s;cursor:pointer}.button:hover{transform:translateY(-2px)}.primary{background:var(--mint);color:#0b211a;border-color:#c7ffe7;box-shadow:0 0 35px #a3edcf0b}.primary:hover{background:#c7ffe7}.secondary{border-color:#ffffff2b;background:linear-gradient(145deg,#ffffff0d,#ffffff03);color:var(--navy)}.text-link{font-size:14px;font-weight:600;text-decoration:none;color:#c3dfd6}.text-link:hover{text-decoration:underline}.status-dot{display:inline-block;height:5px;width:5px;background:var(--mint);border-radius:50%;margin-right:10px;vertical-align:middle;box-shadow:0 0 14px #a3edcf55}.hero-status{font-size:12px;color:var(--muted);margin-top:24px}.orbit-art{position:relative;width:100%;aspect-ratio:1;display:grid;place-items:center;isolation:isolate}.orbital-halo{position:absolute;inset:-15%;background:radial-gradient(ellipse,#73cdaa20 0,#73cdaa08 34%,transparent 65%);z-index:-1}.token-disc{width:55%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 30% 22%,#a3edd021,#233b3580 35%,#101e1b 68%,#080e0c);border:1px solid #a3edcf65;box-shadow:inset 10px 10px 40px #d0ffeb0e,inset -15px -20px 30px #0008,0 0 60px #a3edcf14,12px 16px 0 -7px #0c1c17,13px 17px 0 -7px #56876f;transform:rotate(-18deg);display:grid;place-items:center}.token-disc svg{width:78%;color:#b3e8cf;filter:drop-shadow(2px 2px 1px #0f3b26)}.orbit{position:absolute;width:95%;height:52%;border:1px solid #a3edcf32;border-radius:50%;transform:rotate(-28deg);box-shadow:0 0 20px #a3edcf05}.orbit-b{transform:rotate(48deg);width:88%;height:70%;border-color:#a3edcf15}.orbit-c{transform:rotate(-28deg);width:108%;height:61%;border-style:dashed;border-color:#a3edcf13}.orbit-label{position:absolute;font-size:9px;letter-spacing:2px;color:#839d93}.top-label{top:8%;left:20%}.bottom-label{bottom:7%;right:12%}.spark{position:absolute;height:7px;width:7px;border-radius:50%;background:#d0ffea;box-shadow:0 0 22px #a3edcf}.spark-one{left:10%;top:56%}.spark-two{right:10%;top:41%;width:4px;height:4px}.hero-metrics{display:grid;grid-template-columns:repeat(3,1fr);padding:26px 0 0;border-top:1px solid var(--border);gap:20px;text-align:center}.hero-metrics>div{border-right:1px solid var(--border)}.hero-metrics>div:nth-child(3){border-right:0}.hero-metrics span{color:var(--muted);font-size:13px;display:block;margin-bottom:4px}.hero-metrics strong{font-size:39px;font-weight:450;letter-spacing:-1px}.hero-metrics small{font-size:17px;color:#9cb1be;font-weight:400;letter-spacing:0}.hero-metrics>p{grid-column:1/-1;color:#788b98;font-size:11px;letter-spacing:.3px;margin:0}.section-space{padding:92px 0;border-bottom:1px solid var(--border)}.story,.distribution-section,.guardrails{display:grid;grid-template-columns:1fr 1fr;gap:100px}.story-copy{color:var(--muted)}.large-copy{font-size:23px;line-height:1.5;letter-spacing:-.5px;color:var(--navy);margin-bottom:22px}.section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:32px;margin-bottom:36px}.section-heading h2{margin-bottom:0}.section-aside{font-size:14px;color:var(--muted);margin:0;max-width:340px}.mechanism-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.mechanism-grid article{padding:27px 23px;border:1px solid var(--border);border-radius:17px;background:linear-gradient(145deg,#15211f88,#0e151bcc);display:flex;flex-direction:column}.number{font-size:10px;letter-spacing:1.5px;font-weight:600;color:#8cab9d;display:block;margin-bottom:14px}.mechanism-symbol{height:85px;display:flex;align-items:center;justify-content:center;font-size:35px;letter-spacing:9px;color:var(--mint);font-weight:350}.mechanism-symbol span{color:#638e7b}.rule-symbol{font-size:29px;letter-spacing:-1.5px}.rule-symbol small{font-size:17px}.mechanism-grid h3{font-size:21px}.mechanism-grid p{font-size:14px;color:var(--muted);line-height:1.75;flex:1}.mechanism-grid a{font-size:12px}.section-description{color:var(--muted);max-width:450px}.distribution-section{gap:80px;align-items:center}.distribution-bar{height:70px;display:flex;gap:5px;margin-bottom:32px}.distribution-bar span{display:grid;place-items:center;font-size:22px;font-weight:600}.free-segment{width:20%;background:var(--mint);color:#133627;border-radius:8px 0 0 8px}.market-segment{width:80%;background:linear-gradient(120deg,#405868,#22303f);color:#b9cddb;border-radius:0 8px 8px 0}.distribution-visual article{display:flex;align-items:center;gap:15px;padding:18px 0;border-bottom:1px solid var(--border)}.distribution-visual h3{font-size:18px;margin-bottom:3px}.distribution-visual article p{margin:0;font-size:12px;color:var(--muted)}.distribution-visual strong{margin-left:auto;font-size:32px;font-weight:450}.allocation-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}.free-dot{background:var(--mint)}.market-dot{background:#658da6}.distribution-visual>.small{margin:22px 0 0}.supply-layout{display:grid;grid-template-columns:1fr 1.1fr;gap:80px;align-items:center}.supply-explainer{color:var(--muted)}.supply-explainer strong{color:var(--mint);font-weight:500}.formula{border-left:2px solid var(--mint);padding:10px 18px;font-size:10px;letter-spacing:1.7px;color:var(--mint);margin:28px 0}.formula span{display:block;font-size:16px;color:var(--navy);letter-spacing:0;margin-top:6px}.supply-tool{padding:28px;border:1px solid #a3edcf22;border-radius:20px;background:linear-gradient(140deg,#1628227d,#111b2260)}.chart-top{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;color:var(--muted)}.pill{display:inline-block;border-radius:30px;padding:4px 10px;color:#b9efcf;border:1px solid #a3edcf30;background:#a3edcf0d;font-size:11px;font-weight:500;white-space:nowrap}.neutral{color:#97aab9;border-color:#ffffff22;background:#ffffff06}.chart-value{margin:24px 0 12px}.chart-value>output{display:block;font-size:48px;line-height:1.25;font-weight:400;letter-spacing:-2px}.chart-value>span{font-size:12px;color:var(--muted)}#supply-chart{display:block;width:100%;height:auto}.chart-grid{stroke:#ffffff12;fill:none;stroke-width:1}.chart-axis{display:flex;justify-content:space-between;font-size:10px;color:#7b9497;padding:0 10px}.supply-tool label{font-size:12px;display:flex;justify-content:space-between;margin:24px 0 8px}.supply-tool label span{color:var(--mint)}input[type=range]{accent-color:var(--mint);width:100%;cursor:pointer;margin:0;min-height:28px}.supply-tool>.small{font-size:11px;margin:12px 0 0}.market-heading{text-align:center}.market-heading .section-description{max-width:650px;margin:0 auto 42px}.market-flow{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:25px;align-items:center}.market-flow article{min-height:215px;border-top:1px solid #a3edcf45;padding-top:25px}.market-flow h3{font-size:22px}.market-flow p{color:var(--muted);font-size:14px;margin-bottom:0}.flow-arrow{color:#638473;font-size:26px}.market-note{display:flex;gap:5px;align-items:baseline;justify-content:center;margin-top:38px;background:#ffffff03;border:1px solid var(--border);padding:16px 22px;border-radius:10px}.market-note p{font-size:12px;color:var(--muted);margin:0}.guardrail-list article{display:flex;gap:24px;border-top:1px solid var(--border);padding:22px 0}.guardrail-list article>span{font-size:11px;color:var(--mint);padding-top:5px}.guardrail-list h3{font-size:21px}.guardrail-list p{font-size:14px;color:var(--muted);margin:0}.progress-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:25px}.progress-grid article{border:1px solid var(--border);padding:28px;border-radius:16px;background:#101820}.progress-grid h3{margin-top:22px}.progress-grid p{font-size:14px;color:var(--muted);margin:0}.progress-section>.small{margin:24px 0 0}.closing{text-align:center;padding:90px 30px 20px;background:radial-gradient(ellipse at 50% 80%,#a3edcf0c,transparent 70%)}.closing h2{font-size:clamp(40px,5vw,68px)}.closing>p{max-width:570px;margin:0 auto 24px;color:var(--muted)}.closing>.eyebrow{color:var(--mint);margin-bottom:22px}.closing .actions{justify-content:center;margin:28px 0}.closing>.small{font-size:12px;margin:0 auto}.page-intro{padding:36px 0;margin-bottom:25px}.page-intro h1{font-size:clamp(40px,5vw,64px);margin-bottom:24px}.page-intro h1 span{color:var(--mint)}.application-layout{display:grid;grid-template-columns:1.3fr 1fr;gap:28px}.panel{padding:32px;border:1px solid var(--border);border-radius:18px;background:#10181f;margin-bottom:24px}.panel h2{font-size:30px;letter-spacing:-1px}.panel h3{font-size:19px}.application-card h2{margin-top:24px}.application-card>p{color:var(--muted)}.steps{list-style:none;padding:0;margin:32px 0}.steps li{display:flex;gap:18px;margin-bottom:28px}.steps li>span{width:30px;height:30px;flex-shrink:0;border:1px solid #a3edcf40;border-radius:50%;color:var(--mint);display:grid;place-items:center;font-size:13px}.steps h3{font-size:17px;margin-bottom:7px}.steps p{font-size:14px;color:var(--muted);margin:0}.disabled{width:100%;background:#ffffff06;border-color:#ffffff16;color:#73838e;cursor:not-allowed;transform:none!important}.result-card{background:linear-gradient(145deg,#1732297a,#10181f)}.result-card p{color:var(--muted)}.result-card dd{color:var(--mint)}dl{margin:0 0 25px}dl>div{padding:14px 0;border-bottom:1px solid var(--border)}dt{font-size:13px;color:var(--muted)}dd{margin:5px 0 0;font-size:16px;font-weight:500}.faq{margin-top:38px}.faq h2{font-size:32px}.faq details{border-top:1px solid var(--border);padding:20px 0}.faq summary{font-size:17px;font-weight:500;cursor:pointer;padding-right:20px}.faq details p{margin:15px 0 0;max-width:850px;color:var(--muted);font-size:15px}.transparency-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px}.panel .section-heading{align-items:center;margin-bottom:18px}.panel .section-heading h2{margin:0}table{width:100%;border-collapse:collapse;text-align:left;font-size:14px}td,th{padding:13px 0;border-bottom:1px solid var(--border)}td:last-child,th:last-child{text-align:right}thead th{font-size:12px;color:var(--muted);font-weight:500}tfoot{font-size:17px;color:var(--mint)}td{color:#acbdc9}.network-list dd{font-size:16px}.note{font-size:13px;color:#a9c6b7;border-left:2px solid #a3edcf66;background:#a3edcf07;padding:16px;margin:20px 0}.rules-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px 36px;margin:30px 0}.rules-grid p{font-size:14px;color:var(--muted)}.cost-panel{display:grid;grid-template-columns:1fr 1fr;gap:50px}.cost-panel p{color:var(--muted)}.calculator{padding:24px;background:#080e15;border:1px solid var(--border);border-radius:12px}.calculator label{display:block;font-size:14px;margin-bottom:12px}.calculator input{width:100%;background:#15212b;border:1px solid #526b76;border-radius:8px;color:var(--navy);padding:12px}.calculator output{display:block;font-size:37px;font-weight:400;margin:16px 0 5px;letter-spacing:-1px;color:var(--mint)}.calculator p{font-size:12px;color:var(--muted)}footer{max-width:1180px;margin:auto;padding:50px 0 26px;border-top:1px solid var(--border);display:flex;justify-content:space-between;flex-wrap:wrap;gap:30px}footer .brand{margin-bottom:16px}footer p{font-size:13px;color:var(--muted)}.footer-links{display:grid;grid-template-columns:1fr 1fr;gap:10px 45px;font-size:13px;align-content:start}.footer-links a{text-decoration:none;color:#9babb7}.footer-links a:hover{color:var(--mint)}.footer-bottom{width:100%;border-top:1px solid var(--border);display:flex;justify-content:space-between;gap:18px;padding-top:24px;color:#738491;font-size:11px}.skip{position:absolute;left:15px;top:-100px;padding:12px;background:var(--mint);color:#071811;z-index:10}.skip:focus{top:10px}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
@media(min-width:1400px){.hero{min-height:620px}.hero h1{font-size:76px}}
@media(max-width:1100px){.site-header{margin:20px 30px 0}.brand-sub{display:none}.hero{min-height:480px}.hero h1{font-size:55px}.story,.distribution-section,.guardrails,.supply-layout{gap:45px}.mechanism-grid{grid-template-columns:repeat(2,1fr)}.mechanism-symbol{height:65px}.mechanism-grid article{padding:28px}.market-flow{gap:18px}footer{margin:0 40px}}
@media(max-width:760px){html{scroll-padding-top:20px}.site-header{margin:16px 20px 0;padding:12px 17px;flex-wrap:wrap;border-radius:24px;gap:8px}.brand{font-size:23px}.brand-icon{width:30px;height:30px;font-size:20px}nav{width:100%;justify-content:space-between;gap:12px}nav a{font-size:12px}nav a:last-child{padding:7px 12px}main{padding:0 22px}.page{padding:25px 0 50px}.hero{grid-template-columns:1fr;min-height:0;gap:0;text-align:center;padding-top:27px}.hero-copy{max-width:580px;margin:auto}.hero h1{font-size:clamp(36px,8.1vw,55px);white-space:normal;margin-bottom:22px}.hero .eyebrow{font-size:9px;letter-spacing:1.3px}.lede{font-size:16px;margin-bottom:25px}.actions{justify-content:center;gap:20px}.hero-status{font-size:10px;line-height:1.7;margin-top:20px}.orbit-art{max-width:330px;margin:-5px auto 10px}.orbit-label{font-size:7px;letter-spacing:1.2px}.hero-metrics{gap:12px;padding-top:24px}.hero-metrics span{font-size:10px;line-height:1.5;min-height:32px}.hero-metrics strong{font-size:29px}.hero-metrics small{font-size:12px}.hero-metrics>p{font-size:10px}.section-space{padding:55px 0}h2{font-size:35px}.story,.distribution-section,.guardrails,.supply-layout{grid-template-columns:1fr;gap:24px}.large-copy{font-size:22px}.story h2 br,.distribution-section h2 br,.guardrails h2 br{display:none}.story-copy p{font-size:15px}.section-heading{flex-direction:column;align-items:flex-start;gap:20px;margin-bottom:26px}.section-aside{font-size:13px}.mechanism-grid{grid-template-columns:1fr 1fr;gap:12px}.mechanism-grid article{padding:20px 16px}.mechanism-grid h3{font-size:20px}.mechanism-grid p{font-size:13px}.mechanism-grid .number{font-size:8px;letter-spacing:.7px}.mechanism-symbol{font-size:28px;height:60px;letter-spacing:5px}.rule-symbol{font-size:24px;letter-spacing:-1px}.mechanism-grid a{font-size:11px}.distribution-bar{height:58px}.distribution-visual article p{font-size:11px}.distribution-visual h3{font-size:16px}.distribution-visual strong{font-size:28px}.supply-tool{padding:22px}.supply-explainer p{font-size:14px}.chart-value>output{font-size:42px}.market-heading{text-align:left}.market-heading h2{font-size:33px}.market-flow{grid-template-columns:1fr;gap:20px}.market-flow article{min-height:0;padding-top:20px}.flow-arrow{display:none}.market-note{padding:15px;justify-content:flex-start}.guardrail-list h3{font-size:21px}.progress-grid{grid-template-columns:1fr;gap:14px}.progress-grid article{padding:23px}.closing{padding:55px 0 20px}.closing h2{font-size:43px}.closing>p{font-size:15px}.closing>.eyebrow{font-size:11px}.closing .button{width:auto}.application-layout,.transparency-grid,.rules-grid,.cost-panel{grid-template-columns:1fr;gap:20px}.page-intro{padding:25px 0;margin-bottom:16px}.page-intro h1{font-size:42px}.panel{padding:24px}.panel h2{font-size:27px}.panel .section-heading{flex-direction:row;flex-wrap:wrap;gap:10px}.calculator{padding:20px}.faq h2{font-size:27px}.faq summary{font-size:16px}footer{margin:0 22px;padding-top:35px;gap:24px}.footer-links{gap:8px 28px}.footer-bottom{flex-direction:column;gap:5px}table{font-size:13px}td,th{padding:12px 0}}
@media(max-width:760px){.orbit-art{overflow:clip}}
@media(max-width:360px){.mechanism-grid{grid-template-columns:1fr}.hero h1{font-size:33px}.hero .eyebrow{font-size:8px}.hero-metrics strong{font-size:24px}nav{gap:8px}nav a{font-size:11px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.button{transition:none}}

/* Allocation circles use area, rather than diameter, to represent token amounts. */
.allocation-map{border-top:1px solid var(--border)}.allocation-map-layout{display:grid;grid-template-columns:minmax(0,1.75fr) minmax(0,1fr);gap:32px;align-items:center}.allocation-map-visual{min-width:0}.allocation-bubbles{display:block;width:100%;height:auto;overflow:visible}.allocation-bubble{cursor:pointer;outline:none}.allocation-bubble circle{stroke:#ffffff20;stroke-width:1.5;transition:stroke .18s,filter .18s}.allocation-bubble:hover circle{filter:brightness(1.08);stroke:#e6fff2;stroke-width:3}.allocation-bubble:focus-visible circle,.allocation-bubble[aria-pressed=true] circle{stroke:#f2f7ff;stroke-width:3.5}.allocation-bubble text{fill:#0b1820;text-anchor:middle;pointer-events:none;font-family:inherit}.bubble-name{font-size:27px;font-weight:500}.bubble-name.medium{font-size:18px}.bubble-amount{font-size:52px;font-weight:500;letter-spacing:-2px}.bubble-amount.large{font-size:90px;letter-spacing:-4px}.bubble-amount.small{font-size:32px;letter-spacing:-1px}.bubble-amount.tiny{font-size:18px;letter-spacing:-.5px}.bubble-percent{font-size:22px;fill:#12362d!important}.bubble-percent.medium{font-size:16px;fill:#1c2246!important}.bubble-percent.small{font-size:12px;fill:#342812!important}.allocation-legend{display:grid;grid-template-columns:1fr 1fr;gap:8px}.allocation-legend button{display:flex;align-items:center;gap:9px;text-align:left;border:1px solid transparent;border-radius:8px;padding:10px;background:transparent;color:var(--muted);font:inherit;font-size:12px;cursor:pointer}.allocation-legend button:hover,.allocation-legend button[aria-pressed=true]{border-color:#ffffff20;background:#ffffff05;color:var(--navy)}.allocation-legend button:focus-visible{outline:2px solid var(--mint);outline-offset:2px}.allocation-legend i{width:8px;height:8px;flex-shrink:0;border-radius:50%}.allocation-legend span{margin-left:auto;color:var(--navy);white-space:nowrap}.human-swatch{background:#a3edcf}.treasury-swatch{background:#a5b8ee}.market-swatch{background:#e4bd83}.free-swatch{background:#dcb0d0}.allocation-detail{border:1px solid #ffffff18;background:linear-gradient(150deg,#17212f,#10181f);border-radius:20px;padding:30px}.allocation-detail h3{font-size:28px;letter-spacing:-.7px}.allocation-detail-number{margin:24px 0}.allocation-detail-number strong{display:block;font-size:64px;line-height:1.1;letter-spacing:-3px;font-weight:450}.allocation-detail-number>span{font-size:12px;color:var(--muted)}.allocation-detail>p:not(.eyebrow){font-size:14px;color:var(--muted)}.treasury-composition{padding:20px 0;border-top:1px solid var(--border);margin-top:22px}.treasury-composition>div{display:flex;justify-content:space-between;gap:8px;margin-top:16px}.treasury-composition>div>span{font-size:10px;line-height:1.5;color:var(--muted);text-align:center;flex:1}.treasury-composition b{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;border:1px solid #a5b8ee60;background:#a5b8ee10;margin:0 auto 8px;font-size:17px;color:#c9d5f5;font-weight:500}.treasury-composition>p{font-size:11px;line-height:1.5;color:var(--muted);margin:16px 0 0}.allocation-detail-rule{border-left:2px solid #a5b8ee80;padding-left:14px;margin:12px 0 0}.allocation-map-footnote{font-size:12px;color:var(--muted);line-height:1.7;max-width:900px;margin:32px 0 0}
@media(max-width:1100px){.allocation-map-layout{grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:20px}.allocation-detail{padding:24px}.allocation-legend{grid-template-columns:1fr}.allocation-detail h3{font-size:24px}}
@media(max-width:760px){.allocation-map-layout{grid-template-columns:1fr;gap:28px}.allocation-legend{grid-template-columns:1fr 1fr}.allocation-legend button{padding:9px 5px;font-size:11px;gap:6px}.allocation-detail-number strong{font-size:52px}.allocation-detail{padding:24px}.allocation-map-footnote{font-size:11px;margin-top:24px}.allocation-bubbles{margin-top:-10px}}
@media(max-width:360px){.allocation-legend{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.allocation-bubble circle{transition:none}}
.orbit-art{overflow:clip}

/* Initial allocation entry and application page */
nav .nav-claim{color:var(--mint);font-weight:650}nav .nav-claim span{margin-left:5px}
.claim-callout{display:flex;align-items:center;gap:24px;padding:28px 32px;border:1px solid #a3edcf38;border-radius:20px;background:linear-gradient(115deg,#172e26,#101920);margin:24px 0 36px;box-shadow:0 12px 50px #0002}.claim-icon{width:60px;height:60px;flex-shrink:0;border:1px solid #a3edcf50;border-radius:18px;display:grid;place-items:center;font-size:30px;color:var(--mint);background:#a3edcf09}.claim-callout-copy{flex:1}.claim-callout .eyebrow{margin-bottom:8px;font-size:10px}.claim-callout h2{font-size:30px;letter-spacing:-1px;margin-bottom:9px}.claim-callout p:not(.eyebrow){font-size:14px;color:#b0bfc8;margin-bottom:9px}.claim-status{display:inline-flex;align-items:center;gap:7px;color:#b7c6d0;font-size:11px;letter-spacing:.2px}.claim-status:before{content:'';width:5px;height:5px;background:#b7c6d0;border-radius:50%}.claim-callout .button{white-space:nowrap}
.claim-page-heading{display:grid;grid-template-columns:1.5fr 1fr;gap:60px;align-items:center;padding:48px 0 40px}.claim-page-heading h1{font-size:clamp(38px,4.5vw,62px);line-height:1.1;margin-bottom:24px}.claim-page-heading h1 span{color:var(--mint)}.claim-page-heading .lede{margin:0;font-size:17px}.claim-amount-card{border:1px solid #a3edcf32;background:radial-gradient(ellipse at 15% 15%,#a3edcf14,transparent 80%),#101a20;border-radius:22px;padding:34px}.claim-amount-card>span:first-child{font-size:10px;letter-spacing:1.8px;color:#a4b6bd}.claim-amount-card strong{display:block;font-size:60px;font-weight:450;letter-spacing:-3px;line-height:1.3;margin:14px 0 6px}.claim-amount-card small{font-size:22px;letter-spacing:0;color:var(--mint)}.claim-amount-card p{font-size:13px;color:var(--muted);margin-bottom:22px}.claim-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:24px 0;margin-bottom:40px;border-top:1px solid var(--border);border-bottom:1px solid var(--border)}.claim-summary span{display:block;font-size:12px;color:var(--muted);margin-bottom:5px}.claim-summary strong{font-size:16px;font-weight:550}.application-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.application-heading .eyebrow{font-size:10px;margin-bottom:12px}.application-card .application-heading h2{margin-top:0;font-size:29px}.application-heading .pill{margin-top:3px}.application-card .steps li{padding-bottom:22px;margin-bottom:22px;border-bottom:1px solid var(--border)}.application-card .steps li>span{width:38px;height:38px;border-radius:12px;background:#a3edcf08;font-size:11px}.claim-unavailable{display:flex;align-items:baseline;gap:5px;background:#ffffff03;border:1px solid var(--border);border-radius:12px;padding:18px;margin-bottom:18px}.claim-unavailable strong{font-size:13px;font-weight:600}.claim-unavailable p{font-size:12px;line-height:1.65;color:var(--muted);margin:5px 0 0}.application-privacy{text-align:center;margin:12px 0 0}.eligibility-card ul{list-style:none;padding:0;margin:24px 0}.eligibility-card li{font-size:14px;color:#acbcc6;padding:12px 0 12px 20px;border-bottom:1px solid var(--border);position:relative}.eligibility-card li:before{content:'✓';position:absolute;left:0;color:var(--mint)}
@media(max-width:950px){.claim-page-heading{gap:30px}.claim-callout{flex-wrap:wrap}.claim-callout .button{margin-left:84px}.claim-page-heading h1{font-size:43px}}
@media(max-width:760px){.claim-page-heading{grid-template-columns:1fr;padding-top:32px;gap:24px}.claim-page-heading h1{font-size:42px}.claim-amount-card{padding:26px}.claim-amount-card strong{font-size:52px}.claim-summary{gap:14px}.claim-summary strong{font-size:13px}.claim-summary span{font-size:11px}.claim-callout{padding:24px;gap:18px;text-align:left}.claim-callout h2{font-size:27px}.claim-callout .button{margin-left:0;width:100%}.claim-icon{width:48px;height:48px}.claim-callout-copy{flex-basis:calc(100% - 66px)}.application-heading{display:block}.application-heading .pill{margin-bottom:18px}.application-card .application-heading h2{font-size:27px}}
@media(max-width:420px){.claim-page-heading h1{font-size:35px}.claim-summary{grid-template-columns:1fr;gap:15px}.claim-summary>div{display:flex;justify-content:space-between;align-items:baseline;gap:15px}.claim-summary span{margin:0}.claim-callout{padding:20px}.claim-callout h2{font-size:24px}}

````
