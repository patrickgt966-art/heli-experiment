# HELI — Claude inceleme özeti

Hazırlanma: 4 Ekim 2026. Güncel on-chain çalışma sürümü **V20**. Bu belge bir güvenlik onayı değildir. Kullanıcının hedefi düşük kurucu katkısıyla yürüyebilen, kurallı para arzına sahip deneysel bir Solana tokenıdır.

## Geçerli tasarım

| Tahsis | HELI | İşleyiş |
|---|---:|---|
| İlk mint sırasında burn | 10.000.000 | 100M ilk mintten çıkarılır |
| İlk ücretsiz dağıtım | 1.000.000 | En çok 1.000 ayrı doğrulanmış kişi × 1.000 HELI |
| İlk piyasa envanteri | 4.000.000 | Açılış ihalesi ve sonrasında bağlı emir piyasası |
| Aylık Piyasa Arzı Kasası | 70.000.000 | Aylık kilit açılışı; ücretsiz dağıtım değildir |
| HELI Yönetim Hazinesi | 15.000.000 | Eski founder + likidite + staking tahsislerinin birleşimi |

Burn sonrası toplam 90M. Staking iptal edildi. Eski Human Dividend adı bazı alanlarda bulunur; aylık kişi başına ödeme artık yoktur. Tek yönetici insan vardır; farklı teknik anahtar rolleri bulunması ek insan/yetkili gerektirmez.

Aylık ortak tavan serbest bırakılmış, yakılmamış arz üzerinden hesaplanır. Oran yaklaşık %0,4022473737; başlangıç tabanı 5M; ilk tavan 20.112,368685 HELI. 70M stok üzerinden yüzde alınmaz. Yönetim ve aylık kasa birlikte aynı tavanı paylaşır. Yönetim 12 aylık kilitten sonra en çok %20 izin kullanabilir; ayrıca yönetim dışı gerçek release'in dörtte biri sınırı vardır. Kullanılmayan yönetim izni devretmez ve otomatik aylık kasaya aktarılmaz. 60 yıl/90M yolu bu nedenle koşullu üst yoldur, zorunlu sonuç değildir.

Unlock satış değildir. Alıcı yoksa açılmış satış stoğu bekler; aylık burn yoktur. 720. dönem kapanışı yalnız hâlâ kilitli stokları yakma kuralını içerir. Başlangıç ücretsiz kaydı ilk altı ayla sınırlıdır; yedi gün bekleme vardır. Altı ay sonunda ayrılmamış ücretsiz pay satış stokuna geçer, hak edilmiş fakat çekilmemiş pay korunur. Başlangıç 5M tabanının satılmamış/çekilmemiş envanteri de kapsamasının ekonomik sonucu incelenmelidir.

Piyasa tasarımı, önceki Meteora denemelerinden sonra V20'de **Manifest emir piyasası** bağlantısına dayanır. İlk fiyat/ihale parametreleri ilan edilmelidir; sonra fonlanmış alım/satım emirleri eşleşir. Tek kişinin tüm satış envanterini alması yasak değildir. İlk ücretsiz payın kişi başına eşitliği, sonraki mülkiyet yoğunlaşmasını önleyen bir kural değildir.

Yönetim satış gelirleri kişisel cüzdana değil proje rezervine döner. Gerçek karşılık varlığı olmadan alış likiditesi oluşmaz. Proje rezervi, fiyat garantisi veya sabit kurdan geri ödeme hakkı değildir. Gider gelirlerinin sıfır hacimde yeterli olacağı doğrulanmadı; sponsor gelirine güvenilmemesi kullanıcı tercihidir.

## Gerçekte çalışan ile henüz çalışmayan

