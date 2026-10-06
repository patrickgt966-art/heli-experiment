# Charta V20 — dağıtım ve anahtar planı

Bu belge, inceleme sonrası düzeltmelerle (H1, M9, C2b, C3) değişen kurulum sırasını ve anahtar yönetimini anlatır. Program derleme komutu: `scripts/build_local.sh` (Agave 2.1.21 / platform-tools v1.43). Henüz hiçbir ağa dağıtılmadı ve bağımsız denetimden geçmedi.

## Anahtarlar

Acil durumlar (anahtar kaybı ya da hırsızlığı, hata, duraklatma, bakım servisi): [ACIL_DURUM.md](ACIL_DURUM.md). Komut aracı: `scripts/emergency.mjs`; tatbikat: `scripts/emergency_drill.mjs`.

| Anahtar | Nerede durur | Ne yapar |
|---|---|---|
| **Yönetici** | Günlük kullanılan cüzdan | Satış/yönetim emirleri (fiyat bandı içinde), gider teklifi ve iptali, duraklatma, doğrulayıcı değiştirme, olağan yönetici devri |
| **Kurtarma** | Çevrimdışı (donanım cüzdanı veya kağıt); yine aynı tek yöneticiye aittir | Kayıp yönetici yerine 7 gün sonra yeni yönetici önermek; bekleyen gideri iptal etmek; duraklatmayı kaldırmak; kendini değiştirmek |
| **Doğrulayıcı** | Kullanılmaz (ücretsiz pay yok) | Kurulumda atılmış rastgele bir anahtar verilir |
| **Upgrade yetkisi** | Kurulumda yönetici; kurulum bitince **ayrı bir çevrimdışı güncelleme anahtarı** (ne yönetici ne kurtarma anahtarı; sahibin kararı, 6 Ekim 2026). Donanım cüzdanı ya da kağıt, iki ayrı yerde yedek | Program kodunu değiştirebilir; çalınırsa tüm kasalar risk altındadır. Kaybolursa program bir daha güncellenemez (çalışmaya devam eder) |
| **Keeper** | Ayrı ücret cüzdanı | Yalnız izinli bakım işleri; hiçbir yetkisi yoktur |

Kurallar (programda zorlanır):

- **Olağan devir:** `propose_admin` (yönetici) + `accept_admin` (yeni anahtar), bekleme yok. Aynı işlemde yapılabilir. Yönetici anahtarının çalındığından şüphelenince hemen kullanın.
- **Kurtarma:** `propose_admin` (kurtarma anahtarı) → 7 gün → `accept_admin` (yeni anahtar). Bu sürede yönetici `cancel_admin_proposal` ile itiraz edebilir.
- **Kurtarma anahtarı değişimi:** Kurtarma anahtarı kendini anında değiştirir. Yönetici ise ancak 7 gün bekleyen ve eski kurtarma anahtarının iptal edebildiği bir öneriyle değiştirir. Yeni anahtarın kabul için imza atması gerekir.
- **Kurtarma anahtarı yönetici olamaz, yönetici de kurtarma anahtarı olamaz.**
- **Savunma:** Kurtarma anahtarı `recovery_cancel_expense` ile bekleyen bir gideri durdurabilir.
- **Duraklatma (V24, sahibin 6 Ekim kararı):** `pause` yalnız yöneticidedir ve süresizdir. Kurtarma anahtarı `recovery_unpause` ile duraklatılmış programı hemen açar; bundan sonra yönetici **7 gün** duraklatamaz (açabilir). Böylece çalınan bir yönetici anahtarı programı süresiz durduramaz. `pause` artık yönetim (governance) hesabını da okur; bu yüzden ancak `initialize_governance`'tan sonra çalışır (kurulum adımı 10).

