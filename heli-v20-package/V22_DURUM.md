# HELI V22 — durum özeti

Tarih: 4 Ekim 2026. V22 = Claude V21 + Codex kimlik karar sırası düzeltmesi (PR #1) + iki hedefli gider düzeltmesi. Program ve klasör adları uyumluluk için değişmedi. **Güvenlik denetimi değildir; hiçbir ağa dağıtılmadı.**

| | Değer |
|---|---|
| Kaynak SHA-256 | `c39535f58dbfd74ac7815ea62d5aacc28cab31308e2d56725332ac04a30938ee` |
| ELF SHA-256 | `6af0f12b51a4d651a25e16a549e8a844fe36f08880d9bf2167fa7eb93bc8eabb` |
| Derleme | `heli/solana-v20/scripts/build_local.sh` (Agave 2.1.21 / platform-tools v1.43) |

Değişiklikler, testler, kalan politika seçenekleri ve çalıştırılamayanlar: `reviews/v22/V22_DUZELTME_2026-10-04.md`.

Kısaca:
- Düzeltildi: gider hedefi program hazinesindeki bir hesap olamaz; gider ay sayacı 720. aydan sonra da sayar.
- Karar bekliyor: 60. yıl kapanışından sonra hazine geliri ve yönetim envanteri; `depth/50` sınırının çağrı başına mı ay toplamı mı olacağı.
- V21 açık konuları (`V21_DURUM.md` sonu) aynen geçerli.
