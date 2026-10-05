# Charta ilk web sitesi

6 Ekim 2026 baloncuk haritası ve canlı arka plan:
- "90 million" bölümü Bubblemaps tarzı sahip haritasına dönüştü (`holders.js`, `holders-core.js`). Her sahip bir baloncuk, alanı CHTA miktarıyla orantılı.
- Veriler zincirden okunuyor ve 30 saniyede bir yenileniyor. Yeni alıcılar baloncuk olarak ekleniyor; son ziyaretten beri gelen cüzdanlar halkayla işaretleniyor.
- Program yayınlanana kadar harita, açıkça "Example" etiketli uydurma cüzdanlarla bir önizleme gösteriyor.
- `bg.js`: tüm sayfalarda canvas arka plan. Nane, Solana moru ve kum rengi ışık bulutları; fareyi izleyen noktalı ızgara; ızgara çizgilerinde kayan ışık izleri.
- Hero madalyonundaki dikdörtgen hale kenarı kaldırıldı; madalyona para kenarı ve parlama eklendi.

6 Ekim 2026 görsel kimlik güncellemesi:
- Yazı tipleri: başlıklarda serif Fraunces, sayılarda ve etiketlerde IBM Plex Mono. İkisi de OFL lisanslı ve kendi sunucumuzda (`fonts/`, lisans metinleriyle). CSP değişmedi.
- İkinci renk olarak sıcak kum tonu eklendi; arka planda kâğıt dokusu (`grain.svg`) var.
- Hareket: yavaş dönen yörüngeler ve süzülen madalyon, kurallar bandı (ticker), sayaçlar, kaydırınca beliren bölümler, kart ışığı ve okuma çubuğu (`motion.js`).
- "Hareket azaltma" tercihinde ve JavaScript kapalıyken site durağan.
- Sistem kartlarındaki ok ve daire simgelerinin yerine çizim SVG'ler geldi: kum saati, terazi, büyüteç.

5 Ekim 2026 site güncellemesi: "How to take part" rehberi (`guide.html`) ve risk sayfası (`risks.html`) eklendi.
- Tüm sayfalarda aynı menü (Guide eklendi) ve altbilgi kullanılıyor; menü 320 px'e kadar tek satıra sığıyor.
- Sosyal paylaşım etiketleri (Open Graph) eklendi; ayrıca `404.html`, `robots.txt` ve `sitemap.xml`.
- Cloudflare Pages, `404.html` olmadan bilinmeyen adreslere ana sayfayı döndürüyordu; artık 404 sayfası açılıyor.
- `tests/site-pages.test.mjs` şunları denetler: menü ve altbilgi tutarlılığı, kırık bağlantı, önizleme sunucusu listesi, satır içi stil ve betik olmaması (CSP).

4 Ekim 2026 pazar ölçümü yayını: referans ve derinlik yalnız dış alış emirleriyle; asgari derinlik 1.000 quote birimi; çöküş istisnası (%95, 30 gün, aylık %10). Yayın: https://390e7d50.heli-experiment.pages.dev

4 Ekim 2026 V22 kural metni yayını: hazine release'lerinin aylık toplamı alış derinliğinin %2'si; 60. yıl kapanışından sonra satış geliri gider ödeyebilir, yeni CHTA yok, yönetim emirleri biter; giderler proje hesaplarına geri ödenemez. Cloudflare yayını: https://637407fa.heli-experiment.pages.dev (üretim adresinden doğrulandı).

2 Ekim 2026 V20 güncel yayın: yalnız ilk 1M ücretsiz; 70M aylık satış envanteri rezervidir.
Oran, 5M başlangıç tabanından başlayıp açılmış ve yakılmamış arz üzerinden hesaplanır.
İlk ay 20.112,368685 CHTA; aylık kişi kaydı/ücretsiz hak/burn yoktur.
Baloncuk, tüm açıklamalar ve indirilebilir kurallar İngilizce güncellendi.
V20 gerçek ELF ile 720 ay ve toplam 1.606 kontrol/işlem geçti. Devnet/mainnet yayımlanmadı.
Cloudflare üretim yayını Success durumuyla tamamlandı; dış erişim bu ortamdan teyit edilmedi.
Yayın kimliği: 7e90a4bc-c22d-459b-b052-89e9092cbb25.
Paket: ../website-artifacts/heli-site-v20-market-release.zip
Aşağıdaki V19 ve Human Dividend notları tarihsel kayıttır.

2 Ekim 2026 güncel yayın: İngilizce, tıklanabilir ve alanları tahsislerle orantılı baloncuk görseli eklendi.
70M Human Dividend, 15M Management Treasury, 4M market, 1M free allocation.
15M hazinenin 5M + 5M + 5M birleşimi açıklanır. Telefon (390px) ve masaüstü görünümü,
klavyeyle seçim ve tıklama kontrol edildi. Cloudflare üretim yayını başarıyla tamamlandı.
Yayın kimliği: e4b23b55-df98-4939-8063-99b440a1d41b.
Adres: https://heli-experiment.pages.dev/#token-allocation
Bu ortamdan herkese açık adrese bağlantı zaman aşımına uğradı; dış erişim teyit edilmedi.
Aşağıdaki yayınlanmamış sürüm notları tarihsel kayıttır; V19 site değişiklikleri bu yayına dahildir.

