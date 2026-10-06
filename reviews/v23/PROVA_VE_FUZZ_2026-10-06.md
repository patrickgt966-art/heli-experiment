# Uçtan uca prova ve fuzz testleri (6 Ekim 2026)

Program kodu değişmedi. Bu çalışmada test edilen ELF, V23 derlemesidir:
`ce1949d9b35ca102b4e1ca515d1f26c3808e4cf0880f3063ad5bb98c49cbbc43`.

Tüm çalışmalar yerelde yapıldı:
- yalnızca sentetik anahtarlar ve sentetik USDC kullanıldı;
- ağa dağıtım, gerçek fon ya da gerçek kimlik kullanılmadı.

Bu sonuçlar bağımsız bir denetimin yerine geçmez.

## 1. Uçtan uca prova (`scripts/rehearsal.mjs`)

### Prova zinciri (`scripts/svm_rpc.py`)

Program, ihale bitişinin kurulumdan en az 7 gün sonra olmasını şart koşuyor. `solana-test-validator` ise gerçek saatle ilerliyor. Bu yüzden prova için ayrı bir yerel zincir yazıldı:
- LiteSVM üzerinde çalışıyor ve yalnızca 127.0.0.1'e bağlanıyor;
- derlenmiş Charta ELF'ini, vendored Manifest v3.0.24'ü ve Token Metadata test derlemesini yüklüyor;
- standart Solana JSON-RPC ve websocket arayüzü sunuyor;
- saati `charta_warp` ile yalnızca ileri sarılabiliyor.

Böylece kurulum betiği, bakım servisi ve web sitesi hiç değiştirilmeden onunla çalışıyor.

`--pretend-devnet` seçeneği yalnızca bakım servisinin "yalnız Devnet" kontrolü içindir. Prova betiği, bağlandığı zincirin bu yerel prova zinciri olduğunu ayrıca doğruluyor; başka bir zincirde çalışmayı reddediyor.

### Senaryo

1. Kurulum betiği, `pre` aşaması: 15 adım, Manifest pazarının bağlanması dahil.
2. Teklifler:
   - 40 alıcı, sitenin kendi kodlayıcısıyla (`auction-core.js`) teklif veriyor;
   - 6 teklif değiştiriliyor, 1 teklif iptal ediliyor;
   - reddedilmesi gereken teklifler deneniyor: 250.001 CHTA, 256'ncı fiyat seviyesi, iptal etmeden ikinci teklif, başkasının teklifini iptal.
3. Son 5 dakika: yeni teklif ve iptal reddediliyor.
4. Bakım servisi (`KeeperEngine` ve `SolanaAdapter`, `run.mjs` ile aynı biçimde) ihaleyi kapatıyor.
5. Kurulum betiği, `post` aşaması.
6. Her alıcı claim ediyor; aynı claim ikinci kez reddediliyor.
7. Sahipler arasında 3 transfer yapılıyor.
8. Güncelleme yetkisi ayrı çevrimdışı güncelleme anahtarına devrediliyor (dağıtım adımı 15; iki anahtar da imzalıyor). Kurulum betiği bu anahtarı bakım servisinin ayarına yazıyor.
9. Bakım servisi 3 ay boyunca çalışıyor: ay açma, aylık kapanış ve piyasa gözlemi.
10. 12 USDC'lik sabit teknik gider öneriliyor. 7 gün dolmadan ödeme reddediliyor; 7 gün sonra ödeniyor.

### Sonuç: 173 kontrol, 0 hata

İlk çalıştırma 171 kontrolle güncelleme yetkisini kurtarma anahtarına devrediyordu. Sahibin 6 Ekim kararından (ayrı çevrimdışı güncelleme anahtarı) sonra prova yeniden çalıştırıldı; iki yeni kontrol eklendi. Son çalıştırma V24 ELF'i (`c0e81814…`, kurtarma anahtarıyla duraklatma kaldırma) ile yapıldı. Fuzz testi de V24 ile yeniden çalıştırıldı: 30 tohum, 12.029 adım, 125.623 kontrol, 0 bulgu (`fuzz-verification.json`).

