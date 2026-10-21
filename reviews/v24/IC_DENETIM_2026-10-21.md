# Charta program kodu: iç güvenlik incelemesi (21 Ekim 2026)

> **Bu bir bağımsız denetim değildir.** İnceleme, kodun yazımına katılmış bir yapay zekâ asistanı (Claude) tarafından, bağımsız bir denetimde izlenen yöntemle yapıldı. Kendi işini inceleyen biri, yanlış varsaydığı şeyleri gözden kaçırabilir. Bu rapor dış denetimin yerine geçmez; denetçiye başlangıç noktası olarak verilebilir.

## Kapsam

| | |
|---|---|
| Depo, commit | `patrickgt966-art/heli-experiment`, main `ed59e97` |
| Program | `heli_core_v20`, Devnet adresi `DZbsSEnZxsfQf1HejcLk63BEDNqzAMXPgVxTq97Bd2zG` |
| Kaynak dosyalar | `heli-v20-package/heli/solana-v20/src/*.rs`: 10 dosya, 1.604 satır, 119.157 bayt |
| Derleme | ELF `9c9779c3ef4f23a93ba8edd5cd486aba26f115fc59b2ae87b2c05e1620f8f57c`, 1.018.560 bayt |

**Kapsam dışı:** Manifest ve Metaplex programlarının kendi kodu, web sitesi, keeper ve claim servisi. Bunlara yalnızca programla temas ettikleri yerde bakıldı.

## Yöntem

- Bütün kaynak satır satır okundu: `lib.rs`, `accounts.rs`, `auction.rs`, `release.rs`, `management.rs`, `manifest_bridge.rs`, `market_release.rs`, `calendar.rs`, `economics.rs`, `identity.rs`.
- Her talimat için şunlar kontrol edildi:
  - kim imzalayabilir;
  - hangi hesaplar doğrulanıyor (PDA tohumları, sahiplik, mint, yetki);
  - hangi zaman pencerelerinde çalışıyor;
  - para nereden nereye gidiyor;
  - hesaplamalarda taşma ve yuvarlama;
  - durdurma (pause) altındaki davranış.
- Saldırgan modelleri:
  1. dışarıdan biri;
  2. çalınmış yönetici anahtarı;
  3. çalınmış kurtarma anahtarı;
  4. kötü niyetli ya da hatalı bir bağımlılık (Manifest);
  5. ince bir piyasada fiyat oynatan biri.
- Zincirde doğrulananlar:
  - Devnet'teki token adı kaydı (metadata) değiştirilebilir durumda.
  - Ana ağdaki Manifest programı güncellenebilir.
  - Ana ağdaki Metaplex programı güncellenemez.

## Özet

| No | Bulgu | Önem |
|---|---|---|
| M-1 | Çalınmış bir yönetici anahtarı, kurtarma anahtarının yönetici değiştirmesini süresiz engelleyebilir | **Orta** (güncelleme anahtarı kalkınca **Yüksek**) |
| M-2 | Manifest programı güncellenebilir; Charta yalnız adresini sabitliyor, kodunu değil | **Orta** |
| L-1 | Token adı kaydı "değiştirilebilir" olarak oluşturuluyor; site "kilitli" diyor | Düşük |
| L-2 | İnce piyasada referans fiyat oynatılabilir; asgari derinlik 25 USDC | Düşük |
| L-3 | Yönetimin teklif ve satışları ±%5 bant içinde içeriden kişilere değer aktarabilir | Düşük |
| L-4 | `management_fund_quote` sınırsız: yedek, Manifest'te gerektiğinden fazla tutulabilir | Düşük |
| L-5 | Çalınmış yönetici anahtarıyla satış geliri 7 gün sonra harcanabilir; tek koruma kurtarma anahtarının fark etmesi | Düşük |
| I-1…I-6 | Bilgi notları (aşağıda) | Bilgi |

**Kritik veya yüksek önemde bulgu yok.** Bulguların çoğu tasarım tercihlerinden ve dış bağımlılıktan kaynaklanıyor; doğrudan para çalmaya izin veren bir hata bulunmadı.

---

## M-1: Kurtarma anahtarı, çalınmış bir yönetici anahtarını değiştiremiyor

**Yer:** `lib.rs` `propose_admin`, `cancel_admin_proposal`.

**Sorun:**
- Kurtarma anahtarı yeni bir yönetici önerebiliyor (7 gün bekleme).
- Ama `cancel_admin_proposal` bu öneriyi **mevcut yöneticinin** iptal etmesine izin veriyor.
- Yönetici anahtarı çalınırsa, hırsız kurtarma anahtarının her önerisini iptal eder. Yönetici hiçbir zaman değiştirilemez.