2 Ekim 2026 güncel yerel sürüm: Charta Yönetim Hazinesi 15M; Human Dividend 70M;
ilk ücretsiz dağıtım 1M ve ilk piyasa 4M. Staking ve ayrı likidite tahsisi sıfır.
Gelir proje rezervinde kalır. V19 gerçek ELF yerel testinde 148 kontrol/işlem geçti.
İngilizce tablo ve arz grafiği yeniden 90M koşullu üst sınıra göre güncellendi.
Bu değişiklikler henüz Cloudflare'a yayımlanmadı; aşağıdaki sürümler eski kayıttır.

2 Ekim 2026 sonraki yerel güncelleme: 5M piyasa arz/likidite payı kurucuya
aktarıldı. Kurucu 10M, likidite 0; kurucu kilidi ve satış sınırları korunur.
Kaynak V18; eski staking payı 5M kilitli, released supply sınırı 85M.
Bu son değişiklik de henüz Cloudflare'a yayımlanmadı.

2 Ekim 2026 yerel güncelleme: staking iptal edildi; eski 5M staking payı kilitli.
Released supply grafiği bu nedenle 85M ile sınırlı. Bu değişiklikler henüz
Cloudflare'a yayımlanmadı; aşağıdaki yayın kaydı önceki sürüme aittir.

1 Ekim 2026. Cloudflare Pages ücretsiz barındırmasına uygun, bağımlılıksız statik site.
Canlı başvuru, cüzdan bağlantısı, API anahtarı, belge/yüz toplama, token veya fon işlemi yok.
Tek kullanımlık Didit bağlantıları ve kişi verileri siteye dahil edilmez.

Yayımlama paketi yalnız bu klasördeki `index.html`, `style.css`, `app.js`, `favicon.svg`,
`_headers` ve `charta-rules.txt` dosyalarını içermelidir. Bütün heli klasörü yüklenmez.
Kullanıcı isteğiyle yayımlanan bütün sayfalar ve indirilebilir kurallar İngilizcedir.
Sunucu betiği ve README yayımlama arşivine dahil edilmez.

Cloudflare Pages: Workers & Pages > Create > Pages > Upload assets.
Proje adı: `heli-experiment`. Üretim adresi: https://heli-experiment.pages.dev/.
1 Ekim 2026 tarihinde Cloudflare üretim yayını `success` durumuyla tamamlandı.
Güncel yayın kimliği: `b2cb8cb7-29e0-4489-8c0e-d86b816c729e`.
Koyu zeminli İngilizce ürün sitesi; dağıtım, Human Dividend, para anayasası, piyasa ve ilerleme bölümleri içerir.
Yıl seçilebilen arz grafiği, tam kapasite ve burn olmayan koşullu üst yolu gösterir; fiyat tahmini değildir.
Bilgisayar (1440×960) ve telefon (390×844) görünümü, menüler, grafikte 30. yıl (21,21M),
gider hesabı (1.000 deneme → 165 USD) ve kapalı canlı başvuru kontrol edildi.
Yeni paket: `../website-artifacts/heli-site-cloudflare-redesign.zip`.
Yerel DNS `213.14.227.50`, genel DNS Cloudflare IP'lerini döndürdüğü için erişim sorunu
DNS yönlendirmesi/filtrelemesiyle tutarlıdır; kesin sebep doğrulanmadı ve DNS ayarları değiştirilmedi.
Açık adrese bu ortamdan bağlantı zaman aşımına uğradığı için dış erişim henüz doğrulanamadı.
Yayın kaydı ve kontrol sonuçları `../website-artifacts/` klasöründedir.
Build komutu yok. Statik dosyalar kökte bulunur. Ücretli plan veya alan adı satın almak gerekmez.
Hesap oluşturma/giriş ve hizmet şartlarını kullanıcı tamamlar.

Yerel önizleme: `node server.mjs`; `http://127.0.0.1:8780/`.
Sunucu yalnız listelenmiş yayımlama dosyalarını sunar; klasör veya özel dosya açmaz.

Didit gider hesabı bir örnektir: her kontrolde 500 aylık ücretsiz kullanımın
tamamı mevcutsa, sonraki tam dört-kontrollü deneme başına 0,33 USD.
Gerçek kalan kota veya zincir/sunucu maliyeti hesapta yer almaz.

4 Ekim 2026: Ana siteden kimlik pilotuna giriş üretimde yayımlandı.
Yayın kimliği: `2a639840-a063-4458-bc6f-fbabbe22b2b6` (Cloudflare Success).
`/#allocation` bölümündeki Start application test düğmesi `/apply.html` sayfasını açar.
Sayfa İngilizcedir ve geçici pilot/no token delivery durumunu açıklar.
Pilot adresi: https://practical-wallet-magnet-months.trycloudflare.com
Pilot config HTTP 200: identity, Didit, chainEnabled=false.
Didit mevcut webhook hedefi aynı kapsamda yeni geçici adrese güncellendi.
Yalnız yedi statik dosya yayımlandı; özel ayarlar veya başvuru bağlantıları gönderilmedi.
Bu ortamdan pages.dev/apply.html isteği 20 saniyede zaman aşımına uğradı;
Cloudflare yayını başarılı, dış sayfa erişimi bu kontrolde doğrulanamadı.
Kalıcı kimlik sunucusu barındırması hâlâ gerekli; bu güncelleme coin dağıtımını açmaz.

5 Ekim 2026 V23 depo kopyası: isim Charta (CHTA), ihale cüzdan sınırı 250.000 CHTA, planlanan ihale tabanı 0,0002 USDC, korumalı sabit gider (30 günde 12), kurallar dosyası `charta-rules.txt`. Yayındaki Cloudflare kopyası bu değişikliklerden önceki sürümdür; yeni yayın gerekir.
