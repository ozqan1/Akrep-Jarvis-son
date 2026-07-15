# AKREP Asistan — Proje Durumu

**Tarih:** 15 Temmuz 2026  
**Geliştirici:** Nebi Özkan  
**Marka:** AKREP  
**Teknoloji:** Expo SDK 54, React Native 0.81, TypeScript

## Yönetici özeti

AKREP Asistan’ın Android 14 odaklı çalışabilir temel sürümü tamamlanmıştır. Proje; özgün marka kimliği, tek elle kullanıma uygun koyu mobil arayüz, animasyonlu AKREP avatarı, bas-konuş kayıt akışı, Android TTS ayarları, ayrıntılı izin merkezi, 250’den fazla Türkçe komut örneği, güvenli cihaz eylem sözleşmesi ve Qwen 2.5 1.5B GGUF model yönetimi içerir.

Yerel çıkarım için `llama.rn` bağımlılığı ve Expo yapılandırma eklentisi projeye eklenmiştir. Bu kütüphane yerel Android kodu içerdiğinden Expo Go yerine geliştirme/yayın derlemesi gerektirir.[1] Sistem geneli overlay, sürekli uyandırma sözcüğü, kilit ekranı servisi ve AccessibilityService işlemleri için arayüz, kullanıcı ayarları ve TypeScript köprü sözleşmesi hazırlanmış; Kotlin servis uygulaması sonraki geliştirme aşaması olarak açık biçimde belgelenmiştir.

## Tamamlanan kapsam

| Alan | Durum | Açıklama |
|---|---|---|
| Marka ve ikon | Tamamlandı | Özgün yeşil/sarı/kırmızı neon AKREP ikonu; splash, favicon ve adaptive icon varlıkları |
| Ana arayüz | Tamamlandı | Koyu uzay teması, üst durum alanı, AKREP avatarı, canlı dalga ve büyük bas-konuş düğmesi |
| Ses kaydı | Tamamlandı | Tek kayıt oturumu, metering, sessizlikte otomatik sonlandırma ve hata durumları |
| TTS | Tamamlandı | Android Türkçe ses keşfi, hız, perde, otomatik seslendirme ve kalıcı ayarlar |
| İzin Merkezi | Tamamlandı | Mikrofon, kamera, kişiler, arama, bildirim, overlay ve erişilebilirlik durumları |
| Komut motoru | Tamamlandı | Türkçe normalizasyon, deterministik ayrıştırma, 250+ örnek ve 11 kategori |
| Güvenlik | Tamamlandı | Zod tabanlı katı JSON şeması, risk sınıfı, açık onay ve ayar ekranı geri dönüşü |
| Cihaz eylemleri | Temel sürüm tamamlandı | Arama/SMS taslağı, kamera/fener, medya köprüsü, uygulama açma, parlaklık ve sistem ayarları |
| Qwen modeli | Tamamlandı | İndir, duraklat, devam et, ilerlemeyi göster, GGUF başlığını doğrula, yükle ve sil |
| Yerel çıkarım | Derleme entegrasyonu tamamlandı | `llama.rn` bağlamı, akışlı yanıt ve güvenli JSON işlev çağrısı ayrımı |
| Ayarlar | Tamamlandı | Yerel Qwen varsayılanı, Gemini/OpenAI seçenekleri, SecureStore ve avatar stüdyosu |
| Mini asistan | Arayüz tamamlandı | Ekran altı overlay görünümünün React Native önizlemesi |
| Test ve kalite | Tamamlandı | 11 başarılı test, temiz TypeScript kontrolü ve hatasız Expo lint |
| Dokümantasyon | Tamamlandı | README, tasarım belgesi, TODO geçmişi, Qwen kaynakları ve Android yerel modül sözleşmesi |

## Güvenlik ve gizlilik kararları

Uygulamanın varsayılan sağlayıcısı yerel Qwen’dir. Gemini ve OpenAI seçenekleri kullanıcı tarafından açıkça seçilmedikçe devreye girmez. İsteğe bağlı API anahtarları yalnızca SecureStore’da tutulur; bu modül Android tarafında Keystore destekli şifreli saklama sunar.[2]

> Arama ve SMS gibi etkili işlemler, modelin veya ayrıştırıcının çıktısıyla doğrudan yürütülmez. Kullanıcı onayı, şema doğrulamasından bağımsız zorunlu bir kapıdır.

Modern Android sürümlerinde bazı sistem anahtarlarını üçüncü taraf uygulamaların sessizce değiştirmesi kısıtlıdır. Bu nedenle Wi-Fi, Bluetooth, mobil veri, uçak modu ve konum gibi alanlarda ilgili sistem ayarına güvenli yönlendirme tercih edilmiştir. Bu yaklaşım, sahte bir “başarılı” sonucu göstermek yerine platform sınırını kullanıcıya açıklar.[3]

## Qwen yerel model entegrasyonu

Qwen model yöneticisi resmî `Qwen2.5-1.5B-Instruct-GGUF` deposundaki `qwen2.5-1.5b-instruct-q4_k_m.gguf` dosyasını hedefler.[4] Qwen 2.5 ailesinin yapılandırılmış çıktı üretimindeki gelişmeleri uygulamanın JSON işlev çağrısı yaklaşımıyla uyumludur; yine de hiçbir model çıktısı yerel Zod şema doğrulamasını ve güvenlik kurallarını atlayamaz.[5]