Bilinen sınır: Yönetici anahtarını çalan kişi sizden önce davranıp yöneticiyi kendine devrederse, kurtarma anahtarının önerisini her seferinde iptal edebilir. Bu yüzden yönetici anahtarını iyi koruyun ve şüphe anında hemen olağan devri yapın. Satışlar fiyat bandıyla sınırlıdır; giderleri ve duraklatmayı kurtarma anahtarı durdurabilir; aylık arz kuralı duraklatmadan etkilenmez.

## Kurulum sırası

Devnet denemesi için adım adım rehber ve betikler: `DEVNET.md` (`scripts/devnet_readiness.mjs`, `scripts/devnet_setup.mjs`).

`initialize` yalnız programın upgrade yetkilisi imzalarsa çalışır (H1). Bu imzacı yönetici olur. Bu yüzden program, **yönetici anahtarı upgrade yetkilisi olacak şekilde** yüklenir.

1. `solana program deploy` — upgrade yetkisi: yönetici anahtarı.
2. `initialize(start)` — `start` 7–30 gün sonrası olmalı.
3. `create_market_inventory`
4. `initialize_release_policy(minimum_quote_depth)` — `genesis`'ten **önce** olmalı; sonradan oluşturulamaz. Program bunu zorunlu kılar: politika hesabı yoksa `genesis` reddedilir (Codex F4).
5. `create_vault(0)` ve `create_vault(3)` (70M aylık arz kasası ve 15M yönetim hazinesi; başka kasa yoktur)
6. `create_token_metadata(name, symbol, uri)` — ad **`Charta`**, sembol **`CHTA`** (sahibin kararı, 5 Ekim 2026); cüzdanlarda görünecek ad (≤32 bayt), sembol (≤10 bayt) ve logo/JSON adresi (`https://`, ≤200 bayt). **Bir kez** yazılır; güncelleme yetkisi config PDA'sıdır ve programda güncelleme talimatı yoktur (upgrade anahtarı kaldırılınca kalıcı). Meta veri olmadan `genesis` çalışmaz. Adres, sitedeki bir JSON dosyasını göstermelidir (ör. `{"name":…,"symbol":…,"description":…,"image":"https://…/logo.png"}`); alan adı süresi dolarsa logo kaybolur, kalıcı barındırma (ör. Arweave) düşünülebilir.
7. `genesis` — 100M basılır, 10M yakılır, basma yetkisi kalıcı olarak kaldırılır.
8. `prepare_auction_quote`, `prepare_auction_proceeds`
9. `open_auction(floor, tick_size)` — `start - 600` saniyeden **önce** olmalı. İhale açılmazsa proje satış emri hiç konamaz.
10. `initialize_governance(recovery)` — kurtarma anahtarının **açık** anahtarı. Özel anahtar çevrimdışı kalır.
11. Manifest piyasası oluşturulur (Manifest talimatı), ardından `create_manifest_base`, `create_manifest_quote`, `bind_manifest_market`.
12. `create_fee_base`, `create_fee_quote`, `initialize_fee_vaults(monthly_cap, reserve, project_floor)` — ihaleden sonra (program, ihale sonuçlanmadan reddeder; Codex F5); `project_floor` ≥ 120 quote birimi, toplanan tutara göre. `monthly_cap` (tek teklif üst sınırı) ve `project_floor` sonradan değiştirilemez.
13. `create_release_base(3)`, `create_release_quote(3)`, `initialize_release_seat(3)`
14. `create_management_base`, `create_management_quote`, `initialize_management(rent_lamports)` — proje tabanı ayarlandıktan sonra.
15. Upgrade yetkisini ayrı çevrimdışı güncelleme anahtarına devredin (yönetici ve kurtarma anahtarından farklı olmalı). CLI varsayılan olarak yeni anahtarın da imzasını ister; yanlış adrese devri böyle önler:
    `solana program set-upgrade-authority <PROGRAM_ID> --new-upgrade-authority <GÜNCELLEME_ANAHTARI.json>`
    Donanım cüzdanı için anahtar dosyası yerine `usb://ledger?key=…` yazılabilir. Çevrimdışı anahtarın SOL'ü olmak zorunda değil; ücreti `--fee-payer` öder.
