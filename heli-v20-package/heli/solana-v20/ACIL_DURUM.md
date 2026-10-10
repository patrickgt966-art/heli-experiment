# Charta acil durum el kitabı

Son güncelleme: 6 Ekim 2026.

Bu el kitabı programın bugünkü kurallarına (V24, program adresi `DZbsSEnZ…Bd2zG`, ELF `9c9779c3…`) dayanır. Buradaki her prosedür, prova zincirinde `scripts/emergency_drill.mjs` ile uygulandı: 9 tatbikat, 39 kontrol, 0 hata.

Komutların hepsi `scripts/emergency.mjs` aracıyla verilir:
- Araç her komutu **önce simüle eder** ve sonucu yazar. `--send` verilmeden hiçbir şey gönderilmez.
- Mainnet RPC'sinde ayrıca `--mainnet` onayı ister.
- Anahtar dosyasını yalnızca yerelde okur, hiçbir yere yazdırmaz.

```
node heli/solana-v20/scripts/emergency.mjs status --rpc <RPC>
node heli/solana-v20/scripts/emergency.mjs <komut> [değer] --rpc <RPC> --key <ANAHTAR.json> [--send]
```

## Altın kurallar

1. **Önce durumu oku:** `status` komutu hiçbir şey imzalamaz. Yöneticiyi, kurtarma anahtarını, güncelleme anahtarını, duraklatma durumunu, bekleyen anahtar değişikliklerini ve bekleyen giderleri gösterir.
2. **Önce simüle et, sonra `--send`.** Simülasyon "REJECTED" diyorsa göndermeyi zorlamayın; nedenini okuyun.
3. **Özel anahtarlar hiçbir sohbete, siteye, e-postaya ya da bulut klasörüne yazılmaz.** Kurtarma ve güncelleme anahtarları yalnızca kendi çevrimdışı cihazlarında kullanılır.
4. **Paniğe kapılmayın: aylık kural kendi kendine çalışır.** Duraklatma onu durdurmaz. Ayları kapatma işlemlerini (`open_epoch`, `settle`) herkes tetikleyebilir. Hiçbir acil durum aylık arzı hızlandıramaz.
5. **Her adımı duyurun.** Siteye Güncellemeler sayfasında tarihli bir kayıt girin, GitHub'a da yazın. Resmî adresler yalnızca bu iki yerde yayımlanır.

## Anahtarlar

| Anahtar | Nerede durmalı | Yapabildiği | Çalınırsa |
|---|---|---|---|
| Yönetici | Donanım cüzdanı; günlük kullanım | Duraklatma; gider önerme ve iptal; fiyat bandı içinde hazine emirleri; olağan yönetici devri | Bkz. senaryo 3 |
| Kurtarma | Çevrimdışı donanım cüzdanı ve metal ya da kâğıt yedek; yönetici cihazından ayrı | 7 gün sonra yeni yönetici önermek; herhangi bir bekleyen gideri iptal etmek; **duraklatmayı kaldırmak** (sonra yönetici 7 gün duraklatamaz); kendini anında değiştirmek. **Program kodunu değiştiremez.** | Bkz. senaryo 5 |
| Güncelleme (upgrade) | **Ayrı** çevrimdışı donanım cüzdanı; iki ayrı yerde metal ya da kâğıt yedek; yönetici ve kurtarma cihazlarından ayrı (sahibin kararı, 6 Ekim 2026) | Dağıtım adımı 15'ten sonra program kodunu değiştirmek; kendini başka bir anahtara devretmek. Başka hiçbir işlemde kullanılmaz | Bkz. senaryo 15 (en ağır durum) |
| Bakım servisi | Ayrı, az SOL'lu cüzdan | Yalnızca izinli bakım işleri (ihale kapatma, ay açma/kapatma, gözlem) | Yalnızca içindeki SOL risk altında |
| Cloudflare API anahtarı | Ortam değişkeni; sohbette ya da dosyada asla durmamalı | Siteyi yayımlamak | Bkz. senaryo 10 |

## Düzenli izleme

