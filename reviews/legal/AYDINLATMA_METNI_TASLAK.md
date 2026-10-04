# HELI Kimlik Doğrulama — Kişisel Verilerin İşlenmesine İlişkin Aydınlatma Metni (TASLAK)

> **Bu bir taslaktır, hukuki görüş değildir.** Yayınlanmadan önce KVKK ve kripto varlık konusunda yetkin bir avukat tarafından kontrol edilmelidir. Köşeli parantez içindeki `[ ]` alanlar doldurulmalıdır. Metin, `heli/claim-service` kodunun 4 Ekim 2026 tarihli hâline (commit `14b8078`) göre yazıldı; kod değişirse güncellenmelidir.

Son güncelleme: [tarih]

## 1. Veri sorumlusu

Kişisel verileriniz, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla **[ad soyad veya şirket unvanı]** ("HELI Experiment") tarafından işlenmektedir.

İletişim: [e-posta adresi] · Adres: [posta adresi]

## 2. Hangi verileri işliyoruz?

| Veri | Nerede | Not |
|---|---|---|
| Solana cüzdan adresiniz ve cüzdan sahipliğini gösteren imzalı mesaj | HELI kimlik servisi | Başvuruyu cüzdanınıza bağlamak için |
| Başvuru numarası, başvuru durumu ve zaman bilgileri | HELI kimlik servisi | |
| Kimlik doğrulama oturum numarası (Didit) | HELI kimlik servisi | |
| Kimlik belgesi görüntüsü ve belgedeki bilgiler (ad, soyad, doğum tarihi, belge numarası, kişisel kimlik numarası, uyruk) | **Didit** | HELI bu görüntüleri ve ham bilgileri **saklamaz**. |
| Yüz görüntüsü / selfie, canlılık kontrolü ve yüz karşılaştırması (**biyometrik veri**) | **Didit** | HELI bu görüntüleri **saklamaz**. |
| Cihaz ve IP adresi analizi (sahtecilik ve tekrar başvuru kontrolü) | **Didit** | |
| Belge numarası ve kişisel kimlik numarasından üretilen, geri çözülemeyen özetler (HMAC-SHA256) ve doğrulama kararının özeti (SHA-256) | HELI kimlik servisi | Aynı kişinin ikinci kez başvurmasını engellemek için. Ham numaralar saklanmaz. |
| Manuel inceleme kaydı: tarih ve yazılı gerekçenin özeti (SHA-256) | HELI kimlik servisi | Gerekçe metni saklanmaz. |
| IP adresiniz | HELI kimlik servisi (yalnızca bellekte) | Yalnızca anlık istek sınırlaması için kullanılır, kaydedilmez. Barındırma sağlayıcısının (Cloudflare) kendi kayıtları ayrıdır. |
| [Ücretsiz pay dağıtımı açıldığında] Cüzdan adresiniz, kişi özeti ve doğrulama özeti | **Solana blokzinciri (herkese açık)** | Aşağıdaki 7. maddeye bakın. |

HELI sizden e-posta, telefon numarası veya ödeme bilgisi istemez.

## 3. Hangi amaçlarla işliyoruz?

- Ücretsiz başlangıç payının (1.000 HELI) yalnızca gerçek ve 18 yaşından büyük kişilere, **kişi başına bir kez** verilmesini sağlamak.
- Aynı kişinin farklı belge veya cüzdanlarla tekrar başvurmasını tespit etmek.
- Başvurunuzu cüzdanınıza bağlamak ve durumunu size göstermek.
- Gerektiğinde başvurunuzu manuel olarak incelemek (ör. eski fotoğraflı belge).
- Hizmeti kötüye kullanıma ve aşırı yüke karşı korumak.

## 4. Hukuki sebep

- **Biyometrik veriler** (yüz görüntüsü, canlılık, yüz karşılaştırması) KVKK md. 6 kapsamında özel nitelikli kişisel veridir ve **açık rızanıza** dayanılarak işlenir. [Avukat: 2024 değişikliği sonrası md. 6 şartlarını teyit edin.] Başvuru sırasında ayrı bir onay kutusuyla açık rızanız alınır. Rıza vermezseniz kimlik doğrulaması yapılamaz ve ücretsiz pay alınamaz; HELI'nin diğer kısımlarını (ör. pazar) kullanmanız etkilenmez.
- Diğer veriler: başvurduğunuz hizmetin sunulması (md. 5/2-c) ve kötüye kullanımın önlenmesine yönelik meşru menfaat (md. 5/2-f). [Avukat: teyit edin.]

## 5. Verileri kimlere aktarıyoruz?

