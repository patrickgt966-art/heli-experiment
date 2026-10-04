# HELI — kesintisiz işletim ve gider planı

30 Eylül 2026. 4. başlığın yerelde uygulanabilir kısmı tamamlandı. Durum ekranı bu bilgisayarda çalışır: http://127.0.0.1:8771/. Devnet çalıştırıcısı, bir sunucu kiralaması veya başlangıç görevi bu çalışmada açılmadı. Gerçek fon harcanmadı.

## İşletim düzeni

Bir kişi kurucu olarak devam eder. İşlem gideri cüzdanı programı/yönetici hesabını değiştiremez, kurucu satışı yapamaz, gider kasasını çekemez. Çalıştırıcı yalnız izinli bakım işlerini gönderir. Fiyat gözlemleri gönderilmeden önce **sonraki ayın üç hesabı ve dört bakım işlemi için SOL**, ayrıca asgari bakiye korunur. Para azaldığında gözlemler bekler; mevcut aylık kapanışlara öncelik verilir. Bu, ücretsiz başvurucu sponsor bütçesini finanse etmez; sponsor ayrı cüzdandır.

Boş bekleyişte ağ okuması dört dakikada bir yapılır; bilinen kayıt kapanışı/fiyat gözlemi zamanı yaklaşırsa daha erken uyanır. İşlem gönderildikten sonra onay izlenir. Kod/yetki kontrolleri her gönderim öncesinde korunur. RPC çağrı sayısı ve hizmet bedeli yine sıfır değildir. Dört bakım işlemi sıradan ay varsayımıdır; uzun kesinti veya ek checkpoint işlerinde artar.

Durum ekranı son zincir doğrulamasını, kapanan ayı, bekleyen ayları, cüzdan bakiyesini ve ayrılan günlük gider hakkını gösterir. Beş dakikayı aşan eski durum, düşük bakiye, belirsiz işlem ve gider tavanı için uyarı üretir. Durum veya bakiye ölçümü yoksa bunu tamamlanmış göstermez. `/healthz` yalnız güncel Devnet yürütmesinde ve uyarı yokken 200 döner; diğer durumda 503. Bu, tek başına otomatik yeniden başlatma talimatı değildir. Kod değiştirme kontrolü başarısızsa yeniden başlatmak güven sorununu çözmez; pinleri körlemesine değiştirmeyin.

Durum ekranı yalnız yerel adreste ve salt okunurdur. Özel anahtarları, RPC URL'sini, ham imzalı işlemleri veya gider günlüğünü sunmaz. Mesaj/e-posta gönderilmedi. Bilgisayar kapanırsa ekran da kapanır; tam kesintiyi algılayacak bağımsız dış izleme gerçek sunucu kurulurken eklenmelidir.

## Maliyet ölçümü

Güncel ana ağ RPC okuması program hesapları için 6,52227804 SOL, ilk başvurucu için hesaplar ve imza ücretleriyle 0,00445476 SOL verdi. Aşağıdaki 8,936 SOL ve kira tutarları **yerel test tarifesidir**. Yerleşik Ed25519 sağlayıcı imzasının 5.000 lamport ek ücretini de ölçerek ilk başvuru modelini düzelttik. [Ana ağ başlangıç ölçümü](mainnet-rent-quote.json).

[Yerel V15 kira ölçümü](v15-rent-measurement.json) şu boyutları kullanır: aylık hesap 168 bayt, iki SPL kasa 165'er bayt. Eski V10 hesabı güncel aylık maliyet değildir. RPC'de aynı boyutlarla yeniden ölçülmelidir.

