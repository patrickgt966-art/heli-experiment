# Charta — Devnet deneme rehberi

Bu rehber Devnet'te **değeri olmayan** bir deneme içindir. Bu bir mainnet lansmanı değildir. Mainnet anahtarlarını burada asla kullanma. Bütün anahtar dosyalarını deponun **dışında** tut.

## 0. Gerekenler

- Node.js 20+ ve depo kökünde `npm install`. Gereken paketler: `@solana/web3.js` ve `@solana/spl-token`.
- Solana CLI (Agave). Devnet'e program yüklemek için güncel sürüm önerilir.
- **Program anahtarı:** kodda yazılı program adresi `HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv`. Bu adresin anahtar dosyası sende yoksa:
  - yeni bir anahtar oluşturulur;
  - `declare_id!` bu yeni adresle güncellenir;
  - program yeniden derlenir;
  - betiklerdeki adres güncellenir.
  Bunu yaptırmak için haber ver.
- **Devnet'e özel anahtarlar** (`solana-keygen new -o <dosya>`):
  - yönetici;
  - kurtarma;
  - güncelleme (programın upgrade yetkisi; yönetici ve kurtarmadan ayrı, çevrimdışı);
  - keeper.
- **Test SOL'u:** yükleme anında geçici olarak **~14,1 SOL** gerekir. Program ~7,04 SOL tutar; geçici tampon ~7,04 SOL tutar ve yükleme bitince iade edilir. Kurulum işlemleri için birkaç SOL daha gerekir. Faucet günde sınırlı verdiği için SOL'u birkaç güne yayarak topla.
- **Test USDC'si:** 6 ondalıklı bir mint. Circle'ın Devnet USDC'sini kullanabilir ya da `spl-token create-token --decimals 6` ile kendin oluşturabilirsin.

## 1. Hazırlık kontrolü (sadece okur, işlem göndermez)

```
node heli-v20-package/heli/solana-v20/scripts/devnet_readiness.mjs <YÖNETİCİ_AÇIK_ANAHTAR> <TEST_USDC_MINT>
```

Kontrolün yazdığı `devnet-readiness.json` dosyasında `"ready": true` görülmeli. Özellikle:

- **`enoughSolForUpload`:** cüzdanda yükleme için yeterli SOL var mı.
- **`manifest.sameAsTestedBinary`:** Devnet'teki Manifest, bizim bütün testlerde kullandığımız v3.0.24 ikilisiyle aynı mı.
  - `false` ise Devnet sonuçlarına güvenmeden önce Manifest bayt düzeni bağımlılığı (M4) yeniden kontrol edilmeli.
  - Test ettiğimiz ikili SBPF v3 biçiminde. Agave 4.0'dan eski yerel validator'lar onu çalıştıramaz (5 Ekim provasında görüldü).
- **`metaplex.executable`:** Metaplex Token Metadata o ağda yüklü mü.
- **`quoteMint.decimals`:** 6 olmalı.

## 2. Programı yükle

```
solana program deploy heli-v20-package/heli/solana-v20/heli_core_v20.so \
  --program-id <PROGRAM_ANAHTARI.json> --upgrade-authority <YÖNETİCİ.json> --url devnet
```

Upgrade yetkisi kurulum bitene kadar yöneticide kalmalı. `initialize`, yalnız upgrade yetkilisi imzalarsa çalışır. Kurulumdan sonra yetki ayrı bir çevrimdışı güncelleme anahtarına geçer (6. adım).

## 3. Kurulum: ihale öncesi

`scripts/../devnet-setup.example.json` dosyasını deponun dışına kopyala ve doldur.

- **`upgradeAuthority`:** güncelleme anahtarının açık anahtarı. Betik, yönetici ya da kurtarma anahtarıyla aynıysa durur.
- **`start`:** 7–30 gün sonrası (unix saniye). İhale bu ana kadar açık kalır.
- **Lansman değerleri** (DEPLOYMENT'taki gibi): taban fiyat `200`/`10`, rezerv tabanı `120_000_000`, fiyat ölçümü eşiği `25_000_000`.

```
node heli-v20-package/heli/solana-v20/scripts/devnet_setup.mjs <setup.json> pre          # önce sadece planı gösterir
node heli-v20-package/heli/solana-v20/scripts/devnet_setup.mjs <setup.json> pre --send   # gönderir
```

Betik şu adımları sırayla yapar:

1. `initialize`
2. ihale envanteri
3. fiyat politikası
4. kasalar
5. Charta meta verisi
6. `genesis` (100M basım → 70M/15M kasalar, 10M yakım, basım yetkisi kaldırılır)
7. ihale hesapları ve ihale açılışı
8. kurtarma anahtarı
9. Manifest piyasası ve bağlama

Yarıda kalırsa aynı komutu tekrar çalıştır: tamamlanan adımlar atlanır.

## 4. İhale süresince

Test cüzdanlarıyla teklif ver. Bir cüzdan en fazla 250.000 token alabilir. Son 5 dakikada teklif verilemez ve iptal edilemez.

## 5. Kurulum: ihale bittikten sonra

Önce hazırlık kontrolünü bir kez daha çalıştır; keeper ayar dosyası Manifest pinlerini oradan alır.

```
node heli-v20-package/heli/solana-v20/scripts/devnet_setup.mjs <setup.json> post --send
```

Bu aşama şunları yapar:

1. ihaleyi sonuçlandırır;
2. gider kasalarını açar (rezerv tabanı 120);
3. aylık satış koltuğunu kurar;
4. yönetimi kurar;
5. keeper ayar dosyasını yazar.

## 6. Elle yapılacak son adımlar

```
solana program set-upgrade-authority HkScyzYb2nyhw9X8o31ShQTEFgbuKQj2ThBTBErBJAWv \
  --new-upgrade-authority <GÜNCELLEME.json> --url devnet
```

Ardından keeper'ı, yazılan ayar dosyası ve kendi ayrı keeper anahtarıyla başlat (`heli/keeper/README.md`). Keeper yalnız Devnet'te çalışır.

## Yerel prova (5 Ekim 2026)

Betikler Agave 4.0.0 test validator'ında denendi. Program, Manifest v3.0.24 ve Metaplex 1.14.0 yerel derlemesi yüklüydü; anahtarlar sentetikti.

- **İhale öncesi aşama:** 15 adımın hepsi gönderildi ve başarılı oldu. Yeniden çalıştırınca hepsi "zaten yapıldı" diye atlandı.
- **Zincir durumu:**
  - arz 90M;
  - basım ve dondurma yetkisi yok;
  - kasalarda 70M ve 15M, ihale envanterinde 5M;
  - meta veri "Charta" / "CHTA".
- **İhale sonrası aşama:** gerçek zamanda 7 gün beklemek gerektiği için yalnız planı doğrulandı. Bu adımların kendisi yerel LiteSVM testlerinde çalışıyor.
- **Agave 2.1, 3.0 ve 3.1 validator'larında:** Manifest ikilisi "Program is not deployed" verdi (SBPF v3).
