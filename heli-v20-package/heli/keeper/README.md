# Charta aylık çalıştırıcı

**3 Ekim 2026: çalıştırıcı V20'ye güncellendi. Güncel işleyiş ve testler: [V20 belgesi](V20.md). Aşağıdaki V15 açıklaması tarihsel kayıttır; mevcut sürüm için uygulanmaz.**

**4. başlığın yeni işletim sonucu:** [İzleme ekranı, zorunlu bakım rezervi ve gider planı](../operations/ISLETIM_PLANI_2026-09-30.md). Fiyat gözlemleri bir sonraki ayın hesap/işlem SOL payını tüketemez. Boş bekleyiş dört dakikaya indirildi; bilinen işlem zamanında daha erken uyanır. Atomik günlük/durum yazımı ve ölçülen bakiye/zincir tarihi telemetrisi eklendi. Yerel ekran 8771'de çalışır; bu canlı Devnet çalıştırıcısının açıldığı anlamına gelmez. Windows başlangıç kurulum betiği ve Linux systemd şablonu hazır, kurulu değildir.

30 Eylül 2026. Çalıştırıcı kodu ve yerel testleri hazırdır. Canlı hizmet olarak kurulu değildir; V15 Devnet'te bulunmadığı ve güvenilen adresler henüz atanmadığı için gerçek görev çalıştırılmaz. Bu makine kapanınca çalışamaz; sürekli açık makine/sunucu gerekir.

Çalıştırıcı açılış ihalesini kapatır, altıncı ayda kullanılmayan ücretsiz payı kasaya aktarır, aylık dönem hesaplarını açar, kayıtları kapatır, geçmiş ağırlıkları ilerletir ve aylık release hesabını yapar. 720. ay tamamlandığında yalnız dağıtılmamış stokları yakan anayasa kapanışını çağırır. Bu son işlem mevcut V15 kuralıdır; Solana programını kapatmaz, hak sahiplerinin önce ayrılmış tokenlarını yakmaz. Saatlik fiyat gözlemleri yalnız bağlı Manifest piyasası ve yeterli talep varsa geçer. İşlemler zincirdeki UTC takviminden çıkar; bilgisayarın yerel saatine göre dönem atlanmaz.

Kurucu satış emri, gider aktarımı, kimlik onayı, yönetici değişikliği, program yükseltmesi ve kullanıcının kendi hak teslimatı çalıştırıcının izin listesinde yoktur. Ayrı, düşük bakiyeli bir işlem gideri cüzdanı kullanır. Aynı kişi bu cüzdanı yönetebilir; ek yetkili veya çok imza şartı getirilmez. Bu cüzdan yönetici/doğrulayıcı/yükseltme anahtarıyla aynıysa yürütme reddedilir.

## Yeniden deneme ve bütçe

İmza ve işlem baytları gönderimden önce kalıcı günlüğe yazılır. RPC zaman aşımı ve yeniden başlamada geçerli eski işlem aynı baytlarla tekrar gönderilir. Yeni bir alım/satım hazırlanmaz. İşlem süresi dolduğunda önce imza geçmişi ve gerçekleşmiş zincir durumu kontrol edilir. Doğrulanmış kodun izin listesindeki bakım işlemlerinin kopyası yeni tahsis oluşturamaz: hesap açılışları tekil, kapanışlar bir kez, dönemler sıralıdır. Bu bakım işlemleri taze kod/anahtar kontrolünden sonra tekrar hazırlanabilir. Bilinmeyen bir işlem türü otomatik tekrar edilmez.

Günlük tavan, hesap kirası ve işlem ücreti birlikte rezerve edilir. Onay bilinmediğinde ya da işlem reddedildiğinde eski gider rezervi silinmez; bütçe ihtiyatlı kalır. Varsayılan örnek tavan 0,05 SOL/gün, cüzdan tabanı 0,005 SOL'dur. Bunlar harcama hedefi değil üst sınırdır. Yetersiz bakiye/bütçe yeni gönderimi durdurur. Çok uzun geçmiş kuyruğu bütçe yüzünden birkaç günde tamamlanabilir. Talepsiz piyasada başarısız simülasyon işlem göndermediği için zincir ücreti ödemez; RPC/sunucu maliyeti yine olabilir.

