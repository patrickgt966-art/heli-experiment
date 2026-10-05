# Kırmızı takım testi — 5 Ekim 2026

Kötü niyetli dış oyuncular (Mallory) ve kötü niyetli bir yönetici, derlenmiş programa yerel LiteSVM'de saldırdı. Gerçek Manifest v3.0.24 ikilisi kullanıldı. Anahtarlar ve quote sentetikti. Ağa dağıtım ve gerçek fon yoktu. Bu çalışma bir denetim değildir.

- **Program:** kaynak `332d701e…`, ELF `29186c9f…`.
- **Betik:** `heli-v20-package/heli/solana-v20/scripts/test_redteam_svm.py`.
- **Çıktı:** `redteam-svm-verification.json`.

## Sonuç

**61 saldırının 61'i engellendi; başarılı saldırı (bulgu) yok.** Mallory hiçbir saldırıdan quote veya token kazanmadı. Toplam arz ve kilitli stoklar (70M + 15M) değişmedi.

| Grup | Denenen | Sonuç |
|---|---|---|
| Mallory her yönetici talimatını yönetici yerine imzalar (41 talimat) | 41 | Hepsi reddedildi. Statik tarama: yönetici imzalı her hesap yapısı `has_one=admin` taşıyor. `propose_expense` ve yönetim devri kontrolü talimatın içinde yapılıyor (devir ayrıca `test_governance_svm.py`'de test edildi). `initialize` yükleme yetkisine bağlı (H1) |
| İhale: başkasının teklifini talep etme, ikinci talep, ihale bittikten sonra teklif, ikinci sonuçlandırma | 4 | Hepsi reddedildi |
| Fiyat referansı: aynı saatte ikinci örnek, gözlemi başka talimatla aynı işleme koyma, kopyalanmış sahte piyasa hesabı | 2 (+1 kontrol) | Saldırılar reddedildi. Aynı saatteki gözlem tasarım gereği başarılı döner (A6) ama örnek eklemez; bu da kontrol edildi |
| Giderler: kendine gider önerme, 7 gün dolmadan ödeme, ödemeyi kendi hesabına yönlendirme, sahte bağış/rezerv/operasyon hesabı, aynı gideri iki kez ödeme | 7 | Hepsi reddedildi. Satıcı tam onaylanan tutarı aldı |
| Kötü niyetli yönetici: yönetim/proje parasını veya envanter token'ını kendi hesabına çekme, ilk 12 ayda kilitli stoku açma, 60. yıl kapanışını erken yapma, ay bitmeden kapatma, sırasız ay açma | 7 | Hepsi reddedildi |
| Kötü niyetli yönetici: rezerv parasını yönetim hesabına gönderip geri alarak sahte "gelir" yaratma | kontrol | Gelir sayacı değişmedi |

Kanıtın gücü konusunda bir not: yönetici talimatı saldırılarının bir kısmı, yönetici kontrolüne gelmeden başka nedenlerle reddedildi (hesap zaten var, test ortamında eksik hesap yerine Mallory'nin adresi verildi). Bunlar için asıl kanıt, yukarıdaki statik taramadır.

## Ölçülen ekonomik saldırı: sahte alış (spoof)

Mallory 1.000 USDC'lik bir alış emrini 10,0 fiyattan (gerçek fiyatın 10 katı) defterde bekletti.

- Gözlemden hemen önce konan emir **sayılmadı** (taze emir kuralı).
- Bir saat bekledikten sonra örnek olarak alındı, ama en yeni örnek bir sonraki saate kadar **ağırlık almıyor**. Etki edebilmesi için emrin en az iki saat defterde kalması gerekiyor.
- İki saat sonunda iptal edildi. 24 saatlik referans **1,0 → 1,391** oldu (+%39). Bu, farkın 1/23'üdür; referans 10,0'a çıkmadı.

**Sonucu:**
- Yüksek referans projenin satış tabanını yükseltir. Bu, projeyi korur.
- Doğrudan aylık satış, alış fiyatının referansın %98–102'si arasında olmasını ister. Bu yüzden referans şişikken o gün satış yapılamaz. Etki: en fazla bir günlük gecikme.
- Yönetimin alış tavanı (referansın %105'i) da yükselir, ama alış yapmak yöneticinin kararıdır.
- Mallory'nin parası saldırı boyunca risk altındadır: dışarıdan bir satıcı 10,0'dan ona satabilir.

**Düşük eşikle (25 USDC) dikkat:** ince bir piyasada saldırganın referansı belirlemesi için 1.000 değil yaklaşık 25 USDC yeter. Aşağı yönlü etkisi şu iki sınırla sınırlı:
- Sadece yöneticinin elle başlattığı aylık satış, referansın %98'inin altına inemez.
- Satış miktarı dış derinliğin %2'sini geçemez. 25 USDC derinlikte bu ayda ~0,5 USDC eder.

Bu, eşiği 25 seçerken kabul edilen risktir.

## Kapsam dışı / bilinen ve kabul edilenler

- **Çok cüzdanla ihale sınırını aşma:** kimlik olmadığı için kod engelleyemez. Bu bilinçli bir karardır.
- **Kurucunun kişisel cüzdanları:** kod bunları dış alıcıdan ayıramaz. Kamuya açık taahhütle çözülür.
- **Toz emirle gözlemi durdurma (192 düğüm):** bilinen durum. Satış tabanı 30 gün boyunca korunur (`test_market_measure_v22_svm.py`).
- **Henüz denenmedi:**
  - mainnet Metaplex ikilisi;
  - gerçek ağ zamanlaması;
  - Manifest'in yeni sürümleri;
  - tüm hesap kombinasyonları için bulanık test (fuzz);
  - MEV / işlem sıralama saldırıları.
- Bu yerel test bağımsız bir profesyonel denetimin yerine geçmez.