**Neden önemli:** Programın diğer kurtarma araçları "çalınmış yönetici" senaryosu için tasarlanmış:
- `recovery_unpause`: hırsız programı durdurmuş halde tutamaz.
- `recovery_cancel_expense`: hırsızın önerdiği giderler iptal edilebilir.

Yönetici değişikliği ise yalnız "kaybolmuş yönetici" senaryosunu karşılıyor. Hırsız kontrolde kaldığı sürece kurtarma anahtarı sürekli nöbet tutmak zorunda. Ayrıca hırsız şunları yapabilir:
- L-3'teki bant içi işlemlerle yavaş değer aktarabilir.
- L-5'teki gider akışını zorlayabilir.
- Satışları durdurup açabilir.

Bugün son çare, güncelleme anahtarıyla programı yenilemek. Bu anahtar denetimden sonra kaldırılacağı için o noktada sorun kalıcı olur.

**Seçenekler (sahip kararı gerekir; kural değişikliği):**
- **(A) Önerilen:** Kurtarma anahtarının başlattığı yönetici önerisini yalnız kurtarma anahtarı iptal edebilsin. Bedeli: kurtarma anahtarı çalınırsa, yönetici 7 gün içinde engelleyemez. Kurtarma anahtarı çevrimdışı tutulduğu için bu daha küçük bir risk.
- **(B)** Yönetici, kurtarma önerisini iptal edebilsin ama her iptal bir sonraki iptali 7 gün kilitlesin. Örneğin en fazla bir veto; ikinci öneri iptal edilemesin.
- **(C)** Mevcut hali korunsun, risk açıkça yazılsın ve kurtarma anahtarı için izleme ve alarm kurulsun.

## M-2: Manifest güncellenebilir bir bağımlılık

**Yer:** `manifest_bridge.rs` `check_market`; `release.rs` emir defteri okuma.

**Durum:** Ana ağdaki Manifest programının bir güncelleme yetkisi var (`CDFU8tEWsVU2ZMiek57Sgk3Huha2yBNcSHLAts3V3Cbf`, 21 Ekim'de okundu). Charta yalnız programın adresini ve çalıştırılabilir olduğunu kontrol ediyor.

**Etkisi:**
- Manifest'in kasalarında duran her şey o programın koduna bağlı: proje satış emirleri, yönetimin TEST-USDC/USDC ve CHTA bakiyesi. Kötü niyetli ya da hatalı bir güncelleme bu bakiyeleri riske atar.
- Charta, emir defterini Manifest v3.0.24'ün bayt düzenine göre okuyor. Düzen değişirse ölçümler ya hata verir (aylık satış durur) ya da, daha kötüsü, yanlış okunur. Devnet'te eski bir Manifest sürümüyle ilk durumun yaşandığı görüldü (rapor bölüm 8).
- Keeper, Manifest'in kod özetini sabitliyor ve değişince duruyor. Ama program kendisi bunu yapmıyor; keeper dışında biri (örneğin yönetici) işlem yapmaya devam edebilir.

**Öneriler:**
- Manifest'te tutulan bakiyeleri küçük tut. Bkz. L-4: `fund_quote` için üst sınır.
- Program, Manifest'in program verisindeki "son yükleme yuvası"nı (ProgramData'nın 4–12. baytları) kurulumda kaydetsin ve değişirse para hareketi yapan talimatları reddetsin. Bu ucuz bir kontrol. Manifest güncellenince yeni sürüm incelenip kayıt bilinçli olarak yenilenir.
- En azından: Manifest güncellemelerini izleyen bir alarm ve yayımlanmış bir "Manifest güncellenirse ne yapılır" prosedürü.

## L-1: Token adı kaydı değiştirilebilir oluşturuluyor

**Yer:** `lib.rs` `create_token_metadata`. Veri `…0,0,0,0,0,1,0` ile bitiyor, yani `is_mutable = true`.

**Zincirde:** Devnet'teki tCHTA adı kaydı `isMutable: 1`, güncelleme yetkisi config PDA'sı (`7uKFWueu…`).

**Sorun:** Sitedeki token kural kartında Charta için "No. The name, symbol and logo are written once and locked." yazıyor (`check.js`). Bugün bu ancak dolaylı olarak doğru: programda ad güncelleyen bir talimat yok. Ama güncelleme anahtarı programı değiştirip böyle bir talimat ekleyebilir. Kartın kendi algoritması zincirdeki Charta'yı okusa "Partly" diyecek, yani site kendi kartıyla çelişecek.

**Seçenekler:**
- **(A) Önerilen:** Kaydı `is_mutable = false` ile oluştur. Tek baytlık değişiklik; ELF değişir, testler ve Devnet yeniden yapılır.
- **(B)** Kod aynı kalsın, kart ve kurallar metni "güncelleme anahtarı kaldırılınca kilitli" diye düzeltilsin.