16. Keeper yapılandırmasındaki pinleri güncelleyin: `admin`, `heliUpgradeAuthority` (güncelleme anahtarının açık anahtarı; `devnet_setup.mjs` bunu `upgradeAuthority` alanından yazar) ve Manifest ikili hash'i.

Sonradan yönetici değiştirildiğinde keeper bilinçli olarak durur ("Administrator pin changed"). Yeni değerleri yapılandırmaya elle girin.

## Yükleme maliyeti (4 Ekim 2026)

- ELF 1.018.560 bayt (V24, 6 Ekim 2026): program verisi kirası ≈ **7,09 SOL** (yaklaşık 6.960 lamport/bayt). Yükleme sırasında aynı boyutta geçici bir tampon hesabı için bir o kadar daha gerekir; yükleme bitince iade edilir.
- Upgrade anahtarı kalıcı olarak kaldırıldığında bu kira geri alınamaz. Önceki sürümler büyürse `solana program extend` ile alan eklenir; yüklemede gereksiz boş alan ayırmayın (kullandığınız CLI sürümünün `--max-len` varsayılanını kontrol edin).
- Program `no-idl` ile derlenir: zincir üstü IDL hesabı yoktur (`anchor idl init` kullanılamaz). IDL depoda (`idl.json`) yayımlanır.

## Upgrade yetkisi planı

- **Devnet ve denetim öncesi:** Yetki ayrı çevrimdışı güncelleme anahtarında kalır, böylece hatalar düzeltilebilir. Kurtarma anahtarı kod değiştiremez; çalınırsa en fazla yönetici önerir (7 gün, yönetici iptal edebilir) ve giderleri iptal eder.
- **Güncelleme anahtarından şüphe:** Anahtar kendini hemen yeni bir çevrimdışı anahtara devreder (aynı `set-upgrade-authority` komutu); keeper pini de güncellenir. Ayrıntı: [ACIL_DURUM.md](ACIL_DURUM.md).
- **Mainnet, bağımsız denetimden sonra:** Yetki kalıcı olarak kaldırılır (`solana program set-upgrade-authority <PROGRAM_ID> --final`). Kod bundan sonra değiştirilemez. Keeper'da `heliUpgradeAuthority: null` olur.
- Upgrade yetkisi hiçbir zaman sıcak bir sunucuda tutulmamalıdır.

## Duraklatma

`pause` durdurur: ihale açma ve yeni ihale teklifi, proje satış emri, doğrudan release satışı, yönetimin release / fon aktarma / emir verme işlemleri ve gider ödemesi. Durdurmaz: ihale teklifini iptal etme, ihaleyi sonuçlandırma ve talep (claim), yönetim emrini iptal etme ve parayı proje hesaplarına geri çekme, proje satış gelirini çekme (yani insanların parası ve projenin kendi hesaplarına dönüş açık kalır; dışarıya ödeme ve yeni emirler durur). Aylık arz (`open_epoch`, `settle`) ve 60. yıl kapanışı duraklatmadan **etkilenmez** (H2-B). Bunları herkes tetikleyebilir.

## Giderler (V22)

