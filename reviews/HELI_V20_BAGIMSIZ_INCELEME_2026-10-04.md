# HELI V20 — Bağımsız, adversaryal inceleme

Tarih: 4 Ekim 2026. İncelenen paket: `HELI_V20_CLAUDE_REVIEW.zip` (FILE_MANIFEST.json'daki 112 dosyanın hash'i eşleşti). Bu belge bir güvenlik denetimi veya hukuki görüş değildir. Program kaynağı ile ELF arasındaki bağ yalnızca paketin kendi kaydına göre doğrulandı. Bağımsız bir derlemeyle doğrulanmadı.

---

## 0. Hüküm

| Seviye | Hüküm | Gerekçe |
|---|---|---|
| **Prototip / yerel test** | **Hazır (sınırlı)** | Kayıtlı testlerin hepsini temiz bir kopyada yeniden çalıştırdım ve hepsi geçti (aşağıda). Ekonomik kural, takvim ve 720 dönem yerelde tutarlı. |
| **Devnet** | **Koşullu.** Yalnız test tokenı ve sentetik ya da gönüllü kullanıcıyla olur. | Önce H1 (initialize front-run), dağıtım sırası ve upgrade-authority planı çözülmeli. Dağıtım betiği yok. Cüzdan bakiyesi 0 SOL, tahmini tepe maliyet yaklaşık 13,76 test SOL. Keeper yalnız Devnet'e kilitli, bu Devnet için uygun. |
| **Halka açık / mainnet** | **Hazır değil.** | Kritik bulgular C1–C3 (yöneticinin envanteri ve rezervi fiyat sınırı olmadan aktarabilmesi, anahtar ve upgrade merkeziyeti) ile H1–H5 açık. Bağımsız denetim, yeniden üretilebilir derleme, kalıcı hosting ve yargı alanına göre hukuk/gizlilik çalışması yok. |

Özet: Kod, "aylık tavan" kuralını zincirde doğru uyguluyor. Ancak serbest bırakılan arzın **kime, hangi fiyattan** gideceğini ve proje rezervinin **nereye** harcanacağını tek bir yönetici anahtarı sınırsız belirliyor. Belgelerdeki "satış gelirleri proje rezervinde kalır" ve "piyasa kontrolleri uygulanır" ifadeleri kodda **zorlanmıyor**. Bunu yerel ELF üzerinde gösterdim.

---

## 0.1 Karşı inceleme sonrası düzeltmeler (4 Ekim 2026)

Ayrı bir ajan raporu çürütmekle görevlendirildi. İddialarını yeniden çalıştırarak kontrol ettim; aşağıdakiler doğrulandı ve rapora işlendi.