| Ne zaman | Kontrol | Nasıl |
|---|---|---|
| Her gün | Bakım servisinin durumu | `keeper/.state/health.json`: `status` alanı `idle`, `submitted` ya da `confirmed` olmalı. `rpc-or-safety-stop` veya `insufficient-balance` bir sorun demektir. |
| Her gün | Bekleyen giderler | `status` çıktısında "PAYABLE NOW" işaretli ama sizin önermediğiniz bir gider olmamalı. |
| Her gün | Bekleyen anahtar değişikliği | `status` çıktısında "pending admin change" ve "pending recovery" satırları `none` olmalı. |
| Haftada bir | Doğrula sayfası | Tüm maddeler ✓ olmalı. Güncelleme anahtarı uyarısı, denetimden önce beklenen durumdur. |
| Haftada bir | Bakım servisi cüzdanı | Ayda yaklaşık 0,005 SOL harcar. 0,05 SOL'un altına inince doldurun. |
| Ayda bir | Ay kapanışı | Canlı veri sayfasında "Month N of 720" ilerlemiş ve "Last monthly release" görünüyor olmalı. |

Bu kontroller için ayrıca bir sistem kurmanız gerekmez. Kurtarma anahtarı, kendisine 7 günlük bir pencere bırakan her şeyi durdurabilir. Bu yüzden **en az 7 günde bir `status` okumak** kritik koruma sağlar.

## Senaryolar

### 1. Yönetici anahtarının çalındığından şüpheleniyorum (anahtar hâlâ bende)

Hız önemli. Olağan devirde bekleme süresi yoktur.

1. Yeni bir donanım cüzdanında yeni bir anahtar oluşturun. Yalnızca açık anahtarını (pubkey) kullanacaksınız.
2. Yönetimi yeni anahtara devredin:
   ```
   emergency.mjs propose-admin <YENİ_PUBKEY> --key <ESKİ_YÖNETİCİ.json> --send
   emergency.mjs accept-admin --key <YENİ_YÖNETİCİ.json> --send
   ```
3. `status` ile yöneticinin değiştiğini doğrulayın.
4. Eski anahtarın önermiş olabileceği giderleri kontrol edin. Tanımadığınız her gideri iptal edin:
   ```
   emergency.mjs cancel-expense <NO> --key <YENİ_YÖNETİCİ.json> --send
   ```
5. Bakım servisi yönetici değişince **bilerek durur** ("Administrator pin changed"). Servis ayarındaki `trust.admin` değerini yeni açık anahtar yapın ve servisi yeniden başlatın. Bu sürede kapanmamış aylar varsa servis onları sırayla kapatır.
6. Değişikliği duyurun.

Tatbikat 4: eski anahtar devirden sonra hiçbir yetki taşımıyor.

### 2. Yönetici anahtarı kayboldu (kimsenin elinde değil)

1. Yeni bir yönetici anahtarı oluşturun.
2. Kurtarma anahtarıyla, çevrimdışı cihazında, yeni anahtarı önerin:
   ```
   emergency.mjs propose-admin <YENİ_PUBKEY> --key <KURTARMA.json> --send
   ```
3. **7 gün** bekleyin. Bu süre dolmadan kabul reddedilir.
4. Yeni anahtarla kabul edin:
   ```
   emergency.mjs accept-admin --key <YENİ_YÖNETİCİ.json> --send
   ```
5. Bakım servisini yeni yöneticiye sabitleyin (pin) ve yeniden başlatın. Değişikliği duyurun.

Bu 7 gün içinde aylık kural çalışmaya devam eder. Durdurulmuş olan yalnızca yöneticinin işleri: hazine emirleri ve gider önerisi.

### 3. Yönetici anahtarı çalındı ve hırsız benden hızlı davrandı

**Bilinen sınır.** Bu durum `DEPLOYMENT.md`'de de yazılı ve tatbikat 6'da gösterildi:
- Kurtarma anahtarının yönetici önerisi 7 gün bekler.
- Mevcut yönetici bu öneriyi iptal edebilir. Yönetici artık hırsızsa, kurtarma anahtarı yönetimi tek başına geri alamaz.

**Hırsız ne yapamaz**
- **Para çekemez:** Her gider 7 gün bekler ve kurtarma anahtarı her birini iptal edebilir. Kurtarma anahtarıyla en az 7 günde bir `status` okuyun ve tanımadığınız her gideri iptal edin:
  ```
  emergency.mjs recovery-cancel-expense <NO> --key <KURTARMA.json> --send
  ```
- **Hazine emirleriyle sınırsız kayıp yaratamaz:** Emirler fiyat bandına bağlıdır. Satış referansın %95'inden aşağı, alım %105'inden yukarı olamaz. Rezervden yapılan alımlar 30 günde rezervin %10'uyla sınırlıdır. Çekilen paralar yalnızca programın kendi hesaplarına döner.
- **Aylık arzı değiştiremez ya da durduramaz.**

