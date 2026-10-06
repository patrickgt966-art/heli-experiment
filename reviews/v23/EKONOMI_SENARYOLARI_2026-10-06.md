# Ekonomi senaryoları (6 Ekim 2026)

Bu rapor yalnızca analizdir: hiçbir kural ya da parametre değiştirilmedi. Fiyat ve talep rakamları **tahmin değil, varsayımdır**. Amaç, mevcut kuralların farklı koşullarda nasıl sonuç verdiğini görmektir.

- Betik: `heli/solana-v20/scripts/economics_sim.py`
- Tüm sonuçlar: `economics-sim.json`

## Model

**Arz**
- Programla birebir aynı tamsayı hesabı kullanılıyor (`economics.rs` capacity, `market_release.rs` settle).
- Doğrulama: yönetim payı kullanılmazsa 60 ayda tam **1.116.708 CHTA** serbest bırakılıyor. Bu, bakım servisinin uzun süreli testinde derlenmiş programdan ölçülen rakamın aynısı.

**Satış**
- Her ay serbest bırakılan CHTA, projenin satış envanterine ekleniyor.
- Dışarıdaki alıcıların o ay harcadığı USDC kadarı satılıyor.
- Satış fiyatı, referans fiyatın %95'i alınıyor. Bu, projenin satış emirlerinin inebileceği en düşük seviye; yani gelir ihtiyatlı tarafta hesaplanıyor.

**Giderler**
- **Sabit teknik gider:** 30 günde 12 USDC. Önce ödeniyor ve gerektiğinde proje tabanını da kullanabiliyor (5 Ekim kararı).
- **Diğer giderler**, iki ayrı politika ile hesaplandı:
  - **"Tutumlu":** sabit gider dışında hiç harcama yok.
  - **"Azami":** yönetici kuralların izin verdiği her şeyi her ay harcıyor. Yani satış gelirinin tamamını, artı gelir hariç rezervin yılda %25'ini; ama 120 USDC tabanın altına inmeden.

**Başlangıç rezervi**
- İhale 120 USDC'den az toplarsa kurucu 120'ye tamamlıyor (4 Ekim kararı).

**Kapsam dışı (ikisi de yöneticinin isteğine bağlı)**
- Yönetim hazinesinin satışları.
- Rezervden verilen destek alımları.

## 1. Arz

| | 1 yıl | 5 yıl | 20 yıl |
|---|---|---|---|
| Rezervden satışa açılan CHTA (yönetim payı kullanılmazsa) | 242.556 | 1.116.709 | 5.906.189 |
| Yönetim de bütçesinin tamamını satarsa piyasaya çıkan toplam | 246.760 | 1.361.741 | 8.103.707 |

- İlk ay 20.112 CHTA açılıyor. 12. aydan itibaren tavanın 1/5'i yönetim payına ayrıldığı için 60. ayda açılan miktar 19.620 CHTA.
- Aylık tavan, alıcı olmasa da büyümeye devam ediyor; çünkü satılmayan envanter "serbest bırakılmış arz" sayılıyor. Hiç alıcı yoksa 5 yılda **1,1 milyon CHTA satılmamış envanter** birikir. Talep gelince bu envanter, referans fiyatın %95'inden aşağı olmamak üzere satışa çıkar.

## 2. En önemli tespit: sabit gider, aylık satıştan büyük

Her ay açılan yaklaşık 20.000 CHTA, 0,0002 USDC fiyatla satılırsa projeye yaklaşık **3,8 USDC** getirir. Sabit gider ise **12 USDC**.

| | Aylık satışın sabit gideri karşılaması için gereken fiyat |
|---|---|
| 1. ay | **0,000628 USDC** (açılış fiyatının yaklaşık 3,1 katı) |
| 60. ay | 0,000644 USDC |

Sonuç: fiyat açılış seviyesinin yaklaşık 3 katına çıkmadıkça, açılan arzın tamamı satılsa bile sabit gider rezervden ödenir. Rezerv aslında **sabit giderin kaç ay karşılanabileceğini** belirliyor.

## 3. Rezerv ne kadar dayanır?

"Biter" sütunu, rezervin 12 USDC'lik sabit gideri ilk kez tam ödeyemediği ayı gösterir. "Bitmez" 20 yıl boyunca demektir.

