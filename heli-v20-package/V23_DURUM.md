# Charta V23 — durum özeti

**Tarih:** 5 Ekim 2026.

**V23 nedir:** V22'nin son incelenen sürümü (PR #16, `74c0594`) ile sahibin 5 Ekim kararları, Codex son incelemesi düzeltmeleri, iki kırmızı takım turu ve Devnet hazırlığının toplamıdır.

Program ve klasör adları uyumluluk için değişmedi (`heli_core_v20`). **Güvenlik denetimi değildir; hiçbir ağa dağıtılmadı.**

| | Değer |
|---|---|
| Token | **Charta (CHTA)**, çalışma adı HELI |
| Kaynak SHA-256 | `17fb61bb6a5bc18cb2259b3a4ce6102258f073503ba0432d17d0ba7e0bb6a7de` |
| ELF SHA-256 | `ce1949d9b35ca102b4e1ca515d1f26c3808e4cf0880f3063ad5bb98c49cbbc43` (1.010.656 bayt, yükleme kirası ~7,04 SOL) |
| Derleme | `heli/solana-v20/scripts/build_local.sh` (Agave 2.1.21 / platform-tools v1.43); temiz yeniden derleme aynı hash |

## V24 eki (6 Ekim 2026)

Sahibin iki kararı:
1. **Güncelleme yetkisi ayrı bir çevrimdışı anahtarda.** Kurulumdan sonra ne yönetici ne kurtarma anahtarı kodu değiştirebilir. Program değişikliği değildir; dağıtım adımları, kurulum betiği ve el kitabı güncellendi.
2. **Kurtarma anahtarı duraklatmayı kaldırabilir.** Yeni talimat `recovery_unpause`: yalnız kurtarma anahtarı, yalnız program duraklatılmışken. Ardından yönetici 7 gün duraklatamaz (açabilir). Çalınan bir yönetici anahtarı programı artık süresiz durduramaz. Bu bir **program değişikliğidir**: `Governance` hesabına `pause_locked_until` alanı eklendi (114 → 122 bayt). `pause` artık bu hesabı da okur.

| | V24 |
|---|---|
| Kaynak SHA-256 | `0d8488ab433d682584aeaa77e939a43571f2ecfe8d730ceb8f5cd855f9881199` |
| ELF SHA-256 | `c0e818148ea2aea8595a3024aac2a358c78f2052a45141ca0c299592dd7d6f87` (1.018.560 bayt, yükleme kirası ~7,09 SOL) |

Yeni ELF ile yeniden çalıştırılan testler:
- 14 LiteSVM test betiği, `policy depth` ve `closure` dahil: hepsi geçti. Yönetim testi 76 kontrol.
- Bakım servisi SVM testi (720 ay): geçti.
- Fuzz testi: 30 tohum, 12.029 adım, 125.623 kontrol, 0 bulgu. Kurtarma ile kaldırma ve 7 günlük kilit modele eklendi.
- Uçtan uca prova 173 kontrol; 60 aylık bakım testi 606 kontrol; acil durum tatbikatı 9 tatbikat, 39 kontrol. Hepsinde 0 hata.
- Node testleri: 145/145.
- **Negatif kontrol (mutant ELF'ler):** üç yeni kontrolün her biri ayrı ayrı kaldırıldı: 7 günlük kilit, "yalnız kurtarma anahtarı" ve "yalnız duraklatılmışken". Her mutantı hem yönetim testi hem fuzz yakaladı.

Aşağıdaki tablo ve test bölümü V23'ün (5 Ekim) kayıtlarıdır.

## Kurallar (değişmeyenler)

- Arz oranı ~%0,402247 / ay, 720 ay.
- Dağılım: 70M aylık arz rezervi, 15M yönetim hazinesi, 5M ihale.
- 10M başlangıçta yakılır.
- Yönetim ilk 12 ay kilitli.
- Staking yok.

## V23'te gelenler

| Konu | Kural | Ayrıntı |
|---|---|---|
| İhale | Cüzdan başına en fazla 250.000 CHTA (teklifin %5'i) | V22 düzeltme raporu bölüm 17 |
| İsim | Charta / CHTA | Bölüm 18 |
| Codex düzeltmeleri | F1 iptal iadesi kendi gününe; F2 kendi kendine işlem yasağı slot ömrünü de izler; F3 yönetim satışları kapsamda; F4 genesis politika ister; F5 proje tabanı ihale bitince; F6 keeper sığ piyasada saatte bir | Bölüm 19 |
| Fiyat ölçümü eşiği | Kod alt sınırı 25 USDC | Bölüm 20 |
| Sabit teknik gider | Ayrı ve korumalı: 30 günde 12 USDC. Diğer giderler rezervin yılda %25'i ve 120 USDC taban | Bölüm 21 |
| Lansman değerleri | İhale tabanı 0,0002 USDC; rezerv tabanı 120 USDC; eşik 25 USDC. İhale 120'den az toplarsa kurucu farkı rezerve yatırır ve bunu yayınlar | `DEPLOYMENT.md` |
| Kırmızı takım | 61 saldırı (kötü niyetli yönetici dahil) ve 32 dış saldırı, hepsi engellendi | `reviews/v22/KIRMIZI_TAKIM*.md` |
| Devnet hazırlığı | Kurulum betiği, salt okunur hazırlık kontrolü, rehber. İhale öncesi 15 adım yerel Agave 4.0 validator'da başarılı | `heli/solana-v20/DEVNET.md` |

## Testler (5 Ekim 2026, ELF `ce1949d9…`)

- **SVM:** 15 çalıştırma geçti; ikisi kırmızı takım testi.
- **Keeper SVM (720 ay):** geçti.
- **Node:** 114/114.
- **Negatif kontroller (mutant ELF'ler):** her yeni kontrolde başarısız oluyor.
- **Özet:** `reviews/v23/test-summary.json`.

## Açık konular

- **Devnet denemesi.** Gerekenler: program anahtarı, Devnet anahtarları, ~14 test SOL'u, test USDC'si.
- **Manifest bağımlılığı (M4).** Test edilen v3.0.24 ikilisi SBPF v3 biçiminde. Devnet'teki ikili hazırlık kontrolüyle karşılaştırılmalı.
- Doğrulanabilir derleme.
- Bağımsız denetim.
- Hukuki görüş ve marka kontrolü.
- Alan adı ve logo.
- Sitenin yeni sürümünün yayınlanması.
- Yaklaşık 49. yılda u32 slot alanı (bilinen, kabul edildi).
- Çok cüzdanla ihale sınırını aşma (kimlik yok, kabul edildi).
