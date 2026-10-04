# HELI V22 bağımsız adversaryal inceleme

Esas alınan tek kaynak: `f53f6ab76b8eaf1e18e82f57dc12ea7fa1b92bf2`, PR #6. Yeni GitHub arşivi ayrı klasöre indirildi; eski yerel HELI kopyaları kullanılmadı. Program veya para politikası değiştirilmedi. Ağ dağıtımı, gerçek fon/kimlik/anahtar, `.private`/`.state` erişimi ve harici derleyici kullanılmadı. Bu inceleme tam güvenlik denetimi değildir.

## Özet

| Değişiklik | Hüküm | Kanıt ve sınır |
|---|---|---|
| 1. Hazineye gider ödemesinin engellenmesi | Doğrulandı | `src/lib.rs:112,124,251–255`; SPL token yetkilisi config veya bilinen trader/funder PDA'larından biri olamaz. Teklif ve ödeme ayrı kontrol edilir. `test_expense_v22_svm.py` geçti. Bu, yöneticinin kendi kişisel hesabına gider teklif etmesini engellemez; tek yönetici ve gider tavanı tasarımı devam ediyor. |
| 2. 720 sonrası gider ayı | Doğrulandı | `src/calendar.rs:29–37`, `lib.rs:126–129`. Orijinal başlangıç gününden türeyen sınırlar; 31 Ocak → Şubat kırpması, 721/722/1200 ay testleri geçti. Sayaç u16 sınırında doyar; sonsuz sayaç değildir. |
| 3. Kapanış sonrası gelir → gider | Doğrulandı; fiyatlandırma eksikliği var | `lib.rs:89,99,118–139`, `management.rs:69`. Gelir aktarımı/bağış/gider açık, yönetim emirleri ve yeni release kapalı. `test_policy_v22_svm.py closure` geçti. Ancak satışların fiyat referansı yenilenemiyor (bulgu B2). |
| 4. depth/50 ay toplamı | Doğrulandı | `management.rs:89–96`, `release.rs:217,236`. Ortak `epoch.founder` sayacı. Her çağrı anındaki derinliğe göre kontrol edilir; geçmişteki derinlik sabitlenmez. `depth` testi geçti. |
| 5. 1.000 alt sınır, kendi emirlerinin dışlanması, çöküş istisnası | Kısmen | `release.rs:19,65–109`, `management.rs:108–115`. 1.000 sınırı ve koltuk sahipliği filtresi gerçek Manifest ELF'iyle çalışıyor. Ancak ilk 64 düğüm sınırı, filtrelenen proje emirlerinin ölçümü engellemesine izin veriyor (B1). Çöküş koşulunun yönetici satışlarıyla oluşturulabilmesi politika riski (B4). |
| 6. Ücretsiz pay kaldırılması | Doğrulandı | `lib.rs:20,38–44,50–55,200`, `auction.rs:7`. Launch kasası 0; 5M satış envanterine, ihalede OFFER_HELI=5M. `test_no_free_allocation_svm.py` ve Node zincir testi geçti. |

Yukarıdaki kaynak yollarının kökü `heli-v20-package/heli/solana-v20/`.

## Yeni bulgular

### B1 — P2: 64 küçük emir fiyat ölçümünü engelliyor