## L-2: İnce piyasada referans fiyat oynatılabilir

**Yer:** `release.rs` `observe`, `reference_price`; `management.rs` `order`.

**Sorun:**
- Referans fiyat, en iyi dış alış emirlerinden asgari derinliği (lansman değeri 25 USDC) dolduran fiyatın 24 saatlik ortalaması.
- Piyasada başka alıcı yoksa, biri 25 USDC'lik alış emirlerini 24 saat boyunca yüksek fiyatta bekletip referansı yükseltebilir. Bu emirler gerçek ve doldurulabilir; kimse satmazsa saldırganın maliyeti düşük.
- Yönetimin alış emirleri referansın %105'ine kadar çıkabiliyor. Yöneticinin şişirilmiş referansla alış yapması, saldırgana yüksek fiyattan satma fırsatı verir.
- Kodun başındaki not wash (kendi kendine alım-satım) riskini zaten kabul ediyor.

**Öneriler:**
- Lansmandaki asgari derinliği beklenen piyasa büyüklüğüne göre yükselt.
- Yönetimin alış emirlerini, referansın son 24 saatteki hareketine bakarak elle onaylama kuralı koy.
- Sitedeki "Live data" sayfasında referansın hangi emirlerden oluştuğunu göster.

## L-3: Bant içi işlemlerle içeriden kişilere değer aktarımı

**Yer:** `management.rs` `order`; `manifest_bridge.rs` `place_ask`.

**Sorun:**
- Proje ve yönetim satışları referansın %95'inden, yönetim alışları %105'ine kadar olabilir.
- Emri koyan yönetici, aynı anda kendi kişisel cüzdanıyla karşı tarafa geçebilir: proje satışını %95'ten alır, yönetim alışına %105'ten satar. Bu kurallara uygun ama içeriden kişiye değer aktarımıdır.
- Alış tarafı 30 günde yedeğin %10'u ile sınırlı; aktarılabilecek fark aylık yedeğin yaklaşık %0,5'i mertebesinde.

**Öneriler:**
- "Ekip yalnız açıklanmış cüzdanlardan işlem yapar" taahhüdü zaten var. Bu taahhüt, bant içi işlemlerin karşı tarafını da kapsasın.
- Live sayfasında proje ve yönetim emirlerinin hangi adreslerle eşleştiğini göstermek denetlenebilirliği artırır.

## L-4: `management_fund_quote` için üst sınır yok

**Yer:** `management.rs` `fund_quote`.

**Sorun:**
- Yönetici, tabanın üstündeki bütün yedeği tek seferde Manifest'teki yönetim koltuğuna taşıyabilir.
- Alışlar 30 günde yedeğin %10'u ile sınırlı olduğu için bu paranın büyük kısmı kullanılmadan Manifest'te bekler.
- Para kaybolmaz (`withdraw` geri getirir), ama M-2'deki bağımlılık riskine açık kalır.

**Öneri:** `fund_quote` tutarını, koltukta zaten duran bakiye ile birlikte, 30 günlük alış hakkını aşmayacak şekilde sınırla.

## L-5: Satış geliri, çalınmış yönetici anahtarıyla harcanabilir

**Yer:** `lib.rs` `propose_expense`, `execute_expense`.

**Sorun:**
- Satış geliri (`revenue_total`), tabanı korumak şartıyla %100 harcanabilir.
- Her öneri `monthly_cap` (lansman değeri 1.000 USDC) ile sınırlı, ama öneri sayısı sınırsız.
- Hırsız, birçok gider önerisi açarsa ve kurtarma anahtarı 7 gün içinde hepsini iptal etmezse gelir harcanır. Tek koruma 7 günlük bekleme ve birinin bunu fark etmesi.

**Öneriler:**
- Keeper veya ayrı bir izleyici, her yeni gider önerisinde bildirim göndersin. Telemetri altyapısı var; bildirim yok.
- İsteğe bağlı (kural değişikliği): gelirden harcamaya da 30 günlük bir üst sınır.

---

## Bilgi notları

