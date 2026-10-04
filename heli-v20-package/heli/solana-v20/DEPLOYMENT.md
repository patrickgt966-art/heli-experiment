# HELI V20 — dağıtım ve anahtar planı

Bu belge, inceleme sonrası düzeltmelerle (H1, M9, C2b, C3) değişen kurulum sırasını ve anahtar yönetimini anlatır. Program derleme komutu: `scripts/build_local.sh` (Agave 2.1.21 / platform-tools v1.43). Henüz hiçbir ağa dağıtılmadı ve bağımsız denetimden geçmedi.

## Anahtarlar

| Anahtar | Nerede durur | Ne yapar |
|---|---|---|
| **Yönetici** | Günlük kullanılan cüzdan | Satış/yönetim emirleri (fiyat bandı içinde), gider teklifi ve iptali, duraklatma, doğrulayıcı değiştirme, olağan yönetici devri |
| **Kurtarma** | Çevrimdışı (donanım cüzdanı veya kağıt); yine aynı tek yöneticiye aittir | Kayıp yönetici yerine 7 gün sonra yeni yönetici önermek; bekleyen gideri iptal etmek; kendini değiştirmek |
| **Doğrulayıcı** | Kimlik sunucusu (sıcak) | Didit onayından sonra kimlik imzası |
| **Upgrade yetkisi** | Kurulumda yönetici, sonra çevrimdışı kurtarma anahtarı | Program kodunu değiştirebilir; çalınırsa tüm kasalar risk altındadır |
| **Keeper** | Ayrı ücret cüzdanı | Yalnız izinli bakım işleri; hiçbir yetkisi yoktur |

Kurallar (programda zorlanır):

- **Olağan devir:** `propose_admin` (yönetici) + `accept_admin` (yeni anahtar), bekleme yok. Aynı işlemde yapılabilir. Yönetici anahtarının çalındığından şüphelenince hemen kullanın.
- **Kurtarma:** `propose_admin` (kurtarma anahtarı) → 7 gün → `accept_admin` (yeni anahtar). Bu sürede yönetici `cancel_admin_proposal` ile itiraz edebilir.
- **Kurtarma anahtarı değişimi:** Kurtarma anahtarı kendini anında değiştirir. Yönetici ise ancak 7 gün bekleyen ve eski kurtarma anahtarının iptal edebildiği bir öneriyle değiştirir. Yeni anahtarın kabul için imza atması gerekir.
- **Kurtarma anahtarı yönetici olamaz, yönetici de kurtarma anahtarı olamaz.**
- **Savunma:** Kurtarma anahtarı `recovery_cancel_expense` ile bekleyen bir gideri durdurabilir.
- **Doğrulayıcı:** `set_verifier` ile yönetici tarafından anında değiştirilir. Eski doğrulayıcının imzaları o andan itibaren geçersizdir.

Bilinen sınır: Yönetici anahtarını çalan kişi sizden önce davranıp yöneticiyi kendine devrederse, kurtarma anahtarının önerisini her seferinde iptal edebilir. Bu yüzden yönetici anahtarını iyi koruyun ve şüphe anında hemen olağan devri yapın. Satışlar fiyat bandıyla sınırlıdır; giderleri kurtarma anahtarı durdurabilir; aylık arz kuralı duraklatmadan etkilenmez.

## Kurulum sırası

`initialize` yalnız programın upgrade yetkilisi imzalarsa çalışır (H1). Bu imzacı yönetici olur. Bu yüzden program, **yönetici anahtarı upgrade yetkilisi olacak şekilde** yüklenir.

1. `solana program deploy` — upgrade yetkisi: yönetici anahtarı.
2. `initialize(start)` — `start` 7–30 gün sonrası olmalı.
3. `create_launch_claims`, `create_market_inventory`
4. `initialize_identity(verifier)`, `initialize_release_policy(minimum_quote_depth)` — ikisi de `genesis`'ten **önce** olmalı; sonradan oluşturulamaz.
5. `create_vault(0..3)`
6. `genesis` — 100M basılır, 10M yakılır, basma yetkisi kalıcı olarak kaldırılır.
7. `prepare_auction_quote`, `prepare_auction_proceeds`
8. `open_auction(floor, tick_size)` — `start - 600` saniyeden **önce** olmalı. İhale açılmazsa proje satış emri hiç konamaz.
9. `initialize_governance(recovery)` — kurtarma anahtarının **açık** anahtarı. Özel anahtar çevrimdışı kalır.
10. Manifest piyasası oluşturulur (Manifest talimatı), ardından `create_manifest_base`, `create_manifest_quote`, `bind_manifest_market`.
11. `create_management_base`, `create_management_quote`, `initialize_management`
12. `create_release_base(3)`, `create_release_quote(3)`, `initialize_release_seat(3)`
13. `create_fee_base`, `create_fee_quote`, `initialize_fee_vaults(monthly_cap, reserve)` — `monthly_cap` sonradan değiştirilemez.
14. Upgrade yetkisini kurtarma anahtarına devredin:
    `solana program set-upgrade-authority <PROGRAM_ID> --new-upgrade-authority <KURTARMA_ANAHTARI.json>`
15. Keeper yapılandırmasındaki pinleri güncelleyin: `admin`, `verifier`, `heliUpgradeAuthority` (kurtarma anahtarının açık anahtarı) ve Manifest ikili hash'i.

Sonradan yönetici veya doğrulayıcı değiştirildiğinde keeper bilinçli olarak durur ("Administrator or verifier pin changed"). Yeni değerleri yapılandırmaya elle girin.

## Upgrade yetkisi planı

- **Devnet ve denetim öncesi:** Yetki çevrimdışı kurtarma anahtarında kalır, böylece hatalar düzeltilebilir.
- **Mainnet, bağımsız denetimden sonra:** Yetki kalıcı olarak kaldırılır (`solana program set-upgrade-authority <PROGRAM_ID> --final`). Kod bundan sonra değiştirilemez. Keeper'da `heliUpgradeAuthority: null` olur.
- Upgrade yetkisi hiçbir zaman sıcak bir sunucuda tutulmamalıdır.

## Duraklatma

`pause` satışları, yönetim işlemlerini, giderleri, ücretsiz paya kayıtları ve ihaleyi durdurur. Aylık arz (`open_epoch`, `settle`) ve 60. yıl kapanışı duraklatmadan **etkilenmez** (H2-B). Bunları herkes tetikleyebilir.
