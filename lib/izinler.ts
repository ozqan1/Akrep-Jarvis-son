import { Camera } from "expo-camera";
import * as Contacts from "expo-contacts";
import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
} from "expo-audio";
import * as IntentLauncher from "expo-intent-launcher";
import * as Notifications from "expo-notifications";
import { Linking, PermissionsAndroid, Platform } from "react-native";

export type IzinDurumu = "verildi" | "reddedildi" | "ayar-gerekli" | "desteklenmiyor" | "bilinmiyor";

export type IzinKimligi =
  | "mikrofon"
  | "kamera"
  | "kisiler"
  | "arama"
  | "cagri-gecmisi"
  | "sms"
  | "bildirim"
  | "ekran-ustu"
  | "erisilebilirlik";

export type IzinTanimi = {
  id: IzinKimligi;
  baslik: string;
  aciklama: string;
  ikon: string;
  hassas: boolean;
  androidNotu?: string;
};

export const IZIN_TANIMLARI: IzinTanimi[] = [
  { id: "mikrofon", baslik: "Mikrofon", aciklama: "Bas-konuş komutlarını tek ses oturumunda kaydeder.", ikon: "mic", hassas: true },
  { id: "kamera", baslik: "Kamera", aciklama: "Fotoğraf çekme komutlarında kamera görünümünü açar.", ikon: "photo-camera", hassas: true },
  { id: "kisiler", baslik: "Kişiler", aciklama: "İsimle arama ve mesaj hazırlamak için rehberde arama yapar.", ikon: "contacts", hassas: true },
  { id: "arama", baslik: "Telefon Araması", aciklama: "Yalnızca açık kullanıcı onayından sonra arama başlatır.", ikon: "call", hassas: true },
  { id: "cagri-gecmisi", baslik: "Çağrı Geçmişi", aciklama: "Son arayan gibi komutlar için Android çağrı kaydını okur.", ikon: "history", hassas: true, androidNotu: "Google Play politikaları nedeniyle yalnızca uygun dağıtım ve varsayılan telefon uygulaması senaryolarında kullanılabilir." },
  { id: "sms", baslik: "SMS", aciklama: "Mesajı sistem SMS ekranında kullanıcı onayına sunar.", ikon: "sms", hassas: true },
  { id: "bildirim", baslik: "Bildirimler", aciklama: "Android 13 ve üzerindeki kalıcı servis durumunu gösterir.", ikon: "notifications", hassas: false },
  { id: "ekran-ustu", baslik: "Ekran Üstünde Göster", aciklama: "Mini asistan balonunun diğer uygulamaların üzerinde görünmesini sağlar.", ikon: "picture-in-picture-alt", hassas: true, androidNotu: "Bu özel yetki Android Ayarlar ekranından elle verilir." },
  { id: "erisilebilirlik", baslik: "Erişilebilirlik Servisi", aciklama: "Kullanıcı tarafından etkinleştirildiğinde desteklenen ekran eylemlerini yürütür.", ikon: "accessibility-new", hassas: true, androidNotu: "Uygulama bu yetkiyi kendiliğinden veremez; Android Ayarlar ekranı açılır." },
];

function izinSonucu(granted: boolean, canAskAgain = true): IzinDurumu {
  if (granted) return "verildi";
  return canAskAgain ? "reddedildi" : "ayar-gerekli";
}

async function androidRuntimeDurumu(permission: string): Promise<IzinDurumu> {
  if (Platform.OS !== "android") return "desteklenmiyor";
  const granted = await PermissionsAndroid.check(permission as never);
  return granted ? "verildi" : "reddedildi";
}

export async function izinDurumunuGetir(id: IzinKimligi): Promise<IzinDurumu> {
  if (Platform.OS === "web") return "desteklenmiyor";

  switch (id) {
    case "mikrofon": {
      const izin = await getRecordingPermissionsAsync();
      return izinSonucu(izin.granted, izin.canAskAgain);
    }
    case "kamera": {
      const izin = await Camera.getCameraPermissionsAsync();
      return izinSonucu(izin.granted, izin.canAskAgain);
    }
    case "kisiler": {
      const izin = await Contacts.getPermissionsAsync();
      return izinSonucu(izin.granted, izin.canAskAgain);
    }
    case "bildirim": {
      const izin = await Notifications.getPermissionsAsync();
      return izinSonucu(izin.granted, izin.canAskAgain);
    }
    case "arama":
      return androidRuntimeDurumu(PermissionsAndroid.PERMISSIONS.CALL_PHONE);
    case "cagri-gecmisi":
      return androidRuntimeDurumu(PermissionsAndroid.PERMISSIONS.READ_CALL_LOG);
    case "sms":
      return androidRuntimeDurumu(PermissionsAndroid.PERMISSIONS.SEND_SMS);
    case "ekran-ustu":
    case "erisilebilirlik":
      return Platform.OS === "android" ? "ayar-gerekli" : "desteklenmiyor";
  }
}

async function androidRuntimeIste(permission: string, baslik: string, aciklama: string): Promise<IzinDurumu> {
  if (Platform.OS !== "android") return "desteklenmiyor";
  const sonuc = await PermissionsAndroid.request(permission as never, {
    title: baslik,
    message: aciklama,
    buttonPositive: "İzin ver",
    buttonNegative: "İptal",
  });
  return sonuc === PermissionsAndroid.RESULTS.GRANTED ? "verildi" : sonuc === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ? "ayar-gerekli" : "reddedildi";
}

export async function izinIste(id: IzinKimligi): Promise<IzinDurumu> {
  switch (id) {
    case "mikrofon": {
      const izin = await requestRecordingPermissionsAsync();
      return izinSonucu(izin.granted, izin.canAskAgain);
    }
    case "kamera": {
      const izin = await Camera.requestCameraPermissionsAsync();
      return izinSonucu(izin.granted, izin.canAskAgain);
    }
    case "kisiler": {
      const izin = await Contacts.requestPermissionsAsync();
      return izinSonucu(izin.granted, izin.canAskAgain);
    }
    case "bildirim": {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("akrep-servis", {
          name: "AKREP Asistan Servisi",
          importance: Notifications.AndroidImportance.LOW,
        });
      }
      const izin = await Notifications.requestPermissionsAsync();
      return izinSonucu(izin.granted, izin.canAskAgain);
    }
    case "arama":
      return androidRuntimeIste(PermissionsAndroid.PERMISSIONS.CALL_PHONE, "Telefon araması izni", "AKREP yalnızca sizin açık onayınızdan sonra arama başlatır.");
    case "cagri-gecmisi":
      return androidRuntimeIste(PermissionsAndroid.PERMISSIONS.READ_CALL_LOG, "Çağrı geçmişi izni", "Son arayan gibi komutlarda çağrı geçmişi okunur.");
    case "sms":
      return androidRuntimeIste(PermissionsAndroid.PERMISSIONS.SEND_SMS, "SMS izni", "AKREP mesajı hazırlar ve göndermeden önce size gösterir.");
    case "ekran-ustu":
      if (Platform.OS === "android") {
        await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.MANAGE_OVERLAY_PERMISSION);
        return "ayar-gerekli";
      }
      return "desteklenmiyor";
    case "erisilebilirlik":
      if (Platform.OS === "android") {
        await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.ACCESSIBILITY_SETTINGS);
        return "ayar-gerekli";
      }
      return "desteklenmiyor";
  }
}

export async function uygulamaAyarlariniAc() {
  await Linking.openSettings();
}