- **Programı süresiz duraklatamaz** (V24, sahibin 6 Ekim kararı). Hırsız duraklatırsa kurtarma anahtarı hemen kaldırır; ardından yönetici anahtarı **7 gün** boyunca yeniden duraklatamaz (tatbikat 9):
  ```
  emergency.mjs recovery-unpause --key <KURTARMA.json> --send
  ```
  7 gün sonra hırsız yeniden duraklatırsa aynı komutu tekrarlayın. Böylece program en fazla birkaç saat ya da gün durur, süresiz durmaz.

**Hırsız ne yapabilir**
- Kısa süreli duraklatma (kurtarma anahtarı kaldırana kadar).
- Fiyat bandı içinde, rezervin %10'una kadar zararlı alım-satım yapabilir.
- Yeni gider önerebilir (kurtarma anahtarı iptal eder).

**Kalıcı çözüm (yalnızca güncelleme anahtarı varken):** güncelleme anahtarıyla, yöneticiyi sıfırlayan düzeltilmiş bir program yüklemek. Bu bir kod değişikliğidir: önce yazılmalı, test edilmeli ve mümkünse denetlenmelidir (senaryo 6'daki adımlar). Güncelleme anahtarı kaldırıldıktan sonra yönetim hırsızda kalır, ama yukarıdaki sınırlar geçerlidir.

### 4. Kurtarma anahtarı kayboldu

1. Yeni bir kurtarma anahtarı oluşturun.
2. Yöneticiyle önerin; bu öneri 7 gün bekler:
   ```
   emergency.mjs propose-recovery <YENİ_PUBKEY> --key <YÖNETİCİ.json> --send
   ```
3. 7 gün sonra yeni kurtarma anahtarıyla kabul edin:
   ```
   emergency.mjs accept-recovery --key <YENİ_KURTARMA.json> --send
   ```

Güncelleme yetkisi ayrı anahtarda olduğu için kurtarma anahtarının kaybı program kodunu etkilemez.

Kurtarma anahtarı elinizdeyse ve yalnızca değiştirmek istiyorsanız, değişiklik anında olur (tatbikat 7):
```
emergency.mjs propose-recovery <YENİ> --key <ESKİ_KURTARMA.json> --send
emergency.mjs accept-recovery --key <YENİ_KURTARMA.json> --send
```

### 5. Kurtarma anahtarı çalındı

Güncelleme yetkisi ayrı anahtarda olduğu için hırsız **program kodunu değiştiremez** ve para çekemez. Yapabilecekleri:
- kurtarma yetkisini anında kendine almak;
- yeni bir yönetici önermek (7 gün bekler; yönetici iptal edebilir);
- bekleyen giderleri iptal etmek (sabit teknik gider dahil);
- yöneticinin verdiği bir duraklatmayı kaldırmak; bundan sonra yönetici 7 gün duraklatamaz. Bu süre içinde acil durum freni çalışmaz; bir program hatası çıkarsa düzeltme güncelleme anahtarıyla yapılır (senaryo 6).

Yapılacaklar:
1. Kurtarma anahtarı hâlâ sizdeyse, hırsızdan önce kendini yeni bir anahtara devretsin (tatbikat 7):
   ```
   emergency.mjs propose-recovery <YENİ> --key <ESKİ_KURTARMA.json> --send
   emergency.mjs accept-recovery --key <YENİ_KURTARMA.json> --send
   ```
2. Hırsız daha hızlıysa: en az 7 günde bir `status` okuyun ve kurtarma anahtarından gelen her yönetici önerisini yöneticiyle iptal edin:
   ```
   emergency.mjs cancel-admin-proposal --key <YÖNETİCİ.json> --send
   ```
3. Yöneticiyle yeni bir kurtarma anahtarı önerin (7 gün bekler). Hırsız bu öneriyi iptal edebilir; o durumda yönetim yöneticide kalır, ama hırsız giderleri iptal etmeye devam edebilir. Kalıcı çözüm bir program güncellemesidir (senaryo 6, güncelleme anahtarıyla).
4. Duyurun.

### 6. Programda hata bulundu

1. Hata para kaybına yol açabiliyorsa **önce duraklatın** (kurtarma anahtarı son 7 günde duraklatmayı kaldırdıysa yönetici duraklatamaz; `status` bunu "pause lock" satırında gösterir):
   ```
   emergency.mjs pause --key <YÖNETİCİ.json> --send
   ```
   - Durur: satışlar, hazine emirleri, gider ödemeleri.
   - Açık kalır: insanların kendi teklifini iptal etmesi, claim etmesi ve paranın proje hesaplarına geri dönmesi.
   - Aylık kural etkilenmez.
2. Düzeltmeyi yazın ve tüm testleri çalıştırın:
   - LiteSVM testleri;
   - fuzz testi;
   - uçtan uca prova;
   - bakım servisinin uzun süreli testi.
3. Agave 2.1.21 ile derleyin (`scripts/build_local.sh`). Yeni ELF özetini (hash) kaydedin.
4. Güncelleme anahtarının çevrimdışı cihazında programı güncelleyin:
   ```
   solana program deploy heli_core_v20.so --program-id <PROGRAM_ID> --upgrade-authority <GÜNCELLEME.json>
   ```
5. Yeni özeti şu yerlere yazın:
   - `site-config.js` → `expectedProgram`;
   - bakım servisinin pinleri.

   Doğrula sayfasında kod kontrolünün ✓ olduğunu görün.
6. Duraklatmayı kaldırın:
   ```
   emergency.mjs unpause --key <YÖNETİCİ.json> --send
   ```
7. Ne olduğunu, neyin değiştiğini ve yeni özeti duyurun.

### 7. Bakım servisi durdu ya da RPC çalışmıyor

- **Para riski yok.** Aylar gecikir, ama servis geri gelince sırayla kapatılır. Uzun süreli testte 4 ay kapalı kalıp yetişti.
- **Servisi kontrol etmek için:** `keeper/.state/health.json` dosyasının durumuna ve hata mesajına bakın, servisi yeniden başlatın. Çökmeden önce kaydedilen işlemleri servis günlüğünden okur ve iki kez göndermez.
- **RPC kesintisi uzun sürerse:** ayardaki `rpcUrl` değerini başka bir sağlayıcıyla değiştirin.
- **Servis hiç çalışmıyorsa bile** aylar herhangi bir cüzdanla elle kapatılabilir; bu işlemler izin gerektirmez.

### 8. Bakım servisinin cüzdanı boşaldı

Servis tabanın altına inen bakiyede bilerek işlem göndermez (`insufficient-balance`). Cüzdana SOL gönderin; servis kendisi yetişir.

### 9. Manifest programı güncellendi

Bakım servisi Manifest'in kod özetini de sabitler. Kod değişirse servis durur. Yapılacaklar:
1. Yeni Manifest sürümünü ve sürüm notlarını inceleyin.
2. Uyumluysa yeni özeti ve uzunluğu servis ayarına yazıp servisi yeniden başlatın.
3. Emin değilseniz projenin satış ve hazine emirlerini durdurmak için `pause` verin.

### 10. Site ele geçirildi ya da Cloudflare anahtarı sızdı

Sitede para tutulmaz. Asıl risk, sahte bir sayfanın insanları sahte bir programa yönlendirmesi.
1. Cloudflare panelinden anahtarı **silin** ve yenisini oluşturun.
2. Siteyi GitHub `main` dalından yeniden yayımlayın. Yayındaki `site-config.js` dosyasında program adresinin doğru olduğunu kontrol edin.
3. Ne olduğunu ve resmî adresleri GitHub'da duyurun.

### 11. Sahte site, sahte token ya da dolandırıcılık

1. Güncellemeler sayfasında ve GitHub'da resmî adresleri tekrar duyurun:
   - site adresi;
   - program adresi;
   - mint adresi.
2. Sahte siteyi cüzdan sağlayıcılarının (ör. Phantom) dolandırıcılık bildirim kanallarına bildirin.
3. Charta hiç kimseye önce mesaj atmaz. Rehberdeki uyarı kutusunu öne çıkarın.

### 12. Fiyat çöküşü

**El ile müdahale gerekmez; kuralları çöküş anında değiştirmeye çalışmayın.**
- Proje satışları referansın %95'inin altına inemez.
- Rezervden alımlar 30 günde rezervin %10'uyla sınırlı.
- Çöküş istisnası programda tanımlı.

### 13. Bakım servisinin anahtarı çalındı

Bu anahtarın hiçbir yetkisi yoktur; yalnızca içindeki SOL risk altındadır.
1. Yeni bir anahtar üretin: `keeper/generate-key.mjs`.
2. Eski cüzdanda kalan SOL'u yeni cüzdana aktarın.
3. Ayardaki `keeperKeyFile` değerini değiştirip servisi yeniden başlatın.

### 14. Güncelleme anahtarı kayboldu

- Program çalışmaya devam eder; hiçbir kasa risk altında değildir.
- Ama program artık **hiç güncellenemez**. Bu, fiilen erken "kalıcı kod" demektir: hata bulunursa düzeltilemez. Bu yüzden güncelleme anahtarının en az iki ayrı yerde yedeği olmalı.
- Yedek de yoksa: durumu duyurun, Doğrula sayfasında güncelleme anahtarının değişmediğini izleyin ve denetimi buna göre planlayın.

### 15. Güncelleme anahtarı çalındı (en ağır durum)

Onu çalan kişi programı istediği koda değiştirip kasaları boşaltabilir. Yönetici ya da kurtarma anahtarı bunu engelleyemez.

**Anahtar hâlâ sizdeyse (şüphe):** hemen yeni bir çevrimdışı anahtara devredin (tatbikat 8). CLI yeni anahtarın da imzasını ister; ücreti başka bir cüzdan öder:
```
solana program set-upgrade-authority <PROGRAM_ID> --upgrade-authority <ESKİ_GÜNCELLEME.json> \
  --new-upgrade-authority <YENİ_GÜNCELLEME.json> --fee-payer <ÜCRET_CÜZDANI.json>
```
Ardından bakım servisinin `heliUpgradeAuthority` pinini yeni açık anahtarla güncelleyin; servis pin uyuşmazlığında kendini durdurur.

**Hırsız sizden önce davrandıysa:**
1. Hemen herkese duyurun. İnsanlar ihaleye ya da piyasaya para yatırmayı durdursun.
2. Yöneticiyle `pause` verin:
   ```
   emergency.mjs pause --key <YÖNETİCİ.json> --send
   ```
   Bu, program değiştirilmediği sürece satışları ve gider ödemelerini durdurur. Ama güncelleme yetkisini durduramaz.
3. Doğrula sayfasını ve `solana program show <PROGRAM_ID>` çıktısını izleyin. Kod değişirse herkes bunu kod kontrolündeki ✕ işaretinden görür.

Bu senaryonun riskini azaltmanın yolu önlemdir: anahtarı yalnız güncelleme için kullanmak, hiçbir sıcak cihaza koymamak ve denetimden sonra yetkiyi kalıcı olarak kaldırmak (`--final`).

## Karar gerektiren konular (sahibin kararı; kurallar değiştirilmedi)

1. ~~Kurtarma anahtarı ile güncelleme yetkisi aynı anahtarda.~~ **Karar verildi (6 Ekim 2026):** güncelleme yetkisi ayrı bir çevrimdışı anahtarda tutulur (seçenek b). Dağıtım adımı 15, kurulum betiği, prova, bakım servisi testi ve tatbikat buna göre güncellendi. Kurtarma anahtarının çalınması artık kodu riske atmaz (senaryo 5); en ağır durum güncelleme anahtarının çalınmasıdır (senaryo 15).
2. ~~Güncelleme anahtarı kaldırıldıktan sonra çalınan bir yönetici anahtarı programı süresiz duraklatabilir.~~ **Karar verildi (6 Ekim 2026), program değişikliği V24:** kurtarma anahtarı duraklatmayı kaldırabilir (`recovery_unpause`); ardından yönetici 7 gün duraklatamaz. Yalnızca duraklatılmış bir programda çalışır.
   - Bedeli: kurtarma anahtarı çalınırsa hırsız duraklatmayı da kaldırabilir (senaryo 5). Ama para çekemez ve kodu değiştiremez.

## Duyuru şablonu

> **[Tarih, UTC] Charta durum bildirimi.** Ne oldu: … Ne yaptık: … (işlem imzaları: …). Etkilenen: … Etkilenmeyen: aylık arz kuralı, kendi teklifini iptal ve claim. Sizden beklenen: … Resmî adresler yalnızca heli-experiment.pages.dev/updates ve GitHub deposunda yayımlanır; size mesaj atan kimseye güvenmeyin.

## Tatbikat

Tatbikatlar prova zincirinde, sentetik anahtarlarla çalışır:
```
python heli/solana-v20/scripts/svm_rpc.py --upgrade-authority <ADMIN_PUBKEY> --pretend-devnet &
node heli/solana-v20/scripts/emergency_drill.mjs <iş klasörü>
```
Devnet'e geçildiğinde aynı prosedürler **gerçek donanım cüzdanlarıyla** bir kez daha denenmelidir. Özellikle kurtarma anahtarıyla yönetici değiştirme ve gider iptali, ve güncelleme anahtarının kendini yeni bir anahtara devretmesi.