- Gider hedefi programın kendi hazinesindeki bir token hesabı olamaz: `fee-quote`, ihale/satış geliri hesabı (`auction-proceeds`) ve config, manifest, yönetim, release ve DLMM PDA'larına ait hesaplar reddedilir (`ExpenseDestination`). Kural hem teklifte hem ödemede uygulanır; V22'den önce yazılmış böyle bir teklif ödenemez, iptal edilmelidir.
- **Gider kuralı (sahibin kararı, 4 Ekim 2026):** Rezerv giderden önce taşınmaz (eski `allocate_auction_proceeds` talimatı programdan silindi). Onaylı gider ödenirken (`execute_expense`) önce gider kasasındaki bağışlar (`fee-quote`, `reserve` kadarı kalır), kalanı doğrudan proje rezervinden (`auction-proceeds`) ödenir.
- **Gelir %100 harcanabilir:** `Config.revenue_total` doğrudan release satışlarının gelirini, `withdraw_project_quote` ile çekilen proje satış gelirini ve yönetimin net kârını (geri dönen > aktarılan, bir kez) sayar. İhale geliri gelir değildir (başlangıç rezervi). Harcanan gelir `Operations.revenue_spent`.
- **Gelirin ötesinde:** kayan son 30 günde rezervden harcanan (`out_day`, `out_days[31]`, 31 gün dilimi) ≤ (rezerv − harcanmamış gelir) × 25/1200 (yılda %25). Takvim ayında sıfırlanmaz.
- **Sabit teknik gider (sahibin kararı, 5 Ekim 2026):** `propose_expense(..., fixed=true)` ile önerilen gider (sunucu, RPC) kendi ayrı hakkından ödenir: kayan 30 günde en fazla **12 quote birimi** (10 + %20 hata payı; `Operations.fix_days[31]`). Proje tabanı ve diğer harcamalar bu hakkı engelleyemez; satış geliri varsa önce o kullanılır. 12 birimden büyük sabit gider önerisi reddedilir.
- **Proje tabanı:** sabit gider dışındaki hiçbir ödeme rezervi proje tabanının (`Config.project_floor`) altına indiremez; gelirden ödenen giderler dahil.
- `initialize_fee_vaults(monthly_cap, reserve)`: `monthly_cap` artık yalnız **tek teklif** için üst sınırdır; harcama sınırı ödemede uygulanır. Bekleyen gideri yönetici (`cancel_expense`) veya kurtarma anahtarı (`recovery_cancel_expense`) iptal edebilir.
- 60. yıl kapanışından sonra (sahibin kararı, bulgu 3-B): aynı kurallarla giderler sürer, `contribute_quote` ile bağış alınabilir; 7 gün bekleme ve pause geçerli. Yeni arz yoktur. Yönetim emirleri kapanıştan sonra kapalıdır.

## Pazar ölçümü (V22, sahibin kararları)