**Düzeltilen hatalar**
- **PoC2 rakamı yanlıştı.** Proje geliri 1 değil yaklaşık 9.995 quote. Saldırgan yine 990.005 HELI'yi yaklaşık 0,99 quote'a aldı (C1'de düzeltildi).
- **Satır numaraları:** `release.rs`, `identity.rs`, `mobile/solana.mjs` ve `claim-service/app.js` referansları, dosyaları birleştirerek numaralandırmamdan dolayı kaymıştı. Hepsi düzeltildi. (Karşı inceleyicinin "CRLF" açıklaması doğru değil; sebep birleştirilmiş listelemeydi.)
- **C2b:** `monthly_cap` zaten bir kez yazılıyor ve değiştirilemiyor. Sorun, değeri yöneticinin seçmesi ve iptal yolu olmaması.
- **M2:** PoC tek bir sahte örnek kaydettiğini gösteriyor, referans fiyatın (24 örnek) değiştiğini göstermiyor. Referansın itilebileceği makul ama gösterilmedi.

**Kabul edilen ciddiyet değişiklikleri**
- **C1 ve C2a:** Dışarıdan bir saldırgan istismarı değil, tek yöneticinin yetkisi. Doğru etiket "mainnet'i engelleyen yönetişim riski ve belge-kod çelişkisi". C2b (iptal yok, pause'u kontrol etmiyor) ise gerçek bir kod kusuru olarak Yüksek.
- **H1:** Devnet için ön şart değil (test tokenı, yeniden dağıtılabilir). Mainnet'ten önce zorunlu. Fon kaybı yok, keeper'ın admin pin'i farkı yakalıyor.
- **H5:** Bir hata değil, politika ve açıklama sorunu. Ancak N2 bunu güçlendiriyor (aşağıda).
- **M1:** Asıl sorun `management_order`'da fiyat kontrolü olmaması (C1/C2a ile kesişiyor). Release'in derinlik sınırı ikincil.

**Yeniden üretilmiş yeni bulgular**
- **N1 – Başvuru linkiyle oturum sabitleme (Orta).** `claim-service/app.js:25` (`if(transferred)save()`).
  - Saldırgan kendi başvuru linkini kurbana gönderir, sayfa onay sormadan kurbanın oturumunu ezer.
  - Kurban Didit doğrulamasını saldırganın cüzdanına bağlı başvuruda tamamlar, kendi başvurusu "duplicate" olur.
  - Gözlenen: `hijacked application status verified wallet==attacker true` ve `victim own application status duplicate`.
  - Düzeltme: Linkle gelen oturumu yalnız açık onayla ve cüzdan adresini göstererek kabul edin, var olanı ezmeyin, linki kısa ömürlü yapın.
- **N2 – Tek emre dayalı gözlem: toz bid ile DoS (Orta).** `release.rs:46-69`, `management.rs:93-94`.
  - 0,011 quote teminatlı, 0,01 HELI'lik bir bid gözlemi "Market guard rejected" ile reddettirdi.
  - İki saatten uzun kalırsa 24'lük seri sıfırlanıyor.
  - En az 5.000 quote şartı tek emirden okunduğu için parçalı organik bir piyasa bunu sağlamaz; pratikte ancak bir balina ya da projenin kendi fonladığı bid sağlar.
  - Düzeltme: Birden çok fiyat seviyesinden toplam derinlik, toz ve süresi dolmuş emirleri atlama, gözlemin aynı işlemde veya CPI ile çağrılmasını engelleme.
- **M3 artık hipotez değil.** Süresi dolmuş tek bir top-bid gözlemi 190 slot boyunca engelledi. 0,01 HELI'lik bir ask ile herkes temizleyebiliyor.
- **N3 – Hız sınırı imzalı Didit webhook'larını da kesiyor (Düşük).** `server.mjs:28`.
- **N4 – Kapanıştan sonra `management_base` HELI'si sıkışıyor (Düşük, kod).** `active()` `live` istiyor (`management.rs:68`), proje ask'i ise `live||closed` ile açık kalıyor. Tutarsız.

**Temiz çıkan alanlar (karşı inceleme ile)**
- Ed25519 kontrolü.
- Anchor seeds ve has_one kısıtları.
- İhale yuvarlama ve iadeleri.
- Manifest cancel kodlaması.
- Rust/JS takvim tutarlılığı (504.700 karşılaştırma).
- XSS ve CSRF.

**Yeni kanıt: kaynak, standart araçlarla çalışan bir ikiliye derlenemiyor (M9 → Yüksek)**
- Değiştirilmemiş orijinal kaynak bu ortamda yerel olarak derlendi. Kullanılan araçlar:
  - Solana 1.18.26 / platform-tools v1.41
  - Agave 2.1.21 / platform-tools v1.43
  - `opt-level` 3, s, z ve 2
- Hiçbir derleme çalışan bir ikili vermedi. Hepsinde paketin kendi testinin ilk adımı olan `initialize`, "Access violation in stack frame 5" ile çöküyor.
- Derleyici 9 HELI hesap doğrulama fonksiyonunda (`Initialize`, `BindManifestMarket`, `InitializeReleaseSeat`, `InitializeFeeVaults` vb.) 4 KB'lık yığın sınırının aşıldığını bildiriyor. `opt-level=2` uyarıları kaldırıyor ama çökme sürüyor.
- Paketteki çalışan ELF yalnız Solana Playground'un bilinmeyen araç ve bağımlılık sürümleriyle üretilmiş.
- Sonuç: Kaynak→ikili bağı bağımsız olarak doğrulanamıyor. Ayrıca kaynakta yapılacak her değişiklik, Playground'a gönderilmeden çalışır halde test edilemiyor.
- Ek bir derleme sorunu: `manifest_bridge.rs`'teki `pubkey!` makrosu, `Cargo.toml`'da bulunmayan `solana-program` bağımlılığını gerektiriyor.
- Mainnet için doğrulanabilir derleme (`solana-verify`, sabit Docker imajı) şart olduğu için bu bir blokerdir.

**Güncellenmiş hüküm**
- **Gerçek kullanıcıyla Devnet pilotu öncesi:** N1, H4 (`/web3.js` çökmesi ve hız sınırı) ve C2b kapatılmalı. H1 Devnet için şart değil.
- **Mainnet:** hüküm değişmedi.

## 1. Ne çalıştırdım, ne doğruladım

Ortam: izole kopya, Node 22.22.0 (pakette ≥24 önerilmiş, `node:sqlite` 22'de deneysel uyarıyla çalıştı), Python 3.11, solders 0.29.0. Gerçek anahtar, kimlik, ağ dağıtımı ve harcama kullanılmadı.

| Kanıt | Sonuç | Ne sayılır |
|---|---|---|
| 7 Node test dosyası (`RUN_AND_EVIDENCE.md` komutu) | **70/70 geçti** | 70 `test()` vakası. 70 kullanıcı veya 70 işlem değildir. |
| `test_market_release_svm.py` (V20 + Manifest ELF, LiteSVM) | **Geçti, 1.606 "kontrol/işlem"** | Assert ve gönderilen işlemlerin toplamı. Bağımsız test vakası değildir. |
| `keeper/tests/test_v20_svm.py` | **Geçti, 4.348 kontrol/işlem, 1.442 iş, 720 ay** | Kapsamı yukarıdakiyle kesişir. |
| `claim-service/tests/v20-svm.test.mjs` | **1/1 geçti** | Tek uçtan uca sentetik senaryo. |
| Kaynak SHA-256 / ELF SHA-256 | `compiled-source.json` ile eşleşiyor | Yalnız iç tutarlılık. Derleyici Solana Playground (ELF'te `fe03fd9e-…/src/*.rs` yolları), bağımsız derleme yok. |
| **İnceleme PoC'leri** (`reviews/poc_review.py`, gerçek ELF'ler) | **5/5 senaryo doğrulandı** | C1, C2a, C2b, M1, M2. Ayrıntı aşağıda. |
| Claim-service yerel demo | **Global hız sınırı DoS'u ve statik dosya hatasında süreç çökmesi doğrulandı** | H4 |

Bu sayılar tek bir "güvenlik puanına" toplanmamalı. Hepsi sentetik kimlik ve sentetik quote ile yerel çalıştırmalardır.

---

## 2. Bulgular

Durum etiketleri:

- **[PoC]**: gerçek ELF üzerinde yerelde yeniden üretildi.
- **[Kod]**: kod okumasıyla kesin, ayrıca çalıştırılmadı.
- **[Hipotez]**: yeniden üretilmesi gerekiyor.

Satır numaraları paketteki dosyalara göredir. Kod uzun satırlıdır, bu yüzden numara fonksiyonun başladığı satırı gösterir.

### KRİTİK

**C1 — Yönetici, satış envanterini istediği fiyattan satabiliyor [PoC]**

- Yer: `solana-v20/src/manifest_bridge.rs:94-120` (`place_ask`), `:31-42` (`update_data`).
- Sorun: `price_mantissa/exponent` için tek kontrol `mantissa>0, -18≤exp≤18`. Açılış ihalesi fiyatına, TWAP'a veya herhangi bir tabana bağlı alt sınır yok.
- Senaryo: Yönetici 1.000.000 HELI'yi `1×10⁻⁶` quote-atom/base-atom fiyatına (HELI başına 1 quote atomu) koyuyor. Anlaşmalı bir cüzdan bunu alıyor.
- PoC sonucu (karşı incelemeyle düzeltildi): Ucuz ask önce defterde bekleyen 9.995 HELI'lik bid'i o bid'in fiyatından (1,0) doldurdu, proje bundan yaklaşık 9.995 quote aldı. Kalan 990.005 HELI'yi anlaşmalı alıcı toplam yaklaşık 0,99 quote'a aldı (HELI başına ~1 quote atomu; ihale tabanı 100 atomdu). İlk sürümdeki "proje geliri 1 quote" ifadesi yanlış ölçümdü. Manifest'in eşleştirmesi mevcut bid'leri korur; tam istismar için ask ile anlaşmalı bid'in aynı işlemde gönderilmesi ya da defterin önceden boş olması gerekir. Aynı yol, her ay serbest bırakılan stok ve altı ayda devreden 999 bin ücretsiz pay için de geçerli.
- Etki: "Aylık tavan" yalnız miktarı sınırlıyor. Değerin kime aktarılacağını yönetici seçiyor. Belgelerdeki "piyasa fiyatı belirler" iddiası yönetici dürüstlüğüne dayanıyor.
- Düzeltme:
  - Zincir üstü fiyat tabanı ekleyin: `max(ihale_clearing, k×reference_price)`.
  - Dönem başına ask miktarı sınırı koyun.
  - İsteğe bağlı: önceden ilan edilen deterministik fiyat merdiveni.
  - Fiyat parametrelerini zaman kilitli bir politika hesabına taşıyın.
- Test: Tabanın altındaki `place_project_ask` reddedilmeli.

**C2 — Proje quote rezervi yönetici tarafından boşaltılabilir [PoC]**

(a) Fiyatsız yönetim teklifi:

- Yer: `management.rs:103-109` (`order`), `:79-85` (`fund_quote`).
- Sorun: `fund_quote` rezervden yönetim koltuğuna para aktarıyor. `order` ise sınırsız fiyatla bid koyabiliyor. Yalnız `quote_floor` korunuyor, onu da yönetici belirliyor.
- PoC sonucu: HELI başına 40 quote'luk bid'e anlaşmalı bir satıcı 1 HELI sattı. Rezerv 66'dan 26'ya düştü, satıcı +40 aldı. 12 aylık kilit quote harcamasını kapsamıyor: paketin kendi SVM testi 1. ayda rezervle fonlanmış bid açıyor.

(b) Gider yolu:

- Yer: `lib.rs:103-113` (`allocate_auction_proceeds`), `:114-121` (`propose_expense`), `:122-138` (`execute_expense`), `accounts.rs:455-488`.
- Sorun:
  - Rezervin tamamı gider kasasına aktarılabiliyor.
  - Hedef hesap serbest.
  - `monthly_cap` tek seferde yöneticinin seçtiği değer (u64'e kadar).
  - 7 gün bekleme var ama **iptal veya veto yolu yok**.
  - `execute_expense` herkes tarafından çağrılabiliyor ve **pause'u kontrol etmiyor**.
- PoC sonucu: `monthly_cap=2^63`, rezervin tamamı yöneticinin özel token hesabına gitti. Program duraklatılmış haldeyken bile ödendi.
- Etki: "Satış geliri kişisel cüzdana değil proje rezervine döner" (CURRENT_STATE.md, heli-rules.txt, website) yalnızca muhasebe sırası. Zincir bunu engellemiyor. Anahtar ele geçirilirse saldırgan da aynı yolu kullanır.
- Düzeltme:
  - Yönetim bid fiyatını `reference_price×(1+x)` ile sınırlayın.
  - Dönem başına quote harcama tavanı koyun ve değişmez yapın.
  - Gider hedefleri için zaman kilitli beyaz liste kullanın.
  - `cancel_expense` ekleyin. `execute_expense` pause'u kontrol etsin.
  - Gider ve politika değişiklikleri için çok-imza.
- Test: PoC3 ve PoC4 senaryoları reddedilmeli.

**C3 — Anahtar ve upgrade merkeziyeti, rotasyon ve kurtarma yok [Kod]**

- Yer: `lib.rs` içinde `admin` değiştiren bir talimat yok. `identity.rs:14-17` verifier'ı yalnız `!live` iken bir kez ayarlıyor. Upgrade authority kodda yönetilmiyor. Keeper `heliUpgradeAuthority:null` bekliyor (`keeper/config.example.json`) ama bu yalnız izleme.
- Senaryolar:
  - Upgrade authority devredeyse, yeni kod config PDA ile bütün kasaları (~85M kilitli HELI + envanter + quote) taşıyabilir. Mint yetkisi `None` olduğu için yeni HELI basılamaz, ama mevcutlar taşınabilir.
  - Yönetici anahtarı kaybolursa: pause açıksa sistem kalıcı donar (bkz. H2). Envanter satılamaz.
  - Verifier anahtarı ele geçirilirse: en çok 1.000 sahte kimlik × 1.000 HELI. Rotasyon veya iptal yolu yok. Tek önlem pause, o da meşru kullanıcıları da durdurur.
- Düzeltme:
  - Mainnet öncesi upgrade authority'yi ya kaldırın (`--final`) ya da zaman kilitli çok-imzaya verin ve bunu yayımlayın.
  - `propose_admin/accept_admin` ve verifier rotasyonu ekleyin, zaman kilitli olsun.
  - Kimlik bilgisi iptal talimatı ekleyin.

### YÜKSEK

**H1 — `initialize` herkes tarafından çağrılabilir (front-run) [Kod]**

- Yer: `lib.rs:16-22`, `accounts.rs:2-19`.
- Sorun: Config PDA'sı tekil. İlk çağıran `admin` oluyor ve quote mint'ini seçiyor.
- Senaryo: Dağıtımdan sonra mempool'u izleyen biri önce `initialize` çağırıyor. Yeniden dağıtım ve yeni program ID'si gerekiyor.
- Düzeltme: `admin == sabit anahtar` kontrolü ya da `program_data.upgrade_authority == signer` kontrolü.
- Test: Yabancı imzacının `initialize` çağrısı reddedilmeli.

**H2 — Sınırsız `pause` [Kod; PoC4'te pause'un gideri durdurmadığı da görüldü]**

- Yer: `lib.rs:148`.
- Sorun: Pause `settle`, `open_epoch`, `enroll_launch`, ihale teklifi, yönetim işlemleri ve project ask'i durduruyor. Süre sınırı yok. Pause altında `settle` olmazsa `close_constitution` hiç çalışamaz (`last_settled_epoch==720` şartı).
- Etki: "Herkes tetikleyebilir" denen aylık para kuralı tek bir anahtarın kararına bağlı. Buna karşılık gider ödemesi pause'da durmuyor. Tam ters bir öncelik.
- Düzeltme:
  - `settle/open_epoch` pause'dan muaf olsun, ya da pause en çok N gün sürsün.
  - Pause, gider ve yönetim çıkışlarını durdursun.

**H3 — Aynı kişinin farklı belgeyle ikinci cüzdandan başvurması [Hipotez: canlı test gerekli]**

- Yer: `claim-service/didit.mjs:30-38`, `admission.mjs:15-18`.
- Sorun: Nullifier, ilk belgenin HMAC anahtarından türetiliyor. Kişi anahtarı yalnız `personal_number` varsa ekleniyor. Pasaport ile kimlik kartı ya da yenilenmiş pasaport farklı nullifier üretir. Zincir yalnız aynı nullifier'ı engelliyor (`accounts.rs:94-110`). Tek savunma, Didit iş akışındaki yüz-tekrar uyarısı. Bu uyarının açık olduğu kodda doğrulanmıyor. `HELI_DUPLICATE_POLICY_CONFIRMED=true` yalnızca bir beyan (`server.mjs:60`).
- Mevcut test: yalnız `personal_number` olan senaryo var (`claim.test.mjs`).
- Ek riskler:
  - Kimlik kiralama veya satma: başkasının doğrulama linkini tamamlaması.
  - Verifier sıcak anahtarı sunucuda duruyor.
- Düzeltme:
  - Kişi düzeyinde kalıcı yüz-tekrar kanıtını zorunlu alan yapın (alan yoksa "review").
  - Belge türleri arasında aynı kişiyi bağlayan anahtar ekleyin.
  - Canlı testler: pasaport + kimlik kartı, aynı kişi, iki cüzdan.

**H4 — Kimlik servisinin erişilebilirliği ve maliyeti [PoC: hız sınırı ve çökme]**

- Yer: `claim-service/server.mjs:28`, `:24`, `:51`, `storage.mjs:10`, `admission.mjs:7-13`.
- Sorunlar:
  - Hız sınırı **tüm dünya için toplam 120 POST/dk**. PoC: 120 saldırgan isteğinden sonra meşru kullanıcı 429 aldı.
  - GET statik dosya okunamazsa başlık yazıldıktan sonra hata oluşuyor. `catch` ikinci kez `writeHead` çağırıyor ve **süreç çöküyor**. PoC: paket dağıtımında `/web3.js` yolu (`../solana/node_modules`) eksik olduğu için tek bir istek sunucuyu kapattı.
  - Oturumlar silinmiyor. Her kayıtta tüm durum tek JSON olarak yeniden yazılıyor (O(N)).
  - Her yeni anahtar çifti imzayla yeni bir Didit oturumu açabiliyor (sağlayıcı maliyeti ve kotası).
  - Hosting geçici bir `trycloudflare` tüneli ve tek bilgisayar.
- Düzeltme:
  - IP, cüzdan ve oturum bazlı limit. Cloudflare WAF/Turnstile.
  - Didit oturumu açmadan önce maliyet kapısı (CAPTCHA, kuyruk).
  - Statik dosyayı başlıktan önce okuyun. Süreç gözetmeni ekleyin.
  - Oturum TTL ve temizliği. Satır bazlı SQLite şeması.

**H5 — 60 yıllık 5M→90M yolu pratikte yönetimin sürekli piyasa derinliğine bağlı [Kod + simülasyon; politika çatışması]**

- Yer: `market_release.rs:42-43`, `management.rs:87-94`, `release.rs:70-76`.
- Sorun: Yönetim payı (12–719. aylarda tavanın %20'si) kullanılmasa bile pazar release'inden düşülüyor. Kullanmak için de şunlar gerekiyor: o ayın penceresi içinde 24 saatlik gözlem, en az `minimum_quote_depth` (≥5.000 quote birimi) derinlikte bir top-bid ve ±%2 fiyat bandı.
- Simülasyon (tam sayı, sözleşme formülü):
  - Tam kullanım: 89.999.999,998 HELI.
  - Yönetim hiç kullanmazsa: **51.023.277 serbest, 38.976.723 HELI 60. yılda yakılır**.
  - Yönetim %50 kullanırsa: 67,77M.
  - Bir yıl keeper ve yönetim kesintisi (13–24. aylar): 89,14M.
- Değerlendirme: Belgeler bunu "koşullu üst yol" diye açıklıyor, bu doğru. Ancak site grafiği yolu yalnız "her izin kullanılırsa" diye niteliyor. Bunun **piyasa derinliği şartına** bağlı olduğunu söylemiyor. Bu bir hata değil, bir politika seçimi. Seçenekler §7'de.

### ORTA

**M1 — `management_release` derinlik sınırı çağrı başına, kümülatif değil [PoC]**

- Yer: `management.rs:92-94`.
- Sorun: `amount<=depth/50` her çağrıda ayrı kontrol ediliyor, ama release satış yapmadığı için derinliği tüketmiyor.
- PoC: Top-bid 9.995 HELI, çağrı limiti 199,9 HELI. 21 çağrıda 4.197,9 HELI serbest bırakıldı, yani derinliğin %42'si. Belgedeki "market checks still apply" yanıltıcı.
- Düzeltme: Dönem başına kümülatif sınır, ya da release'i satışla atomik yapın.

**M2 — İzinsiz `observe_release_market` tek işlemde flash bid ile yönlendirilebilir [PoC]**

- Yer: `release.rs:57-69`.
- PoC: Tek işlemde "bid koy → observe → iptal". Önceki örneklerin hepsi 1,0 quote/HELI iken kayıt 5,0 quote/HELI oldu. Saldırgan 60.000 quote teminatının tamamını aynı anda geri çekti. Sermaye maliyeti yok, yalnız işlem ücreti.
- Etki: 24 örneğin hepsi kontrol edilerek referans fiyat ±%2 bandının dışına itilebilir. Böylece yönetim release ve satışları engellenir (DoS). Ayrıca yönetici kendi fonladığı bid'le derinlik ve fiyat şartını kendisi sağlayabilir.
- Düzeltme:
  - Gözlemi CPI ile çağrılamaz yapın (instruction introspection ile tek talimat/üst seviye şartı).
  - Bid yaşı veya min `sequence` farkı arayın.
  - Proje ve yönetim emirlerini derinlikten hariç tutun.

**M3 — Süresi dolmuş top-bid ile gözlem engelleme [Hipotez]**

- Yer: `release.rs:53`.
- Sorun: `last_valid_slot < now` olan bir en iyi bid defterden temizlenene kadar `top_bid` reddediliyor.
- Senaryo: Kısa ömürlü yüksek bir bid ucuz bir DoS olabilir.
- Gereken: Manifest'in tembel temizleme davranışıyla yeniden üretim.

**M4 — Hak koruması ve iptal [Kod]**

- `dispute_launch` (`lib.rs:49-52`): Yönetici, ay 6'dan önce talep edilmemiş geçerli bir makbuzu gerekçesiz iptal edebiliyor. Kişi yeniden kayıt olamıyor (makbuz PDA'sı kalıcı) ve itiraz yolu yok.
- Credential iptal talimatı yok: Didit kararı sonradan Declined'a dönse bile zincirdeki kimlik geçerli kalıyor.
- Düzeltme: Gerekçe hash'i ve olay, itiraz süresi, credential iptali.

**M5 — Başvuru tokenı kaybolursa kişi kalıcı olarak "duplicate" oluyor [Kod]**

- Yer: `admission.mjs:15-18`.
- Sorun: Doğrulanmış kişinin anahtarları eski oturum ID'sine bağlı kalıyor. Cüzdan imzasıyla oturuma geri dönme yolu yok.
- Senaryo: localStorage temizlenirse (ör. Safari depolama silmesi, başka tarayıcı) aynı kişi yeni oturumda "duplicate" oluyor.
- İlgili sorun: Didit'te manuel onay uyarıları silmediği için ikizler veya benzer aile üyeleri kalıcı olarak "review"da kalabilir. Bu, "aile üyeleri katılabilir" hedefiyle çelişiyor.
- Düzeltme: Cüzdan imzasıyla oturum kurtarma, ayrıca kayıtlı insan incelemesi için imzalı bir override yolu.

**M6 — Sponsor bütçesi tek bir doğrulanmış kullanıcıyla tüketilebilir [Kod]**

- Yer: `mobile/solana.mjs:38-65`.
- Sorun: Her `prepare` çağrısı, 90 saniyelik geçerlilik dolunca bütçeye yeniden yazılıyor (kira dahil yaklaşık 0,003–0,006 SOL). Günlük 0,05 SOL tavan, birkaç düzine çağrıda doluyor.
- Düzeltme: Bütçeyi gönderilen veya onaylanan işlem üzerinden düşün, ya da oturum başına günlük tek hazırlık.

**M7 — Dağıtım sırası tuzakları [Kod]**

- `initialize_release_policy` ve `initialize_identity` yalnız `!live` iken çalışıyor (`release.rs:17`, `identity.rs:15`).
- `open_auction` yalnız `start-600`'den önce çalışıyor (`auction.rs:75`).
- `place_project_ask` için `auction.finalized` şart (`manifest_bridge.rs:96`).
- Sonuç: Sıra kaçarsa satış envanteri veya yönetim yolu **kalıcı kullanılamaz**.
- Düzeltme: Bir runbook ve tek seferlik kurulum testi. Mümkünse "ihale yapılmadı" durumu için bir yol.

**M8 — Manifest bağımlılığı [Kod/Hipotez]**

- Yer: `release.rs:46-56`, `manifest_bridge.rs:8-21`.
- Sorunlar:
  - Ham bayt ofsetleri ve CPI baytları v3.0.24'e sabitlenmiş.
  - Manifest upgrade edilebilir. HELI programı yalnız program ID'sini kontrol ediyor, kod hash'ini değil. Keeper kod hash'ini kontrol ediyor, ama program etmiyor.
  - `last_valid_slot` alanı u32. Slot sayısı 2³²'ye 60 yıllık ufuk içinde ulaşabilir (hipotez).
- Düzeltme: Upgrade izleme ve uyumsuzlukta otomatik pause yerine güvenli bir durma modu.

**M9 — Taşınabilirlik ve yeniden üretilebilirlik [Kod]**

- `Cargo.lock` yok. Platform-tools sürümü kayıtlı değil. Derleme `api.solpg.io` üzerinden (`build.py`).
- Sabit yollar:
  - `claim-service/tests/v20-svm.test.mjs:5`: `C:/Users/POLAT/...python.exe`
  - `solana-v20/scripts/devnet_readiness.mjs:2`
  - `server.mjs:15` (`../solana/node_modules`): pakette yok, bkz. H4 çökmesi.
- Düzeltme: `anchor build --verifiable` ve Docker imajı, kilitli bağımlılıklar, `solana-verify` ile zincir üstü doğrulama.

**M10 — Telefon akışı uçtan uca tamamlanmamış [Kod]**

- Devnet modunda `enroll/claim` cüzdan imzası istiyor. Safari'de cüzdan yok (`app.js:16`) ve Phantom'a geri dönüş linki yok.
- Uygulama tokenı localStorage'da ve `navigator.share` ile paylaşılıyor.
- Gerçek cihaz testi yapılmadı. Bu, kodun kendi belgesinde de kabul ediliyor.

### DÜŞÜK

- **L1:** Eski staking, Meteora ve DLMM alanları ve talimatları duruyor (`lib.rs:154-179`, `Config`). `initialize` 23.048 baytlık `GlobalBook` hesabı istiyor; ana ağ teklifine göre yaklaşık 0,118 SOL boşa kira. Denetim yüzeyi büyüyor.
- **L2:** Epoch hesap kiraları geri alınmıyor: 720 × 1.503.680 lamport ≈ 1,08 SOL.
- **L3:** Token metadata yok. Sahte "HELI" taklitleri ayırt edilemez.
- **L4:** İhale 256 fiyat seviyesiyle sınırlı. Talep tavanı aşarsa fiyat keşfi tavanda kesilir (`auction.rs:76`).
- **L5:** Zincire yazılan `proof_digest`, tam karar JSON'unun hash'i. Kişisel veriye kalıcı ve herkese açık bir bağlılık. Silme talepleriyle çelişebilir.
- **L6:** Doküman çelişkileri:
  - `.env.example:7`'deki workflow ID, editör grup kimliği (`2856c2d4…`). `start-identity.mjs:9` ise yayımlanmış ID'yi (`a8a9365f…`) zorunlu kılıyor.
  - `operations/README.md` "üç imzalı gider" ve "auction-proceeds→gider yolu yok" diyor. V20'de tek imzalı yol var (C2b).
  - GitHub `README.md` hâlâ V15'i ve Human Dividend/staking'i anlatıyor.
  - `identity.rs` öneki `HELI_IDENTITY_V15`. Zararsız ama kafa karıştırıcı.
- **L7:** Quote mint olarak 6 ya da 9 ondalıklı herhangi bir mint kabul ediliyor (`lib.rs:18`). Doğru USDC/wSOL adresi zincirde zorlanmıyor. USDC seçilirse ihraççının dondurma yetkisi rezervi etkileyebilir.

---

## 3. Gereksinim tablosu

| Gereksinim | Durum | Kanıt / not |
|---|---|---|
| 100M mint, 10M burn, mint yetkisi kaldırılır | **Uygulandı** | `lib.rs:24-35`. Freeze yetkisi yok. SVM'de doğrulandı. |
| 1M ücretsiz, 4M envanter, 70M kasa, 15M yönetim | **Uygulandı** | `genesis`. Toplam 90M. |
| Staking ve aylık ücretsiz HD iptal | **Uygulandı** | Talimatlar hata döndürüyor. Eski kod duruyor (L1). |
| Aylık tavan = floor(serbest × r / 10¹⁸), taban 5M, 720 dönem | **Uygulandı** | `economics.rs:7`. (1+r)^720 = 18,0000000000004. |
| Yönetim aynı tavanı paylaşır, ≤%20 ve ≤¼ | **Uygulandı (miktar için)** | Fiyat ve quote tarafı sınırsız (C1, C2). |
| 12 ay yönetim kilidi | **Kısmen** | HELI release için var. Quote harcaması ve bid için yok (paketin kendi testi 1. ayda fonlanmış bid açıyor). |
| Kullanılmayan yönetim izni devretmez | **Uygulandı** | Pazar payından da düşülüyor (H5). |
| Satılmayan stok yakılmaz; 720'de yalnız kilitli stok yakılır | **Uygulandı** | `lib.rs:180-187`. |
| 6 ayda kullanılmayan ücretsiz pay satışa geçer, hak edilen korunur | **Uygulandı / kısmen** | Yönetici `dispute` riski (M4). |
| Tek kişi bir kez | **Kısmen** | Aynı belge ve aynı kişisel no için var. Farklı belge yalnız sağlayıcıya bağlı (H3). |
| Aile üyeleri ayrı katılabilir | **Yalnız simüle** | Sentetik test var. Yüz-benzerlik ve manuel onay çelişkisi (M5). |
| Satış geliri proje rezervinde kalır | **Kodla çelişiyor** | C2 (PoC3, PoC4). |
| "Piyasa kontrolleri uygulanır" | **Kısmen / yanıltıcı** | M1, M2. Ask fiyatına kontrol yok (C1). |
| Tek yönetici, rotasyon ve kurtarma | **Eksik** | C3 |
| Upgrade yetkisi politikası | **Eksik** | C3. Keeper yalnız izliyor. |
| İhale: tek fiyat, oransal dağıtım, iade | **Uygulandı** | `auction.rs`. Alıcı başına tavan yok (tasarım gereği). |
| Manifest CPI hesap ve vault doğrulaması | **Uygulandı** | `check_market` mint, vault ve sahipliği kontrol ediyor. Kod hash'i kontrol edilmiyor (M8). |
| Webhook HMAC, zaman damgası, tekrar | **Uygulandı (birim testte)** | Webhook yalnız "yeniden çek" tetikliyor, iyi tasarım. Didit imza şeması canlı belgeye karşı tarafımdan doğrulanmadı. |
| Kalıcı webhook kuyruğu | **Uygulandı** | Saniyede 1 iş. Olay kayıtları silinmiyor. |
| Didit gerçek pilotu | **Kısmen** | Rapor: bir onay, tekrar başvuru "review". Farklı belge ve aile testleri yok. |
| Zincire kayıt ve teslim (gerçek ağ) | **Yalnız simüle** | LiteSVM. Identity modunda zincir kapalı. |
| Keeper sürekli çalışma | **Yalnız simüle** | Devnet'e kilitli (`adapter.mjs:30`). Mainnet keeper yok. Sunucu kurulmadı. |
| Kalıcı hosting ve izleme | **Eksik** | Quick tunnel, tek PC, yerel durum ekranı. |
| Yeniden üretilebilir derleme | **Eksik** | M9 |
| Bağımsız denetim | **Eksik** | — |
| Saklama, itiraz ve gizlilik politikası | **Eksik** | Sitede de "pending" yazıyor. |
| Açılış fiyatı, quote, piyasa adresi | **Eksik** | Site bunu doğru biçimde "not finalized" diyor. |

---

## 4. Para kuralı: tavan ile gerçek arz farkı

- Aylık oran yaklaşık %0,40225, yıllık bileşik yaklaşık **%4,94**. İlk tavan 20.112,368685 HELI (doğrulandı), 12. ayda 21.020, 720. ayda en çok yaklaşık 360.572 HELI.
- **Serbest bırakma satış değildir.** Taban, satılmamış envanteri de sayıyor. Talep olmasa da "serbest arz" büyüyor, ama fiilen proje (yönetici) kontrolündeki bir depoda birikiyor. Bu, "dolaşımdaki para" değil, **ihraççı stoku**.
- Yuvarlama ihmal edilebilir: 720 ayda 0,002 HELI.
- Geç settle tavanı değiştirmiyor (taban yalnız settle ve yönetim release ile değişiyor). Ancak o ayın yönetim penceresi kayboluyor.
- Son dönemde (720) yönetim payı 0, pazar tam tavanı alıyor, kapanış kalan kilitli stoğu yakıyor. Kod belgeyle tutarlı.
- **Friedman'a uygunluk:** Sayısal oran, Friedman'ın sabit para büyümesi önerisindeki aralığa yakın (yıllık yaklaşık %3–5). Mekanizma ise farklı:
  - Friedman'ın kuralı takdirsiz bir para stoku büyümesi. HELI'de yeni arz ihraççı envanterine gidiyor ve fiyat ile zamanlamayı yönetici seçiyor (C1). Yani kuralın amacı olan takdir yetkisizliği sağlanmıyor.
  - "Helikopter parası" metaforu bedelsiz dağıtımdır. HELI'de yalnız 1M (%1,1) bedelsiz, gerisi satılıyor.
  - Yönetim payı kullanılmazsa büyüme sabit değil (H5).
  - 60 yılda biten bir ufuk var.
  - Pakette Friedman'a açık bir sadakat iddiası bulamadım. İddia edilirse bu farklar belirtilmeli.

---

## 5. Adversaryal ve ekonomik senaryolar

1. **Sıfır talep:** İhale boş kalır, 4M satılmaz. 6. ayda 999 bin ücretsiz pay da envantere geçer. Hiç alıcı olmasa da satılmamış envanter 12. ayda yaklaşık 5,24M, 10. yılda 7,42M, 30. yılda 16,04M, 60. yılda yaklaşık 51,02M olur. Derinlik olmadığı için yönetim release yapamaz, her ay %20 kaybolur ve 60. yılda yaklaşık 38,98M yakılır. Proje rezervi 0, gider ödenemez. Keeper ücretleri (60 yılda yaklaşık 2,59 SOL gözlem ücreti ve 1,08 SOL epoch kirası) kurucuya kalır. Gözlem her 5 dakikada simülasyonla başarısız olur, bu RPC kotası tüketir.
2. **Tek büyük alıcı:** İhalede 4M'nin tamamını en üst seviyeden alabilir (yasak değil). Ardından aylık stoğu alabilir. Kendi bid'iyle top-bid derinliğini ve fiyatı belirleyip yönetim release şartlarını tetikleyebilir ya da M2 ile engelleyebilir. Yöneticiyle anlaşırsa C1 ile envanteri sıfıra yakın fiyattan alır. Fiyat ve dağılım tek elde toplanır.
3. **Aylık stok satılmıyor:** Envanter birikir ama tavan büyümeye devam eder. Fiyat düşük kalırken arz takvimi talepten bağımsız ilerler. Gelecekte talep gelirse birikmiş stok (onlarca milyon) tek seferde arz edilebilir. "Aylık tavan" satış hızını sınırlamaz, yalnız release hızını sınırlar.
4. **Bir yıl keeper kesintisi:** Herkes `settle` çağırabildiği için kural durmaz. Keeper dönünce 24 işlemle (12 open + 12 settle) yaklaşık 0,018 SOL kira ve ücretle yakalar. Kalıcı etki: 12 ayın yönetim penceresi kaybolur. Simülasyonda 60. yıl serbest arzı 89,14M, yakım 0,86M. Admin pause açıksa kimse settle edemez (H2).
5. **Yönetim kotasını hiç kullanmıyor:** 51,02M serbest, 38,98M yakım. Pazar payı da azalır, çünkü yönetim payı düşülüyor. "90M" iddiası pratikte gerçekleşmez.
6. **Quote iflası / SOL tükenmesi:** Quote rezervi SOL ödeyemez, kodda takas yolu yok (operasyon belgesi de doğru biçimde belirtiyor). Sponsor SOL biterse UI'deki tüm başvuru ve talep işlemleri durur, çünkü işlemlerin ücretini sponsor ödüyor. Zincirde doğrudan `claim_launch` mümkün, ama UI yok. Keeper SOL biterse settle başkaları tarafından yapılabilir, gözlemler durur, yönetim release yapamaz. Rezerv C2 ile boşaltılmışsa geri ödeme veya "karşılık" algısı tamamen boştur. Rezerv zaten bir geri ödeme garantisi değildir.
7. **Aynı kişi, başka cüzdan:** Aynı belge veya aynı kişisel no ile sunucu "duplicate" der, zincir aynı nullifier'ı reddeder. Farklı belgeyle ve `personal_number` yoksa engel yalnız Didit'in yüz-tekrar uyarısıdır (H3, canlı testte kanıtlanmalı). Sunucu atlatılsa bile verifier imzası gerekir. Verifier anahtarı çalınırsa 1.000 sahte kayıt olur.
8. **Yönetici anahtarı ele geçirildi:** Envanter sıfıra yakın fiyattan satılır (C1). Rezerv bid ve gider yoluyla boşaltılır (C2). Gider 7 gün sonra pause'a rağmen ödenir ve iptal edilemez. Kalıcı pause ile settle durdurulur.
9. **Gözlem manipülasyonu:** M2'deki gibi, 24 saat boyunca saatte bir flash bid ile referans fiyat itilir. Yönetimin satış ve release işlemleri ±%2 bandına giremez.

---

## 6. Asgari, öncelikli onarım planı

**Devnet öncesi (yerelde yapılabilir):**

1. `initialize` erişimini kısıtlayın (H1). Upgrade authority ve yönetici modelini yazılı olarak belirleyin (C3).
2. Fiyat korumaları:
   - `place_project_ask` için taban.
   - Yönetim bid ve ask'ları için referans bandı.
   - Dönemsel quote harcama tavanı (C1, C2a).
3. Gider yolu: beyaz liste, `cancel_expense`, pause kontrolü, değişmez tavan (C2b).
4. Pause'u sınırlayın. `settle/open_epoch` pause'dan bağımsız olsun (H2).
5. Kümülatif yönetim release sınırı ekleyin, flash gözlem korumasını (introspection) ekleyin (M1, M2).
6. Verifier ve admin rotasyonu, credential iptali, dispute gerekçesi (C3, M4).
7. Claim-service:
   - IP ve cüzdan bazlı limit, çökme düzeltmesi, oturum TTL, kurtarma akışı (H4, M5).
   - Sponsor bütçesini onaylanan işlem üzerinden düşün (M6).
8. Yeniden üretilebilir derleme ve `Cargo.lock`. Sabit yolları kaldırın (M9).
9. Her düzeltme için bu raporun PoC'lerini **ret testi** olarak ekleyin.

**Devnet'te yapılması gerekenler:**

- Runbook ile tam kurulum sırası (M7) ve gerçek Manifest market.
- Keeper ile 7/24 test (RPC kesintisi, yeniden başlama).
- Gerçek telefonlarla akış: Phantom → Safari → Didit → geri dönüş → enroll → 7 gün → claim.
- Canlı kimlik testleri: aynı kişi + farklı belge, ikizler veya benzer aile üyeleri, manuel onay, iptal edilen karar.
- Sponsor maliyet ölçümü.
- Upgrade ve pause tatbikatı.

**Mainnet'i bloklayanlar:**

- C1–C3 ve H1–H4'ün kapatılması.
- Bağımsız güvenlik denetimi. Bu raporun 1.606/4.348 sayıları bir denetim değildir.
- Doğrulanabilir derleme (on-chain hash = kaynak).
- Kalıcı hosting, dış izleme, yedek ve kurtarma.
- Yargı alanının belirlenmesi ve ona göre hukuk ve gizlilik çalışması (kimlik ve biyometrik veri, token satışı, beyanlar).
- Açılış fiyatı, quote mint ve piyasa adresi kararları.
- H5 politika kararı.

---

## 7. Sahibin vermesi gereken politika kararları (sessizce değiştirmedim)

1. **Yönetim payı kullanılmazsa ne olacak?**
   - (a) Mevcut durum: kaybolur ve 60. yılda yakılır. Gerçekçi üst yol yaklaşık 51M ile 90M arası.
   - (b) Kullanılmayan pay aynı ay pazar envanterine geçer. 90M yolu talepten bağımsız korunur, ama ihraççı stoğu daha da büyür.
   - (c) "90M" ifadesini bırakıp gerçekçi aralığı yayımlayın.
2. **Envanter satış fiyatında takdir yetkisi:** Yönetici serbest mi kalacak, yoksa kural tabanlı mı olacak (ihale fiyatı veya TWAP tabanı, deterministik merdiven, periyodik ihale)? Kural seçilirse "Friedman tarzı takdirsizlik" iddiası güçlenir.
3. **Rezervin kullanım amacı:** Gider kasası mı, likidite mi? Hangi tavan ve hangi hedefler? Sabit fiyattan geri ödeme yok ve bu açıkça söylenmeli. Mevcut metinler bunu doğru söylüyor.
4. **Satılmayan stok tabanı büyütmeye devam etsin mi?** Alternatif: taban yalnız satılmış veya dağıtılmış arz olsun. Bu, sıfır talepte arzın birikmesini önler ama kuralı talebe bağımlı kılar.
5. **Aile ve ikiz politikası ile manuel onay:** Uyarı varken manuel onay kabul edilecek mi? Kabul edilecekse kim, hangi kayıtla karar verecek?

---

## 8. Çalıştıramadığım veya doğrulayamadıklarım

- Program kaynağını kendim derlemedim (yasak dış derleyici; yerel Solana/Anchor araç zinciri yok). Kaynak→ELF bağı yalnız paket kaydına dayanıyor.
- Devnet veya mainnet'e dağıtım, gerçek RPC, gerçek Manifest market, gerçek USDC veya wSOL kullanılmadı.
- Didit canlı davranışı (yüz-tekrar tespiti, manuel onay, webhook imza şemasının güncel belgeyle uyumu, fiyatlandırma: sitedeki "500 ücretsiz / 0,33 USD") doğrulanmadı.
- Gerçek telefon, kamera, Phantom ve Safari akışı denenmedi.
- `heli-experiment.pages.dev` ve trycloudflare erişilebilirliği denenmedi. Quick tunnel'ın kalıcı olmadığı kodun kendi raporunda da yazıyor.
- M3 (süresi dolmuş bid DoS) ve Manifest'in u32 slot sınırı yeniden üretilmedi.
- Yargı alanı belirtilmediği için hukuki yükümlülükleri araştırmadım ve uydurmadım.
- `build.py`, `start-identity.mjs`, probe ve dağıtım betikleri bilinçli olarak çalıştırılmadı.
- Node 24 yerine 22.22 kullandım. Tüm testler yine de geçti.

---

## Ek: PoC'nin yeniden üretilmesi

`reviews/poc_review.py`, paketteki `heli/solana-v20/scripts/` dizinine kopyalanıp şu komutla çalıştırılır:

```sh
python scripts/poc_review.py   # solders==0.29.0, yerel LiteSVM; ağ, anahtar veya fon kullanmaz
```

Gözlenen çıktı (atom; 1 HELI = 10⁶, 1 quote = 10⁶):

```
poc1: top_bid_depth 9_995_000_000, per_call 199_900_000, calls 21, released 4_197_900_000 (≈%42 derinlik)
poc2: alıcı 990_005 HELI için ~0,99 quote ödedi; proje, önce Bob'un 9_995 HELI'lik bid'ini doldurarak ~9_995 quote aldı (ilk sürümdeki "1_000_000 quote-atom gelir" yalnız çekilen kısımdı)
poc3: rezerv 66_000_000 → 26_000_000, anlaşmalı satıcı +40_000_000 (1 HELI karşılığı)
poc4: rezervin tamamı (26_000_000) yöneticinin özel hesabına, paused=true iken
poc5: önceki örnekler 1_000_000; flash örnek 5_000_000; teminat tamamen geri çekildi
```
