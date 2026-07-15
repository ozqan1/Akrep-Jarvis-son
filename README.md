# AKREP Asistan

**AKREP Asistan**, Android 14 odaklı; cihaz içinde çalışan Qwen 2.5 1.5B modeli, Türkçe sesli etkileşim, güvenli cihaz komutları ve koyu bilim-kurgu arayüzünü bir araya getiren Expo SDK 54 / React Native mobil uygulama projesidir.

> **Geliştirici:** Nebi Özkan  
> **Marka:** AKREP

![AKREP Asistan uygulama ikonu](assets/images/icon.png)

## Proje özeti

Uygulama, basılı tutarak konuşma akışı, sessizlikte otomatik kayıt sonlandırma, Android TTS ses keşfi, canlı ses dalgası, animasyonlu AKREP avatarı, ayrıntılı İzin Merkezi ve Qwen GGUF model yönetimi sunar. Cihaz komutları serbest metinden doğrudan çalıştırılmaz; önce deterministik Türkçe ayrıştırıcıya veya katı JSON işlev çağrısı şemasına dönüştürülür. Arama ve SMS gibi riskli işlemler kullanıcı onayı olmadan yürütülmez.

| Katman | Uygulanan yaklaşım |
|---|---|
| Mobil arayüz | Expo SDK 54, React Native 0.81, Expo Router ve Reanimated |
| Yerel yapay zekâ | Qwen2.5-1.5B-Instruct Q4_K_M GGUF ve `llama.rn` köprüsü |
| Model yönetimi | İndirme, duraklatma, devam, ilerleme, GGUF başlık doğrulama ve silme |
| Ses | `expo-audio` ile tek kayıt oturumu; `expo-speech` ile Android TTS |
| Güvenlik | Zod tabanlı işlev çağrısı doğrulaması, risk sınıfları ve açık onay kapıları |
| Cihaz yetenekleri | İzin merkezi, intent yönlendirmeleri, kamera/fener ekranı ve güvenli ayar geri dönüşleri |
| Gizlilik | Yerel Qwen varsayılanı; isteğe bağlı API anahtarları yalnızca SecureStore’da |

## Ekranlar

| Ekran | Temel işlev |
|---|---|
| Ana Asistan | AKREP avatarı, durum göstergesi, canlı ses dalgası, bas-konuş ve altyazılar |
| İzin Merkezi | Mikrofon, kamera, kişiler, arama, bildirim, overlay ve erişilebilirlik durumları |
| Model Yönetimi | Qwen modelini indir, duraklat, devam ettir, doğrula, yükle veya sil |
| Ayarlar | TTS sesi/hızı/perdesi, otomatik konuşma, avatar, uyandırma sözcüğü ve sağlayıcı ayarları |
| Mini Asistan | Ekran altı overlay deneyiminin React Native önizlemesi |
| Kamera | Kamera ve el feneri komutları için gerçek cihaz ekranı |

## Kurulum

Geliştirme için Node.js 22 ve `pnpm` önerilir. Depoyu klonladıktan sonra bağımlılıkları kurup tip, lint ve test doğrulamalarını çalıştırın.

```bash
pnpm install
pnpm check
pnpm lint
pnpm test
```

Web tabanlı hızlı arayüz önizlemesi için aşağıdaki komut kullanılabilir. Mikrofon, SecureStore ve özellikle `llama.rn` gibi yerel özelliklerin gerçek doğrulaması Android geliştirme derlemesinde yapılmalıdır.

```bash
pnpm dev
```

## Android geliştirme derlemesi ve APK

`llama.rn`, özel Android servisleri ve yerel izinler Expo Go içinde tam olarak çalışmaz; bunlar yerel kütüphaneleri içeren bir geliştirme ya da yayın derlemesi gerektirir.[1] Proje, `app.config.ts` içinde `llama.rn` eklentisi, Android izinleri ve ARM mimarileriyle yapılandırılmıştır.

Bu yönetilen proje için APK’yi sandbox içinde elle derlemeyin. Önce doğrulanmış bir proje checkpoint’i oluşturun; ardından yönetim arayüzündeki **Publish** düğmesini kullanın. Yayın işlemi Android derlemesini ve APK üretimini platformun derleme ortamında başlatır.

## Yerel Qwen modeli

Model Yönetimi ekranı, Qwen’in resmî `Qwen2.5-1.5B-Instruct-GGUF` deposundaki `qwen2.5-1.5b-instruct-q4_k_m.gguf` dosyasını kullanır.[2] Qwen 2.5 ailesi yapılandırılmış çıktılar ve JSON üretimi için geliştirilmiş destek sunar; uygulama bunun üzerine ayrıca katı yerel şema doğrulaması uygular.[3]

