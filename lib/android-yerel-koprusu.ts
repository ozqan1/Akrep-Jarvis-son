import { NativeModules, Platform } from "react-native";

export interface AkrepOverlayAyari {
  tema: "dark";
  avatar: "akrep" | "robot" | "insan" | "minimal";
  konum: "alt";
}

export interface UyandirmaServisiAyari {
  soz: "Hey Akrep" | "Akrep";
  kilitEkranindaCalis: boolean;
  bildirimBasligi: string;
}

interface AkrepAndroidNativeModule {
  overlayBaslat(ayar: AkrepOverlayAyari): Promise<void>;
  overlayDurdur(): Promise<void>;
  erisilebilirlikServisiAcikMi(): Promise<boolean>;
  uyandirmaServisiBaslat(ayar: UyandirmaServisiAyari): Promise<void>;
  uyandirmaServisiDurdur(): Promise<void>;
  kesintisizDinlemeyiBaslat(locale: "tr-TR"): Promise<void>;
  kesintisizDinlemeyiDurdur(): Promise<void>;
}

const nativeModule = NativeModules.AkrepAndroid as AkrepAndroidNativeModule | undefined;

export const androidYerelKoprusu = {
  kullanilabilir() {
    return Platform.OS === "android" && Boolean(nativeModule);
  },
  async overlayBaslat(ayar: AkrepOverlayAyari) {
    if (!nativeModule) throw new Error("AKREP overlay modülü bu derlemede yok. Publish/özel Android derlemesi gerekir.");
    await nativeModule.overlayBaslat(ayar);
  },
  async overlayDurdur() {
    await nativeModule?.overlayDurdur();
  },
  async erisilebilirlikServisiAcikMi() {
    return nativeModule ? nativeModule.erisilebilirlikServisiAcikMi() : false;
  },
  async uyandirmaServisiBaslat(ayar: UyandirmaServisiAyari) {
    if (!nativeModule) throw new Error("Uyandırma sözcüğü servisi Expo Go’da bulunmaz.");
    await nativeModule.uyandirmaServisiBaslat(ayar);
  },
  async uyandirmaServisiDurdur() {
    await nativeModule?.uyandirmaServisiDurdur();
  },
  async kesintisizDinlemeyiBaslat() {
    if (!nativeModule) throw new Error("Kesintisiz Android SpeechRecognizer köprüsü bu derlemede bulunmuyor.");
    await nativeModule.kesintisizDinlemeyiBaslat("tr-TR");
  },
  async kesintisizDinlemeyiDurdur() {
    await nativeModule?.kesintisizDinlemeyiDurdur();
  },
};
