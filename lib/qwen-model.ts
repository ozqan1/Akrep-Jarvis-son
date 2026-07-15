import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

export const QWEN_MODEL = {
  id: "qwen2.5-1.5b-instruct-q4_k_m",
  ad: "Qwen2.5 1.5B Instruct",
  quantization: "Q4_K_M",
  lisans: "Apache-2.0",
  kaynak: "Qwen/Qwen2.5-1.5B-Instruct-GGUF",
  dosya: "qwen2.5-1.5b-instruct-q4_k_m.gguf",
  url: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf?download=true",
  yaklasikBoyut: 1_100_000_000,
} as const;

const KLASOR = `${FileSystem.documentDirectory}models/`;
export const QWEN_MODEL_URI = `${KLASOR}${QWEN_MODEL.dosya}`;
const GECICI_URI = `${QWEN_MODEL_URI}.download`;
const DEVAM_ANAHTARI = "akrep:qwen-download-resume-v1";

type ModelDurumu = "eksik" | "indiriliyor" | "duraklatildi" | "dogrulaniyor" | "hazir" | "hata";

export interface QwenModelState {
  durum: ModelDurumu;
  ilerleme: number;
  indirilenBayt: number;
  toplamBayt: number;
  mesaj: string;
  uri?: string;
}

type Dinleyici = (durum: QwenModelState) => void;

type KayitliIndirme = {
  url: string;
  fileUri: string;
  options: FileSystem.DownloadOptions;
  resumeData?: string;
};

let durum: QwenModelState = {
  durum: "eksik",
  ilerleme: 0,
  indirilenBayt: 0,
  toplamBayt: QWEN_MODEL.yaklasikBoyut,
  mesaj: "Model henüz indirilmedi.",
};
let indirme: FileSystem.DownloadResumable | null = null;
const dinleyiciler = new Set<Dinleyici>();

function yayinla(yeniDurum: Partial<QwenModelState>) {
  durum = { ...durum, ...yeniDurum };
  dinleyiciler.forEach((dinleyici) => dinleyici(durum));
}

async function klasoruHazirla() {
  const bilgi = await FileSystem.getInfoAsync(KLASOR);
  if (!bilgi.exists) await FileSystem.makeDirectoryAsync(KLASOR, { intermediates: true });
}

async function ggufDogrula(uri: string): Promise<boolean> {
  const bilgi = await FileSystem.getInfoAsync(uri);
  if (!bilgi.exists) return false;
  if (bilgi.isDirectory || bilgi.size < 800_000_000) return false;
  const ilkDortBayt = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
    position: 0,
    length: 4,
  });
  return ilkDortBayt === "R0dVRg==";
}

function ilerlemeGeriCagirimi(veri: FileSystem.DownloadProgressData) {
  const toplam = veri.totalBytesExpectedToWrite || QWEN_MODEL.yaklasikBoyut;
  yayinla({
    durum: "indiriliyor",
    indirilenBayt: veri.totalBytesWritten,
    toplamBayt: toplam,
    ilerleme: Math.min(1, veri.totalBytesWritten / toplam),
    mesaj: "Qwen modeli cihaza indiriliyor…",
  });
}

async function tamamla(sonuc: FileSystem.FileSystemDownloadResult | undefined) {
  if (!sonuc?.uri) throw new Error("İndirme sonucu alınamadı.");
  yayinla({ durum: "dogrulaniyor", mesaj: "GGUF dosyası doğrulanıyor…" });
  if (!(await ggufDogrula(sonuc.uri))) throw new Error("İndirilen dosya geçerli bir GGUF modeli değil.");
  const asilDosya = await FileSystem.getInfoAsync(QWEN_MODEL_URI);
  if (asilDosya.exists) await FileSystem.deleteAsync(QWEN_MODEL_URI, { idempotent: true });
  await FileSystem.moveAsync({ from: sonuc.uri, to: QWEN_MODEL_URI });
  await AsyncStorage.removeItem(DEVAM_ANAHTARI);
  indirme = null;
  const bilgi = await FileSystem.getInfoAsync(QWEN_MODEL_URI);
  if (!bilgi.exists) throw new Error("Model dosyası taşındıktan sonra bulunamadı.");
  yayinla({ durum: "hazir", ilerleme: 1, indirilenBayt: bilgi.size, toplamBayt: bilgi.size, mesaj: "Qwen modeli çevrimdışı kullanıma hazır.", uri: QWEN_MODEL_URI });
}

export const qwenModelYoneticisi = {
  aboneOl(dinleyici: Dinleyici) {
    dinleyiciler.add(dinleyici);
    dinleyici(durum);
    return () => dinleyiciler.delete(dinleyici);
  },
  durumAl() {
    return durum;
  },
  async denetle() {
    await klasoruHazirla();
    if (await ggufDogrula(QWEN_MODEL_URI)) {
      const bilgi = await FileSystem.getInfoAsync(QWEN_MODEL_URI);
      if (bilgi.exists) {
        yayinla({ durum: "hazir", ilerleme: 1, indirilenBayt: bilgi.size, toplamBayt: bilgi.size, mesaj: "Qwen modeli çevrimdışı kullanıma hazır.", uri: QWEN_MODEL_URI });
        return;
      }
    }
    const kayitli = await AsyncStorage.getItem(DEVAM_ANAHTARI);
    if (kayitli) yayinla({ durum: "duraklatildi", mesaj: "Yarım kalan model indirmesi devam ettirilebilir." });
    else yayinla({ durum: "eksik", ilerleme: 0, mesaj: "Model henüz indirilmedi.", uri: undefined });
  },
  async indir() {
    await klasoruHazirla();
    const kayitliMetin = await AsyncStorage.getItem(DEVAM_ANAHTARI);
    const kayitli = kayitliMetin ? JSON.parse(kayitliMetin) as KayitliIndirme : null;
    indirme = kayitli
      ? new FileSystem.DownloadResumable(kayitli.url, kayitli.fileUri, kayitli.options, ilerlemeGeriCagirimi, kayitli.resumeData)
      : FileSystem.createDownloadResumable(QWEN_MODEL.url, GECICI_URI, {}, ilerlemeGeriCagirimi);
    yayinla({ durum: "indiriliyor", mesaj: kayitli ? "Qwen indirmesi devam ediyor…" : "Qwen modeli cihaza indiriliyor…" });
    try {
      await tamamla(await indirme.downloadAsync());
    } catch (hata) {
      const mesaj = hata instanceof Error ? hata.message : "Model indirilemedi.";
      indirme = null;
      yayinla({ durum: "hata", mesaj });
      throw hata;
    }
  },
  async duraklat() {
    if (!indirme) return;
    const kayit = await indirme.pauseAsync();
    await AsyncStorage.setItem(DEVAM_ANAHTARI, JSON.stringify(kayit));
    yayinla({ durum: "duraklatildi", mesaj: "Model indirmesi duraklatıldı; daha sonra devam edebilirsiniz." });
  },
  async sil() {
    if (indirme) {
      try { await indirme.pauseAsync(); } catch { /* Etkin indirme zaten durmuş olabilir. */ }
      indirme = null;
    }
    await Promise.all([
      FileSystem.deleteAsync(QWEN_MODEL_URI, { idempotent: true }),
      FileSystem.deleteAsync(GECICI_URI, { idempotent: true }),
      AsyncStorage.removeItem(DEVAM_ANAHTARI),
    ]);
    yayinla({ durum: "eksik", ilerleme: 0, indirilenBayt: 0, toplamBayt: QWEN_MODEL.yaklasikBoyut, mesaj: "Model cihazdan silindi.", uri: undefined });
  },
};
