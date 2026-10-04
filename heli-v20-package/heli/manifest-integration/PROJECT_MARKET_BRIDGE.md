# HELI proje envanterini tek serbest piyasaya bağlama

28 Eylül 2026. Güncel yön: V13'ün açılış ihalesi ile sonraki kullanıcı Sat/Al işlemleri **aynı HELI/quote çiftinin** fiyat keşfi yoludur. İhale önce tek açılış fiyatını üretir; sonrasında çift taraflı emir defteri fiyatı eşleşen işlemlerle üretir. [Manifest](https://github.com/Bonasa-Tech/manifest) bu emir defteri için adaydır. Bu belge proje envanterinin piyasaya girişini somutlaştırır; gerçek Manifest CPI veya canlı pazarın kurulduğu iddiası değildir.

## Muhasebe ve işlem sırası

1. Genesis'te 1 milyon HELI ücretsiz hak kasasına, 4 milyon HELI proje piyasa kasasına konur. Ücretsiz kasa emir piyasasına bağlanmaz.
2. Açılış ihalesi taban fiyatı ve HELI/quote çifti yayımlanır. Alıcılar quote teminatı koyarak teklif verir. İhale kapanınca satın alınan HELI **alıcı çekene kadar** piyasa kasasında hak olarak rezerve edilir.
3. İhaleden kalan satılabilir miktar `piyasa kasası bakiyesi − henüz çekilmemiş ihale hakları`dır. Bu miktar, sabitlenmiş tek pazar adresindeki **proje satış emrine** aktarılabilir. Piyasa katılımcılarının alış/satış emirleri aynı pazarda kalır. Fiyat bir formülle yükseltilmez; proje kendi minimum kabul fiyatıyla emir verir, alıcıların karşı emirleriyle işlem oluşur. Piyasada yeterli alıcı yoksa HELI satılmadan bekler.
4. Program kasasından piyasa emir hesabına çıkış **yalnız HELI programının imzaladığı işlemle** yapılır. Pazar program kimliği, pazar hesabı, HELI minti ve quote minti zincirde doğrulanır; kurucunun kişisel token hesabına veya başka pazara aktarım yolu yoktur. Dış piyasada kalan HELI ile gerçekleşmiş quote, yalnız program denetimli hesaplara çekilebilir. Satış gelirini gider kasasına taşıma ayrı kural ve rezerv sınırıyla yapılır.
5. Altıncı ayda `1 milyon − geçerli hak sahibi × 1.000` HELI, henüz çekilmemiş haklar korunarak ücretsiz kasadan proje piyasa kasasına taşınır. Aynı pazarın yeni satış emrine konu olabilir; başka fiyat veya ikinci piyasa açılmaz.

## V13'ten gereken somut kod değişikliği

- V13'ün 64 tekliflik sabit ihale hesabı halka açık açılış için ölçeklenebilir değildir. Üretim sürümü teklifleri ayrı hesaplarda tutmalı veya kapasite/pencereyi açıkça sınırlayan başka bir yöntem kullanmalıdır. Mevcut 64 tekliflik sonuç yalnız yerel pilottur.
- HELI programında **pazarı bir kez bağlama**, **proje envanterini rezerve ederek satış emrine koyma**, **emri iptal etme**, **dolum ve karşılık gelirini program kasasına çekme** talimatları gerekir. Manifest resmî wrapper/core hesapları ve talimat baytları hedef program sürümüne göre doğrulanmadan CPI yazılmaz. Program sahibi PDA imzasını cüzdan SDK'sı tek başına üretemez; mevcut [`market_adapter.mjs`](market_adapter.mjs) yalnız kullanıcıların kendi cüzdan işlemlerini hazırlar.
- İlk gönderimden sonra pazar adresi ve iki mint değiştirilemez. Program kasası + ihale hakları + dış pazardaki program bakiyesi her işlemden sonra mutabık kalmalıdır. Piyasa kapanır veya üçüncü taraf program değişirse bekleyen emrin iptal/geri çekme yolu test edilmelidir.
- Kurucu satış emri fiyatını belirleyebilir; bu **piyasa fiyatını belirlemek** değildir. Kullanıcı emirleri daha yüksek ya da düşük fiyatlardan eşleşebilir. Fiyat değiştirmek için eski proje emri iptal edilip yeni fiyatlı emir gönderilir; böyle bir yetkinin sınırları ve kamuya görünürlüğü ana ağ öncesinde ilan edilir.

## Bu turda tamamlanan yerel kontrol

[`inventory_guard.mjs`](inventory_guard.mjs), ihale alıcısı henüz tokenını çekmemişken aynı HELI'nin ikinci satış emrine ayrılmasını reddeder, yanlış HELI/quote pazarını reddeder ve altıncı aydaki kullanılmayan ücretsiz miktarı tam atom cinsinden hesaplar. [`inventory_guard.test.mjs`](inventory_guard.test.mjs) 3 milyon ihale satışı / 1 milyon kalan, boş ihale, yanlış pazar ve 300 kişi / 100 çekilmiş hak senaryolarını sınar. Bu JavaScript muhasebesi Solana sözleşmesinin yürüttüğü bir güvenlik kuralı **değildir**; sonraki on-chain talimat için kabul ölçütüdür.

Canlıya geçiş koşulu: aynı pazarın resmî Manifest sürümüyle program imzalı yatırma/emir/iptal/çekme zincir işlemleri, 64'ü aşan ihale katılımı, kısmi dolum, bütün ihale haklarının çekilmesi, altıncı ayda kalan ücretsiz pay, hatalı pazar hesabı ve yetkisiz aktarım testleri Devnet'te geçmelidir. HELI V13 henüz Devnet'e yüklenmedi.