Ayrıntılar `rehearsal-report.json` dosyasında.

**İhale**
- Takas fiyatı 0,00023 USDC (3. seviye). Toplam talep 5.587.441 CHTA, yani 5M'nin üzerinde.
- 34 teklif tam doldu, 2 teklif kısmen doldu, 4 teklif dışarıda kaldı.
- Takas seviyesi, fiyat ve satılan miktar `auction.rs` kurallarıyla bağımsız olarak hesaplandı ve programla birebir eşleşti.
- Her claim'de alınan CHTA ve geri ödenen USDC, kuralın verdiği değerle birebir aynı çıktı.
- Toplam 4.999.999,999999 CHTA dağıtıldı ve 1.150,000001 USDC ödendi:
  - aradaki 1 atomluk CHTA farkı, orantılı paylaştırmanın aşağı yuvarlamasından geliyor;
  - USDC'deki 1 atomluk fark ise ödemenin yukarı yuvarlanmasından geliyor;
  - ikisi de programın kuralı ve beklenen davranış.

**Arz ve kasalar**
- Her aşamadan sonra şunlar doğrulandı:
  - arz 90.000.000 CHTA;
  - tüm CHTA hesaplarının toplamı arza eşit;
  - kasa bakiyeleri kayıtlı stoklara eşit;
  - basma yetkisi kapalı.

**Site mantığı zincir verisiyle**
- Baloncuk haritası 36 cüzdanı gösterdi; harita çizgileri yalnızca 3 cüzdan-cüzdan transferi için çizildi, claim işlemleri çizgi oluşturmadı.
- Doğrula sayfası:
  - kod derlemeyle eşleşiyor;
  - güncelleme anahtarı = kurtarma anahtarı.
- Teklif etiketleri gerçek dağıtımla tutarlı.

**Bakım servisi**
- İhaleyi kapattı.
- 3 ay boyunca her ayı açtı, kapattı ve gözlemi yaptı.
- Aylık tavanlar yayımlanan oranla tutarlı. Örneğin 3. ayda 5.040.305 × %0,402247 = 20.274,5 CHTA.

**Site görünümü**
- Site prova zincirine bağlanıp tarayıcının saati zincir saatine eşitlendi.
- Kontrol edilen sayfalar:
  - Doğrula: "Passed · 1 to note";
  - Canlı veri: 3. ay, 1.138 USDC rezerv, 12/12 USDC sabit gider;
  - İhale: FINALIZED, 0,00023 USDC;
  - Harita: 36 cüzdan, 3 çizgi.

### Provanın bulduğu sorunlar

1. **Canlı veri sayfası, bir ayın tavanını yanlış okuyordu** (site hatası, düzeltildi).
   - Program bir ayın tavanını yalnızca o ay kapanırken (`settle`) yazıyor.
   - Sayfa henüz açık olan ayı okuduğu için "0 CHTA" gösteriyordu.
   - Artık son kapanan ayın tavanı ve satışa açılan miktar gösteriliyor ("Last monthly release").
2. **Prova zinciri gerçek RPC'den farklı davranıyordu** (yalnız araç; programı ve siteyi etkilemiyor):
   - simülasyonda imza kontrolü;
   - ileri sarma sonrasında blok özetinin geçerliliği.

   İki davranış da gerçek RPC'ye uyduruldu.
3. **Senaryo hatası:** gider numarası (`nonce`), programın beklediği sıradaki numara olmalıydı. Program bunu doğru şekilde reddetti; senaryo düzeltildi.

## 2. Modele dayalı fuzz testi (`scripts/test_fuzz_svm.py`)

Her tohumda iki rastgele kampanya çalışıyor. Her adımdan sonra program, kuralların bağımsız bir Python modeliyle karşılaştırılıyor.

**A. Canlı ihale**
- 6 cüzdan ve bilinçli olarak çoğu geçersiz girdi:
  - miktar: 0, 250.001, 2^63;
  - fiyat seviyesi: 256 ve 65.535;
  - yetersiz bakiye.
