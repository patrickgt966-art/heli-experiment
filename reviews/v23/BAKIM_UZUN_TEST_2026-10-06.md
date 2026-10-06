# Bakım servisinin uzun süreli testi (6 Ekim 2026)

## Ne test edildi

Değiştirilmemiş bakım servisi motoru (`keeper/engine.mjs` ve `keeper/adapter.mjs`, `run.mjs` ile aynı biçimde), prova zincirinde **5 yıl (60 aylık sınır)** boyunca çalıştırıldı.

**Ortam**
- Zincir: `scripts/svm_rpc.py`.
- Blok özetleri (blockhash) gerçek ağdaki gibi 150 slot sonra geçersiz oluyor (`--blockhash-validity 150`).
- Program ELF'i V23 derlemesi: `ce1949d9…`.
- Yalnızca sentetik anahtarlar kullanıldı; ağa dağıtım ya da gerçek fon yok.

**Başlangıç ve takvim**
- Başlangıç bilerek ayın 31'ine konuldu: 31 Ekim 2026, 12:34:56 UTC.
- Bu sayede 30 günlük aylar, şubatlar ve 29 Şubat 2028 artık günü denendi.
- Her ayın işi, sınırdan sonra rastgele 0–72 saat gecikmeyle çalıştırıldı.

Betik: `heli/solana-v20/scripts/keeper_longrun.mjs`. Ayrıntılı sonuç: `keeper-longrun-report.json`.

## Kasıtlı arızalar ve sonuçları

