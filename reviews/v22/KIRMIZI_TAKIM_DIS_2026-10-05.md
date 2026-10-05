# Kırmızı takım 2: yalnız dışarıdan saldırılar — 5 Ekim 2026

Bu turda saldırganların yönetici anahtarı yoktu:

- **Mallory:** quote sahibi.
- **Eve:** ihaleden token almış bir kişi.
- **Bob:** dışarıdan normal bir alıcı.

Test, derlenmiş programın üzerinde yerel LiteSVM'de, gerçek Manifest v3.0.24 ikilisiyle yapıldı. Ağa dağıtım ve gerçek para kullanılmadı.

- **Program:** kaynak `332d701e…`, ELF `29186c9f…`
- **Betik:** `scripts/test_redteam_outside_svm.py`
- **Çıktı:** `redteam-outside-svm-verification.json`

## Sonuç

**32 saldırının 32'si engellendi, bulgu yok.** 157 kontrol ve işlem geçti. Toplam arz değişmedi. Kilitli stoklar yalnız dürüst aylık kapanışla hareket etti.

| Saldırı | Engelleyen kontrol |
|---|---|
| **Canlı ihale** | |
| Bob'un teklif hesabını onun imzası olmadan açmak | İmza zorunlu ("account did not sign") |
| 256 seviye dışında fiyat; sıfır miktar; teminatı taşıran dev miktar; %5 sınırını aşmak; iptal etmeden ikinci teklif | `Quota` / `State` |
| Alice'in teklifini iptal edip parasını almak | Hesap adresi (seeds) sahibine bağlı |
| Sonuçlanmadan talep (claim); son 5 dakikada iptal (snipe); süre dolmadan sonuçlandırma; ikinci talep | Takvim ve durum kontrolleri |
| İhale emanet hesabına hediye quote göndermek | Sonuçlandırma ve talepler normal çalıştı |
| **Token düzeyi** | |
| Yeni token basmak | Basım yetkisi yok; dondurma yetkisi de yok |
| 70M, 15M ve envanter kasalarından token çekmek veya kasaları kapatmak | SPL sahiplik hatası; kasaların sahibi programın config hesabı |
| Proje rezervinden quote çekmek; rezervin yetkisini kendine almak | SPL sahiplik hatası |
| **İzinsiz talimatlar** | |
| Ay kapanışında kendi hesabını rezerv / envanter / yönetim stoku diye vermek; sahte dönem hesabı vermek | Hesap adresi ve başlatılmış hesap kontrolleri |
| Aynı ayı iki kez kapatmak; sırasız dönem açmak; 60. yıl kapanışını erken yapmak veya kendi hesaplarıyla yapmak | Takvim ve hesap adresi |
| Rezerv kasasına 1 token hediye etmek | Muhasebedeki stok değişmedi; kapanış normal çalıştı |
| **Fiyat ölçümü** | |
| Sahte Manifest programı; sahte talimat sysvar'ı; kopyalanmış sahte piyasa hesabı | Program ve adres kontrolleri |
| Gerçek alışın altına 40 ucuz alış emri doldurmak | Referans değişmedi |
| Tüm token'larını dış alıcıya satıp (dump) piyasayı boşaltmak | Referans **düşmedi**, durdu. Piyasa "sığ" diye kaydedildi. Proje yine son referansın %95'inin altında satış yapamıyor |

Önceki turdan (`KIRMIZI_TAKIM_2026-10-05.md`): sahte bir yüksek alış iki saat bekletilirse 24 saatlik referans farkın 1/23'ü kadar oynuyor. Etkisi sınırlı.

## Dışarıdan hâlâ yapılabilenler (açık değil, piyasanın doğası)

- **Çok cüzdanla ihale sınırını aşmak:** kimlik olmadığı için engellenemiyor. Bu bilinçli bir karar.
- **Gerçek satış:** elindeki token'ı satan herkes fiyatı düşürebilir. Proje buna katılmıyor.
- **Toz emirle 192 düğümü doldurup gözlemi durdurmak:** satış tabanı 30 gün korunuyor (mevcut test).
- **Sahte yüksek alışla referansı geçici şişirmek:** aylık satışı en fazla bir gün geciktirir.

## Denenmeyenler

- Mainnet Metaplex üzerinde meta veri güncelleme saldırısı (güncelleme yetkisi config PDA'sı ve programda güncelleme talimatı yok; bu bulgu kod okumasına dayanıyor).
- İşlem sıralama (MEV) ve gerçek ağ zamanlaması.
- Manifest programının kendisine yönelik saldırılar.
- Kapsamlı bulanık test (fuzz).

Bu yerel test, bağımsız bir denetimin yerine geçmez.
