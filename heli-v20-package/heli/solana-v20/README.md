# HELI programı (V22) — `heli_core_v20`

Program ve klasör adı uyumluluk için "v20" olarak kaldı; içerik V22'dir. **Dağıtılmadı, bağımsız denetimden geçmedi.**
Ayrıntılı karar ve test kaydı: `../../../reviews/v22/V22_DUZELTME_2026-10-04.md`. Kurulum: `DEPLOYMENT.md`.

## Arz

| Kalem | HELI |
|---|---:|
| İlk basım | 100.000.000 |
| İlk yakım | −10.000.000 |
| Açılış ihalesi ve piyasa envanteri (ücretsiz dağıtım yok) | 5.000.000 |
| Aylık Piyasa Arzı Kasası (vault 0, kilitli) | 70.000.000 |
| Yönetim Hazinesi (vault 3, kilitli) | 15.000.000 |

Aylık tavan: `floor((mint_supply − kilitli_stoklar) × RATE / SCALE)`, `RATE = 4_022_473_737_086_389`, `SCALE = 10^18`
(≈ %0,402247; ilk ay 20.112,368685 HELI), 720 ay. Yönetim: ilk 12 ay kilitli; sonra tavanın en fazla %20'si,
yönetim dışı arzın ¼'ü ve dış alış derinliğinin %2'si. 60. yılda kalan kilitli stok yakılır.

## Hazine ve pazar (özet)

- Açılış ihalesi: cüzdan başına tek teklif, en fazla 250.000 HELI (`WALLET_CAP_HELI`, teklifin %5'i); satılmayan kısım proje envanterinde kalır.

- Fiyat referansı yalnız dış alışlardan (Manifest v3.0.24), saatlik gözlemle; satış ≥ %95, rezervle alış ≤ %105.
- Rezervle tüm alışlar 30 günde rezerv bakiyesinin en fazla %10'u; çöküş istisnası 24 saat kesintisiz kayıtlı sığlık ister.
- Giderler: önce bağışlar, satış geliri %100, ötesi 30 günde 10 quote birimi + rezervin yılda %25'i; rezerv, kurulumda seçilen proje tabanının (en az 120) altına yalnız 10 birimlik teknik tabanla iner; 7 gün bekleme, yönetici veya kurtarma anahtarı iptal edebilir.
- Token meta verisi (ad, sembol, logo) genesis'ten önce bir kez yazılır; basım yetkisi genesis'te kaldırılır.

## Derleme ve doğrulama

`scripts/build_local.sh` (Agave 2.1.21 / platform-tools v1.43). Kaynak, ELF ve `Cargo.toml` özetleri `compiled-source.json`'dadır;
testler (`scripts/test_*_svm.py`, LiteSVM) ELF'in kaynakla eşleşmesini doğrular. Metaplex test programı: `test-programs/README.md`.
