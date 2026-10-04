# V21 durumu ve V22 çalışma planı — 4 Ekim 2026

## Hangi V21 esas alınıyor?
Claude'un V21'i: claude/heli-v20-token-review-6gocpn dalı; kaynak/ELF anlık görüntüsü bd4429398e5acbd0e860038412a654b418060009, sonraki belge düzeltmesi 044ef8cd4165e41f4535e756e31636b906329270. Yerelde dondurulmuş kopyası ve karşılaştırma paketi saklandı. Kaynak hash kontrolü derlemenin bağımsız tekrarlandığı anlamına gelmez.

Codex'in eski yerel solana-v21 taslağı farklı ve derlenmemiş bir alternatiftir. Toplu hazine ihalesi, rezervle alışın kapatılması, farklı yönetişim/pause seçimleri, gider kasasına kendine ödeme engeli ve 720 ay sonrası işletim yolları içeriyordu. Bu taslak Claude'un V21'ine topluca uygulanmadı; çalışan Solana programı veya onaylı para politikası sayılmaz. Eksik sayılan her fark otomatik olarak kusur değildir.

Esas alınacak kod hattı Claude V21 + bağımsız doğrulanan düzeltmelerdir. PR #1 (9692be16b3585a0d7b890e4f1f56f29ad80d1137), eski kimlik onayının daha yeni reddi ezmesini önler. 104 yerel Node vaka geçti; eski koda karşı 10 yeni vakanın 8'i başarısızdı. Rust/LiteSVM bu JS düzeltmesi için yeniden çalıştırılmadı.

## Canlı kimlik pilotu
4 Ekim'de çalışan pilot, bu PR'ın kimlik servis dosyaları ve Claude'un V21 arayüz/ortak modülleriyle yeniden başlatıldı. Kod ve veritabanı için yerel yedek alındı; sırlar ve başvurular GitHub'a yüklenmedi.
- HTTPS: https://practical-wallet-magnet-months.trycloudflare.com/
- config, sayfa ve app.js HTTP 200; sunulan app.js güncel dosyayla eşleşti.
- Identity mode, chainEnabled=false; geçersiz sentetik başvuru HTTP 400.
- Yeniden başlatma öncesi ilgili 26 test geçti. Yeni gerçek kimlik oturumu açılmadı.
- Bu yerel bilgisayara bağlı geçici tüneldir. Kalıcı barındırma veya Solana dağıtımı değildir.
- PR henüz birleştirilmedi; canlı servis PR kaynak kopyasıyla güncellendi.

## V22 planı
V22, eski alternatifin üzerine değil Claude V21 hattının üzerine kurulmalı.
1. Gider kasasının kendisine ödeme ve muhasebe etkisini V21 ELF ile tekrar doğrula; doğrulanırsa engel ve regresyon testi ekle.
2. 720 ay sonrasında mevcut serbest stok satışı/gider finansmanı yollarını test et. Para arzı kapanışıyla işletimi ayır; politika değişikliği gerekiyorsa seçenekleri sahibine sun.
3. depth/50 sınırının art arda çağrılardaki toplam etkisini doğrula; çağrı başına limit ile aylık bütçeyi karıştırma.
4. Manifest ofsetleri, fiyat referansı, ihale yuvarlaması, Ed25519 doğrulaması ve keeper yeniden denemelerini mevcut V21 üzerinde bağımsız test et.
5. Yeni kaynaktan ELF üretimi ve sentetik LiteSVM regresyonları olmadan V22 programını hazır/dağıtılmış sayma.

Bu maddeler çalışma ve doğrulama kapsamıdır; hepsi doğrulanmış açık değildir. Yüzde 95/105 bandı, toplu ihale seçimi, rezervle alış yetkisi, pause ve kurtarma politikası sessizce değiştirilmeyecek. Anahtarlar, ham kimlik/veritabanı ve özel çalışma kayıtları hiçbir GitHub commit'ine alınmayacak. Kod değişiklikleri ve kamuya uygun test/işletim sonuçları commit ve PR ile kaydedilecek.
