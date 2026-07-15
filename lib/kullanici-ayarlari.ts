import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type AiSaglayicisi = "yerel-qwen" | "gemini" | "openai";
export type AvatarStili = "akrep" | "robot" | "insan" | "minimal";

export interface KullaniciAyarlari {
  saglayici: AiSaglayicisi;
  avatar: AvatarStili;
  uyandirmaSozcugu: boolean;
  miniAsistan: boolean;
}

const AYAR_ANAHTARI = "akrep:kullanici-ayarlari:v1";
const SAGLAYICI_ANAHTARLARI: Record<Exclude<AiSaglayicisi, "yerel-qwen">, string> = {
  gemini: "akrep.gemini.api-key",
  openai: "akrep.openai.api-key",
};

export const VARSAYILAN_KULLANICI_AYARLARI: KullaniciAyarlari = {
  saglayici: "yerel-qwen",
  avatar: "akrep",
  uyandirmaSozcugu: false,
  miniAsistan: false,
};

export async function kullaniciAyarlariAl(): Promise<KullaniciAyarlari> {
  const kayit = await AsyncStorage.getItem(AYAR_ANAHTARI);
  if (!kayit) return VARSAYILAN_KULLANICI_AYARLARI;
  try {
    return { ...VARSAYILAN_KULLANICI_AYARLARI, ...(JSON.parse(kayit) as Partial<KullaniciAyarlari>) };
  } catch {
    return VARSAYILAN_KULLANICI_AYARLARI;
  }
}

export async function kullaniciAyarlariKaydet(ayarlar: KullaniciAyarlari) {
  await AsyncStorage.setItem(AYAR_ANAHTARI, JSON.stringify(ayarlar));
}

export async function apiAnahtariVarMi(saglayici: Exclude<AiSaglayicisi, "yerel-qwen">) {
  if (Platform.OS === "web") return false;
  return Boolean(await SecureStore.getItemAsync(SAGLAYICI_ANAHTARLARI[saglayici]));
}

export async function apiAnahtariKaydet(
  saglayici: Exclude<AiSaglayicisi, "yerel-qwen">,
  deger: string,
) {
  if (Platform.OS === "web") throw new Error("API anahtarları web önizlemesinde saklanmaz. Android uygulamasını kullanın.");
  const temiz = deger.trim();
  if (temiz.length < 12) throw new Error("API anahtarı beklenen biçimde değil.");
  await SecureStore.setItemAsync(SAGLAYICI_ANAHTARLARI[saglayici], temiz, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function apiAnahtariSil(saglayici: Exclude<AiSaglayicisi, "yerel-qwen">) {
  if (Platform.OS === "web") return;
  await SecureStore.deleteItemAsync(SAGLAYICI_ANAHTARLARI[saglayici]);
}