- **Asgari derinlik:** `initialize_release_policy` için kod alt sınırı **25 quote birimi** (sahibin kararı, 5 Ekim 2026: çok küçük pazarın en kötü senaryosu; önceki 250, ondan önce 1.000). Gerçek değer kurulumda pazara göre seçilir — öneri: beklenen ihale gelirinin ~%5'i, en kötü senaryoda **25** ve sonra değişmez. Bu, bekleyen alış emirlerinin anlık toplamıdır; işlem hacmi değildir.
- **Projenin kendi emirleri sayılmaz:** Yönetim, proje envanteri ve release satış hesaplarının Manifest koltuklarındaki alış emirleri referans fiyata ve derinliğe katılmaz. Not: kişisel cüzdanlardan verilen emirleri kod ayırt edemez; buna karşı koruma asgari derinlik ve şeffaflıktır.
- **Çöküş istisnası (inceleme sonrası, sahibin kararı):** Dışarıdaki tüm canlı alış emirleri asgari derinliğin altındaysa bunu bir gözlem (`observe_release_market`) kaydeder (`shallow_since`); dış alış yeterli olunca kayıt sıfırlanır. Kayıt, sığ gözlemler arasında 2 saatten uzun boşluk olursa yeniden başlar (`shallow_seen`); yani 24 saat kesintisiz teyit gerekir. Rezervle alış ancak bu durum **en az 24 saattir** kayıtlıysa, son sığ gözlem **en fazla 2 saat** önceyse **ve** emir anında da dış alış sığsa açılır. Tavan: son dış referansın %95'i (en fazla 30 gün eski; değilse açılış ihale fiyatının %95'i). Sınır: aşağıdaki ortak alış sınırı.
- **Gözlem güvenliği:** Kitapta en fazla 192 emir düğümü taranır (yaklaşık 220 bin CU'ya kadar). Asgari derinliğin binde birinden küçük "toz" emirler atlanır ama tarama sınırına sayılır. Tarama 192 düğümde biterse kitap "sığ" sayılmaz (çöküş istisnası açılmaz); okunan kısım asgari derinliğe ulaşmadıysa gözlem başarısız olur ve örnek alınmaz. %98 bant derinliği yalnız okunan kısmı sayar, bu da sınırı yalnız düşürebilir. Kalan risk: birinin binlerce toz-üstü emirle kitabı doldurması gözlemi geciktirebilir; bu emirler gerçek para bağlar.
- **Ortak rezerv alış sınırı (sahibin kararı):** Normal ve çöküş, tüm rezervle verilen alış emirleri **kayan son 30 günde** emir anındaki proje quote rezerv bakiyesinin (`auction-proceeds`) %10'unu aşamaz (`ManagementBook.bid_day`, `bid_days[31]`; takvim ayı başında sıfırlanmaz). Emir **verildiğinde** sayılır; canlı bir alış emri iptal edilirse dolmamış kısmı, **emrin verildiği güne** ve en fazla o emrin harcadığı kadar geri verilir (`management_cancel`; son 16 emir `bid_seq/bid_on/bid_left` ile hatırlanır, kaydı silinmiş emre iade yok; Codex F1). Süresi dolan emir iptal edilmezse geri verilmez; emirleri ~24 saatlik süre dolmadan iptal edip yeniden koyun. Yönetim koltuğuna aktarılmış (`management_fund_quote`) para tabana sayılmaz; bu sınırı yalnız daraltır.
- **Referanssız satış tabanı (sahibin kararı, Grok bulgu 2):** Canlı referans yokken proje ve yönetim satışları, açılış ihale fiyatı ile son dış referansın %95'inden (en fazla 30 gün eskiyse) büyük olanın altına inemez. Tarama sınırını (192 düğüm) tozla doldurup gözlemi durdurmak tabanı düşürmez; yalnız gözlemi ve doğrudan release satışını durdurur. Keeper gözlem hatalarını izlemeli.
- **Kendi kendine işlem yok (A1/A2, sahibin kararı):** Rezervle verilen alış emri hem iki gün hem de Manifest'teki son geçerli slotuna kadar hatırlanır (`Config.mgmt_bid_max/mgmt_bid_until/mgmt_bid_slot`); bu sürede proje ve yönetim satış emirleri o fiyatın üstünde olmalı ve doğrudan release satışı (`execute_release_sale`) reddedilir. Proje ve yönetim satış emirleri de aynı şekilde hatırlanır (`ask_min/ask_until/ask_slot`); rezerv alışları onların altında olmalı. Hata: `SelfTrade` (6012). Slot sınırı, ağ yavaşlar veya durursa emrin iki günden uzun yaşamasına karşıdır (Codex F2); yönetim satışları da kapsamdadır (Codex F3). İptal bu süreyi kısaltmaz.
- **Asgari rezerv alış büyüklüğü (A8):** her rezerv alış emri en az (proje quote rezervi / 160), yani 30 günlük alış bütçesinin 1/16'sı olmalı; böylece aynı anda birkaç düzine emirden fazlası durmaz ve yönetim 192 düğümlük gözlem taramasını kendi emirleriyle dolduramaz.
- **Proje tabanı:** `initialize_fee_vaults(monthly_cap, reserve, project_floor)` ile **açılış ihalesinden sonra**, toplanan tutara göre bir kez seçilir; en az **120 quote birimi**. Yönetim emirlerine aktarılamaz ve giderler bu tabanı delemez. Bu ayar yapılmadan `management_fund_quote` çalışmaz.
- **Kapanıştan sonra gözlem:** 60. yıl kapanışından sonra da fiyat gözlemleri sürer (keeper yalnız gözlem planlar); yönetim emirleri kapalıdır.

## Ekip işlem taahhüdü (sahibin kararı, 4 Ekim 2026)

Kurucu ve ekip CHTA pazarında yalnız **ilan edilmiş** cüzdanlardan işlem yapar; beyan edilmemiş hesap kullanılmaz. Ekip ve varsa piyasa yapıcı cüzdan adresleri lansmandan önce sitede yayınlanır. Program kişisel cüzdanları ayırt edemediği için bu bir kod kuralı değil, kamuya açık taahhüttür. Lansman kontrol listesine: cüzdan adreslerini yayınla.

## Yönetim release sınırı (V22, sahibin kararı, bulgu 4-B)

O ayki yönetim release'leri ve doğrudan release satışlarının **toplamı** (`epoch.founder`) dış alış derinliğinin %2'sini (`depth/50`) aşamaz. Derinlik (inceleme sonrası, sahibin kararı): en az bir saattir bekleyen (`sequence_mark` öncesi), projeye ait olmayan, fiyatı referansın **%98'inden düşük olmayan** tüm alış emirleri. Doğrudan release satışı da fiyat ve derinliği yalnız bir saattir bekleyen emirlerden ölçer. Aylık bütçe sınırları (kapasitenin %20'si, insan bütçesinin ¼'ü) ayrıca geçerlidir. İnce pazarda payın kullanılmayan kısmı o ay kullanılamaz.

## Lansman parametreleri (sahibin kararları, 5 Ekim 2026)

| Talimat | Değer | Anlamı (USDC, 6 ondalık) |
|---|---|---|
| `initialize_release_policy(minimum_quote_depth)` | `25_000_000` | Fiyat ölçümü eşiği 25 USDC (en kötü senaryo: çok küçük pazar) |
| `open_auction(floor, tick_size)` | `200`, `10` | Taban fiyat 0,0002 USDC/token, basamak 0,00001; ihale fiyatı en fazla ~0,00275 |
| `initialize_fee_vaults(monthly_cap, reserve, project_floor)` | `project_floor = 120_000_000` | Rezerv tabanı 120 USDC |

- Tabandan tamamı satılırsa ihale 1.000 USDC toplar; bir cüzdan en fazla 250.000 token (50 USDC) alabilir.
- **İhale 120 USDC'den az toplarsa:** kurucu farkı (ve harcanabilir pay için fazlasını) proje rezerv hesabına (`auction-proceeds`) doğrudan SPL transferiyle koyar ve bunu sitede "kurucunun rezerve katkısı" olarak yayınlar. Bu para gelir sayılmaz, karşılığında token verilmez; tabanın üstündeki kısım yılda %25 kuralıyla harcanır. `contribute_quote` bu amaçla kullanılmaz (o, bağış kasasına gider).

## Ücretsiz pay yok (sahibin kararı, 4 Ekim 2026)

- Başlangıç tabanı 5M'nin tamamı açılış ihalesi ve piyasa envanterine gider (`genesis`), ihalede 5M satışa çıkar (`OFFER_HELI`).
- **Cüzdan başına ihale sınırı (sahibin kararı, tekele karşı):** bir cüzdan en fazla `WALLET_CAP_HELI` = 250.000 CHTA (teklifin %5'i) isteyebilir; daha büyük teklif `Quota` ile reddedilir, iptal edip yeniden teklif vermek sınırı artırmaz. Çok cüzdan açmayı kod engelleyemez (kimlik yok); sınır tek cüzdanla tekeli önler ve aşmayı görünür kılar. Satılmayan CHTA `market_remaining` içinde kalır ve yalnız satış tabanıyla satılır.
- `issue_credential`, `enroll_launch`, `claim_launch`, `dispute_launch`, `restore_launch`, `set_credential_active`, `finalize_launch` programdan ve IDL'den silindi; çağrılırsa program `Fallback functions are not supported` ile reddeder.
- Kimlik ve doğrulayıcı (`initialize_identity`, `set_verifier`) programdan tamamen kaldırıldı (bölüm 14).
- Kimlik servisi (`heli/claim-service`) ve canlı test kayıtları arşivdir; lansmanda çalıştırılmaz.

