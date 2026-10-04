# HELI V21 — durum özeti

Tarih: 4 Ekim 2026. V21, V20 inceleme paketinin üzerine yapılan bağımsız inceleme düzeltmelerinin toplamıdır. Klasör ve program adları (`heli-v20-package`, `heli_core_v20`, `solana-v20`) uyumluluk için değiştirilmedi; içerik V21'dir.

**Bu bir güvenlik denetimi değildir.** Program hiçbir ağa (Devnet/mainnet) dağıtılmadı ve bağımsız denetimden geçmedi.

- GitHub dalı: `claude/heli-v20-token-review-6gocpn`
- V21 anlık görüntüsü: commit `bd44293` (kalıcı link: https://github.com/patrickgt966-art/heli-experiment/tree/bd44293 , ZIP: https://github.com/patrickgt966-art/heli-experiment/archive/bd44293.zip). Bu ortam etiket gönderemediği için etiket yerine commit kullanılıyor. İsterseniz GitHub'da Releases → Draft a new release ile bu commit'e `heli-v21` etiketi verebilirsiniz.
- V20 başlangıç hali: commit `c9176d5`. Değiştirilmemiş ZIP içeriği; aradaki fark GitHub'da satır satır görülebilir.

## Program kimliği

| | Değer |
|---|---|
| Kaynak SHA-256 (10 dosya, `compiled-source.json` sırası) | `5b4bd88704b8fbe4298c7f75efc15b3c3df7c275cf633b68c9b82eabaa65b03d` |
| ELF SHA-256 (`heli_core_v20.so`) | `1645494a8c02eaa595a1785a21a565605ae7e57d30cf2a74bf776c75a6edd207` |
| Derleme | `heli/solana-v20/scripts/build_local.sh` — Agave 2.1.21 / platform-tools v1.43. Temiz derlemede aynı ELF elde edildi. Solana Playground kullanılmıyor. |

## V20 → V21 değişiklikleri

İnceleme raporu: `reviews/HELI_V20_BAGIMSIZ_INCELEME_2026-10-04.md` (bulgu kodları oradadır).

**Zincir üstü program (`heli/solana-v20/src`)**

| Konu | Değişiklik |
|---|---|
| Derlenebilirlik (M9) | Birden fazla token hesabı açan kurulum talimatları 11 ayrı talimata bölündü (4 KB yığın sınırı). `Cargo.lock`, açık `solana-program` bağımlılığı. |
| `initialize` front-run (H1) | Yalnız programın upgrade yetkilisi başlatabilir. |
| Fiyat sınırları (C1, C2a) | Proje ve yönetim satışları ≥ referansın %95'i (referans yoksa ≥ ihale fiyatı). Rezervle alış ≤ %105 (referans yoksa yok). Emirler ~24 saat geçerli. |
| Gider yolu (C2b) | Pause'da ödeme yok; `cancel_expense`. |
| Fiyat gözlemi (M2, N2, M3) | Yalnız bir gözlem aralığı boyunca beklemiş emirler sayılır. Derinlik birden çok seviyeden toplanır. Süresi dolmuş ve global emirler atlanır. Gözlem tek başına bir işlemde yapılır. |
| Pause (H2, karar B) | Aylık arz (`open_epoch`, `settle`) ve 60. yıl kapanışı pause'dan etkilenmez. |
| Anahtar yönetimi (C3, karar B) | Olağan yönetici devri. Çevrimdışı kurtarma anahtarı: 7 gün, yönetici itiraz edebilir. Kurtarma anahtarı rotasyonu. Kurtarma anahtarıyla gider iptali. Anında doğrulayıcı değişimi. |
| Ücretsiz pay hakları (M4) | İptal yalnız 7 günlük bekleme süresinde ve gerekçe parmak iziyle. İlk 6 ayda itiraz ve geri alma. Kimlik bilgisinin pasif/aktif yapılması. |

**Kimlik servisi (`heli/claim-service`) ve ortak modüller**

| Konu | Değişiklik |
|---|---|
| Oturum sabitleme (N1) | Yabancı başvuru linki yalnız cüzdan adresi gösterilip onaylanınca kabul edilir. |
| Erişilebilirlik ve maliyet (H4, N3) | İstemci bazlı hız sınırı. Oturum açma sınırı. Webhook'lar için ayrı kota. Eksik dosyada çökme yerine 404. Günlük Didit oturum tavanı. Süresi dolmuş başvuruların temizlenmesi. |
| Kayıp link (M5) | Aynı cüzdan imzasıyla mevcut başvuruya geri dönülür; yeni Didit oturumu açılmaz. |
| Sponsor bütçesi (M6) | Kullanılmayan planların bütçesi iade edilir; başvuru başına günde 6 hazırlama. |
| Manuel inceleme (canlı testten) | `manual-review.mjs`: Didit konsolu onayı + yazılı gerekçe (yalnız özet saklanır). Yüz-tekrar sinyali yalnız açık bayrakla aşılır; aynı belge veya kişisel numara hiçbir zaman aşılmaz. |
| Pilot güncelleme | `update-pilot.ps1`: yerel pilota güncel kodu indirir; `.private` ve `.state` klasörlerine dokunmaz. |

**Keeper ve operasyon:** Yeni gözlem düzenine ("kur → saatlik örnek") ve pause kuralına uyarlandı.

**Web sitesi:** Güncel kurallar ve başvuru sayfasında pilot çevrimiçi kontrolü. 4 Ekim'de Cloudflare Pages'e yayınlandı (`application-entry-deployment.json`).

## Testler (yerel; bağımsız vaka sayısı değildir)

| Test | Sonuç |
|---|---|
| `test_market_release_svm.py` (V20 + Manifest ELF, 720 ay) | 1.615 kontrol/işlem |
| `keeper/tests/test_v20_svm.py` (program 720 ay boyunca pause'lu) | 4.353 kontrol/işlem |
| `test_price_bounds_svm.py` | 91 |
| `test_observation_controls_svm.py` | 74 |
| `test_governance_svm.py` | 68 |
| `test_entitlement_controls_svm.py` | 51 |
| `test_expense_controls_svm.py` | 45 |
| `test_setup_controls_svm.py` | 33 |
| `claim-service/tests/v20-svm.test.mjs` | 1/1 |
| Node test paketi (claim-service, keeper, operations, manifest-integration) | 95/95 |

Bu sayılar örtüşen yerel kontrollerdir. Tek bir güvenlik puanı olarak toplanmamalıdır.

Çalıştırma:
```sh
cd heli/solana-v20
python scripts/test_market_release_svm.py   # solders==0.29.0; diğer test_*_svm.py dosyaları da aynı şekilde
cd ../..
HELI_TEST_PYTHON=$(which python) node --test heli/claim-service/tests/*.test.mjs heli/keeper/tests/keeper.test.mjs heli/operations/tests/operations.test.mjs heli/manifest-integration/*.test.mjs
```

## Canlı kimlik testi (Didit, proje sahibi)

- **Test 1** (aynı kişi, farklı belge, yeni cüzdan): HELI sonucu `review`; Didit uyarıları "duplicated" + "low similarity". H3 savunması çalıştı. Tek deneme, karışık sinyal.
- **Test 2** (aile üyeleri): sahibin kararıyla atlandı.
- **Test 3, 4 ve M** (kayıp link, telefon geçişi, manuel inceleme): pilotun güncel kodla yeniden başlatılmasını bekliyor. Çalışan pilot hâlâ V20 claim-service ile çalışıyor.

Ayrıntılar: `reviews/KIMLIK_CANLI_TEST_LISTESI.md`

## Açık konular

- Pilotu V21 koduyla yeniden başlatmak ve Test 3, 4, M'yi yapmak.
- Projenin kendi fonladığı bid'in fiyat gözleminde derinlik sayılıp sayılmayacağı (politika kararı).
- Uzun süreli, gerçek sermayeyle yapılan wash trade (yalnız kısmen azaltıldı).
- Yönetici anahtarını çalan kişi önce davranırsa kurtarma önerilerini iptal edebilir (bilinen sınır, `DEPLOYMENT.md`).
- 7 gün içinde fark edilmeyen sahte kayıt pay alabilir (M4 kararının bedeli).
- Kendi alan adı: bazı ağlarda `pages.dev` engelleniyor. Pilot için kalıcı hosting.
- Devnet dağıtımı (`heli/solana-v20/DEPLOYMENT.md` sırası), Docker ile doğrulanabilir derleme (`solana-verify`), bağımsız güvenlik denetimi.
- Yargı alanına göre hukuk ve gizlilik çalışması (yargı alanı belirtilmedi).
