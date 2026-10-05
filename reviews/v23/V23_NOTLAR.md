# V23 notları — V22'den (PR #16, `74c0594`) bu yana

V22'nin son incelenen sürümünden bu yana yapılan bütün değişikliklerin kısa kaydı. Ayrıntılı gerekçe ve testler `reviews/v22/V22_DUZELTME_2026-10-04.md` bölüm 17–21'de ve kırmızı takım raporlarında.

| PR | Değişiklik | Sahibin kararı mı |
|---|---|---|
| #18 | İhale cüzdan sınırı (%5) | Evet |
| #18 | İsim Charta (CHTA) | Evet |
| #18 | Codex F1–F6 düzeltmeleri ve metin–kod tutarsızlıkları | Hata düzeltmesi ("gerçekten sorunsa ve fikri bozmuyorsa düzelt") |
| #19 | Fiyat ölçümü eşiği alt sınırı 250 → 25 | Evet (en kötü senaryo) |
| #20 | Kırmızı takım 1: 61 saldırı | Yalnız test |
| #21 | Kırmızı takım 2: 32 dış saldırı | Yalnız test |
| #22 | Korumalı sabit gider 12/30 gün; lansman değerleri | Evet |
| bu PR | Devnet hazırlığı (kurulum betiği, hazırlık kontrolü, rehber); README/site eski bilgileri; V23'e geçiş | Evet ("hepsi güncelse V23'e geç") |

## Ölçülen ve kabul edilen riskler

- **Sahte yüksek alış:** iki saat bekletilen 10 kat fiyatlı bir alış, 24 saatlik referansı farkın 1/23'ü kadar oynatır. Aylık satışı en fazla bir gün geciktirir.
- **Eşik 25 USDC:** ince piyasada referansı belirlemek ucuzdur. Aşağı yönlü zarar ayda ~0,5 USDC ile sınırlı (satış, derinliğin %2'si).
- **Manifest v3.0.24 ikilisi SBPF v3:** Agave 4.0'dan eski validator'larda çalışmaz. Devnet'teki ikili hazırlık kontrolüyle karşılaştırılmalı.

## Çalıştırılmayanlar

- Gerçek Devnet: bu ortamın ağ politikası Devnet RPC'yi engelliyor.
- İhale sonrası kurulum aşamasının yerel validator'da çalıştırılması: gerçek zamanda 7 gün bekleme gerekir. Plan doğrulandı; adımlar LiteSVM testlerinde çalışıyor.
- Mainnet Metaplex ikilisi.
- MEV ve işlem sıralama saldırıları.
- Kapsamlı bulanık test (fuzz).
- Bağımsız denetim.