- **Dosya:satır:** `src/release.rs:82–93,99–113`.
- **Senaryo:** Geçerli 1,0 dış referansı ve 1.500 HELI / 1.500 quote birimlik dış alış varken yönetim koltuğuna 1,05 fiyatından 64 adet, her biri 1 HELI atomu olan alış koyuldu. Toplam yeni base miktarı 0,000064 HELI. Rent için yalnız yerel sentetik SOL kullanıldı. Sonraki gözlem `Market guard` ile reddedildi; örnek sayısı değişmedi. Yeni emirlerin henüz bir saat dinlenmemesi de tarama yuvalarını tüketmelerini engellemiyor.
- **Etki:** Kendi emirleri fiyat/depth toplamına katılmıyor ama ilk 64 düğüm taramasını tüketiyor. Dış alıcılar görünmez oluyor; referans eskiyip yönetim release'i durabilir. Yönetici yetkisi gerekmeyen dış cüzdanlar da benzer biçimde çok sayıda küçük emir koyabilir (bu dış-cüzdan varyantı ayrıca çalıştırılmadı). `outside_bid_quote` 64 düğümden sonra gerçek toplam yerine `u128::MAX` döndürüyor; eksik tarama "pazar derin" sayılıyor ve çöküş alımını kapatabiliyor. Büyük emir defterleri saldırısız da bu sınıra gelebilir.
- **Öneri:** Eksik tarama ile ölçülmüş derinliği ayrı durumlar olarak taşı; süre/compute sınırları içinde sayfalı veya devam edebilen ölçüm tasarla. Salt limiti yükseltmek saldırıyı yalnız pahalılaştırır. Hangi eksik-ölçüm davranışının istendiği açıkça seçilmeli.
- **Durum:** Proje-koltuğu gözlem engellemesi **yeniden üretildi** (`adversarial_svm.py`, `adversarial-results.json`). Rezerv istisnasının kapanması kodla doğrulandı; aynı PoC içinde ayrıca ölçülmedi.

### B2 — P2: 60. yıl sonrasında satış açık, fiyat referansı güncellemesi kapalı

- **Dosya:satır:** `src/release.rs:123,141–145,180–187`; `src/manifest_bridge.rs:96–103`; `heli/keeper/planner.mjs:6`.
- **Senaryo:** Tam 720 aylık testten sonra `close_constitution` tamamlandı. Bir gün sonra `observe_release_market` `Invalid state` verdi. İlk ihale fiyatı 100 quote atomu/HELI iken 95 atomdan proje satışı `PriceOutsideBand` ile reddedildi.
- **Etki:** Son referans en fazla bir saat geçerli. Kapanıştan sonra gözlem yenilenemediğinden proje satışlarının tabanı kalıcı olarak eski açılış ihalesi fiyatı oluyor. Piyasa bunun altındaysa envanter satılamayabilir ve gider finansmanı aksayabilir. Bu gelecekteki piyasa sonucu bir hipotezdir; gözlemin kapanması ve tabanın geri dönmesi gerçek ELF'te doğrulandı. Gelirin gider kasasına aktarılabilmesi düzeltmesi doğrudur, fakat gelir elde edilebilmesini garanti etmez.
- **Seçenekler:** (A) Yeni arz/yönetim emirleri kapalı kalırken yalnız mevcut envanterin fiyat gözlemini açık tut; keeper'a kapanış sonrası bu bakımı ekle. (B) Eski ihale tabanını bilinçli kalıcı kural olarak belgelerde ilan et. (C) Kapanış için ayrı fiyatlandırma kuralı seç. Hiçbiri sessizce uygulanmadı.
- **Durum:** **Yeniden üretildi** (`closure_svm.py`, `closure-results.json`).

### B3 — P2: Satılmayan stok büyüme tabanına girmiyormuş izlenimi veren anlatım

- **Dosya:satır:** `src/economics.rs:7`, `src/market_release.rs:42–52`; `heli/website/index.html:19–20`, `heli/website/heli-rules.txt:10,22–24`.
- **Senaryo:** `capacity = (mint.supply - sum(config.stocks)) × RATE`. Settlement satış/gelir koşulu aramadan aylık rezervi `market-inventory` hesabına taşır ve kilitli stock sayacından düşer. Satılmamış envanter bir sonraki ayın release hesabında serbest arz olarak sayılır. Pazar testinin 720 ay kısmında sürekli satış zorunluluğu yoktur.
- **Etki:** Kullanıcı "talep yoksa release büyümesi durur" sonucunu çıkarabilir; kodda durmaz. Dolaşım/satış ile anayasadaki released taban farklıdır. RELEASE tavanı aşılmıyor; kusur mevcut koddan farklı bir ekonomik davranış ima edilmesidir.
- **Öneri:** Mevcut politikayı koruyarak açıkça yaz: "Kilitleri açılmış, henüz satılmamış proje envanteri de sonraki ayın hesap tabanına girer; satış için alıcı gerekir." Satışa bağlı büyüme istenirse bu ayrı bir para politikası kararıdır, düzeltme diye uygulanamaz.
- **Durum:** **Kod ve mevcut yerel SVM akışıyla doğrulandı**; ayrı adversaryal satışsız 720 aylık test yazılmadı.

