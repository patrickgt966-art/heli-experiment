# HELI V22 — durum özeti

Tarih: 4 Ekim 2026. V22 = Claude V21 + Codex kimlik karar sırası düzeltmesi (PR #1) + iki gider düzeltmesi + sahibin iki politika kararı. Program ve klasör adları uyumluluk için değişmedi. **Güvenlik denetimi değildir; hiçbir ağa dağıtılmadı.**

| | Değer |
|---|---|
| Kaynak SHA-256 | `bc7995cf22b3087b6eb8deeea1c7203498924a03e5382e9c9b580476155880a6` |
| ELF SHA-256 | `73dfdbb6bacf0eacd147a17d8c9f006f609cc06815efb9b45d7fdedb414c7e3d` |
| Derleme | `heli/solana-v20/scripts/build_local.sh` (Agave 2.1.21 / platform-tools v1.43) |

Değişiklikler, kararlar, testler ve çalıştırılamayanlar: `reviews/v22/V22_DUZELTME_2026-10-04.md`.

Kısaca:
- Düzeltildi: gider hedefi program hazinesindeki bir hesap olamaz; gider ay sayacı 720. aydan sonra da sayar.
- Sahibin kararı (B): 60. yıl kapanışından sonra satış geliri ve bağışlar gidere aktarılabilir; yönetim emirleri kapalı, yeni arz yok.
- Sahibin kararı (B): yönetim release + doğrudan release satışının ay toplamı derinliğin %2'sini aşamaz.
- Sahibin kararları (pazar ölçümü): asgari derinlik alt sınırı 1.000; projenin kendi emirleri ölçüme girmez; çöküş istisnası (%95 tavan; dış alış ≥24 saat kayıtlı sığ; kayan 30 günde rezervin en fazla %10'u).
- Bağımsız inceleme düzeltmeleri (bölüm 8): toz emir koruması (192 düğüm), %2 sınırı referansın %98'ine kadar tüm dış alışlar, kapanıştan sonra gözlem sürer, doğrudan satış taze emirleri saymaz. Açık: M4 (Manifest bağımlılığı, ~49. yıl slot alanı), L3.
- Sahibin kararları (bölüm 9): tüm rezerv alışları (normal + çöküş) kayan 30 günde rezervin %10'u ile sınırlı; iptal edilen alışın dolmamış kısmı geri verilir; rezerv tabanı (`quote_floor`) en az 1.000; çöküş kaydı en fazla 2 saat arayla kesintisiz teyit ister. Tartışılacak: gider tavanına üst sınır.
- Gider kuralı (bölüm 11): gider ödenirken rezervden tam tutar çekilir; satış geliri %100 harcanabilir; gelirin ötesinde 30 günde 10 birim sabit teknik taban + rezervin yılda %25'i; rezerv 1.000 birimin altına yalnız sabit taban için iner. Tartışılacak: kurtarma anahtarının gider iptali.
- Grok bulguları (bölüm 10): referanssız satış tabanı son dış referansın %95'i (30 gün), alış sınırı düz %10 (pencere tabana eklenmez).
- Manuel kimlik onayında canlılık şartı korunuyor (Codex bulgusu).
- Sahibin kararı: ücretsiz başlangıç payı kaldırıldı; başlangıç tabanı 5M'nin tamamı açılış ihalesi ve piyasa ile satılır. Kimlik servisi arşivdir.
- V21 açık konuları (`V21_DURUM.md` sonu) aynen geçerli.
