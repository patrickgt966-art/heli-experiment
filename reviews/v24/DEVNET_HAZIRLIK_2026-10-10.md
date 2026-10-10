# Devnet uçtan uca test hazırlığı (10 Ekim 2026)

**Durum: Devnet'e kurulum YAPILMADI.** Bu oturumda iki engel vardı (bölüm 6):
- Devnet RPC'ye ağ erişimi yoktu.
- Gerekli imzalama anahtarlarına erişim yoktu.

Aşağıdakilerin hepsi yereldir: derleme, testler, prova zinciri ve maliyet ölçümü. Bu çalışma **bağımsız bir güvenlik denetimi değildir.**

## 1. Kullanılan sürüm

| | Değer |
|---|---|
| Commit | `58048a29d3cdfa4c88884b7bcd30a8d660755f1e` (`main`, PR #40 birleşmesi) |
| Birleşmemiş düzeltme | Yok. Açık PR yok; `main`'in önünde commit taşıyan uzak dal yok. |
| Program adresi (kodda) | `HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv` |
| Kaynak SHA-256 | `0d8488ab433d682584aeaa77e939a43571f2ecfe8d730ceb8f5cd855f9881199` |
| ELF SHA-256 | `c0e818148ea2aea8595a3024aac2a358c78f2052a45141ca0c299592dd7d6f87` |
| ELF boyutu | 1.018.560 bayt |
| Araçlar | Agave 2.1.21 (`solana-cargo-build-sbf 2.1.21`), platform-tools v1.43, rustc 1.79.0 |
| Yeniden derleme | `scripts/build_local.sh` ile temiz derleme yapıldı; yayımlanan ELF ile bayt bayt aynı. Kaynak hiçbir harici derleyiciye gönderilmedi. |

## 2. Testler

Test vakası, işlem ve kontrol sayıları ayrı verilmiştir.

| Grup | Test vakası / çalıştırma | İşlem | Kontrol | Sonuç |
|---|---|---|---|---|
| Node (site, keeper, operasyon, claim, Manifest adaptörü) | 152 test | – | node:test assert sayısını raporlamaz | 152/152 geçti |
| LiteSVM, derlenmiş ELF (14 betik, `policy depth` ve `closure` dahil, ayrıca 720 aylık keeper SVM) | 16 çalıştırma | 7.809 (355'i testin beklediği gibi reddedildi) | 3.195 açık durum kontrolü | 16/16 geçti |
| Fuzz (model tabanlı rastgele diziler) | 30 tohum | 12.029 adım (1.811 kabul, 10.218 ret) | 125.623 | 0 bulgu |
| Uçtan uca prova (40 teklif veren, kurulum betiği, keeper, claim) | 1 senaryo, 11 aşama | ayrı sayılmadı | 173 | 0 hata |
| Bakım servisi uzun testi (arızalarla 60 ay) | 1 senaryo | ayrı sayılmadı | 606 | 0 hata |
| Acil durum tatbikatı | 9 tatbikat | ayrı sayılmadı | 39 | 0 hata |

- Çalıştırma bazında sayılar: `svm-test-counts.json`.
- Bazı testlerdeki düz Python `assert` satırları kontrol sayısına dahil değildir.

**Uzun takvim ve 720 ay (yalnız yerel, Devnet'te zaman değiştirilmedi):**
- Keeper SVM, 720 ay: 1.464 işlem, 2.887 kontrol.
- Aylık piyasa serbest bırakma, 720 ay: 1.576 işlem.
- 60 yıl sonrası kapanış senaryosu: 1.623 işlem.
- Fuzz: 242 ay kapandı.

**Önceki web incelemesinin (Codex) bulguları:** beş bulgunun her biri için ayrı bir test var ve hepsi geçiyor:
1. Ödendi görünen başarısız işlem.
2. Eksik satış koşulunda teklif durumu.
3. Yanlış sahipli program verisinin kabul edilmesi.
4. Kısa kodun eşleşme sayılması.
5. Eksik kontrolün "All passed" görünmesi; artık "Incomplete" yazıyor.

**İstenen akışlar ve kapsamları:**

| Akış | Nerede test edildi |
|---|---|
| Teklif verme, değiştirme, iptal, son 5 dakika, finalize, claim, iade | Prova, fuzz |
| Duraklatma sırasında iptal | Yalnız fuzz modeli: duraklatmada yeni teklif reddedilir, iptal serbesttir. **Buna ayrılmış tek bir test yok;** Devnet senaryosuna eklenmeli. |
| Order book (Manifest) bağlantısı ve satış gelirinin kasaya gitmesi | Gerçek Manifest ELF'iyle piyasa testleri |
| Yetkisiz işlem ve limit aşımının reddi | Kırmızı takım testleri, fuzz |
| Live ve Verify sayfalarının zincirle karşılaştırılması | Provada Verify mantığı kontrolleri; Live sayfası daha önce provada bulunan aylık tavan hatası düzeltilmiş hâliyle |

## 3. Devnet maliyeti (20 test SOL)

Kira, her hesap için `(boyut + 128) × 6.960` lamport; işlem başına 5.000 lamport.

| Kalem | SOL | Kaynak |
|---|---|---|
| Program verisi hesabı (1.018.560 + 45 bayt) | 7,0904 | formül |
| Yükleme sırasında geçici tampon (yükleme bitince iade) | 7,0903 | formül |
| Program hesabı | 0,0011 | formül |
| Yükleme işlem ücretleri (~1.008 yazma işlemi) | ~0,0051 | tahmin |
| Kurulum betiği, ihale öncesi 15 adım + sonrası 10 adım (kiralar ve ücretler) | 0,1195 | prova zincirinde ölçüldü |
| Test cüzdanları (ör. 10 × 0,02) ve keeper cüzdanı (0,1) | ~0,30 | tahmin |

- **En yüksek anlık ihtiyaç:** yükleme sırasında ~14,19 SOL. 20 SOL yeterli, ~5,8 SOL pay kalır.
- **Kalıcı harcama:** ~7,52 SOL. Testlerden sonra yaklaşık **12,5 SOL** kalır.
- **Önemli:** yükleme komutuna `--max-len 1018560` açıkça verilmeli. Bazı CLI sürümleri program alanını varsayılan olarak iki katı ayırıyor; bu durumda program verisi ~14,2 SOL tutar ve en yüksek ihtiyaç ~21,3 SOL olur, yani 20 SOL'u aşar.

## 4. Devnet test sitesi

- `scripts/devnet_preview.mjs` sitenin **ayrı** bir kopyasını üretir. Üretim dosyalarını yalnız okur ve şunları yapar:
  - her sayfaya sabit bir "DEVNET TEST SITE · test tokens only (TEST-USDC has no value)" şeridi ekler;
  - "USDC" yazan her yeri "TEST-USDC" yapar (48 yer). Gerçek ana ağı okuyan kural kartı sayfası hariç tutulur;
  - sayfayı arama motorlarına kapatır (`robots.txt` ve `X-Robots-Tag`);
  - Devnet ayarlarını ayrı bir `site-config.js` dosyasına yazar.
- Cloudflare Pages **önizleme dalına** (`devnet`) yayınlandı: https://devnet.heli-experiment.pages.dev
  - Program henüz kurulmadığı için sayfalar "henüz kurulmadı" durumunu gösterir.
  - Üretim sitesi (`main` dalı) ve ayarları değişmedi.
  - Bu ortamdan alt alan adlarına erişim engelli olduğu için önizlemenin açıldığı buradan doğrulanamadı; yayın aracı yüklemenin tamamlandığını bildirdi.
- Kurulumdan sonra aynı betik program adresi ve ELF hash'iyle yeniden çalıştırılır:
  `node scripts/devnet_preview.mjs <klasör> --program <ID> --sha256 <hash> --length <bayt>`

## 5. Bu oturumda Devnet'te yapılanlar

Hiçbiri. İşlem yok, Explorer bağlantısı yok, harcanan SOL yok. Cüzdan bakiyesi (Codex'in raporladığı 20 SOL) bu ortamdan **yeniden doğrulanamadı.**

## 6. Engeller ve seçenekler

1. **Ağ:** bu ortamın ağ politikası `api.devnet.solana.com` adresini engelliyor. Ortam ayarlarında Network access → izin verilen alan adlarına eklenmeli: https://code.claude.com/docs/en/cloud-environments#network-access
2. **İmzalama anahtarı:** `5rYen19d…ngYq` cüzdanının özel anahtarı bu ortamda yok; olması da gerekmiyor. Seçenekler:
   - **(a) Önerilen:** sahip kurulumu kendi bilgisayarında, hazır betiklerle yapar (`DEVNET.md` adım 2–6). Bu ortam yalnız doğrulama yapar.
   - **(b)** Yalnız Devnet için üretilmiş, başka hiçbir yerde kullanılmayan bir anahtar ortamın gizli değişkeni olarak verilir. Sohbete, GitHub'a ya da dosyaya yazılmaz.
3. **Program adresi:** kodda yazılı `HkScy…JAWv` adresinin anahtar dosyası yok. Seçenekler:
   - **(a)** Sahip yeni bir program anahtarı üretir ve yalnız açık anahtarını verir. `declare_id!` ve betiklerdeki adres güncellenir, program yeniden derlenir ve testler tekrarlanır.
     - ELF hash'i değişir, çünkü adres koda gömülüdür.
     - Bu bir kural değişikliği değildir, ama koda dokunduğu için sahibin onayıyla yapılır.
   - **(b)** Eski anahtar bir yerde varsa o kullanılır.
4. **Ayrı anahtarlar:** kurulum betiği yönetici, kurtarma ve çevrimdışı güncelleme anahtarının **farklı** olmasını şart koşar. Kurtarma ve güncelleme için iki açık anahtar daha gerekir.
5. **Devnet bağımlılıkları:** `scripts/devnet_readiness.mjs`, ağ izni olmadığı için çalıştırılamadı. Şunları kontrol eder:
   - Manifest'in test ettiğimiz ikiliyle aynı olup olmadığı;
   - Metaplex'in Devnet'te kurulu olup olmadığı;
   - test tokenının 6 ondalıklı olup olmadığı.
6. **Duraklatmada iptal** için ayrı bir test henüz yok; Devnet senaryosuna eklenecek.

## 7. Bu dalda değişenler

- `scripts/svm_fixture.py`: isteğe bağlı sayım raporu (`HELI_TEST_COUNTS`). İşlem, beklenen ret ve kontrol sayılarını ayrı yazar; test davranışı değişmez.
- `scripts/devnet_preview.mjs`: Devnet test sitesi kopyası.
- `reviews/v24/`: bu rapor, `svm-test-counts.json`, `devnet-setup-cost-local.json`.

## 8. Ek: ağ izni açıldıktan sonra yapılan kontroller (10 Ekim, aynı gün)

**Bakiye:** `5rYen19d…ngYq` Devnet'te **20 SOL** (20.000.000.000 lamport); resmî Devnet RPC'den doğrulandı.

**Devnet hazırlık kontrolü (`devnet_readiness.mjs`, salt okunur):**
- Devnet'te kira bu hesaptan **düşük.** Program verisi için asgari kira **5,18 SOL**; yükleme sırasındaki en yüksek ihtiyaç **~10,35 SOL.** Bölüm 3'teki 7,09 ve 14,19 SOL rakamları üst sınır olarak kalır; 20 SOL rahatça yeter.
- Manifest ve Metaplex Devnet'te kurulu.
- Devnet'teki Manifest, test ettiğimiz ikiliyle **aynı değil.**

**Zincirdeki ikililerle tam test.** Üç farklı Manifest ikilisi var:

| Manifest | Bayt | SHA-256 (ilk 16) | Yükleme slotu |
|---|---|---|---|
| Testlerde kullanılan v3.0.24 | 335.040 | `6d0aa96d34f33266` | – |
| Devnet | 410.728 | `ad148f7660f13048` | 355.430.404 |
| **Ana ağ** | 368.096 | `ef32efe941808ad5` | 447.525.709 |

Zincirdeki ikililer indirildi ve testlerin bir kopyasında yerine konup **bütün test seti** yeniden çalıştırıldı. Kopya: 16 LiteSVM çalıştırması, fuzz, prova, 60 aylık test ve tatbikat. Depodaki dosyalar değişmedi.

- **Ana ağ Manifest ve Metaplex ile: hepsi geçti.** 16/16 çalıştırma, fuzz 0 bulgu, prova 173, 60 aylık test 606, tatbikat 39 kontrol. 720 aylık piyasa testi de geçti (1.635 işlem ve kontrol). Lansmanda kullanılacak ikililerle uyumsuzluk bulunmadı.
- **Devnet Manifest ile: 3 çalıştırma başarısız** (`test_market_release_svm`, `policy depth`, `policy closure`). Devnet'teki eski Manifest, aylık satış çağrısında (`execute_release_sale`) "Token account must be owned by the Token Program" hatası veriyor. Diğer 14 çalıştırma, prova, 60 aylık test ve tatbikat geçti.

**Sonuç:** Devnet'te **aylık satış akışı çalışmaz.** Bu Charta'nın hatası değil; Devnet'teki Manifest eski bir sürüm. Seçenekler:
- **(a) Önerilen:** Devnet testinde aylık satış akışı "bilinen Devnet farkı" olarak işaretlenir; bu akış ana ağ ikilisiyle yapılan yerel testlere dayanır.
- **(b)** Manifest ekibinden Devnet'i güncellemesi istenir.

Manifest adresi programa gömülü olduğu için Devnet'e kendi Manifest kopyamızı başka bir adreste kurmak program değişikliği gerektirir; önerilmez.

## 9. Ek: Devnet için yeni program adresi (10 Ekim, sahibin onayıyla)

Sahip yeni bir program anahtarı üretti ve yalnız açık anahtarını verdi; kurtarma ve güncelleme anahtarları için de aynısını yaptı. Özel anahtarların hiçbiri bu ortama girmedi.

| | Açık anahtar |
|---|---|
| Program | `DZbsSEnZxsfQf1HejcLk63BEDNqzAMXPgVxTq97Bd2zG` |
| Yönetici (yeni, sahibin bilgisayarında) | `DobScceWyio1sLNFGSFqmheFVE713qHwaHbuW5Hnrw7A` (SOL `5rYen19d…` deneme cüzdanından aktarıldı) |
| Kurtarma | `HkBEzszeWGAgCPzHgPJBNryjGpbGd6N85vG5JmKbNPyJ` |
| Çevrimdışı güncelleme | `ANRm3qEKohq78rkXTYPVqa2E7pf9ThC6ziGtK627co9o` |

- **Kaynakta tek değişiklik:** `src/lib.rs` içindeki `declare_id!` satırı. Kurallar, oranlar ve süreler değişmedi.
- **Yeniden derleme** (Agave 2.1.21): kaynak `4f0c0f8c883ad9b2eb2facd853867e411980300b3b77a0b9302601d3ea15d5d9`, ELF `9c9779c3ef4f23a93ba8edd5cd486aba26f115fc59b2ae87b2c05e1620f8f57c`, 1.018.560 bayt.
  - ELF eskisinden 1.329 bayt farklı. Adres, derlenmiş kodun karşılaştırma yaptığı her yere sabit değer olarak gömülüyor.
- Betikler, testler ve güncel belgelerdeki adres değiştirildi (25 dosya). Geçmiş inceleme kayıtlarına dokunulmadı.
- **Yeni ELF ile bütün testler iki turda geçti:** depodaki Manifest v3.0.24 ile ve ana ağ Manifest + Metaplex ikilileriyle.
  - Her turda: 16 LiteSVM çalıştırması, 30 tohumlu fuzz, prova (173), 60 aylık test (606), tatbikat (39).
  - Node testleri 152/152.
  - Depodaki doğrulama dosyaları yeni ELF hash'iyle yenilendi.
- Açık anahtarlar ekran görüntüsünden okundu. Dördü de geçerli ve Devnet'te kullanılmamış. Kurulum adımları, `program.json` dosyasının açık anahtarının `declare_id!` ile birebir aynı olduğunu yükleme öncesinde ayrıca kontrol eder.


## 10. Devnet'te 1. gün (10 Ekim): kurulum, teklifler ve site karşılaştırması

**Kullanılan commit:** program kodu `0d2dac1` (yalnız `declare_id!` değişti). Zincirdeki kod bu derlemeyle birebir aynı.
Bu bir Devnet testidir; bağımsız güvenlik denetimi değildir.

### Zincirdeki durum

| | Değer |
|---|---|
| Program | [`DZbsSEnZxsfQf1HejcLk63BEDNqzAMXPgVxTq97Bd2zG`](https://explorer.solana.com/address/DZbsSEnZxsfQf1HejcLk63BEDNqzAMXPgVxTq97Bd2zG?cluster=devnet) |
| Program verisi | `Fd41wnL4rZU2PvcnH66Kz42cGiXg1FSKxJp5f8gF8iqz`: kod 1.018.560 bayt, SHA-256 `9c9779c3…f8f57c` ✓; güncelleme yetkisi şimdilik yönetici `DobScce…` |
| Yükleme işlemi | [`3x4a1KSr…`](https://explorer.solana.com/tx/3x4a1KSr8ckxLPnMJibMWnMPDfoFsU41fT15xRuCKTqH9Zq4XpCmFYxcqhwDtYGRtoU1pGHjAQnrupfdJuD3VFRY?cluster=devnet), yuva 509.513.812 |
| CHTA (Devnet) mint | `4d1StKnwkxwFuoLNBQey7fc7U5v8LbdFNr6BLbmkjAhZ`: "Charta DEVNET TEST" / tCHTA; arz 90.000.000; basma ve dondurma yetkisi yok |
| Kasalar | aylık kural 70.000.000; yönetim 15.000.000; açık artırma envanteri 5.000.000 (10M hiç basılmadı = yakılmış pay) |
| Teklif tokenı | TEST-USDC `2ZC1gvHqHo5x2GnYxW4bcTsztp9SD4DpXiQn8KhTaFFD` (değersiz test tokenı) |
| Manifest piyasası | `4pFZTJ7GrhyBoEd12QtnepXFiwgpg8e7qnAbwokLi44y`, programa bağlı |
| Açık artırma bitişi | 18 Ekim 2026 12:00 UTC |

- İlk yükleme denemesi `--use-rpc` ile ortak RPC'de "Max retries exceeded" verdi. Ara hesap (`5UAJs87p…`) kapatılıp 5,175 SOL geri alındı.
- İkinci deneme öncelik ücretiyle tamamlandı.
- Kurulum (`devnet_setup.mjs pre --send`): 15 adımın 15'i tamamlandı.

### Teklif testleri (`scripts/devnet_auction_day0.mjs open`)

Sentetik cüzdanlar A–E kullanıldı. İşlem ücretlerini operatör ödedi. Reddedilmesi beklenen işlemler ön kontrol kapalı gönderildi, böylece her ret Devnet'te gerçek bir başarısız işlem olarak kaydedildi.

| Sayım | Değer |
|---|---|
| Test vakaları | 18 (17 işlem vakası + reddedilenler sonrası kasa kontrolü); **18/18 geçti** |
| Durum kontrolleri (assert) | 18 |
| Gönderilen işlem | 22 (5 fonlama + 17 vaka); 8'i beklendiği gibi reddedildi |

**Kabul edilenler:**
- Teklif.
- Aynı teklifi tekrar verme (reddedilmeli, reddedildi).
- İptal ve tam iade.
- Değiştirme: iptal ve yeni teklif.
- Cüzdan sınırında teklif: tam 250.000.

**Reddedilenler (hata kodlarıyla):**
- Sınır aşımı: 250.001 (Quota).
- 256. fiyat seviyesi (Quota).
- 0 adet (State).
- Yetersiz bakiye (insufficient funds). İşlem tümüyle geri alındı, teklif hesabı açılmadı.
- Başkasının teklifini iptal (ConstraintSeeds).
- Başkasının TEST-USDC hesabından ödeme (ConstraintTokenOwner).
- Sahte emanet hesabı (ConstraintSeeds).
- Yönetici olmayan anahtarla durdurma (ConstraintHasOne).
- Reddedilen işlemlerden sonra emanet bakiyesi değişmedi.

İşlem imzaları: `devnet-day0-auction.json`.

### Duraklatma sırasında iptal (`paused` ve `after` aşamaları)

Yönetici programı sahibin bilgisayarından durdurdu (`4Vid6Kpx…`) ve sonra tekrar açtı (`KBQbApP9…`).

| Vaka | Beklenen | Sonuç |
|---|---|---|
| P1: C durdurma sırasında iptal | kabul | ✓ |
| P2: C durdurma sırasında teklif | ret (State) | ✓ |
| P3: B durdurma sırasında 250.000'lik teklifi iptal | kabul, 50 TEST-USDC tam iade | ✓ |
| U1: B açıldıktan sonra yeniden teklif (200.000) | kabul | ✓ |
| U2: C açıldıktan sonra yeniden teklif (1.000) | kabul | ✓ |

- Durdurma sırasında site Verify, Live ve Auction sayfalarında "PAUSED" gösterdi. Kilitli tutar 35,9 TEST-USDC idi; zincirle aynı.
- **Teklif testlerinin toplamı:** 23 vaka (23/23 geçti), 21 durum kontrolü, 27 işlem (5 fonlama dahil).
- **Açık artırmanın şimdiki durumu:** 4 etkin teklif, 331.000 tCHTA, emanette 96,1 TEST-USDC.

### Site karşılaştırması (https://devnet.heli-experiment.pages.dev)

- **Live ve Auction sayfaları zincirle aynı:** 381.000 CHTA teklif, 4 cüzdan, 86,1 TEST-USDC kilitli (33,6 + 50 + 2,3 + 0,2), arz ve kasalar.
- **Verify:** "Passed · 1 to note". Not, güncelleme anahtarının hâlâ var olması; kurulum bitince `ANRm…` anahtarına geçecek. RPC'ye ulaşılamadığında, mint okunamadığında veya program verisi okunamadığında özet "Could not read the chain" oluyor ve okunamayan satırlar "–" kalıyor. Eksik okumada hiçbir zaman "passed" yazmıyor.
- **Sitedeki cüzdan akışı:** test cüzdanı E ve F ile, gerçek imzalarla 5 senaryo çalıştırıldı (`devnet-day0-site-wallet.json`).
  - **Bulunan hata:** Onay adımı websocket'le 30 saniye bekliyordu. Websocket açılamayınca zincirde **başarılı** olan teklif, değiştirme ve iptal sayfada **"failed"** görünüyordu (3 senaryo).
  - **Düzeltme** (`auction-core.js` `confirmOrThrow`): durum artık HTTP ile soruluyor. Üç sonuç ayrı gösteriliyor: başarılı, zincirde başarısız, süresi doldu / henüz belli değil. "Belli değil" durumu asla "failed" diye yazılmıyor.
  - Testler eklendi; site testleri 39/39.
  - Düzeltmeden sonra 5/5 senaryoda sayfa ile zincir aynı: ön kontrolde ret, zincirde başarısız işlem, teklif, değiştirme ve iptal.
  - Bu düzeltme üretim sitesine bu PR birleşince yüklenecek.

### SOL

| | Bakiye |
|---|---|
| Başlangıç | yaklaşık 20,00 SOL |
| Şimdi | yönetici 12,748, operatör 1,932, eski cüzdan 0,010; toplam yaklaşık 14,69 SOL |

- Harcanan yaklaşık 5,31 SOL.
- Bunun 5,175 SOL'ü programın kira teminatı; program kapatılırsa geri alınır.

### Kalan adımlar

- **18 Ekim 12:00 UTC sonrası:** kapanış (finalize), talepler ve iadeler, `setup post`, piyasa, keeper. Güncelleme yetkisi `ANRm…` anahtarına devredilir.
- **Aylık satış:** bilinen Devnet farkı (bölüm 8).
- **720 aylık senaryolar:** yerelde (bölüm 8), Devnet'te zaman atlatılmaz.