### B4 — Politika riski: Yönetici sığlaşmayı kendi satışıyla oluşturabilir

- **Dosya:satır:** `src/management.rs:108–115`; `src/release.rs:151–156`; `src/manifest_bridge.rs:96–131`.
- **Senaryo:** Referans eskidiğinde dış alışlar 1.000 eşiğinin üzerindeyse keeper'ın durmuş olması tek başına çöküş emri açmadı. Yönetici, proje envanterinden 1.500 HELI satarak bu dış talebi tüketti. Ardından son dış referansın %95'iyle rezerv alış emri kabul edildi.
- **Etki:** İstisna sığlaşmanın nedenini ayırt etmiyor. "Dış alıcılar doğal olarak kayboldu" garantisi yok. Bağlı dış satıcıya rezerv alımı yaptırılması riski tamamen bitmiyor; fiyat tavanı ve crash bütçesi hâlâ geçerli. Gizli kişisel cüzdanları ayırt edememek zaten belgelenmiş bir sınır.
- **Ay sınırı:** Başlangıç tarihine bağlı aylık sınırda `crash_spent` sıfırlandı; önceki ay ve yeni ay bütçeleri kısa aralıkta kullanılabilir. Bu takvim-ay politikasıdır, aynı ay tavanını atlama değildir. Kayan 30 gün koruması yok. Ayrıca `crash_base`, ilk crash emri anındaki `auction-proceeds` SPL bakiyesidir; Manifest'e önceden yatırılan quote veya gider kasası dahil bütün ekonomik rezerv değildir. 30 günlük yaş şartı yalnız son referansın kullanılmasına uygulanır; istisna eski referanstan sonra tamamen kapanmaz, ihale fiyatına döner.
- **Seçenekler:** (A) Mevcut takvim/sığ-pazar kuralını kabul edip sınırları açıkça anlat. (B) Sığlığın belirli süre devam etmesini zorunlu kıl. (C) Kayan süre bütçesi seç. Bunlar politika tercihidir; para politikasını değiştirmedim.
- **Durum:** Yönetici satışıyla koşulun açılması ve ay sınırı **yeniden üretildi** (`crash_svm.py`, `crash-results.json`). Bağlı satıcıyla rezerv boşaltma ayrıca yeniden üretilmedi; risk senaryosudur.

### B5 — P3: Kamuya açık mutlak iddia ve çelişkili kurallar

- **Dosya:satır:** `heli/website/index.html:15,20,55`; `heli/website/heli-rules.txt:34–40`; kök `README.md` son Türkçe paragraf; `heli/solana-v20/DEPLOYMENT.md` upgrade planı.
- **Etki/öneri:** "No one can speed it up" ancak mevcut program kodu için, upgrade yetkisi kaldırıldıktan sonra mutlaklaştırılabilir. Şu anda upgrade anahtarı kodu değiştirebilir. Açıkça bu şartı ekle. `heli-rules.txt` çöküş istisnasını anlatıp hemen ardından "none without a reference" diyor; site de benzer çelişki taşıyor. "Çöküş istisnası hariç" eklenmeli. Satışlar yalnız aşağıdan %95 ile sınırlıdır; üst satış fiyatı %105 değildir, bu sınır alış içindir. Sitedeki "buy/sell orders ... within 95%–105%" bunu yanlış ifade ediyor. README'nin Türkçe kısmında hâlâ insanlara dağıtım/canlı kimlik pilotu güncel tasarım gibi anlatılıyor. İnceleme raporunun son bölümündeki "site güncellenmedi" notu da güncel dosyalarla çelişiyor.
- **Durum:** **Dosyalardan doğrulandı**. Canlı Cloudflare yayınının bu commit'e eşit olduğu kontrol edilmedi.

