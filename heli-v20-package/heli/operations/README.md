# HELI aylık süreklilik ve kendi kendini finanse etme hesabı

**3 Ekim 2026: gider modeli V20'ye güncellendi; ayda tek dönem hesabı ve iki bakım işlemi esas alınır. [Güncel V20 belgesi](../keeper/V20.md). Aşağıdaki sürüm ve maliyet kayıtları tarihseldir.**

**Güncel V15 işletim planı:** [Durum ekranı, kira ölçümü, gider hesabı ve yeniden başlama](ISLETIM_PLANI_2026-09-30.md). Yerel ekran: http://127.0.0.1:8771/. Aşağıdaki belge V10 tarihsel hesabıdır; eski program boyutu, üç imza ve kullanıcı ödeme varsayımları güncel V15 maliyeti değildir. Yeni model, bilinmeyen hizmet giderlerini sıfır kabul etmez ve günlük ayrılmış gideri harcanmış gelir gibi göstermez.

28 Eylül 2026. Bu belge **kimlik doğrulamasını kapsam dışı bırakır**. Sürekli Sat/Al yolu olarak değerlendirilen Manifest emir defteri kendi açıklamasına göre işlem ücreti almıyor; dolayısıyla HELI, oradaki alış-satışlardan düzenli protokol geliri varsayamaz. Gelir kaynağı olarak yalnız **gerçekleşmiş ilk HELI satışının karşılık varlığı** sayılır. Satış olmazsa bu gelir sıfırdır. [Manifest kaynak açıklaması](https://github.com/Bonasa-Tech/manifest), [HELI piyasa yolu](../manifest-integration/README.md).

## Aylık işlemin gecikmesi

[V10 çalışma kaynağında](../solana-v10/src/lib.rs) `open_epoch`, `finalize_registry` ve `settle` geç gelen çağrıları kabul edecek biçimde düzenlendi. Kapanış herkesçe çağrılabilir; kurucunun ya da kimlik görevlisinin imzasına gerek yoktur. Dönemler sırayla sonuçlandırılır ve ağırlık hesabı, gecikme gününe değil **asıl takvim döneminin sonuna** kadar yapılır. Sonuçlandırma ancak ay bittikten sonra yapılır. Program duraklatılsa bile daha önceki dönemler kapatılabilir. 60. yıl kapanışı, 720 dönemin tamamı sonuçlandırılmadan yapılamaz. V10 derlendi; dört gecikmiş ay ve geçmiş staking ödülü derlenmiş ELF ile yerel Solana simülatöründe doğrulandı. Açık ağ testi ve bağımsız güvenlik incelemesi yapılmadı.

Kullanıcıların henüz kayıt olmadığı eski bir ay geç açılırsa yeni geriye dönük kayıt kabul edilmez; o ayın kullanılmayan Human Dividend hakkı sonraki aya devretmez. Önceden kayıtlı haklar ise geç sonuçlandırmadan sonra talep edilebilir. İşlemleri kimsenin gönderme zorunluluğu yoktur: izin gerekmemesi otomatik çalıştığı anlamına gelmez. Gönderici SOL işlem ücretini ve yeni ay hesaplarının kira muafiyet bakiyesini öder. Çağrı teşviki/geri ödeme talimatı ayrıca gerekir.

## Sabit değil, satışa bağlı bütçe kuralı

Rastgele bir yüzdeyi anayasa kuralı olarak seçmiyoruz. Önce gerçekleşen HELI satışı ve o günkü SOL/karşılık kuru bilinir. Ardından gerekli rezerv şu şekilde hesaplanır:

`gerekli karşılık = (gelecekteki SOL ihtiyacı × karşılık/SOL kuru) + planlanan zincir dışı giderler`

Gerçek satış geliri bu tutarın altındaysa sistemin satıştan kendi kendini finanse ettiği iddia edilmez, gider taahhüdü açılmaz ve daha fazla HELI basılmaz. Fazla gelir oluşursa hangi kısmının gider kasasına geçebileceği ve kalan rezervin yönetimi ayrıca, açık bir tavanla kodlanmalıdır. V9'un `auction-proceeds` kasasından gider kasasına aktarım yolu **yoktur**; mevcut gider sözleşmesindeki `earned_total` artmadığından üç imzalı ödeme yolu bu ihaleyle fonlanmaz. Karşılık USDC ise SOL giderini ödemek için dönüşüm de gerekir; bu kodlanmadı.

## Ölçülebilen alt sınır

[`budget.py`](budget.py), V10'un 949.336 bayt ELF boyutunu ve yerel Solana simülatörünün kira muafiyet hesabını kullanır. Program yayımlama hesap bakiyesi yaklaşık **6,61 SOL** olur. Bu bakiye satıştan *önce* gerekir; satış kendi yükleme maliyetini önceden karşılayamaz. Gerçek yayımlama hesabı, program büyüklüğü ve ağ parametreleriyle yeniden ölçülmelidir. Genesis ve ilk piyasa hesapları bunun dışında kalır.

Her aylık dönem hesabı ve iki SPL kasası yerel ölçümde toplam **0,005916 SOL** bağlar. 720 dönem için **4,25952 SOL** eder. Üç adet tek imzalı temel işlem varsayımıyla 60 yıllık çıplak ağ ücreti **0,0108 SOL**; öncelik ücreti, ek checkpoint işlemleri ve kullanıcı hesapları dışarıdadır. %25 güvenlik tamponuyla zincir tarafında **5,3379 SOL** gelecek rezervi gerekir. Kullanıcıya özel staking/kimlik hesaplarının depozitolarını kullanıcıların ödemesi varsayılmıştır; bu pay değişirse maliyet de değişir. [Solana ücret açıklaması](https://solana.com/docs/core/fees/fee-structure), [program yayımlama maliyeti](https://solana.com/docs/programs/deploying).

Yalnız **örnek hesap**: 1 SOL = 100 karşılık birimi ve yıllık zincir dışı gider = 0 kabul edilirse gelecek rezervi 533,79 karşılık birimi olur. 1 milyon HELI ortalama 0,0001'e satılırsa gelir 100'dür, yetmez; ortalama 0,001'e satılırsa 1.000'dir, yalnız bu dar gider varsayımında yeter. Yıllık 100 karşılık birimi işletme gideri bile 60 yılda 6.000 ekler ve ikinci senaryoyu yetersiz yapar. Bunlar **piyasa fiyatı veya SOL kuru tahmini değildir**. Gelecekteki SOL fiyatı, ağ ücreti ve gereken personel maliyeti sabit kalmayacağından 60 yıllık kesin garanti verilemez.

Sonuç: **zorunlu işi en aza indir, dönem çağrılarını izinsiz ve gecikmeye dayanıklı yap, kişisel işlem masrafını işlemi isteyen ödesin, gerçek satıştan sonra hesaplanan SOL rezervini ayır; satış yoksa ücretli işletme sözü verme.** Kurucu için kaçınılmaz başlangıç SOL'u, daha küçük program ve hesap tasarımıyla azaltılabilir; sıfıra indirilemez.

Yerel bütçe testi: `python -m unittest -q test_budget.py`. V10 ELF sonuçları [çalışma sürümünde](../solana-v10/README.md) kayıtlıdır.