| Kontrol | Uygulama davranışı |
|---|---|
| İndirme kaynağı | Resmî Qwen Hugging Face deposu |
| Devam desteği | İndirme durumu kalıcılaştırılır; duraklatma/devam kullanıcı kontrolündedir |
| Dosya bütünlüğü | Boyut alt sınırı ve `GGUF` sihirli başlığı doğrulanır |
| Çıkarım belleği | 2048 bağlam ve kontrollü üretim seçenekleriyle mobil odaklı başlatma |
| Güvenli geri dönüş | Yerel bağlam hazır değilse deterministik Türkçe ayrıştırıcı |

## Doğrulama sonuçları

Son kalite çalıştırması aşağıdaki sonuçları üretmiştir.

| Komut | Sonuç |
|---|---|
| `pnpm test` | 11 test başarılı, 1 şablon testi koşullu olarak atlandı |
| `pnpm check` | TypeScript hatası yok |
| `pnpm lint` | ESLint hatası veya kural uyarısı yok; yalnızca Node modül türü performans bildirimi |

Testler yalnızca olumlu örnekleri değil, güvenlik ihlallerini de kapsar. Arama eyleminden kullanıcı onayını kaldıran model çıktısı ve geçersiz parlaklık yüzdesi reddedilir. Türkçe ekli sözcükler için `müziği` ve `parlaklığı` gibi gerçek kullanım örnekleri doğrulanmıştır.

## Bilinçli sınırlar

| Sınır | Mevcut durum | Tamamlanması için gereken |
|---|---|---|
| Kesintisiz çevrimdışı STT | Ses kaydı ve sessizlik algılama hazır; ses-metin motoru bağlı değil | Android SpeechRecognizer ya da çevrimdışı Whisper/Vosk yerel modülü |
| Sistem geneli overlay balonu | React Native mini asistan görünümü ve köprü sözleşmesi hazır | `TYPE_APPLICATION_OVERLAY` kullanan Kotlin servis ve kullanıcı onayı |
| Erişilebilirlik eylemleri | Ayar yönlendirmesi ve sözleşme hazır | AccessibilityService, kullanıcıya açık eylem sınırları ve cihaz testleri |
| “Hey Akrep” uyandırma | Kalıcı kullanıcı ayarı ve servis sınırı hazır | Düşük güç tüketimli wake-word motoru ve foreground service |
| Kilit ekranında çalışma | Bildirim/servis mimarisi belgeli | Android 14 foreground-service türleri, bildirim kanalı ve cihaz üreticisi testleri |
| Gerçek arka plan medya tuşları | Native bridge geri dönüşü hazır | MediaSession tabanlı Kotlin modülü |
| Telefon araması/SMS gönderimi | Güvenli arama ve SMS taslağı/onayı hazır | Mağaza politikaları gözetilerek yetkili native uygulama rolü veya kullanıcı onaylı sistem UI’si |

Bu sınırlar kusur gizlemek yerine proje içinde açık sözleşmelerle temsil edilmiştir. Uygulama Expo Go’da desteklenmeyen bir yerel modülü çağırdığında çökmez; bunun yerine kullanıcıya geliştirme derlemesi gereksinimini bildirir.

## Sonraki önerilen geliştirme sırası

İkinci aşamada önce Android geliştirme derlemesi üretilmeli ve gerçek Android 14 cihazında mikrofon, TTS, kamera/fener, SecureStore ve Qwen model yükleme akışı doğrulanmalıdır. Ardından çevrimdışı ses-metin motoru eklenerek bas-konuş çıktısı doğrudan komut motoruna bağlanmalıdır.

Üçüncü aşamada `docs/ANDROID_YEREL_MODULLER.md` sözleşmesine göre Kotlin overlay, AccessibilityService, MediaSession ve foreground-service modülleri uygulanmalıdır. Her güçlü yetenek için açık kullanıcı onayı, görünür bildirim ve geri alma davranışı korunmalıdır.

## APK üretimi

Bu yönetilen proje için sandbox içinde manuel Gradle/APK derlemesi önerilmez. Son checkpoint’ten sonra yönetim arayüzündeki **Publish** düğmesi kullanılmalıdır. Publish işlemi, yerel bağımlılıkları içeren Android derlemesini platform ortamında başlatır. Cihaz kurulumu sonrasında özellikle Android 14 izinleri ve üreticiye özgü pil optimizasyonu davranışları gerçek donanımda test edilmelidir.

## Kaynak dosyalar

| Belge | Amaç |
|---|---|
| [`README.md`](README.md) | Kurulum, mimari, test ve APK üretim rehberi |
| [`design.md`](design.md) | Mobil ekranlar, akışlar ve renk kararları |
| [`todo.md`](todo.md) | Tamamlanan işlerin değiştirilemeyen görev geçmişi |
| [`docs/QWEN_KAYNAKLARI.md`](docs/QWEN_KAYNAKLARI.md) | Model ve llama.rn kaynak doğrulaması |
| [`docs/ANDROID_YEREL_MODULLER.md`](docs/ANDROID_YEREL_MODULLER.md) | Kotlin servis ve köprü uygulama sözleşmesi |

## References

[1]: https://github.com/mybigday/llama.rn "llama.rn — React Native llama.cpp bindings"
[2]: https://docs.expo.dev/versions/latest/sdk/securestore/ "Expo SecureStore"
[3]: https://developer.android.com/develop/connectivity/wifi/wifi-scan "Android Wi-Fi permissions and restrictions"
[4]: https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF "Qwen2.5-1.5B-Instruct-GGUF"
[5]: https://qwenlm.github.io/blog/qwen2.5/ "Qwen2.5 announcement"