## Diğer kontroller ve yanlış alarmlar

- Yıllık bileşik tavan `(1+RATE/SCALE)^12-1 = %4,9352033401`; yaklaşık %4,9 doğrudur. Sabit toplam arz 90M ile released tabanın artışını ayırmak gerekir.
- Ay 1, başlangıçtan boundary(1)'e kadardır; `epoch()` ve `month_index()` bu sayımı yapar. Epoch n settlement'i ay n bittiğinde gerçekleşir, yönetim hakkı sonraki sınır aralığında kullanılabilir. n=12 ilk 12 tam ay sonrasıdır. `epoch` arz tarafında 721'e doyar; gider ayı ayrı devam eder. Ay sonu kırpması her seferinde orijinal anchor'dan hesaplanır; Şubat kırpması Mart'ı 28'e kaydırmaz.
- Manifest okuması: market owner/executable/sabit program ID, header/mint/vault kontrolleri `manifest_bridge.rs:11–20`; `node` 80 bayt hizalama, NIL ve veri uzunluğunu doğrular (`release.rs:50`). Order payload 64 bayt; seat indeksi payload 32..36, seat trader anahtarı düğüm başlangıcı+16..48. `node` son 80 baytı sınırlandırdığı için bu dilimler mevcut doğrulanmış layout'ta veri dışına çıkmaz. Ayrı seat node türü kontrolü yok; güvenlik şu Manifest programının geçerli order/seat indeksleri üretmesine bağlı. Gerçek paket ELF'iyle kendi yönetim koltuğu filtresi geçti. Bunu bağımsız bütün Manifest sürümlerine veya keyfi yükseltmeye taşınabilirlik kanıtı saymıyorum.
- Upgrade authority ile initialize kısıtlaması var (`accounts.rs:4–7`); front-run için sırf herkesin talimatı çağırabilmesi yeterli değil. Yönetim/ask hesaplarında admin signer ve has_one; token kasalarında PDA, mint ve token-authority kontrolleri var. Gider ödeme imzacısız olması kusur değil: hedef/tutar önceden imzalı teklifte sabit, gecikme/tavan/iptal/pause programda kontrol ediliyor. Bulunan yeni bir yetkisiz transfer yolu yok; bu sonuç bütün hesap kombinasyonlarının formal kanıtı değildir.
- IDL'nin kullanılan talimatları, signer/mut listeleri ve hesap düzenleri Python fixture ve gerçek JS adapter üzerinden paket ELF'iyle çalıştı. Eklenen `ReleasePolicy`/`ManagementBook` alanları decode edildi; 6015/6016 kaynak ve IDL'de mevcut. Yerel Anchor IDL yeniden üretilemedi; bütün IDL'nin derleyici çıktısıyla eşliği garanti edilmiyor.
- Ücretsiz talimatların handler'ları kapalı. Anchor hesap doğrulaması handler'dan önce çalıştığı için geçersiz/eksik hesapla her çağrının özellikle 6016 vermesi beklenmez; daha erken hesap hatası gelebilir. Bu ücretsiz coin bypass'ı değildir. Launch kasası boş, reward budget 0; fresh V22 genesis'te eski staking pozisyonu açılamıyor. Birinin kendi coinini hediye etmesi veya üçüncü taraf airdrop yapması protokol ücretsiz payı değildir.
- İhale bir alıcının 5M'nin tümünü almasına izin veriyor: sahibin tasarım tercihi, açık değil. Pro-rata base dağıtımı aşağı, quote tahsilatı yukarı yuvarlanıyor; kullanılan miktar/collateral sınırları içinde. Son claim sonrası fractional reserved dust serbest kalıyor. Claim'de pause/closed kontrolünün olmaması, ödenmiş ihale hakkının geri alınması değil, alıcı tesliminin korunmasıdır.
- Ed25519 introspection artık ücretsiz token erişimi sağlamıyor: `issue_credential` handler'ı doğrulamaya ulaşmadan reddediliyor. Arşiv kimlik servisinin kalan riskleri bu sürümün aktif token erişim açığı olarak sunulmadı. Gerçek webhook/kimlik sağlayıcısı çağrılmadı.
- Keeper aylık settlement'i pause altında da sürdürüyor, tahmini imzayı göndermeden journal'a yazıyor, belirsiz sonucu blokhash geçerliliğinde aynı transaction ile sorguluyor; expire sonrası bakım allowlist'i ile fresh state/pin kontrolü var. Geçen 720 aylık test journal/RPC kesintilerinin 720 ay boyunca gerçek ağ davranışını kanıtlamaz. Yeni kesin journal double-release açığı bulmadım. Kapanışta planlayıcının tüm bakımı durdurması B2'yi destekliyor.