| Özellik | Davranış |
|---|---|
| Model dosyası | `qwen2.5-1.5b-instruct-q4_k_m.gguf` |
| Kaynak | Resmî Qwen Hugging Face deposu |
| Saklama | Uygulamanın özel belge dizini |
| Doğrulama | Boyut ve `GGUF` sihirli başlığı kontrolü |
| Çıkarım | `llama.rn` üzerinden cihaz içinde |
| Geri dönüş | Model hazır değilse deterministik Türkçe komut ayrıştırıcı |

## Komut motoru

Proje, **250’den fazla** kategori tabanlı Türkçe komut örneği içerir. Desteklenen temel kategoriler arama, SMS, kamera, fener, medya, uygulama açma, ses, parlaklık, sistem ayarları, izin yönetimi ve sohbet olarak tanımlanmıştır.

> Riskli eylemlerde model çıktısı tek başına yetkili değildir. Şema doğrulaması, izin kontrolü ve kullanıcı onayı birbirinden ayrı güvenlik katmanlarıdır.

Android’in güvenlik modeli nedeniyle Wi-Fi, mobil veri, Bluetooth, uçak modu ve konum gibi bazı anahtarlar modern sürümlerde üçüncü taraf uygulamalar tarafından sessizce değiştirilemez. AKREP bu durumlarda ilgili Android ayar ekranına güvenli yönlendirme yapar.[4]

## Yerel Android modül sınırları

Overlay balonu, kesintisiz SpeechRecognizer, erişilebilirlik eylemleri, uyandırma sözcüğü ve kilit ekranı servisi için TypeScript sözleşmesi `lib/android-yerel-koprusu.ts` içinde; uygulanması gereken Kotlin servisleri ve Android 14 kısıtları ise [`docs/ANDROID_YEREL_MODULLER.md`](docs/ANDROID_YEREL_MODULLER.md) içinde tanımlanmıştır.

Bu ilk sürümde React Native arayüzleri, güvenli ayar yönlendirmeleri ve köprü sözleşmeleri hazırdır. Tam sistem geneli overlay, sürekli uyandırma sözcüğü ve AccessibilityService eylemleri için belgede listelenen Kotlin modüllerinin sonraki yerel geliştirme aşamasında uygulanması gerekir.

## Güvenli sağlayıcı ayarları

Yerel Qwen varsayılandır ve API anahtarı gerektirmez. Gemini ve OpenAI yalnızca kullanıcı isterse seçilebilir. Anahtarlar `expo-secure-store` ile Android Keystore destekli güvenli depoda tutulur; AsyncStorage’a veya uygulama günlüğüne yazılmaz.[5]

## Testler

```bash
pnpm test
```

Test paketi; komut katalog büyüklüğünü, Türkçe normalizasyonu, arama/SMS onay kurallarını, medya-parlaklık-fener-uygulama ayrıştırmasını ve geçersiz JSON işlev çağrılarının reddedilmesini kapsar. Son doğrulamada **11 test başarılı**, TypeScript denetimi ve Expo lint işlemi hatasız tamamlanmıştır.

## Proje yapısı

```text
app/                         Ekranlar ve yönlendirme
components/                  AKREP avatarı ve ses dalgası
hooks/                       Ses kayıt ve TTS durum kancaları
lib/                         Komut, izin, model, ayar ve yerel köprü katmanları
docs/                        Qwen kaynakları ve Android yerel modül sözleşmesi
tests/                       Vitest güvenlik ve komut motoru testleri
assets/images/               Özgün AKREP uygulama ikonları
```

## Durum ve sonraki geliştirme

Ayrıntılı teslim kapsamı, doğrulamalar, bilinçli sınırlar ve sonraki adımlar [`PROJE_DURUMU.md`](PROJE_DURUMU.md) dosyasında; arayüz kararları [`design.md`](design.md) içinde; özellik geçmişi ise [`todo.md`](todo.md) içinde tutulur.

## References

[1]: https://github.com/mybigday/llama.rn "llama.rn — React Native llama.cpp bindings"
[2]: https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF "Qwen2.5-1.5B-Instruct-GGUF"
[3]: https://qwenlm.github.io/blog/qwen2.5/ "Qwen2.5 announcement"
[4]: https://developer.android.com/develop/connectivity/wifi/wifi-scan "Android Wi-Fi permissions and restrictions"
[5]: https://docs.expo.dev/versions/latest/sdk/securestore/ "Expo SecureStore"