- Saldırılar:
  - başkasının teklifini iptal etmek;
  - başkasının USDC hesabıyla teklif vermek;
  - erken claim ve erken kapanış.
- Yönetici ve yabancı tarafından duraklatma denemeleri; zamanın son 5 dakikaya sıçratılması.
- Ardından ihale kapanışı ve rastgele sırayla claim'ler.

**B. Lansman sonrası**
- Aylarca süren rastgele zaman sıçramaları.
- Doğru ve yanlış numaralarla ay açma ve aylık kapanış.
- Bağışlar.
- Gider önerme, iptal ve ödeme: sabit ve diğer, geçerli ve geçersiz.
- Duraklatma; yabancıların yönetici işlemlerini denemesi.

**Bulgu sayılan durumlar**
- Program, modelin yasakladığı bir işlemi kabul ederse.
- Modelin izin verdiği bir işlemi reddederse.
- Bir değişmez bozulursa:
  - arz;
  - hesap toplamı;
  - kasa ve stok eşitliği;
  - teminat;
  - cüzdan bakiyeleri;
  - aylık tavan formülü;
  - 7 günlük gider beklemesi;
  - 30 günde 12 USDC sabit gider sınırı;
  - yılda %25 penceresi;
  - proje tabanı.

### Sonuç (`fuzz-verification.json`): bulgu yok

| Ölçü | Değer |
|---|---|
| Tohum | 30 |
| Rastgele adım | 14.393 |
| Kontrol | 150.656 |
| Kapanan ay | 313 |
| Ödenen gider | 106 |
| Bulgu | 0 |

Aynı tohumlar her çalıştırmada aynı sonucu veriyor.

### Karşı kontrol (mutantlar)

"Bulgu yok" sonucunun anlamlı olduğunu göstermek için programa bilerek dört hata konuldu ve her biri Agave 2.1.21 ile derlendi. Her mutant 10 tohumla fuzz testinden geçirildi.

| Mutant | Değişiklik | Sonuç |
|---|---|---|
| CAP | `auction.rs`: cüzdan başına 250.000 sınırı kaldırıldı | Yakalandı: 250.001'lik teklif kabul edildi |
| MONTH | `market_release.rs`: aylık tavan iki katı | Yakalandı: 202 bulgu, tavan formülden farklı |
| WAIT | `lib.rs`: gider beklemesi kaldırıldı | Yakalandı: 7 gün dolmadan ödeme kabul edildi |
| FREEZE | `auction.rs`: son 5 dakikada iptal serbest | Yakalandı: son 5 dakikada iptal kabul edildi |

Dört mutantın dördü yakalandı. Mutant derlemeleri depoya eklenmedi.

## Çalıştırma

```
# Fuzz (yalnız LiteSVM ve solders):
python heli/solana-v20/scripts/test_fuzz_svm.py 30 300 300

# Prova (solders ve websockets; Node bağımlılıkları heli/mobile/deps.mjs üzerinden):
python heli/solana-v20/scripts/svm_rpc.py --upgrade-authority <ADMIN_PUBKEY> --pretend-devnet &
node heli/solana-v20/scripts/rehearsal.mjs <iş klasörü>
```

İş klasöründeki `admin.json` dosyası ve prova sırasında üretilen anahtarlar **depoya eklenmemeli**.

## Sınırlar

- Prova zinciri LiteSVM'dir: aynı SVM çalışma zamanı, ama ağ, oylama ve gerçek ücret piyasası yok.
- Devnet'te bunlar ayrıca denenecek: gerçek RPC sınırları, ücretler ve gecikme.
- Fuzz modeli, kuralların bizim yorumumuzdur. Model ile program aynı yanlış varsayımı paylaşırsa bu test onu yakalayamaz. Bağımsız denetim bu yüzden hâlâ gerekli.
- Kapsam dışında kalanlar:
  - yönetim emirleri;
  - Manifest üzerindeki alım-satımlar;
  - anahtar devri.

  Bunlar mevcut LiteSVM testlerinde ve saldırı (red team) testlerinde ayrıca deneniyor.