## Yeniden çalıştırılanlar

Python 3.13, solders **0.29.0**, Node **24.19.0**. Yeni snapshot'ın kendi mobile lockfile bağımlılıkları ayrı kuruldu; kurulum scriptleri kapalı. Eski proje node_modules veya Python modülleri kullanılmadı.

- `scripts/test_*_svm.py`: 9 tek-mod betik + `test_policy_v22_svm.py depth` ve `closure`, **11 çalıştırma başarılı**. Bunlar bağımsız test-vakası sayısı değildir.
- `keeper/tests/test_v20_svm.py`: bağımlılık kurulmadan ilk deneme modül hatası verdi; yeni bağımlılıklar kurulduktan sonra **başarılı**. 720 ay, 1.441 planlanan iş, 4.352 kontrol/işlem; bunları test veya kullanıcı sayısıyla toplamadım.
- İstenen Node paketi: **112 test, 112 başarılı, 0 başarısız/atlanan**. Arşiv claim-service testleri de yalnız sentetik/yerel çalıştı.
- Ek adversaryal PoC'ler: `adversarial_svm.py`, `crash_svm.py`, `closure_svm.py` **başarılı**. Hazır suite'lerin bütününün geçmesi B1/B2'yi yakalamadıkları için güvenlik kanıtı değil.

## Hash ve çalıştırılamayanlar

İndirilen kaynak dosyalarının build scriptindeki aynı sırayla SHA-256'sı:
`e1726b41d13899735bbecc774837942962ecae13a1ebcd2fae0620bdb8b0a9c3`.
İndirilen ELF'in SHA-256'sı:
`e16495fcf257c2bb7927f0335d7d7d16cdba1c32e72eb8417c40d543204d0077`.
**İkisi de beklenenle eşleşiyor. Ancak bu, kaynaktan yeniden derleme sonucu değildir.** Fixture'ın manifest ile iki dosya hash'ini karşılaştırması da kaynak→ELF provenansını tek başına kanıtlamaz.

- `build_local.sh` ile yeniden derleme **yapılamadı**: bu Windows ortamında kullanılabilir bash/Agave 2.1.21 `cargo-build-sbf`, platform-tools v1.43 veya Docker yok; WSL durum sorgusu da kullanılabilir bir Linux ortamı vermedi. Kurulum/OS değişikliği yapılmadı. Temiz yeniden derleme ve `solana-verify` bağımsız doğrulanmış sayılmamalı.
- Anchor IDL yeniden üretimi, Manifest layout kaynak derlemesi, kapsamlı fuzz/formal doğrulama ve ekonomik manipülasyon optimizasyonu yapılmadı.
- Devnet/mainnet, gerçek fon, gerçek kimlik, harici derleyici ve canlı hizmet çağrıları kurala uygun olarak yapılmadı. Canlı web yayını doğrulanmadı.

**Hüküm:** Prototipin altı değişikliğinin çoğu gerçek program testleriyle doğrulandı; pazar ölçümünde yeniden üretilmiş bir kullanılabilirlik açığı ve kapanış sonrası fiyatlandırma boşluğu var. Mainnet hazır hükmü desteklenmiyor. Öncelik B1; B2 ve çöküş istisnasının kapsamı sahibin açık kararıyla çözülmeli.