| Alıcı | Amaç | Konum |
|---|---|---|
| **Didit** ([şirket unvanı]) | Kimlik belgesi, canlılık ve yüz doğrulaması | [ülke — Didit sözleşmesinden teyit edin] |
| **Cloudflare, Inc.** | Web sitesi ve bağlantı altyapısı | ABD ve küresel |
| **Solana blokzinciri** | [Yalnızca dağıtım açıldığında] Ücretsiz payın kaydı | Herkese açık, dağıtık ağ |

Bu aktarımların bir kısmı **yurt dışına** yapılmaktadır. [Avukat: KVKK md. 9 kapsamında aktarım mekanizmasını (standart sözleşme vb.) belirleyin ve buraya yazın.]

Verileriniz satılmaz ve reklam amacıyla kullanılmaz.

## 6. Ne kadar süre saklıyoruz?

- **HELI kimlik servisi:**
  - Tamamlanmamış başvurular: süresi dolduktan sonra otomatik silinir.
  - Tamamlanan başvurular ve kişi özetleri: ücretsiz dağıtım dönemi boyunca ve sonrasında [süre] saklanır. Bu özetler, aynı kişinin tekrar başvurmasını engellemek için gereklidir.
- **Didit:** [Didit konsolundaki saklama ayarı — gün sayısı] gün sonra silinir. [Avukat/işletmeci: Didit'teki saklama süresini kısa tutun ve buraya yazın.]
- **Blokzinciri kayıtları:** Silinemez (bkz. madde 7).

## 7. Blokzinciri hakkında önemli bilgi

[Bu madde ücretsiz pay dağıtımı açıldığında geçerlidir. Şu anki pilot yalnızca kimlik doğrulaması yapar ve blokzincirine bir şey yazmaz.]

Ücretsiz payınızı aldığınızda Solana blokzincirine şu bilgiler **kalıcı ve herkese açık** olarak yazılır:
- Cüzdan adresiniz
- Belge bilgilerinizden üretilmiş, geri çözülemeyen bir kişi özeti
- Doğrulama kararının özeti

Bu özetlerden adınız veya belge numaranız çıkarılamaz. Ancak blokzincirinin yapısı gereği bu kayıtlar **sonradan silinemez veya değiştirilemez.** Bu nedenle silme talebiniz blokzincirindeki kayıtlar için yerine getirilemez; HELI kimlik servisi ve Didit'teki veriler için yerine getirilir.

## 8. Haklarınız (KVKK md. 11)

Veri sorumlusuna başvurarak şunları talep edebilirsiniz:
- Verilerinizin işlenip işlenmediğini öğrenmek ve işlenmişse bilgi istemek
- İşleme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenmek
- Yurt içinde veya yurt dışında aktarıldığı kişileri öğrenmek
- Eksik veya yanlış işlenmişse düzeltilmesini istemek
- Silinmesini veya yok edilmesini istemek (blokzinciri kayıtları hariç, bkz. madde 7)
- Düzeltme ve silme işlemlerinin aktarılan kişilere bildirilmesini istemek
- Otomatik sistemlerle yapılan analiz sonucunda aleyhinize bir sonuç çıkmasına itiraz etmek. Kimlik kontrolü otomatik yapılır; tekrar başvuru veya düşük benzerlik gibi durumlarda başvurunuz manuel incelemeye alınabilir.
- Kanuna aykırı işleme nedeniyle zarara uğramışsanız zararın giderilmesini istemek

Başvurularınızı [e-posta adresi] adresine iletebilirsiniz. Başvurunuz en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.

Açık rızanızı her zaman geri çekebilirsiniz. Geri çekme, daha önce yapılmış işlemleri etkilemez. Ücretsiz pay henüz verilmediyse başvurunuz kapatılır.

---

## İşletmeci için notlar (yayınlanmayacak)

- **Açık rıza kutusu:** Eklendi (commit sonrası `claim-service`). Didit linki, sunucu rızayı (`heli-biometric-consent-v1`, zaman damgasıyla) kaydedene kadar verilmez. Rıza metni değişirse sürüm adı da değiştirilmeli. Kutudaki metin avukat onaylı aydınlatma metniyle uyumlu hale getirilmeli ve metne link eklenmeli.
- **Didit saklama süresi:** Didit konsolundaki veri saklama ayarı kontrol edilip mümkün olan en kısa süreye ayarlanmalı.
- **VERBİS:** Veri sorumluları siciline kayıt yükümlülüğü olup olmadığı avukata sorulmalı.
- **Yaş:** 18 yaş altı başvurular reddedilir; bunun metinde ayrıca belirtilmesi gerekip gerekmediği sorulmalı.
- **Pilot:** Başkalarının verisi toplanmadan önce bu metin yayınlanmalı ve rıza kutusu eklenmelidir.
- **İngilizce sürüm:** Uluslararası başvurular olacaksa GDPR uyumlu bir İngilizce sürüm de gerekir.
