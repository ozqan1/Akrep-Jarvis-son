# AKREP Android Yerel Modül Sözleşmesi

AKREP Asistan’ın React Native arayüzü ve iş mantığı çalışır durumdadır; ancak Android işletim sisteminin **overlay**, **erişilebilirlik**, **kilit ekranı**, **kesintisiz SpeechRecognizer**, **uyandırma sözcüğü** ve bazı sistem anahtarı yetenekleri Expo Go’nun güvenlik sınırlarının dışındadır. Bu yetenekler `AkrepAndroid` adlı yerel modül üzerinden bağlanır.

> Yerel modül bulunmadığında uygulama çökmez. `lib/android-yerel-koprusu.ts` güvenli bir “bu derlemede yok” geri dönüşü sağlar ve kullanıcıyı Publish/özel Android derlemesine yönlendirir.

## TypeScript sözleşmesi

| İşlev | Amaç | Android bileşeni |
|---|---|---|
| `overlayBaslat` | Alt kenarda mini asistan penceresi açar | `TYPE_APPLICATION_OVERLAY` + foreground service |
| `overlayDurdur` | Mini asistan penceresini kapatır | `WindowManager.removeView` |
| `erisilebilirlikServisiAcikMi` | AKREP erişilebilirlik servisinin etkinliğini denetler | `AccessibilityManager` |
| `uyandirmaServisiBaslat` | “Hey Akrep”/“Akrep” algılamasını başlatır | Foreground service + mikrofon bildirimi |
| `uyandirmaServisiDurdur` | Uyandırma servisini sonlandırır | Foreground service stop |
| `kesintisizDinlemeyiBaslat` | `tr-TR` SpeechRecognizer oturumunu başlatır | Android `SpeechRecognizer` |
| `kesintisizDinlemeyiDurdur` | Etkin dinleme oturumunu sonlandırır | `SpeechRecognizer.destroy` |

## Android 14 güvenlik sınırları

Uygulama, mikrofon kullanan foreground service çalıştırdığında görünür bir bildirim göstermeli ve `FOREGROUND_SERVICE_MICROPHONE` iznini bildirmelidir. Kilit ekranında sürekli mikrofon kullanımı cihaz üreticisinin pil optimizasyonu ve Android sürüm politikasına bağlı olabilir. Kullanıcıdan açık onay alınmadan arka plan dinleme başlatılmaz.

Telefon araması, SMS, mobil veri, uçak modu, Bluetooth ve Wi‑Fi gibi eylemlerde Android’in izin vermediği doğrudan anahtarlama işlemleri yapılmaz. AKREP güvenli sistem ayarı ekranını açar veya kullanıcı onayı ister. SMS eylemi varsayılan olarak mesaj taslağını açar; otomatik gönderim yapmaz.

## Yerel proje klasörleri

Expo CNG/Publish aşamasında Kotlin modülü aşağıdaki hedef yapıyla eklenmelidir:

```text
modules/akrep-android/
  android/src/main/java/com/akrep/asistan/AkrepAndroidModule.kt
  android/src/main/java/com/akrep/asistan/AkrepOverlayService.kt
  android/src/main/java/com/akrep/asistan/AkrepWakeWordService.kt
  android/src/main/java/com/akrep/asistan/AkrepAccessibilityService.kt
  expo-module.config.json
```

Yerel modülün JavaScript adı tam olarak `AkrepAndroid` olmalıdır. Yöntem imzaları `lib/android-yerel-koprusu.ts` ile eşleşmelidir.

## APK üretimi

Yerel modüller ve `llama.rn` Expo Go’da bulunmaz. Android APK/AAB üretmek için Manus yönetim arayüzündeki **Publish** düğmesi kullanılmalıdır. Publish işlemi yeni bir Android geliştirme/dağıtım derlemesi üretir; APK’yı sandbox içinde elle derlemek kaynak tükenmesine yol açabileceği için önerilmez.
