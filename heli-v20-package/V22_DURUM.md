# HELI V22 — durum özeti

Tarih: 4 Ekim 2026. V22 = Claude V21 + Codex kimlik karar sırası düzeltmesi (PR #1) + iki gider düzeltmesi + sahibin iki politika kararı. Program ve klasör adları uyumluluk için değişmedi. **Güvenlik denetimi değildir; hiçbir ağa dağıtılmadı.**

| | Değer |
|---|---|
| Kaynak SHA-256 | `990c035e3fd3f3cf103e963d6ce91bd9dd744f31774bd5fec1ff54e5b408db32` |
| ELF SHA-256 | `9c01e4783be8a17e97cdc710711c3c75d20768000a37a71f36a7360667282ab1` |
| Derleme | `heli/solana-v20/scripts/build_local.sh` (Agave 2.1.21 / platform-tools v1.43) |

Değişiklikler, kararlar, testler ve çalıştırılamayanlar: `reviews/v22/V22_DUZELTME_2026-10-04.md`.

Kısaca:
- Düzeltildi: gider hedefi program hazinesindeki bir hesap olamaz; gider ay sayacı 720. aydan sonra da sayar.
- Sahibin kararı (B): 60. yıl kapanışından sonra satış geliri ve bağışlar gidere aktarılabilir; yönetim emirleri kapalı, yeni arz yok.
- Sahibin kararı (B): yönetim release + doğrudan release satışının ay toplamı derinliğin %2'sini aşamaz.
- Sahibin kararları (pazar ölçümü): asgari derinlik alt sınırı 1.000; projenin kendi emirleri ölçüme girmez; çöküş istisnası (%95 tavan; dış alış ≥24 saat kayıtlı sığ; kayan 30 günde rezervin en fazla %10'u).
- Bağımsız inceleme düzeltmeleri (bölüm 8): toz emir koruması (192 düğüm), %2 sınırı referansın %98'ine kadar tüm dış alışlar, kapanıştan sonra gözlem sürer, doğrudan satış taze emirleri saymaz. Açık: M4 (Manifest bağımlılığı, ~49. yıl slot alanı), L3.
- Sahibin kararları (bölüm 9): tüm rezerv alışları (normal + çöküş) kayan 30 günde rezervin %10'u ile sınırlı; iptal edilen alışın dolmamış kısmı geri verilir; rezerv tabanı (`quote_floor`) en az 1.000; çöküş kaydı en fazla 2 saat arayla kesintisiz teyit ister. Tartışılacak: gider tavanına üst sınır.
- Küçük başlangıç ayarları (bölüm 15): proje (rezerv) tabanı ihaleden sonra seçilir, en az 120 USDC (bir yıllık sabit teknik maliyet); fiyat ölçümünün asgari derinliği kodda en az 250 USDC (önce 1.000).
- Bağımsız test ajanı ve temizlik (bölüm 14): rezerv tabanı gelir ödemelerinde de korunur, 30 günlük pencereler 31 gün dilimi, alıcı dönüşünü gösteren gözlem geri alınmaz, logo adresi alan adı kontrolü; kimlik, staking geçmişi, launch hesabı, 1/2 numaralı kasalar ve kullanılmayan alanlar silindi. ELF 995 KB (~6,93 SOL). Açık: kendi kendine satışla gelir aklama (A1/A2) ve yönetimin gözlemi durdurması (A8).
- Token meta verisi (bölüm 13): `create_token_metadata` genesis'ten önce ad/sembol/logo adresini bir kez yazar; meta veri yoksa genesis çalışmaz. İsim henüz seçilmedi (testlerde yer tutucu).
- Küçültme (bölüm 12): ölü talimatlar silindi, zincir üstü IDL kapalı, `opt-level="z"`; ELF 1,42 MB → 1,04 MB (yükleme kirası ~9,9 → ~7,2 SOL).
- Gider kuralı (bölüm 11): gider ödenirken rezervden tam tutar çekilir; satış geliri %100 harcanabilir; gelirin ötesinde 30 günde 10 birim sabit teknik taban + rezervin yılda %25'i; rezerv 1.000 birimin altına yalnız sabit taban için iner.
- Grok bulguları (bölüm 10): referanssız satış tabanı son dış referansın %95'i (30 gün), alış sınırı düz %10 (pencere tabana eklenmez).
- Manuel kimlik onayında canlılık şartı korunuyor (Codex bulgusu).
- Sahibin kararı: ücretsiz başlangıç payı kaldırıldı; başlangıç tabanı 5M'nin tamamı açılış ihalesi ve piyasa ile satılır. Kimlik servisi arşivdir.
- V21 açık konuları (`V21_DURUM.md` sonu) aynen geçerli.