**İhale 120 USDC toplarsa** (veya kurucu 120'ye tamamlarsa; bu, ihalenin çoğunun satılmadığı durumdur):

| Senaryo | Tutumlu: biter | Azami: biter |
|---|---|---|
| Hiç alıcı yok | 11. ay | 11. ay |
| Az alıcı (ayda 5 USDC, 0,0002) | 15. ay | 15. ay |
| İstikrarlı (ayda 50 USDC; fiyat 0,0003, yılda +%20) | 22. ay | 22. ay |
| Güçlü (ayda 500 USDC; fiyat 0,0003, yılda +%50) | bitmez | bitmez |
| Çöküş (6. ayda fiyat −%80; ayda 20 USDC) | 13. ay | 13. ay |

**İhale 1.150 USDC toplarsa** (provadaki gibi; 5M CHTA 0,00023'ten tamamen satılırsa):

| Senaryo | Tutumlu: biter | Azami: biter | Tutumlu: 5. yılda rezerv |
|---|---|---|---|
| Hiç alıcı yok | 96. ay (8 yıl) | 54. ay | 430 USDC |
| Az alıcı | 144. ay (12 yıl) | 67. ay | 642 USDC |
| İstikrarlı | bitmez | bitmez | 954 USDC |
| Güçlü | bitmez | bitmez | 1.488 USDC |
| Çöküş | 105. ay | 57. ay | 497 USDC |

**İhale 5.000 USDC toplarsa:**
- Tutumlu politikada hiçbir senaryoda rezerv bitmiyor; alıcı hiç olmasa bile 20. yılda 2.120 USDC kalıyor.
- Azami harcamada rezerv, alıcısız senaryoda 110. ayda bitiyor.

## 4. Kurallarla ilgili gözlemler (karar senin)

1. **120 USDC taban tek başına yaklaşık 10 aylık sabit gider demek.** İhale az satarsa ve alıcı gelmezse, sunucu ve RPC giderleri yaklaşık bir yıl sonra rezervden karşılanamaz hale gelir. Bu durumda gider ya bağışlardan (gider kasası önce bağışlardan öder) ya da kurucudan karşılanmalı. Program bu durumda çalışmaya devam eder; yalnızca giderler ödenemez.
2. **"Azami" harcama rezervi tabana çeker.** Satış gelirinin %100'ü harcanabildiği ve gelir dışındaki rezervin de yılda %25'i kullanılabildiği için, her şeyi harcayan bir yönetici rezervi uzun vadede 120 USDC'de tutar. Güçlü talep olsa bile 20. yılda rezerv 120 USDC'de kalır. Bunun iki sonucu var:
   - rezerv, fiyat düşüşünde destek alımı için (30 günde rezervin %10'u) çok küçük kalır;
   - birikmiş bir güvenlik payı oluşmaz.

   Kurallar buna izin veriyor; bu bir hata değil, bir tercih. Değiştirmek istersen ayrıca konuşmalıyız.
3. **Satılmayan envanter birikir.** Alıcı yokken her ay açılan CHTA envanterde bekler; 5 yılda 1,1 milyona ulaşır. Talep döndüğünde bu envanter piyasaya çıkabilir. Kurallar satış fiyatını referansın %95'inin altına indirmediği için ani bir döküm olmaz, ama fiyat üzerinde baskı yaratabilir.
4. **Yönetim payı kullanılırsa arz daha hızlı büyür.** Yönetim bütçesinin tamamını satarsa piyasaya çıkan CHTA, 5 yılda yaklaşık %22, 20 yılda yaklaşık %37 artar. Bu artış hâlâ yayımlanan tavanın içinde kalıyor.

## 5. SOL maliyeti (ayrı cüzdan)

Bakım servisinin ücretleri rezervden değil, servisin kendi SOL cüzdanından ödeniyor. Tahmini maliyet:

| Kalem | Tutar |
|---|---|
| Ay açma (hesap kirası) | yaklaşık 0,0012 SOL |
| Birkaç ücret | 0,00002 SOL |
| Saatlik piyasa gözlemleri (yalnızca dış talep varken; başarısız simülasyon ücret ödemez) | en fazla yaklaşık 0,0036 SOL |
| **Toplam** | **ayda yaklaşık 0,005 SOL** |

Bu bir tahmindir; Devnet'te ölçülecek.

## Sınırlar

- Fiyat ve talep dışarıdan verilen varsayımlardır. Gerçek fiyat, ihale alıcılarının kendi satışlarına ve piyasa davranışına bağlıdır; bunlar modelde yok.
- Model aylık adımlarla çalışıyor. Programdaki 30 günlük kayan pencereler ve günlük ayrıntılar yaklaşık olarak modellendi.
- Yönetim satışları, destek alımları ve bağışlar senaryolara dahil edilmedi. Bağışlar gelirse rezervin ömrü uzar.

## Çalıştırma

```
python3 heli/solana-v20/scripts/economics_sim.py
```
