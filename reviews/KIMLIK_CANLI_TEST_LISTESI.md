# HELI kimlik doğrulaması — canlı test kontrol listesi (H3, M5, N1)

Bu testler gerçek kişiler ve gerçek belgelerle **yalnız proje sahibi** tarafından yapılır. Bu listeye kişisel veri, belge numarası, oturum kimliği veya ekran görüntüsü yazmayın. Yalnız sonuçları ve tarihleri işaretleyin.

## Hazırlık

- [ ] Kimlik sunucusu `claude/heli-v20-token-review-6gocpn` dalındaki güncel kodla yeniden başlatıldı. Eski sürüm M5, N1 ve H4 değişikliklerini içermez.
- [ ] Yeni, boş bir durum dosyasıyla başlatıldı (eski `.state/claim.sqlite` ayrı bir yere yedeklendi).
- [ ] Didit tarafındaki **eski oturumlar silinmedi**. 1. test onlara dayanır.
- [ ] Didit iş akışında yüz-tekrar (face search / duplicate) kontrolünün açık olduğu konsoldan kontrol edildi.
- [ ] Test katılımcılarından açık rıza alındı (belge ve yüz verisi Didit'e gider).
- [ ] Her deneme için yeni, boş bir test cüzdanı hazır.

Not: Proje sahibinin yüzü daha önceki pilot denemeleri nedeniyle Didit kayıtlarında bulunur. Onun yeni başvurularının "review" veya "duplicate" alması beklenir ve **hata değildir**.

## Test 1 — Aynı kişi, farklı belge, yeni cüzdan (H3)

Kim: **Proje sahibi**. Önceki onaylı başvuruda pasaport kullanıldıysa bu kez kimlik kartı.

1. Yeni bir cüzdanla başvuru başlatın ve cüzdan imzasını atın.
2. Didit'te **farklı belgeyle** doğrulamayı tamamlayın.
3. Başvuru sayfasında "Refresh status"a basın.

| Sonuç | Anlamı | İşaret |
|---|---|---|
| `review` veya `duplicate` | Yüz karşılaştırması aynı kişiyi yakaladı. H3 savunması çalışıyor. | [ ] |
| `verified` | **H3 açığı gerçek:** aynı kişi ikinci bir ücretsiz hak alabilir. Bildirin. | [ ] |
| `declined` / `expired` | Test sonuçsuz (belge veya çekim sorunu). Tekrarlayın. | [ ] |

Tarih: ______  Didit'teki uyarı türü (ör. "duplicate face"): ______

**Sonuç kaydı (4 Ekim 2026, deneme 1):** Proje sahibi, kimlik kartıyla ve yeni bir cüzdanla başvurdu. HELI sonucu `review`. Didit uyarıları: **duplicated** + **low similarity** (eski belge fotoğrafı).
- Yorum: Yüz-tekrar tespiti, farklı belgeye rağmen aynı kişiyi önceki oturumla eşleştirdi. H3 savunması bu denemede çalıştı.
- Sınır: Tek deneme. Düşük benzerlik uyarısı da aynı anda geldiği için sinyal karışık.
- Daha temiz kanıt için (isteğe bağlı): Yeni fotoğraflı başka bir belgeyle tekrar; beklenen sonuç yalnız "duplicated" uyarısı.
- Not: Pilot bu sırada önceki claim-service sürümüyle çalışıyordu. H3 karar mantığı (`didit.mjs`) bu oturumda değişmedi, sonuç geçerli.

**Ortaya çıkan politika konusu:** Eski fotoğraflı belgeler (ör. 10 yıl geçerli kimlik kartları) gerçek başvuranlarda da "low similarity" ile `review`'a düşürebilir. **Sahibin kararı (4 Ekim):** Bu başvurular manuel incelemeyle onaylanabilir. Yeni fotoğraflı bir belge, örneğin pasaport, de önerilebilir; proje sahibinin pasaport denemesi onay almıştı.

Uygulama: `claim-service/manual-review.mjs`.
1. Didit konsolunda oturumu inceleyip "Approved" yapın.
2. Kimlik servisini durdurun.
3. `node manual-review.mjs <başvuru-id> "<yazılı gerekçe>"` komutunu çalıştırın.

Kurallar:
- Yalnız gerekçenin SHA-256 özeti saklanır; metni kendi kayıtlarınızda tutun.
- Canlılık kontrolü ve 18 yaş şartı aynen geçerli.
- "Duplicated" uyarısı ancak `--allow-duplicate-face` ile aşılır. Bunu yalnız farklı kişi olduğu doğrulanmış ikiz veya kardeşler için kullanın.
- Aynı belge veya kişisel numara başka bir başvurudaysa hiçbir şekilde onaylanmaz.

## Test 2 — İki ayrı aile üyesi

Kim: Daha önce **hiç başvurmamış** iki kişi, mümkünse birbirine benzeyen kardeşler. Her biri kendi belgesi ve kendi yeni cüzdanıyla.

| Kişi | Beklenen | Sonuç | İşaret |
|---|---|---|---|
| A | `verified` | ______ | [ ] |
| B | `verified` | ______ | [ ] |

Biri `review` alırsa, yüz benzerliği iki farklı kişiyi karıştırmış olabilir. Didit'teki uyarı türünü not edin. Bu durumda manuel onay politikasına karar vermek gerekir: şu an uyarı içeren manuel onaylar da "review"da kalır.

## Test 3 — Kayıp başvuru linki (M5)

Kim: Test 2'de `verified` alan kişilerden biri.

1. Başvuru `verified` iken tarayıcının site verilerini silin (veya başka bir tarayıcı açın).
2. Başvuru sayfasına gidin ve **aynı cüzdanla** bağlanıp imzayı atın.

| Beklenen | İşaret |
|---|---|
| "Your existing application for this wallet was reopened." mesajı çıkar ve durum `verified` görünür | [ ] |
| Didit'te **yeni bir oturum açılmadı** (konsolda bu kişi için tek oturum var) | [ ] |
| Sonuç `duplicate` **değil** | [ ] |

## Test 4 — Telefonda tarayıcı geçişi (N1)

Kim: Test 2'deki kişilerden biri, gerçek bir telefonda (iPhone tercih edilir).

1. Başvuruyu Phantom uygulamasının içindeki tarayıcıda başlatın ve imzayı atın.
2. "Continue in Safari/Chrome" linkini kopyalayıp Safari'de açın.

| Beklenen | İşaret |
|---|---|
| Safari'de "This private link opens the HELI application for wallet: …" onay penceresi çıkar | [ ] |
| Penceredeki cüzdan adresi Phantom'daki adresle aynı | [ ] |
| Onaydan sonra Didit kamerası açılır ve doğrulama tamamlanır | [ ] |
| Doğrulamadan sonra Safari'de "Refresh status" doğru sonucu gösterir | [ ] |

Ek kontrol (isteğe bağlı): Başka birinin linkini açtığınızda onay penceresinde **sizin olmayan** bir cüzdan adresi görünmeli. "İptal" seçince kendi kayıtlı başvurunuz değişmemeli.

## Sonuç

- [ ] Test 1 `review`/`duplicate` → H3 için canlı kanıt var.
- [ ] Test 2–4 beklendiği gibi.
- [ ] Beklenmeyen bir sonuç varsa yalnız sonuç türünü ve tarihi bildirin (kişisel veri değil).