| Kalem | SOL | Kapsam |
|---|---:|---|
| Bir aylık hesapların depozitosu | 0,00613872 | V15'in üç hesabı; harcanan ağ ücreti değil, hesaplarda bağlı bakiye |
| Ayda 720 gözlem + 4 bakım temel ücreti | 0,00362 | 30 gün, 5.000 lamport/tek imza, öncelik ücreti yok |
| Aylık bakım, %25 tampon dahil | **0,0121984** | Kullanıcı işlemleri, sunucu ve kimlik hizmeti hariç |
| Gözlem olmadan 4 bakım, %25 tampon dahil | 0,0076984 | Düşük faaliyet için dar bakım senaryosu |
| 1.000 ilk başvuru/teslimat | **6,09412** | Önceki yerel 6,06912 SOL hesap ölçümü + iki çift imzalı işlem + yerleşik sağlayıcı imzası/kişi; tampon ve kimlik hizmeti hariç |
| V15 program + ProgramData hesapları | **8,93603448** | 1.283.576 bayt ELF; yükleme buffer'ı, upload/genesis/piyasa hesapları ve işlem ücretleri hariç |

Yayımlama sırasında geçici buffer için ek SOL bağlanabilir; 8,94 SOL tek başına eksiksiz yayımlama bütçesi değildir. Bu ilk kurulum, satış başlamadan önce gerekir. Daha sonra hesapları kapatıp kiraları otomatik geri alma kodu eklenmedi; eski hak sahiplerinin hesabını kapatmak bu işin kapsamında değildir.

