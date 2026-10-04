# HELI Sat/Al yolu — mevcut emir piyasası

**Durum:** Manifest'in resmî istemci API'sine göre HELI/quote piyasası için alım, satım, iptal ve bakiye çekme bağlantısı kodlandı; sahte istemci testleri geçti. Ayrıca resmî Manifest program ikilisiyle gerçek emir eşleşmeleri yerel Solana simülatöründe geçti. Devnet hesabıyla işlem yapılmadı; HELI minti ve HELI/quote piyasası henüz açık ağa yüklenmedi.

[Proje envanterini aynı piyasaya bağlama ve ihale haklarını koruma planı](PROJECT_MARKET_BRIDGE.md), kurucu kasasından satış emri çıkarma için gereken on-chain işlemleri ve yerel muhasebe kontrolünü ayırır.

[Resmî Manifest `program-v3.0.24` ELF'siyle yerel Solana işlemi](official-manifest-svm-verification.json), kullanıcılar arasında 1.000 HELI alış/satış eşleşmesini ve karşılığın satıcıya çekilmesini geçti. HELI V14'ün **program kasasından** Manifest'e emir verme yolu da [ayrı çalışma sürümünde](../solana-v14/README.md) derlendi ve yerel Solana ortamında eşleşme, gelir çekme ve emir iptaliyle sınandı.

## Kullanıcı akışı

1. HELI açılış ihalesini sonuçlandırır. Kazanan kullanıcı `claim_auction_bid` ile aldığı HELI'yi kendi cüzdanına çeker.
2. İlan edilmiş **tek HELI/quote piyasa adresi** `loadHeliMarket` ile yüklenir. Piyasanın baz tokenı HELI, karşılık tokenı ilan edilen quote minti değilse arayüz işlem kurmaz.
3. Kullanıcı cüzdanını bağlar. Piyasa ilk kurulum istiyorsa `prepareWallet` kurulum talimatlarını verir; kullanıcı kendi cüzdanıyla imzalar.
4. **Sat**: kullanıcı HELI miktarını ve en düşük kabul fiyatını girer; `limitOrderInstructions` Manifest'e satış emri ve gerekliyse HELI yatırma talimatı üretir. **Al**: aynı yol karşılık tokenı yatırıp alış emri üretir. Fiyatlar kesişirse piyasa eşleştirir; eşleşmezse emir bekler.
5. Kullanıcı `cancelOrderInstruction` ile bekleyen emrini iptal edebilir ve `withdrawAllInstructions` ile serbest bakiyesini çekebilir. Arayüz emir defterini `orderBook` ile okur.

Bu istemci bağlantısı **kullanıcıların kendi cüzdanındaki HELI** içindir. Program kasasından satışlık HELI'nin aynı piyasaya emir olarak aktarımı [V14'te](../solana-v14/README.md) ayrıca kodlandı ve yerel testten geçti. Açılış ihalesi hâlâ üçüncü taraf piyasayı tek işlemde oluşturmaz.

## Dosyalar ve doğrulama

- [`market_adapter.mjs`](market_adapter.mjs): resmî Manifest SDK yöntemleriyle işlem talimatlarını hazırlar; özel anahtar almaz ve işlemi kendisi göndermez.
- [`market_adapter.test.mjs`](market_adapter.test.mjs): yanlış piyasa çiftini reddetme, alım/satım yönü, emir girişi, iptal ve çekim kontrolleri.
- Yerel test: `node --test market_adapter.test.mjs`.

Arayüz için güncel resmî paket `@bonasa-tech/manifest-sdk`; üretim kullanımında sürüm sabitlenmeli ve SDK ile hedef Manifest programının kimliği doğrulanmalıdır. SDK'nın [`getSetupIxs`, `getClientForMarketNoPrivateKey`, `placeOrderWithRequiredDepositIxs`, `cancelOrderIx`, `withdrawAllIx` ve emir defteri yöntemleri](https://github.com/Bonasa-Tech/manifest/tree/main/client/ts) bu adaptörün dayanağıdır. Bu paket henüz yerel ortama kurulmadı; sahte istemci testi gerçek SDK veya açık ağ uyumluluğunu kanıtlamaz.

Gerçek piyasa bağlantısı için kalan girdiler: açık ağ HELI mint adresi, quote mint adresi, oluşturulmuş HELI/quote Manifest piyasa adresi ve kullanıcı cüzdanının imzalayacağı arayüz. Devnet denemesinde test SOL ve değersiz quote varlığı kullanılır; gerçek fon gerekmez.