| Ay | Arıza | Beklenen | Sonuç |
|---|---|---|---|
| 3 | RPC kesintisi (servisin isteklerinin %60'ı düşüyor; toplam 78 yapay hata) | Servis hata verip yeniden dener, RPC düzelince ayı kapatır | ✓ |
| 5 | Günlüğe yazdıktan sonra, göndermeden önce çökme | Yeniden başlayan servis bekleyen işlemi günlükten okur, tekrar gönderir ve onaylar | ✓ |
| 7 | Gönderdikten sonra, onaydan önce çökme | Yeniden başlayan servis işlemi zincirde bulur, ikinci kez göndermez | ✓ |
| 9 | Yolda kaybolan işlem; blok özetinin süresi doluyor | İşlem "süresi doldu" olarak tanınır, güvenli biçimde yeniden hazırlanır (`expired-retry-safe`) | ✓ |
| 11–14 | Servis 4 ay kapalı | Bu sürede hiçbir ay kapanmaz; 15. ayda 11'den 15'e kadar sırayla kapatılır | ✓ |
| 20 | Aynı anda iki servis (farklı cüzdanlar) | Ay yalnızca bir kez kapanır; ikinci servis işin yapıldığını görür (`reconciled`, zaten zincirde yapılmış) | ✓ |
| 24 | Servisin cüzdanında SOL, ayrılan tabanın altına iniyor | Servis işlem göndermez (`insufficient-balance`), ay açık kalır; bakiye doldurulunca yetişir | ✓ |
| 30–32 | Yönetici programı duraklatıyor | Aylık kural duraklatılamaz; aylar kapanmaya devam eder | ✓ |
| 36 | Yönetici kurtarma anahtarıyla değiştiriliyor (öneri, 7 gün bekleme, kabul) | Servis "Administrator pin changed" ile durur, hiçbir şey yapmaz; işletmeci yeni yöneticiyi sabitleyip (pin) yeniden başlatınca devam eder | ✓ |

## Her ayın sonunda kontrol edilenler

- Vadesi gelen her ay kapatılmış mı? Servis kapalıyken ya da kasıtlı durmuşken, vadesi gelen ay açık mı?
- Arz 90.000.000 CHTA mı?
- Rezerv ve hazine kasaları kayıtlı stoklarına eşit mi?
- Her ayın tavanı ve serbest bırakılan miktarı, yayımlanan formülün bağımsız olarak yeniden hesaplanmasıyla birebir aynı mı?
  - Tavan: serbest ve yakılmamış arz × 4.022.473.737.086.389 / 10¹⁸.
  - 12. aydan itibaren tavanın 1/5'i yönetim payına ayrılıyor.
  - Rezervden bırakılabilecek en fazla miktar, rezervin kendisi.
- 24 takvim sınırının her birinde ay, sınırdan 1 saat önce kapatılmaya çalışıldı ve reddedildi. Örnekler: 30 Kasım, 28 Şubat, **29 Şubat 2028**, 30 Nisan.
- Her ay, kendi sınırından sonra kapatılmış mı?
- Servisin 5 yıl boyunca imzaladığı 178 işlemin tamamı denetlendi. Hepsi yalnızca izin listesindeki bakım talimatlarını kullanıyor: ihaleyi kapatma, ay açma, ay kapatma, gözlem. Başka bir programı ya da talimatı çağıran işlem yok.

## Sonuç: 606 kontrol, 0 hata

Test, V24 ELF'i (`c0e81814…`) ve ayrı çevrimdışı güncelleme anahtarıyla yeniden çalıştırıldı: yine 606 kontrol, 0 hata.

- 60 ayın tamamı kapandı.
- 5 yılda rezervden 1.116.708 CHTA satışa açıldı; rezervde 68.883.291 CHTA kaldı.
- Bu rakam basit bileşik büyümeden biraz düşük, çünkü 12. aydan sonra tavanın 1/5'i yönetim payına ayrılıyor ve bu pay satışa açılan miktara dahil değil.

**Servis durumlarının dökümü**

| Durum | Adet |
|---|---|
| submitted | 175 |
| confirmed | 177 |
| idle | 60 |
| pending | 3 |
| uncertain | 1 |
| reconciled | 1 |
| insufficient-balance | 1 |

## İşletme için çıkan notlar

1. **Yönetici değişirse servis durur.** Bu kasıtlı bir güvenlik davranışı. Yönetici anahtarı değişirse, işletmecinin yeni anahtarı servis ayarına sabitleyip (pin) servisi yeniden başlatması gerekir. Acil durum el kitabına eklenecek.
2. **Servis kapalı kaldığında aylar birikir.** Servis geri açılınca birikmiş ayları sırayla kapatır; bunun için ayrıca bir şey yapmak gerekmez. Ancak bu sürede aylık satış envanteri açılmamış olur.
3. **Cüzdan bakiyesi izlenmeli.** Bakiye tabanın altına inerse servis sessizce bekler; `health.json` dosyasındaki durum `insufficient-balance` olur.
4. **İki servis aynı anda çalışabilir.** Zarar vermez, yalnızca fazladan simülasyon ve ücret harcar. Yine de tek örnek kilidi (`run.mjs`) korunmalı.

## Sınırlar

- Prova zinciri LiteSVM'dir. Gerçek ağın gecikmesi, ücret piyasası ve RPC hız sınırları yok; bunlar Devnet'te denenecek.
- `run.mjs` yalnızca HTTPS RPC kabul ettiği için doğrudan çalıştırılmadı. Test, `run.mjs`'in kullandığı motoru ve adaptörü aynı biçimde kurdu. Kilit dosyası ve `health.json` yazımı bu testin kapsamında değil.
- Yönetim satışları ve Manifest üzerindeki alım-satımlar kapsam dışında. Bu yüzden piyasa gözlemleri talepsiz bir piyasada yapıldı.

## Çalıştırma

```
python heli/solana-v20/scripts/svm_rpc.py --upgrade-authority <ADMIN_PUBKEY> --pretend-devnet --blockhash-validity 150 &
node heli/solana-v20/scripts/keeper_longrun.mjs <iş klasörü> 60
```

İş klasöründeki anahtarlar ve günlük dosyaları depoya eklenmemeli.
