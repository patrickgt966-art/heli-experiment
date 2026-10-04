# HELI V22 — durum özeti

Tarih: 4 Ekim 2026. V22 = Claude V21 + Codex kimlik karar sırası düzeltmesi (PR #1) + iki gider düzeltmesi + sahibin iki politika kararı. Program ve klasör adları uyumluluk için değişmedi. **Güvenlik denetimi değildir; hiçbir ağa dağıtılmadı.**

| | Değer |
|---|---|
| Kaynak SHA-256 | `4f42cf6c112c13c289d718ccc9a50ed05b6eadebc132b4f46a67b0652b6f4356` |
| ELF SHA-256 | `af15b7b42e5cfda26904cd7dfb20d8fb5d92e76736eaa20befe4919344f95d27` |
| Derleme | `heli/solana-v20/scripts/build_local.sh` (Agave 2.1.21 / platform-tools v1.43) |

Değişiklikler, kararlar, testler ve çalıştırılamayanlar: `reviews/v22/V22_DUZELTME_2026-10-04.md`.

Kısaca:
- Düzeltildi: gider hedefi program hazinesindeki bir hesap olamaz; gider ay sayacı 720. aydan sonra da sayar.
- Sahibin kararı (B): 60. yıl kapanışından sonra satış geliri ve bağışlar gidere aktarılabilir; yönetim emirleri kapalı, yeni arz yok.
- Sahibin kararı (B): yönetim release + doğrudan release satışının ay toplamı derinliğin %2'sini aşamaz.
- Sahibin kararları (pazar ölçümü): asgari derinlik alt sınırı 1.000; projenin kendi emirleri ölçüme girmez; çöküş istisnası (%95 tavan; dış alış ≥24 saat kayıtlı sığ; kayan 30 günde rezervin en fazla %10'u).
- Bağımsız inceleme düzeltmeleri (bölüm 8): toz emir koruması (192 düğüm), %2 sınırı referansın %98'ine kadar tüm dış alışlar, kapanıştan sonra gözlem sürer, doğrudan satış taze emirleri saymaz. Açık: M4 (Manifest bağımlılığı, ~49. yıl slot alanı), L3.
- Sahibin kararları (bölüm 9): tüm rezerv alışları (normal + çöküş) kayan 30 günde rezervin %10'u ile sınırlı; iptal edilen alışın dolmamış kısmı geri verilir; rezerv tabanı (`quote_floor`) en az 1.000; çöküş kaydı en fazla 2 saat arayla kesintisiz teyit ister. Tartışılacak: gider tavanına üst sınır.
- Manuel kimlik onayında canlılık şartı korunuyor (Codex bulgusu).
- Sahibin kararı: ücretsiz başlangıç payı kaldırıldı; başlangıç tabanı 5M'nin tamamı açılış ihalesi ve piyasa ile satılır. Kimlik servisi arşivdir.
- V21 açık konuları (`V21_DURUM.md` sonu) aynen geçerli.