Kod özeti, yükseltme yetkisi, yönetici, kimlik doğrulayıcı, zincir ve hesap sahibi/türü doğrulanır. ProgramData'nın yalnız başlığı boş bekleyişte kontrol edilir; kod her gönderim öncesi tam doğrulanır. Charta veya Manifest yükseltilirse eski pin ile devam edilmez. Bunlar RPC'nin dürüstlüğüne bağlıdır; bağımsız ağ güvenliği ispatı değildir. Teknik dayanak: [Solana yükseltme yetkisi](https://solana.com/docs/programs/deploying), [işlem gönderimi ve onay](https://solana.com/docs/rpc/http/sendtransaction), [Loader-v3 ProgramData yapısı](https://docs.rs/crate/solana-loader-v3-interface/latest/source/src/state.rs).

## Kurulum

1. `config.example.json` kopyasını oluştur. Yönetici/doğrulayıcı public key'lerini, Charta/Manifest program yükseltme yetkilerini ve dağıtılmış Manifest ELF özeti/boyutunu bağımsız olarak doğrulayarak doldur. `null` yükseltme yetkisi, gerçekten değiştirme yetkisi kaldırılmış program demektir; rastgele varsayım değildir. Pinler otomatik benimsenmez.
2. `node heli/keeper/generate-key.mjs` yalnız yerel işlem gideri anahtarını üretir. Özel anahtar `.keys/` altında kalır. Hesaba yetki veya SOL verilmez. `keeperKeyFile` için bu dosyanın tam yolunu kullan. Anahtarı kaynak paketine/derleyiciye gönderme.
3. Devnet V15 kurulumu, doğru pinler ve yeterli test SOL'u sağlandıktan sonra `node heli/keeper/run.mjs TAM_CONFIG_YOLU --once` salt plan çıkarır. Bu mod anahtar okumaz, imzalamaz ve eski bekleyen işlemi de göndermez.
4. Yürütme modu `node heli/keeper/run.mjs TAM_CONFIG_YOLU --execute` biçimindedir. Bu mod yalnız Devnet kabul eder. Bu çalışmada yürütme modu açılmadı.
5. Sürekli çalışan Windows makinesinde `windows-service.ps1 -ConfigPath TAM_CONFIG_YOLU -Execute` süreç kapanırsa geri açar. İşletim sisteminin açılış hizmetine ekleme gerçek ağ ayarları kesinleştikten sonra yapılır; henüz zamanlanmış görev veya başlangıç kaydı kurulmadı. Başlatılırken pencereler gizli olmalıdır. `.state/health.json` son durumu verir; `.state/journal.json` silinmeden korunur. Görev tek örnek kilidiyle çalışır; aynı/yeniden kullanılmış PID kilidi varsa güvenli biçimde durur.

## Doğrulama

`node --test heli/keeper/tests/*.test.mjs`: **19 test** geçti. RPC yanıt kaybı, yeniden başlama, gider sınırı, eski işlemin güvenli toparlanması, salt plan modu, kod/anahtar değişimi ve izin dışı işlem reddi sınandı. RPC adaptörü gerçek Devnet'te sınanmadı.

`python heli/solana-v15/scripts/test_keeper_60y_svm.py`: aynı JavaScript planlayıcı gerçek V15 Solana işlemlerini **üç senaryoda 720 ay** boyunca yönetti. On aylık kesinti, sekiz aylık ilerletme sınırı, sıra/tekrar koruması, kullanıcı burn'ünün arz kapasitesini azaltması, 60. yıl kapanışı ve sonrasında staking anaparası/ödül teslimatı geçti. Yoğun kullanıcı senaryosunun kayıt sayısı yerel testte doğrudan verildi; 1.000 gerçek kişi doğrulaması sayılmaz. [Sonuç dosyası](../solana-v15/keeper-60y-verification.json).

Program anahtarını dondurma, yönetici değişimi veya anahtar kopyalama işlemleri yapılmadı. Tek kurucunun yönetici anahtarı için soğuk yedek/kurtarma kararı ve dış inceleme canlı yayından önce gerekir.
