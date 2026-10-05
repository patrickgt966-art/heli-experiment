# İnceleme kanıtlarını tekrar çalıştırma

Taban commit: **74c05949877e3a73f877289a67bc3861b71ffa99**. Bu dalın değişiklikleri yalnız `reviews/v22-final/` altındadır. Önce `RAPOR.md` okuyun. Programı dağıtmayın, gerçek anahtar/fon kullanmayın; `build.py`, `start-identity.mjs` veya ağ probe betiklerini çalıştırmayın.

## Ortam

İzole bir geçici çalışma kopyası kullanın. Depodaki standart testler kendi doğrulama JSON dosyalarını program/keeper klasörüne yazabilir; bunları kaynak değişikliği diye commit etmeyin. Bu rapordaki özel betikler yalnız bu inceleme klasörüne çıktı yazar.

- Python 3.13 + **solders==0.29.0** (venv veya ayrı dependency dizini).
- Node 24.19, `heli-v20-package/heli/mobile` lockfile bağımlılıkları; kurulum sırasında lifecycle scripts kapatıldı (`--ignore-scripts --frozen-lockfile`).
- Linux/Bash + Agave 2.1.21 / platform-tools v1.43 yalnız bağımsız build için gereklidir. Bu incelemede build çalıştırılamadı.

Yerel derleme hazır ortamda önce:

```sh
cd heli-v20-package/heli/solana-v20
bash scripts/build_local.sh
sha256sum heli_core_v20.so Cargo.toml
```

Beklenen üç hash ve boyut `hashes.json` içinde. Metadata hash'i eşleşmesi tek başına yeniden derleme değildir.

## Ek adversaryal senaryolar

Depo kökünden, her biri **yeni Python process** ile:

```sh
python reviews/v22-final/poc_final_svm.py management-self
python reviews/v22-final/poc_final_svm.py slot-time
python reviews/v22-final/poc_final_svm.py cancellation
python reviews/v22-final/poc_setup_svm.py missing-policy
python reviews/v22-final/poc_setup_svm.py early-floor
node reviews/v22-final/poc_keeper.mjs
```

Başarı, açığın karşı örneğinin yeniden üretildiği anlamına gelir; programın güvenli olduğu anlamına gelmez. `slot-time` sentetik bir saniye/slot koşulu kullanır; gerçek ağdaki güncel ilerlemeyi kanıtlamaz. Diğer senaryolar da sentetik saat/anahtar kullanır. Helper kaynaklarının yalnız setup bölümleri çalıştırılır; program/ELF baytlarına veya program hesaplarına patch uygulanmaz. Synthetic quote mint ve Clock değişikliği testin kapsamındadır.

## Standart regresyonlar

`heli-v20-package/heli/solana-v20/scripts` altındaki 11 `test_*_svm.py` dosyasını ayrı process ile çalıştırın; `test_policy_v22_svm.py` iki ayrı çağrı ister: `depth` ve `closure`. Böylece 12 script çalıştırması olur. Ardından `heli-v20-package/heli/keeper/tests/test_v20_svm.py`; `node` PATH'te olmalı.

`heli-v20-package` klasöründen:

```sh
HELI_TEST_PYTHON=$(which python) node --test heli/claim-service/tests/*.test.mjs heli/keeper/tests/keeper.test.mjs heli/operations/tests/operations.test.mjs heli/manifest-integration/*.test.mjs
```

Windows'ta `HELI_TEST_PYTHON` ortam değişkenini Python exe yolu olarak ayarlayın; ayrı dependency dizini kullanıyorsanız `PYTHONPATH` de ayarlanmalıdır. Bu incelemede 12 program script çalıştırması, 1 keeper SVM script'i ve 113 Node test kaydı geçti. Bunlar toplam bağımsız saldırı veya kullanıcı sayısı değildir. Ek beş SVM senaryosu ve bir planner mock senaryosu ayrıca raporlandı.

## Sonuç dosyaları

- `svm-results.json`, 12 program ve 1 keeper çalıştırmasının exit kodları.
- `node-tests.log`, 113 test sonucu (arşiv claim testleri dahil).
- `poc-*.json` / `poc-*.log`, ek senaryo ölçümleri.
- `test_*.log` ve `keeper-svm.log`, standart çalıştırma çıktıları.

Kayıtlar yalnız yerel simülatör sonuçlarıdır. Kaynaktan yeniden build, public network, real keeper, gerçek kimlik/webhook ve mainnet Metaplex kullanılmadı. Gizli klasörler incelenmedi veya yayımlanmadı.
