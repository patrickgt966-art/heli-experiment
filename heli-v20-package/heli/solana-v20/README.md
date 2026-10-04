# HELI V20 — aylık piyasa arzı

2 Ekim 2026 kullanıcı kararı: yalnız ilk **1M** ücretsizdir. Eski Human Dividend
70M kasası **Monthly Market Release Reserve / Aylık Piyasa Arzı Kasası** olur.
Oran, 70M stok üzerinden değil, **serbest bırakılmış ve yakılmamış arz** üzerinden
hesaplanır. Başlangıç tabanı 5M, aylık oran %0,4022473737086389.

| Tahsis | HELI |
|---|---:|
| İlk ücretsiz dağıtım | 1.000.000 |
| İlk piyasa envanteri | 4.000.000 |
| Aylık Piyasa Arzı Kasası | 70.000.000 |
| Yönetim Hazinesi | 15.000.000 |
| Toplam, başlangıçtaki 10M burn sonrası | 90.000.000 |

## Aylık işlem

İlk takvim ayı kapanışından itibaren dönemler sırayla kapatılır. Kimlik kayıt
sayısı, 1.000 kişi tabanı ve kişi başına dağıtım yoktur. Aylık bütçe aşağıdaki
tam sayı hesabıyla belirlenir; SPL token 6 ondalık kullanır:

`capacity = floor((mint_supply - sum(locked_stocks)) × RATE / SCALE)`

`RATE = 4_022_473_737_086_389; SCALE = 10^18`

İlk ay toplam tavan **20.112,368685 HELI** olur. Yönetim kilidi açılmadan önce
bu tavanın tamamı, stok yeterliyse 70M kasasından canonical `market-inventory`
hesabına aktarılır. Sonraki ay hesaplanan taban bu gerçek unlock kadar büyür.
Bu taban, piyasada satılmış miktar veya borsa fiyatı değildir; kilit dışına
çıkarılmış, yakılmamış token miktarıdır. İlk ücretsiz pay da önceki muhasebede
olduğu gibi başlangıçtaki 5M release tabanına dahildir.

Yönetim hazinesi için mevcut 12 aylık kilit korunur. 12. ay kapanışından itibaren
(son dönem hariç) toplam tavanın en fazla %20'si yönetim izni olarak ayrılır;
70M kasası kalan bütçeyi kullanır. Yönetim satışı/yeni likidite release'i ayrıca
gerçek aylık piyasa unlock'ının en fazla dörtte biriyle sınırlıdır. Tek sayaç,
proje rezervine gelir dönüşü ve mevcut fiyat/derinlik kontrolleri korunur.
Kullanılmayan yönetim izni sonraki aya devretmez. Yönetim işlemi yoksa ayrılmış
pay otomatik olarak 70M kasasına verilmez; bu nedenle 5M → 90M / 60 yıl yolu
yine tam kapasite kullanımına bağlı bir üst yoldur.

`settle` herkese açıktır: bir işlem ücretini karşılayan kişi/bot dönem kapanışını
tetikleyebilir; hedef kasa ve miktar değiştirilemez. Zincir kendiliğinden işlem
göndermez. Gecikmiş dönemler, takvim sınırı aşılmadan ve sırayla işlenebilir.
Yeni kayıt veya iki boş aylık claim/reward token hesabı oluşturmak gerekmez.

## Satış ve satılmayan stok

Unlock, satışın tamamlandığı anlamına gelmez. Kilidi açılan stok mevcut bağlı
Manifest piyasasında `place_project_ask` ile fonlanmış limit satış emrine
konabilir. Yönetici limit fiyatını belirler, alış/satış emirleri eşleşirse işlem
gerçekleşir. Alıcı yoksa stok/emir bekler. **Aylık burn yapılmaz.** İptal edilen
ve geri alınan tokenlar satış envanterine döner; tekrar kilitli stok sayılmaz ve
yeni unlock izni yaratmaz. Satış geliri proje rezervine geri alınır.

720. dönemden sonra yeni aylık release bitmektedir. Önceki 60 yıl kapanış
kuralı yalnız hâlâ kilitli kalmış stok içindir; daha önce açılmış satılmayan
stok ve hak edilmiş başlangıç payları bu burn'a dahil değildir. Piyasa emir,
iptal ve geri alma yolları daha önce açılmış stok için korunur.

## Ücretsiz pay

İlk 1M: en fazla 1.000 doğrulanmış kişi × 1.000 HELI, bir defa. Başlangıç
kimlik/7 gün bekleme/ilk 6 ay kayıt kuralları korunur. 6 ay sonunda kimseye
ayrılmamış başlangıç payı satış envanterine geçer. Hak edilmiş fakat çekilmemiş
paylar korunur. Aylık kimlik kayıt/ücretsiz claim yolları açıkça reddedilir.

## Kaynak ve doğrulama

V20, V19'un üzerine canlı yükseltme değildir; yeni yerel test genesis'idir.
V19'un 148 kontrolü V20 için sonuç sayılamaz. Yeni kaynağın ayrı derlenmesi ve
aynı kaynak hash'iyle gerçek ELF testi gerekir. Derleme ve gerçek program testleri tamamlandı; sonuç aşağıda kaydedilmiştir. Devnet/mainnet, gerçek
varlık veya kişi verisi kullanılmaz; bağımsız güvenlik denetimi değildir.

Eski veri düzeni nedeniyle `stocks[0]`, `human`, `Epoch.human_budget` gibi bazı
isimler tutulmuştur. V20'de `human_budget`, kişiye ait hak değil, o dönem gerçekten
piyasa envanterine aktarılmış miktardır. Yeni kayıtlarda kişi payları sıfırdır.

İngilizce site yeni tasarımı anlatır; uygulama durumunu başarılı V19 testinden
ayrı gösterir. Fiyat, likidite ve satış geliri garantisi yoktur.

V20 derlemesi tamamlandı ve gerçek V20/Manifest ELF ile **1606 kontrol/işlem geçti**.
720 ayın tamamında arz hesabı, aylık burn olmaması, ilk ücretsiz hak, iptal/iadede
yeniden kilit oluşmaması, yönetim sınırları ve gelirin proje rezervine dönüşü doğrulandı.
Kaynak SHA-256: `2f0790a42b96ca17831c890be91169f44c8610735304ec38f646ffe07aa11526`.
ELF SHA-256: `1aa53b296736203fb81cc918cb2b6f8d81af463ddba19223aa15d7eace74ab30`.
Sonuç: `market-release-svm-verification.json`. Devnet/mainnet yayımlanmadı.
