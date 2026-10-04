# Codex için V21 inceleme promptu

Aşağıdaki metni Codex'e yapıştırın. Depo herkese açık: https://github.com/patrickgt966-art/heli-experiment

```text
Görevin: HELI V21 adlı deneysel bir Solana token projesinin bağımsız ve adversaryal incelemesi. Yanıtını Türkçe ver.

Kaynak: GitHub deposu patrickgt966-art/heli-experiment, etiket "heli-v21"
(dal: claude/heli-v20-token-review-6gocpn). Önce şunları oku:
- heli-v20-package/V21_DURUM.md (V21 özeti, hash'ler, testler, açık konular)
- reviews/HELI_V20_BAGIMSIZ_INCELEME_2026-10-04.md (önceki inceleme ve "Düzeltme durumu" tablosu)
- heli-v20-package/heli/solana-v20/DEPLOYMENT.md (kurulum sırası ve anahtar planı)
V20 başlangıç hali commit c9176d5'tir. V20→V21 farkını git diff ile inceleyebilirsin.

Kurallar:
- Hiçbir ağa dağıtım yapma, fon harcama, gerçek anahtar veya kimlik verisi kullanma.
- Kaynağı harici bir derleyiciye gönderme. Yerel derleme serbest: heli/solana-v20/scripts/build_local.sh
  (Agave 2.1.21 / platform-tools v1.43).
- Yalnız yerel LiteSVM (solders==0.29.0) ve sentetik veri kullan.

İstediklerim:
1. "Düzeltme durumu" tablosundaki her düzeltmeyi kodla doğrula: gerçekten düzeltildi mi, yeni bir açık getirdi mi?
   Özellikle bak:
   - release.rs içindeki bid_book ağaç gezintisi ve sequence_mark mantığı
   - fiyat bandı hesabı (check_order_price, mantissa/exponent birimleri)
   - Governance devri ve itiraz sırası (yarış durumları)
   - dispute/restore ile launch_people sayacı
   - claim-service manuel inceleme (didit.mjs manual modu) ve hız sınırları
2. build_local.sh ile derleyip ELF hash'inin V21_DURUM.md ile aynı olduğunu kontrol et.
   Mümkünse SVM ve Node testlerini çalıştır.
3. Yeni açıklar ara: Anchor hesap kısıtları, yeni talimatların yetki kontrolleri, IDL ile kaynak uyumu,
   keeper'ın yeni gözlem düzeni.
4. Sahibin politika kararlarını (pause B, %95/%105 bant, 7 günlük iptal penceresi, kurtarma anahtarı)
   sessizce değiştirme. Sorun görürsen seçenek olarak öner.
5. Sayıları karıştırma: kontrol/işlem sayıları bağımsız test vakası değildir.

Çıktı: önce özet tablo (düzeltme → doğrulandı / kısmen / yanlış), sonra yeni bulgular
(dosya:satır, senaryo, etki, düzeltme, durum: yeniden üretildi / hipotez), en sonda neyi çalıştıramadığın.
```

Kaynağı indirilebilir dosya olarak vermek isterseniz:
https://github.com/patrickgt966-art/heli-experiment/archive/refs/tags/heli-v21.zip