- V20 ve Manifest ikilileri yerel Solana LiteSVM testlerinde çalıştırıldı. Devnet/mainnet dağıtımı yapılmadı. Paket içindeki program adresi yerel/test kimliğidir; canlı token adresi gibi tanıtılmamalıdır.
- Keeper V20 için hazırlanmış ve yerelde sınanmıştır; sürekli açık ağ hizmeti olarak kurulmadı.
- Didit üzerinden gerçek kimlik pilotu denenmiştir. İlk test onaylandı; sonraki aynı kişi başvuruları tekrar/face uyarılarıyla inceleme veya red aldı. Kullanıcı sonradan eski başvuruları reddetti. Bu paket gerçek kimlik belgelerini, başvuru kayıtlarını veya yüz verilerini içermez.
- Katı HELI karar değerlendiricisi yalnız sağlayıcıda Approved yazmasına bakmaz; gerekli kontroller ve boş uyarı/eşleşme kanıtları aranır. Manuel Didit onayı uyarıları otomatik kaldırmaz. Bu davranışın amaçla uyumu incelenmelidir.
- Gerçek farklı belge ve ayrı aile üyesi uçtan uca kimlik testleri tamamlanmış sayılmaz. Sentetik test geçmesi bu iddiayı kanıtlamaz.
- Kimlik sunucusu şu an **identity-only**: zincir kaydı, sponsor işlem ve coin teslimi kapalıdır. Geçici Cloudflare tunnel bilgisayara bağlıdır; kalıcı hosting değildir.
- İngilizce ana siteye 4 Ekim'de `/apply.html` başvuru girişi yayımlandı. Cloudflare üretim durumu Success. Bu ortamdan pages.dev erişim testi 20 saniyede zaman aşımına uğradı; dış erişim doğrulanamadı. Geçici pilotun config isteği HTTP 200 ve chainEnabled=false döndürdü.
- Wallet→Safari/Chrome geçişi, aynı başvuruyu fragment içindeki özel erişim tokenıyla taşır. Token uygulama durumuna erişim yetkisidir, paylaşılmamalıdır. Gerçek telefon/tarayıcı uçtan uca kabul testi tamamlanmış sayılmaz.

## Özellikle sorgulanacak tutarsızlıklar

1. `claim-service/.env.example` eski workflow editor kimliğini içerirken güncel README/launcher published API kimliğini kullanıyor. Örnek ayarı takip eden kişinin yanlış kimlik seçmesi incelenmeli.
2. Bazı README'lerde V15/önceki sürüm açıklamaları tarihsel olarak tutuldu. V20 kaynak ve V20.md üstün tutulmalı; yine de doküman çelişkileri listelenmeli.
3. Statik `heli-rules.txt` kimlik pilotunun önceki durumunu anlatabilir; son gerçek başvuruların mevcut onayı anlamına gelmez.
4. Test bağımlılıklarında yerel yollar ve eski sürüm isimleri var. Kaynakları incelemek taşınabilir; derleme/testi yeni makinede tekrarlamak ayrıca sınanmalı.
5. Kaynak hash'i ile ELF hash'inin kaydedilmesi, üçüncü taraf derleyicinin aynı kaynağı doğru derlediğinin bağımsız/reproducible-build ispatı değildir.
6. Açılış fiyatı, quote varlığı, gerçek piyasa adresi, fonlanma, kalıcı hosting, canlı işlem yetkileri ve bağımsız denetim henüz tamamlanmış kabul edilmemeli.

## Paket kapsamı

Güncel V20 Rust kaynakları/IDL/ELF; claim-service ve testleri; kullandığı mobile ortak modülleri; keeper; operations; Manifest adaptörü ve resmî program ikilisi; İngilizce website; ilgili yerel sonuçlar. V1–V19 arşivi, node_modules, bağımlılık depoları, .private, .state, cüzdan anahtarları, gerçek kişi oturumları, kimlik görüntüleri ve ekran görüntüleri dahil değildir. Tarihsel sonuçlar dosya tarihleriyle ayrılmalıdır. Gizli veriler olmadan canlı sağlayıcı doğrulaması yeniden üretilemez.
