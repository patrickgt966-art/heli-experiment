# HELI V22 son bağımsız inceleme — 5 Ekim 2026

İncelenen tek kaynak: `74c05949877e3a73f877289a67bc3861b71ffa99` (PR #16).
Program değiştirilmedi. Bu dal yalnız inceleme raporu, sentetik deneme betikleri ve çıktılar içerir. Ağ dağıtımı, gerçek fon, gerçek kimlik veya özel anahtar kullanılmadı. Daha eski yerel kopyalar incelemeye esas alınmadı.

## Önce derleme kanıtının sınırı

Bu Windows ortamında kullanılabilir Bash/Linux, Agave 2.1.21 ve platform-tools v1.43 yok. `build_local.sh` **çalıştırılamadı**; kaynaktan yeniden derlenmiş ELF elde edilmedi. Bu bir hash uyuşmazlığı değildir, bağımsız yeniden derleme kanıtının eksikliğidir. Lansman öncesi ayrıca kapatılmalıdır.

Paketin gerçek baytları üzerinden hesaplanan üç hash ve ELF boyutu verilen değerlerle eşleşti (`hashes.json`):

| Nesne | Sonuç |
|---|---|
| 10 Rust dosyası, build_local.sh sırası | `d6d1cf5bc354cfc31d788ced1ec9333367b3a79f5a2e420e8d02b26b26b21cfb` |
| Paket ELF | `12ac8cb733fe6c5b53ef2de17e905308f79f0772f2d41784a58599c8c46a0964` |
| ELF uzunluğu | 1.001.600 bayt |
| Cargo.toml | `85e79529e7698bce722f4ede3686a9273a118841dd6fdd97338cc70febcfa185` |

`compiled-source.json` ve fixture içindeki hash assert'i, dosyaların kayıtla tutarlılığını doğrular; tek başına ELF'in bu kaynaktan üretildiğini kanıtlamaz. Aşağıdaki SVM sonuçları **paket ELF'i** içindir.

## Özet

| Kontrol | Sonuç |
|---|---|
| Kayan rezerv alış sınırı ve iptal iadesi | **Kısmen:** iptal yanlış günün harcamasını silebiliyor (F1) |
| Çöküş kaydı: iki saatlik boşluk ve dış talepte sıfırlama | Mevcut yerel testler geçti; örnek alınamasa da Deep kaydı silinebiliyor |
| Referanssız satış tabanı | Kodda `max(ihale, yakın referans × %95)`; bazı kamu metinleri eksik |
| Gider anında ödeme, gelir / rezerv ayrımı, proje tabanı | Normal gider testleri geçti; self-trade kaynaklı sahte gelir bu ayrımı aşabiliyor (F2) |
| Kendi kendine işlem yasağı | **Kısmen:** yönetim satışları kapsam dışında; slot/zaman ayrışması da korumayı bitirebiliyor (F2/F3) |
| Meta veri → genesis, mint yetkisinin kaldırılması | Meta veri kontrolleri ve 100M → 90M dağılımı geçti; policy kurulmadan genesis mümkün (F4) |
| Kimlik ve staking temizliği, 250 quote alt sınır | Silinen talimatlar reddediliyor; ücretsiz pay yok; derinlik testleri geçti |
| Aylık ortak arz ve 60. yıl kapanışı | Mevcut 720 aylık senaryolar geçti; yeni bir arz-tavanı atlatması yeniden üretilmedi |
| Config/Epoch ve diğer hesap boyutları | Taşma bulunmadı; OpeningAuction'da 169 bayt fazladan alan var |
| Keeper planlayıcısı | Sığ piyasada başarılı gözlemi tekrar tekrar planlıyor (F6) |

Aşağıdaki dosya yolları `heli-v20-package/` tabanına göredir. Bulgular yönetici tarafından kullanılan yolları da kapsar: projenin amacı yönetici yetkilerini kodla sınırlamaktır. Her bulgu dışarıdan anonim saldırı anlamına gelmez.

## F1 — Yüksek: iptal iadesi alışın kendi gününden düşülmüyor

**Dosya:** `heli/solana-v20/src/management.rs:153–159`; bütçe kontrolü `130–139`.

**Senaryo:**
1. Sentetik rezerv 1.860 quote birimi; alış sınırı 186.
2. D0 gününün sonuna doğru 20 birimlik A alış emri verilir; dolmaz.
3. D1 gününde B emri 102 birim harcar ve tamamen dolar.
4. A, slot süresi dolmadan iptal edilir. Kod `newest days first` kullanır: D1'deki gerçek 102 harcamayı 82'ye düşürür; D0'daki 20'yi bırakır.
5. D31 başında D0 dilimi silinir; B alışının üzerinden yalnız 2.531.520 saniye (29,3 gün) geçmiştir.
6. Yeni 104 birimlik alış kabul edilir. Sayaç 82 + 104 = 186; son 30 günün gerçek harcama ve yeni emir toplamı 102 + 104 = **206**.

**Sonuç:** kayan %10 sınırı aşılır. 31 dilim kullanılması yanlış gün atamasını telafi etmiyor. İptal edilen emrin dolmamış kısmını iade etmek doğru politika; yanlış harcamaya iade yazılması kusurdur.

**Düzeltme:** her alışın sequence, yerleştirme günü, başlangıç quote tutarı ve kalan iade hakkını program hesabında saklayın; iptali yalnız o emrin özgün gününden düşürün. Süresi pencere dışında kalan emrin iptali yeni günün kotasını açmamalı. Kısmi dolum, gün sınırı, tekrar iptal ve yuvarlama regresyonları ekleyin.

**Doğrulama:** yerel ELF/Manifest testi, `poc_final_svm.py cancellation`; `poc-cancellation.json`. Gerçek dolum, iptal ve yeni emir talimatları kullanıldı; program hesapları elle değiştirilmedi. Zaman ilerletildi; bu test slot/zaman ayrışmasına ihtiyaç duymaz (A aynı slot ömrü içinde iptal edilir).

## F2 — Yüksek, koşullu: zaman koruması biterken slot tabanlı emir hâlâ canlı olabilir

**Dosya:** `heli/solana-v20/src/release.rs:230,240`; `management.rs:145`; `manifest_bridge.rs:102,209`; gelir harcaması `lib.rs:146–166`.

**Senaryo:**
1. Yönetim koltuğuna toplam 90 quote aktarılır; 80 HELI için 1,02 fiyatında alış konur (81,6 quote).
2. Sentetik Clock 172.801 saniye ve 172.801 slot ilerletilir: iki gün geçmiştir, fakat 216.000-slot emir sonu gelmemiştir. Bu, bir saniye/slot gibi yavaş ilerleme varsayımıdır.
3. Timestamp ile tutulan `mgmt_bid_until` biter; proje aynı fiyattan 80 HELI satar. Alıcı hâlâ canlı yönetim alışıdır.
4. Proje 81,6 quote çeker; `revenue_total` 81,6 artar. Yönetim kullanılmayan 8,4 quote'u geri getirir. Proje rezervi başlangıçtaki **1.100** birime döner: dışarıdan yeni gelir yoktur.
5. Bu sahte gelir için 81,6 birim gider önerilir; yedi gün sonra dış sentetik cüzdana ödenir. Rezerv 1.018,4 olur, 1.000 tabanı korunur. Gelir olmasaydı aynı başlangıç rezervinde olağan gider sınırı yaklaşık **32,916666** birimdi.

**Sonuç:** iç fon dolaşımı %100 harcanabilir gelir yapılabiliyor; rezervden olağan gider sınırının ötesinde para çıkarılıyor. Yönetici erişimi ve slot/zaman ayrışması gerekir. Yerel senaryo gerçek ağın şu an bu koşulda olduğunu kanıtlamaz. İki gün seçimi kabul edilmiş politika olsa da “her zaman slot ömründen uzun” varsayımı matematiksel garanti değildir; bu, kabul edilen 49. yıl u32 taşmasından farklıdır.

**Düzeltme:** SelfTrade kontrolünü canlı emirlerin aynı slot ölçütündeki ömrüne bağlayın veya CPI öncesi proje koltuklarının karşı emirlerini doğrulayın. İç karşı taraf eşleşmesini reddedin. Ek olarak satış gelirini iç rezerv dolaşımından ayıran muhasebe savunması düşünün. Yalnız pencereyi birkaç gün artırmak mutlak garanti sağlamaz.

**Doğrulama:** koşullu senaryo yerel ELF ile yeniden üretildi, `poc_final_svm.py slot-time`; `poc-slot-time.json`. Gider ödemesi de gerçek program talimatıyla geçti. Gerçek ağda oluşabilirlik ölçümü yapılmadı.

## F3 — Düşük: yönetim satış emri SelfTrade kontrolünden geçmiyor

**Dosya:** `heli/solana-v20/src/management.rs:118–151`, özellikle `if is_bid` bloğu `130–146`.

**Senaryo:**
1. Dış alış fiyatı 1,00 iken yönetim 10 HELI için 1,02 alış koyar.
2. Yönetim kendi çalışma envanterinden 10 HELI'yi aynı fiyattan satışa koyar.
3. Manifest aynı yönetim koltuğunun alışını eşleştirir; HELI geri çekilebilir. `ask_until` hâlâ sıfırdır.

**Sonuç:** “projenin kendi emirleri birbiriyle işlem yapamaz” ifadesi doğru değil. Bu PoC aynı koltuktaki döngüdür; dış cüzdana nakit çalındığı veya net kâr sayacının arttığı gösterilmedi. Bu nedenle yalnız bu bulguyu kritik/yüksek olarak değerlendirmiyorum. Alış öncesi yönetim satışı da `ask_min/ask_until` kaydına alınmıyor (kod okuma).

**Düzeltme:** yönetim satışlarına da karşı alış denetimi ve satış fiyat/ömür kaydı uygulayın; her iki emir sırası için regresyon testi ekleyin.

**Doğrulama:** alış → satış sırası yerel ELF ile yeniden üretildi; `poc_final_svm.py management-self`, `poc-management-self.json`.

## F4 — Orta: release policy olmadan genesis kabul ediliyor

**Dosya:** `heli/solana-v20/src/lib.rs:57–72`; `accounts.rs` içindeki `Genesis`; `release.rs:18–21`.

**Senaryo:** yönetici policy kurmadan kasaları ve meta veriyi oluşturup genesis yapar. 90M toplam ve `live=true` oluşur. Sonradan policy oluşturmak `!config.live` koşulunda reddedilir.

**Sonuç:** kamuya açık satış ve yönetim talimatları policy hesabı ister; normal 60 yıllık canlı dönemde eksik hesabı tamamlamak mümkün değildir. Upgrade yetkisi varsa kod düzeltmesiyle kurtarılabilir. Bu anonim saldırı değil, geri dönülmez dağıtım sırası hatası riskidir. DEPLOYMENT bunu doğru sırayla anlatıyor; program sırayı zorlamıyor.

**Düzeltme:** genesis hesaplarında canonical, program-owned `ReleasePolicy` hesabını zorunlu kılın; değerini de doğrulayın. Policy olmadan genesis negatif testi ekleyin.

**Doğrulama:** `poc_setup_svm.py missing-policy` yerel ELF ile geçti; genesis kabulü ve sonraki policy reddi yeniden üretildi.

## F5 — Düşük: “ihaleden sonra seçilir” proje tabanı koşulu zorlanmıyor

**Dosya:** `heli/solana-v20/src/lib.rs:101–106`; `accounts.rs` içindeki `InitializeFeeVaults`.

**Senaryo:** genesis'ten hemen sonra, ihale hesabı bile yokken `initialize_fee_vaults(..., project_floor=120 quote)` çağrılır. Kabul edilir; tek kez açılan operations hesabı nedeniyle ayar yeniden yapılamaz.

**Sonuç:** ilan edilen “toplanan tutara göre ihaleden sonra” kararına aykırı yapılandırma mümkün. Yönetici hatası riski; 120 alt sınırı aşılmadı ve tek başına fon çalma gösterilmedi. Kullanıcıların talepleri henüz sonuçlanmadığı için yalnız `auction.finalized` kontrolü de toplanan gerçek geliri bütünüyle temsil etmeyebilir.

**Düzeltme:** seçilecek politikaya göre canonical auction hesabını ve finalized durumunu zorunlu tutun; gerekiyorsa tüm taleplerin sonuçlanmasını şart koşun. Aksi tercihse metni “kurulumda bir kez” olarak düzeltin. Sahip kararı sessizce değiştirilmedi.

**Doğrulama:** `poc_setup_svm.py early-floor`, yerel ELF; ihale hesabı yokken kabul yeniden üretildi.

## F6 — Orta: sığ piyasada keeper başarılı gözlemleri aralıksız yeniden planlıyor

**Dosya:** `heli/solana-v20/src/release.rs:150–152`; `heli/keeper/planner.mjs:22–23`; `poll.mjs:4–5`.

**Senaryo:**
1. Piyasa sığlaşır. `observe_release_market` başarılıdır; `shallow_seen` güncellenir, `mark_time` değişmez.
2. Planner yalnız `mark_time` üzerinden karar verdiği için aynı saatlik işi tekrar seçer; yeni `shallow_seen` onu bekletmez.
3. Confirmed işlem sonrası polling iki saniyedir. Yeni işlem başarılı oldukça normal idle dört dakika aralığına da dönülmeyebilir. Journal tamamlanan bir observation key'ini sonsuza kadar kapatmaz; her adım zincirden planlar.

**Sonuç:** ihtiyaç dışı işlem ve RPC yükü, keeper günlük bütçesinin tüketilmesi ve önemli bakım için kullanılabilir fonun daralması. `dailyCap` ve essential-reserve korumaları tamamen sınırsız harcamayı önler; bunların varlığı hatayı gidermez. Gerçek harcama hızı ağ gecikmesine bağlıdır, kesin günlük maliyet iddiası yapılmıyor.

**Düzeltme:** örnek saati ve sığ durum teyit saatini ayırın; sığ piyasada bir sonraki teyidi `shallow_seen` üzerinden uygun aralığa planlayın (iki saatlik devamlılık kuralını koruyarak). Pending/confirmed zincir akışında aynı observation için son başarılı teyidi kullanın.

**Doğrulama:** planner'ın 240 saniye sonra yeni teyide rağmen aynı işi verdiği ve confirmed polling'in 2.000 ms olduğu `poc_keeper.mjs` ile yeniden üretildi. Uzun süreli ücret tüketimi veya ağ bağlantılı keeper çalıştırılmadı; bu etki kod akışından çıkarımdır.

## Diğer kontroller ve yanlış alarm ayıklama

- **Arz:** `market_release.rs:37–55` toplam kapasiteyi released/unburned arzdan hesaplıyor; yönetim aynı Epoch kapasitesinin en fazla %20'sini ve market bütçesinin dörtte birini paylaşır. depth/50 ay toplamı `epoch.founder` üzerinden ortak. İptal/çekim kilitli stoku geri doldurmuyor. 720. ay kapatıldıktan sonra yeni arz/yönetim emirleri yok; açılmış stok satışı ve giderler farklı yollardır.
- **Genesis:** 100M basım, 70M/15M transfer, 10M burn, 5M market inventory ve mint authority None akışı yerel testlerde geçti. Metadata zorunlu; bir kez yazma ve PDA/URI kontrolleri geçti. Kabul edilmiş Metaplex test ikilisi sınırlılığı tekrar yeni açık sayılmadı.
- **Ücretsiz pay:** eski kimlik, staking ve ücretsiz claim discriminator'ları artık program/IDL'de yok; fallback ile reddediliyor. 5M'nin gizli launch hesabında kalan payı bulunmadı. İhale got > 0 ise ceil ile paid > 0; sıfır ödeme yoluyla ücretsiz ihale alımı bulunmadı. Tek alıcının tüm ihaleyi alabilmesi politika, bulgu değil.
- **İhale:** marginal pro-rata aşağı yuvarlanır, ödeme yukarı yuvarlanır; collateral/refund checked subtraction ile korunur. Son claim sonrası allocation dust envanterde korunur. Mevcut senaryolar geçti; bütün u64 sınırlarını kapsayan bağımsız fuzz yapılmadı.
- **Anchor:** canonical token hesaplarında seeds, mint ve authority; yönetici yollarında has_one veya handler signer kontrolü; piyasa adresi ve canonical Manifest vault kontrolleri mevcut. Gider hedefi config / manifest / management / release PDA sahiplerinden olamaz. Eksik mut/has_one kaynaklı yeni yetkisiz fon transferi gösterilmedi. Ayrıntılı negatif hesap fuzz kapsamı sınırlıdır.
- **Manifest ofsetleri:** v3.0.24 ile gerçek yerel eşleşmeler/ölçümler geçti. Seat offset 32..36; node %80 hizası ve `256+index+80 <= len` sınırı; trader key payload +16..48. Bilinen layout bağımlılığı yeniden bulgu değil; key ile ownership testi arbitrary account data kabul etmez, market sahibi Manifest'tir. Yeni Manifest sürümüyle uyumluluk iddia edilmiyor.
- **Çöküş:** süre boşluğu, Deep ile kayıt temizliği, son teyit ve emir anında yeniden shallow kontrolü mevcut. Salt keeper'ı durdurmak 24 saat devamlılık oluşturmaz. Dış talebi tüketip gerçekten 24 saat teyit edilmiş sığ piyasa oluşturmak kabul edilen istisnayı açar; bunu tek başına açık olarak yazmadım. 192-node Unknown sığ kabul edilmiyor. Bu kontrol dış talebin iki teyit arasında hiç yükselmediğini kanıtlamaz; saatlik örnekleme modelidir.
- **IDL:** 53 program talimatının isimleri kaynakla eşleşti. Yerel işlemler IDL'den encode/decode edildi. Kaynaktan otomatik IDL yeniden üretimi yapılmadı; isim eşleşmesi tam IDL ispatı değildir.
- **Hesap alanları:** discriminator dahil Config 282; Epoch 52; Operations 328; ManagementBook 297; ReleasePolicy 450; Governance 122; Expense 130; OpeningBid 52. Bunlar Borsh alan toplamıyla ayrılan alana uyuyor, testlerde yazma taşması görülmedi. OpeningAuction 256 demand girdisiyle 2.143 bayt kullanır; `auction.rs:23` 2.312 ayırır: 169 bayt fazlalık, **taşma değil**, düşük etkili kira/temizlik ayrıntısı.
- **Journal:** signature gönderimden önce kalıcılaştırılıyor, aynı imzalı işlem tekrar gönderiliyor; expiry sonrası yalnız allowlist maintenance yeniden hazırlanır. Admin/code pin değişimi fail-closed. Özel journal/gerçek sunucu kullanılmadı; mevcut mock ve SVM keeper testleri geçti. F6 bu tekrar planlama mekanizmasına ilişkindir, çift arz gösterilmedi.

## Metin–kod tutarsızlıkları

1. README:21, `heli/website/heli-rules.txt` satış tabanı satırı ve index.html:55, yakın son referans varsa **ihale ile max** alınmasını atlıyor. Kod daha sıkıdır; DEPLOYMENT bunu doğru anlatır.
2. README:22 / rules / index.html:55 “own orders never trade” ve kayan %10 kesinliği F1–F3 nedeniyle sağlanmıyor.
3. `DEPLOYMENT.md` içinde kaldırılmış verifier/launch/free talimatları, allocate_auction_proceeds hata kodu, eski 995.032 bayt ELF ve `bid_days[30]` / `out_days[30]` ifadeleri var. Güncel diziler 31; kaldırılmış talimatlar adlandırılmış eski hatayı değil fallback döndürür. Kurulum operatörü için güncellenmeli.
4. DEPLOYMENT pause açıklaması geniş: finalize_auction/claim, iptal ve proje hesabına çekim bazı yollarda pause dışında devam eder; rezervden dış gider ve yeni emirler durur. İade/çekimin açık kalması makul politika olabilir, metin bunu ayırmalı.
5. Site:20 “expenses ... at most 25% ... a year” kısaltması sabit 10 birim teknik gideri atlıyor. Kod 31 gün diliminde `10 + (rezerv - harcanmamış gelir) × 25/1200` kullanır; bu kesin takvim-yıllık %25 tavanı değildir. Rules içindeki ayrıntılı formül daha doğrudur.
6. “No admin action can speed it up” için ayrım gerekli: mevcut program talimatları ortak kilit açma tavanını yükseltemez; upgrade authority kaldırılana kadar kod değişebilir. Ayrıca geçmiş aylar gecikince art arda settle yapılabilir; bu eski hakları işler, tek duvar-saati ayında catch-up dolaşımı %0,4'ü geçebilir. Aylık dönem tavanı ile kayan 30 gün satış/dolaşım tavanı aynı şey değildir.
7. ~%4,9 yıllık oran matematiksel olarak tutarlı: `(1 + RATE/SCALE)^12 - 1 ≈ %4,93520334`. 5M → 90M grafiği koşullu üst yol; fiilen satılmış miktar garantisi değildir. Bu politika değiştirilmedi.

## Test dökümü

- `solders==0.29.0`, Python 3.13, Node 24.19; fresh sabit snapshot ve sentetik mint/anahtarlar.
- 11 `test_*_svm.py` dosyası; policy dosyası `depth` ve `closure` ile ayrı çalıştırıldı: **12 script çalıştırması**, tamamı exit 0.
- `keeper/tests/test_v20_svm.py`: **1 script çalıştırması**, exit 0.
- İstenen claim-service, keeper, operations, manifest-integration Node komutu: **113 Node test kaydı**, 113 pass, 0 fail/skip. Arşiv claim testleri mevcut HELI ücretsiz dağıtımının çalıştığını kanıtlamaz.
- Yeni **5 bağımsız LiteSVM senaryosu**: management-self, slot-time, cancellation, missing-policy, early-floor; hepsi yeniden üretildi. Ek **1 planner mock senaryosu**. Yardımcı kurulum assert/işlem sayıları bu senaryo sayılarına eklenmedi.
- 720 dönem, kontrol/assert/işlem sayıları ve gerçek kullanıcı sayısı birbirine eklenmedi. Bu çalışmada gerçek kullanıcı **yok**.
- Çıktılar aynı klasörde. İlk PoC hazırlığında yeterli collateral olmadığı için reddedilen deneme, gerçek bir bug diye sunulmadı; son cancellation PoC'sinde sentetik reserve top-up ile floor korunarak yeniden üretim sağlandı.

## Genel görüş, politika soruları, test edilmeyenler

**Lansmana hazır değil.** Standart regresyonların geçmesi değerli, ancak rezerv alış kotası ve iç gelir ayrımı için yeni karşı örnekler var. **Devnet:** gerçek değeri olmayan, açıkça hata araştırma amaçlı ve upgrade edilebilir bir deneme olarak koşullu yapılabilir; “son güvenlik kontrolü geçti” diyerek yapılmamalı. Önce F1/F2, kurulum policy guard'ı ve keeper tekrar planlama giderilmeli, yerel regresyonlar ve bağımsız build yeniden çalıştırılmalı. Bu inceleme kapsamlı profesyonel denetimin yerine geçmez.

Politika soruları (kod değiştirilmedi):
- Proje tabanı ihale finalized olduğunda mı, bütün claim'ler tamamlanınca mı sabitlenecek?
- Kendi kendine işlem yasağı gerçekten bütün proje koltukları için mi? Metin bu yönde; yönetim ask'ını hariç tutmak bilinçli tercihse açıkça daraltılmalı.
- “Yılda %25” kesin kayan 365 gün tavanı mı, mevcut 30-günlük formülün yıllıklaştırılması mı? Mevcut kuralı sessizce değiştirmek doğru olmaz.
- Duraklatmada iade ve proje hesaplarına geri çekim açık mı kalacak? Mevcut davranış bunu yapıyor.

Çalıştırılmayan / doğrulanmayan: kaynaktan Agave build ve yeniden üretilmiş ELF; ağ dağıtımı; ağın güncel slot ilerlemesi; gerçek keeper/RPC/sunucu; mainnet Metaplex ikilisi; gerçek webhook/kimlik (servis arşiv); .private/.state; kapsamlı bütün hesap kombinasyonları/fuzz; bütün ekonomik manipülasyon ihtimalleri; yayımdaki sitenin bu commit ile aynı olması. Yeni bir kritik anonymous-drain bulmamak böyle bir açığın olmadığını kanıtlamaz.
