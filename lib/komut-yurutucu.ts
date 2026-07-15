import * as Brightness from "expo-brightness";
import * as Contacts from "expo-contacts";
import * as IntentLauncher from "expo-intent-launcher";
import { router } from "expo-router";
import { Alert, Linking, NativeModules, Platform } from "react-native";

import type { CihazKomutu, KomutSonucu } from "@/lib/komut-sozlesmesi";

interface AkrepDeviceActionsModule {
  setFlashlight?(enabled: boolean): Promise<boolean>;
  sendMediaCommand?(command: "oynat" | "duraklat" | "sonraki" | "onceki"): Promise<boolean>;
  setMusicVolume?(level: number): Promise<boolean>;
}

const yerelModul = NativeModules.AkrepDeviceActions as AkrepDeviceActionsModule | undefined;

function onayAl(baslik: string, mesaj: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(baslik, mesaj, [
      { text: "Vazgeç", style: "cancel", onPress: () => resolve(false) },
      { text: "Onayla", style: "default", onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

async function kisiNumarasiBul(hedef: string): Promise<string | null> {
  const yalnizcaNumara = hedef.replace(/[^+\d]/g, "");
  if (yalnizcaNumara.length >= 7) return yalnizcaNumara;
  const izin = await Contacts.requestPermissionsAsync();
  if (izin.status !== "granted") return null;
  const sonuc = await Contacts.getContactsAsync({
    name: hedef.replace(/(?:annemi|babamı|eşimi|kardeşimi)/, "").replace(/[ıiuü]$/i, "").trim(),
    fields: [Contacts.Fields.PhoneNumbers],
    pageSize: 20,
  });
  return sonuc.data.flatMap((kisi) => kisi.phoneNumbers ?? []).find((telefon) => telefon.number)?.number ?? null;
}

const basarili = (mesaj: string): KomutSonucu => ({ basarili: true, mesaj, kod: "TAMAMLANDI" });
const basarisiz = (mesaj: string, kod: KomutSonucu["kod"] = "HATA"): KomutSonucu => ({ basarili: false, mesaj, kod });

async function ayarEkraniniAc(ayar: Extract<CihazKomutu, { eylem: "SISTEM_AYARI_AC" }>["ayar"]) {
  const eylemler: Record<typeof ayar, string> = {
    wifi: "android.settings.WIFI_SETTINGS",
    bluetooth: "android.settings.BLUETOOTH_SETTINGS",
    konum: "android.settings.LOCATION_SOURCE_SETTINGS",
    "ucak-modu": "android.settings.AIRPLANE_MODE_SETTINGS",
    ses: "android.settings.SOUND_SETTINGS",
    ekran: "android.settings.DISPLAY_SETTINGS",
    pil: "android.settings.BATTERY_SAVER_SETTINGS",
    erisilebilirlik: "android.settings.ACCESSIBILITY_SETTINGS",
    bildirim: "android.settings.APP_NOTIFICATION_SETTINGS",
  };
  await IntentLauncher.startActivityAsync(eylemler[ayar]);
}

export async function komutuYurut(komut: CihazKomutu): Promise<KomutSonucu> {
  if (Platform.OS !== "android" && !["SOHBET", "BILGI_SOR"].includes(komut.eylem)) {
    return basarisiz("Bu cihaz eylemi Android geliştirme derlemesinde kullanılabilir.", "DESTEKLENMIYOR");
  }

  try {
    switch (komut.eylem) {
      case "ARAMA_YAP": {
        const numara = komut.numara ?? await kisiNumarasiBul(komut.hedef);
        if (!numara) return basarisiz(`${komut.hedef} için telefon numarası bulunamadı veya kişiler izni verilmedi.`, "IZIN_GEREKLI");
        if (!(await onayAl("Arama onayı", `${komut.hedef} (${numara}) için telefon arayıcı açılsın mı?`))) return basarisiz("Arama kullanıcı tarafından iptal edildi.", "IPTAL");
        await Linking.openURL(`tel:${numara.replace(/\s/g, "")}`);
        return basarili(`${komut.hedef} için telefon arayıcı açıldı.`);
      }
      case "SMS_HAZIRLA": {
        const numara = await kisiNumarasiBul(komut.hedef);
        if (!numara) return basarisiz(`${komut.hedef} için telefon numarası bulunamadı veya kişiler izni verilmedi.`, "IZIN_GEREKLI");
        if (!(await onayAl("Mesaj onayı", `${komut.hedef} kişisine “${komut.mesaj}” taslağı hazırlansın mı? Mesaj siz göndermeden iletilmez.`))) return basarisiz("Mesaj taslağı iptal edildi.", "IPTAL");
        await Linking.openURL(`sms:${numara}?body=${encodeURIComponent(komut.mesaj)}`);
        return basarili("Mesajlar uygulamasında onaylı SMS taslağı açıldı.");
      }
      case "KAMERA_AC":
        router.push({ pathname: "/kamera", params: { facing: komut.kamera, mode: komut.mod } });
        return basarili("AKREP kamera görünümü açıldı.");
      case "FENER_AYARLA": {
        if (yerelModul?.setFlashlight) {
          await yerelModul.setFlashlight(komut.durum === "ac");
          return basarili(`El feneri ${komut.durum === "ac" ? "açıldı" : "kapatıldı"}.`);
        }
        router.push({ pathname: "/kamera", params: { torch: komut.durum === "ac" ? "1" : "0", facing: "arka" } });
        return basarili("El feneri, güvenli kamera görünümünde yönetiliyor.");
      }
      case "MEDYA_KONTROL":
        if (!yerelModul?.sendMediaCommand) return basarisiz("Diğer uygulamaların medya oturumunu yönetmek için AkrepDeviceActions yerel modülü gerekir.", "YEREL_MODUL_GEREKLI");
        await yerelModul.sendMediaCommand(komut.komut);
        return basarili(`Medya komutu uygulandı: ${komut.komut}.`);
      case "UYGULAMA_AC": {
        if (komut.sema && await Linking.canOpenURL(komut.sema)) await Linking.openURL(komut.sema);
        else if (komut.paket) await IntentLauncher.openApplication(komut.paket);
        else return basarisiz(`${komut.uygulama} için güvenli Android bağlantısı tanımlı değil.`, "DESTEKLENMIYOR");
        return basarili(`${komut.uygulama} açıldı.`);
      }
      case "SISTEM_AYARI_AC":
        await ayarEkraniniAc(komut.ayar);
        return basarili(`${komut.ayar} Android ayar ekranı açıldı.`);
      case "PARLAKLIK_AYARLA": {
        const izin = await Brightness.requestPermissionsAsync();
        if (izin.status !== "granted") return basarisiz("Parlaklık izni verilmedi.", "IZIN_GEREKLI");
        await Brightness.setBrightnessAsync(komut.seviye / 100);
        return basarili(`AKREP ekran parlaklığı yüzde ${komut.seviye} olarak ayarlandı.`);
      }
      case "SES_AYARLA":
        if (!yerelModul?.setMusicVolume) {
          await IntentLauncher.startActivityAsync("android.settings.SOUND_SETTINGS");
          return basarisiz("Android ses ayarı açıldı. Doğrudan seviye ayarı için AkrepDeviceActions yerel modülü gerekir.", "YEREL_MODUL_GEREKLI");
        }
        await yerelModul.setMusicVolume(komut.seviye);
        return basarili(`Medya sesi yüzde ${komut.seviye} olarak ayarlandı.`);
      case "BILGI_SOR":
        return basarisiz("Bu bilgi isteği etkin LLM sağlayıcısına gönderilmelidir.", "YEREL_MODUL_GEREKLI");
      case "SOHBET":
        return basarisiz("Bu sohbet iletisi etkin LLM sağlayıcısına gönderilmelidir.", "YEREL_MODUL_GEREKLI");
      case "DESTEKLENMIYOR":
        if (komut.onerilenAyar) await Linking.openSettings();
        return basarisiz(komut.neden, "DESTEKLENMIYOR");
    }
  } catch (hata) {
    const mesaj = hata instanceof Error ? hata.message : "Bilinmeyen Android hatası";
    return basarisiz(`Komut tamamlanamadı: ${mesaj}`);
  }
}