- **I-1 Cüzdan sınırı kişi sınırı değil.** Açık artırmadaki %5 sınırı cüzdan başına; aynı kişi birden fazla cüzdanla aşabilir. Site metni "per wallet" diyor, doğru. Ama "tekele karşı" amacı kod tarafından sağlanmıyor.
- **I-2 Teklif hesapları kapatılmıyor.** Her teklif sahibinin yaklaşık 0,0012 SOL'lük kira teminatı kalıcı olarak kilitli kalıyor.
- **I-3 Talep edilmeyen teklifler süresiz bekler.** Bitişten sonra talep etmeyenlerin teminatı emanette kalır; kaybolmaz, süre sınırı da yok. Site bunu söylemeli.
- **I-4 Devnet Manifest farkı.** Devnet'teki Manifest eski sürüm; aylık satış Devnet'te çalışmıyor (rapor bölüm 8).
- **I-5 Keeper ayarı.** `devnet_setup.mjs`'in yazdığı keeper ayarı depodaki Manifest sürümünün özetini kullanıyor. Ana ağda doğru, Devnet'te keeper'ı durdurur.
- **I-6 Kodun yoğun yazımı.** Satırlar çok uzun ve sıkıştırılmış (ortalama 74 karakter/satır, birden çok ifade tek satırda). Bu dış denetimi yavaşlatır ve pahalılaştırır. Denetimden önce `rustfmt` ile biçimlendirme önerilir. Hata mesajlarında dosya ve satır numarası geçtiği için ELF değişir; testler yeniden çalıştırılmalı.

## Olumlu bulgular

- **Kurulumun ele geçirilmesi engellenmiş:** `initialize` yalnız programın güncelleme yetkilisi tarafından çağrılabiliyor.
- **Para basma:** Para basma yetkisi genesis'te kalıcı olarak kaldırılıyor. Dondurma yetkisi hiç verilmiyor. Toplam arz 90 milyonu aşamaz.
- **Hesap doğrulaması tutarlı:** Bütün program hesapları PDA tohumu, mint ve yetki ile doğrulanıyor. Devnet'te sahte emanet, başkasının teklifi ve başkasının token hesabı denemeleri reddedildi.
- **Açık artırma hesabı:** Yuvarlama yönleri doğru. Ödeme yukarı, tahsis aşağı yuvarlanıyor; iade eksiye düşemez. Tavan fiyat × teklif sınırı `open_auction`'da u64'e sığacak şekilde kontrol ediliyor.
- **Durdurma:** Durdurma para çıkışlarını engelliyor ama teklif iptalini, talepleri ve aylık kuralı engellemiyor. Kullanıcı parası kilitlenemez.
- **Gider hedefi:** Hazine kendine ödeme yapamaz; hedef, öneride ve ödemede iki kez kontrol ediliyor.
- **Ölçüm talimatı:** Gözlem talimatı aynı işlemde başka talimata izin vermiyor. Böylece aynı işlem içinde emir koyup kaldırarak referans fiyat oynatılamaz.
- **Self-trade koruması:** Proje ve yönetim emirlerinin birbirleriyle eşleşmesini engelleyen koruma zaman ve yuva olarak iki ayrı pencereyle tutuluyor.

## Uygulama durumu (21 Ekim, sahip kararları)

- **M-1: seçenek A uygulandı.** Kurtarma anahtarının yönetici önerisini yalnız kurtarma anahtarı geri çekebilir. Yönetici bu öneriyi iptal edemez ve üzerine kendi önerisini yazamaz. Yöneticinin kendi önerisini yönetici de kurtarma anahtarı da iptal edebilir.
  - Testler: `test_governance_svm.py` (87 kontrol) ve tatbikat 6.
  - Bilinen bedeli: kurtarma anahtarı çalınırsa 7 gün sonra yönetimi alır. `ACIL_DURUM.md` senaryo 3 ve 5 buna göre yazıldı.
- **L-1: seçenek A uygulandı.** Token adı kaydı `is_mutable=false` ile oluşturuluyor.
  - Test: `bootstrap_v15.py`, `test_no_free_allocation_svm.py` içinde zincirdeki kaydı okuyan bir kontrol.
  - Devnet'teki tCHTA kaydı eski kodla oluşturulduğu için değiştirilebilir kalır; ana ağ kaydı yeni kodla oluşturulacak.
- **Yeni derleme:** kaynak `284f5003…`, ELF `a377eebe5aea3ca3c4c03170795c45b8afa547f3a42a3a41a7169a3da5c5d2b8`, 1.018.992 bayt (432 bayt büyüdü).
- **Testler:** bütün LiteSVM testleri, 30 tohumlu fuzz, prova (173), 60 aylık test (606) ve tatbikat (9 tatbikat, 40 kontrol) geçti. Ayrıca ana ağ Manifest ve Metaplex ikilileriyle ikinci tur çalıştırıldı.
- M-2, L-2…L-5 ve bilgi notları açık; sahip kararını bekliyor.

## Sonraki adımlar

1. M-1 ve L-1 için sahip kararı: seçenek A, B veya C.
2. M-2, L-4, L-5 için hangi önerilerin uygulanacağına karar.
3. Kararlar uygulanırsa: kod değişikliği, testlerin hepsi, yeni ELF, Devnet'te kısa tekrar.
4. Biçimlendirme (I-6) ve bu raporla birlikte bağımsız denetime gönderim.