Temel ücret kaynağı: [Solana ücret açıklaması](https://solana.com/docs/core/fees). Öncelik ücreti ve canlı kira RPC'den ölçülür. Bunlar SOL fiyatı veya kullanıcı tahmini değildir. Devnet'teki test SOL'uyla ana ağın ekonomik gideri birbirine karıştırılmaz.

## Gelir ve süre hesabı

Yeni [hesaplayıcı](finance.mjs), yalnız **gider için harcanabilir bütçeyi** kullanır. İhale iadeleri, kullanıcı teslimat hakları veya rezervin tamamı işletme parası sayılmaz. Henüz satılmamış HELI nakit değildir. Manifest hacminden otomatik HELI işlem geliri çıkmaz; mevcut modelde tahsil edilen işlem geliri varsayılan olarak sıfırdır. Teorik ücret yüzdesi girilse bile bu gelir tahsil edilmiş kabul edilmez; ek ücret alma kodu uygulanmadı.

SOL ile karşılık bütçesi ayrı tutulur. Karşılık kasasında para bulunması, SOL cüzdanını kendiliğinden doldurmaz. Otomatik dönüşüm/gider kasasından doldurma bu çalışmada yapılmadı. Eksik sunucu/RPC/kimlik fiyatları sıfır kabul edilmez; toplam gider ve işletim süresi bilinmiyor olarak kalır. Kimlik hizmetinin sabit abonelik bedeli varsa diğer aylık giderlere ayrıca eklenir. Aylık devam eden HD/staking talepleri, ihale ve piyasa kullanıcı işlemleri bu ilk başvuru örneği dışında ayrıca bütçelenir.

**Yalnız örnek:** işletime ayrılmış 0,25 SOL ve 100 karşılık birimi; 1 SOL=100 karşılık birimi; sunucu 10/ay, RPC 0/ay; yeni başvurucu ve tahsil edilmiş gelir sıfır. Aylık zincir gideri tamponla 1,21984 karşılık; toplam 11,21984 karşılık. SOL cüzdanı yaklaşık 20,08 ay, karşılık bütçesi 10 ay dayanır: ayrı cüzdanlarla sınır **10 ay**. Dönüşüm ayrıca yapılabilse birleşik hesap yaklaşık 11,10 aydır. Bu bir sağlayıcı fiyatı, güncel kur veya gerçek HELI bakiyesi değildir.

Sıfır gelir + pozitif gider sonsuza kadar kendi kendini finanse etmez. En az maliyetli pilot mevcut bilgisayarda kurulabilir; makine açık/uyanık kalmalıdır, elektrik/internet/yıpranma gideri yok sayılmaz. Kesintisiz sunucunun bedeli gerçek teklif alındığında hesaplayıcıya girilir. Sponsor veya gelecekteki satış gerçekleşmiş gelir yerine konmaz.

## Çalıştırma ve yeniden başlama

1. Şimdi: `node heli/operations/server.mjs` salt okunur ekranı açar. `node heli/operations/check-health.mjs` durumu kontrol eder; hizmet yoksa çıkış kodu 2. Bu hata beklenen durumdur, Devnet'e gönderim yapmaz.
2. Devnet hazır olduğunda: V15/Manifest ikililerini ve yönetici/doğrulayıcı adreslerini doğrula; ayrı çalıştırıcı anahtarını ve test bakiyesini ata. `node heli/keeper/run.mjs CONFIG --once` imzasız ön kontrolü geçmelidir.
3. Windows: `heli/keeper/install-startup.ps1 -ConfigPath CONFIG` planı gösterir. Açık `-Install` seçeneği başarılı ön kontrolden sonra mevcut kullanıcı oturum açınca gizli çalışacak görevi kaydeder; hemen başlatmaz. Görev bu çalışmada **kurulmadı**. Oturum kapalı/uykuda veya bilgisayar kapalıyken bu düzen kesintisiz sunucu değildir.
4. Linux sürekli sunucu için [systemd şablonu](../keeper/heli-keeper.service.example) hazır; kullanıcı/yollar, mevcut bağımlılıklar ve doğrulanmış ayarlar hosta göre doldurulur. Şablon gerçek Linux sunucusunda denenmedi. Ücretli host seçilmedi, kurulmadı veya satın alınmadı.
5. Günlük `check-health` sonucu, cüzdan bakiyesi, kaçırılmış aylar ve son gözlem kontrol edilir. Bir saatten eski belirsiz işlem veya aylık gecikme operatör incelemesine alınır. Hatalı pin yeni değere otomatik geçirilmez. SOL düşükse önce gider cüzdanına gerekli miktar tamamlanır; para arzı artırılmaz.

## Kalıcı kayıt ve kurtarma

Gider günlüğü ve durum dosyası geçici dosyaya yazılıp diske senkronize edilerek atomik değiştirilir. Gönderim öncesi imza kaydı korunur. Yerel tek örnek kilidi sürer. JSON günlük çoklu sunucunun aynı cüzdanla eşzamanlı gönderimine uygun değildir.

Yedek: çalıştırıcı durdurulup `.state/journal.json` erişimi kısıtlı, şifreli yedeğe alınmalıdır. Bu işte özel anahtar veya günlük üçüncü tarafa yüklenmedi, otomatik yedek yapılmadı. Kurtarmada eski gönderim günlükleri silinmez. Disk bozulması/günlüğün kaybında önce zincir imza geçmişi ve bakiyeler uzlaştırılır; başka host aynı cüzdanla körlemesine başlatılmaz. İşletim planı kurucu/kimlik anahtarının zincir üstü kurtarmasını eklemez.

## Doğrulama ve açık kalanlar

**49 test geçti:** 20 çalıştırıcı, 14 mobil/sponsor ve 15 işletim/gider testi. [Doğrulama kaydı](verification.json) kaynak özetlerini, yerel kira ölçümünü ve senaryoları içerir. Ekran yerel tarayıcıda kontrol edildi; Windows başlangıç betiklerinin sözdizimi doğrulandı, görev kurulmadı. Eski V15 sözleşme kaynağı/ELF değişmedi; yeniden derleyiciye gönderim yapılmadı. Önceki üç 720 aylık test sözleşme/planlayıcı kanıtıdır, bu yeni izleme servisinin 60 yıl gerçek ağda çalıştığı anlamına gelmez.

Canlı sürekli çalıştırıcı kabul testi, gerçek sunucu/RPC/kimlik bedelleri, bağımsız dış izleme ve finansman bakiyesi hâlâ gerekir. Bu çalışmanın çıktısı hazırlık ve yerel doğrulamadır; 24/7 canlı işletim veya sonsuz gelir garantisi değildir.
