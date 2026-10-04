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

## Giderler (V22)

- Gider hedefi programın kendi hazinesindeki bir token hesabı olamaz: `fee-quote`, ihale/satış geliri hesabı (`auction-proceeds`) ve config, manifest, yönetim, release ve DLMM PDA'larına ait hesaplar reddedilir (`ExpenseDestination`). Kural hem teklifte hem ödemede uygulanır; V22'den önce yazılmış böyle bir teklif ödenemez, iptal edilmelidir.
- Aylık gider tavanı takvim ayına göre sıfırlanır. Bu ay sayacı 720. aydan sonra da saymaya devam eder; arz takvimi (720 ay, 60. yıl kapanışı) değişmedi.
- 60. yıl kapanışından sonra (sahibin kararı, bulgu 3-B): satış geliri `allocate_auction_proceeds` ile gider kasasına aktarılabilir, `contribute_quote` ile bağış alınabilir; giderler aynı aylık tavan, 7 gün bekleme, pause ve kurtarma iptaliyle sürer. Yeni arz yoktur. Yönetim emirleri kapanıştan sonra kapalıdır.

## Pazar ölçümü (V22, sahibin kararları)

- **Asgari derinlik:** `initialize_release_policy` için kod alt sınırı **1.000 quote birimi** (ör. 1.000 USDC). Gerçek değer kurulumda pazara göre seçilir ve sonra değişmez. Bu, bekleyen alış emirlerinin anlık toplamıdır; işlem hacmi değildir.
- **Projenin kendi emirleri sayılmaz:** Yönetim, proje envanteri ve release satış hesaplarının Manifest koltuklarındaki alış emirleri referans fiyata ve derinliğe katılmaz. Not: kişisel cüzdanlardan verilen emirleri kod ayırt edemez; buna karşı koruma asgari derinlik ve şeffaflıktır.
- **Çöküş istisnası:** Geçerli referans yok **ve** o anda dışarıdaki alış emirleri asgari derinliğin altındaysa, rezervle alış emri verilebilir. Tavan: son dış referansın %95'i (en fazla 30 gün eski; değilse açılış ihale fiyatının %95'i). Aylık sınır: ayın ilk çöküş alımındaki proje quote rezervinin %10'u. Gözlemler (keeper) durdurulup referans eskitilse bile dışarıda alıcı varsa istisna açılmaz.

## Yönetim release sınırı (V22, sahibin kararı, bulgu 4-B)

O ayki yönetim release'leri ve doğrudan release satışlarının **toplamı** (`epoch.founder`) çağrı anındaki alış derinliğinin %2'sini (`depth/50`) aşamaz. Aylık bütçe sınırları (kapasitenin %20'si, insan bütçesinin ¼'ü) ayrıca geçerlidir. İnce pazarda payın kullanılmayan kısmı o ay kullanılamaz.

## Ücretsiz pay: iptal, itiraz ve kimlik durumu

- **İptal penceresi:** `dispute_launch(reason)` yalnız kaydın 7 günlük bekleme süresi içinde ve ilk 6 ay içinde çalışır. Bekleme süresi dolan hak kesinleşir; hiçbir anahtar onu geri alamaz.
- **Gerekçe:** Her iptal, geri alma ve kimlik durumu değişikliği, yazılı gerekçenin SHA-256 parmak izini (`reason`) ister. Bu iz zincirde saklanır ve olay olarak yayınlanır. Gerekçe metni kişisel bilgi içerebileceği için zincire değil yönetici kayıtlarına yazılır. İtirazda gösterilen metin bu izle karşılaştırılabilir.
- **İtiraz:** `restore_launch(reason)` iptal edilmiş kaydı ilk 6 ay içinde yeniden geçerli yapar ve yeni bir 7 günlük bekleme başlatır.
- **Kimlik bilgisi:** `set_credential_active(active, reason)` yalnız yönetici tarafından çağrılır. Pasif kimlik yeni kayıt açamaz. Bekleme süresindeki bir hakkı durdurmak için kaydın kendisi `dispute_launch` ile iptal edilir. Kesinleşmiş haklar kimlik iptalinden etkilenmez.
- **Bilinen sınır:** Sahte bir kayıt 7 gün içinde fark edilmezse 1.000 HELI'yi çekebilir.
