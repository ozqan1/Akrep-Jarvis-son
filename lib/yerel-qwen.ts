import type { LlamaContext } from "llama.rn";

import type { CihazKomutu } from "@/lib/komut-sozlesmesi";
import { guvenliJsonIslevCagrisiniCoz } from "@/lib/komut-sozlesmesi";
import { komutuAyristir } from "@/lib/komut-ayristirici";

export type YerelQwenDurumu = "kapali" | "yukleniyor" | "hazir" | "uretiyor" | "hata";

export type YerelQwenSonucu = {
  metin: string;
  komut: CihazKomutu;
  modelKullanildi: boolean;
};

type Dinleyici = (durum: YerelQwenDurumu, mesaj: string) => void;

const SISTEM_ISTEMI = `Sen AKREP Asistan'sın. Türkçe, kısa ve doğrudan yanıt ver.
Kullanıcı bir Android cihaz eylemi istediğinde yalnızca geçerli JSON üret.
JSON alanları: istekId, hamMetin, guven, aciklama, eylem, risk, onayGerekli ve eyleme özgü alanlar.
İzin atlatma, gizli işlem veya kullanıcı onayını kaldırma yapma.
Riskli arama ve SMS işlemlerinde onayGerekli her zaman true olmalıdır.
Bir cihaz eylemi değilse doğal Türkçe metinle yanıt ver.`;

let baglam: LlamaContext | null = null;
let durum: YerelQwenDurumu = "kapali";
let aktifModelUri: string | null = null;
const dinleyiciler = new Set<Dinleyici>();

function yayinla(yeniDurum: YerelQwenDurumu, mesaj: string) {
  durum = yeniDurum;
  dinleyiciler.forEach((dinleyici) => dinleyici(yeniDurum, mesaj));
}

function dosyaYolunuDuzelt(uri: string) {
  return uri.startsWith("file://") ? uri : `file://${uri}`;
}

export const yerelQwen = {
  aboneOl(dinleyici: Dinleyici) {
    dinleyiciler.add(dinleyici);
    return () => dinleyiciler.delete(dinleyici);
  },

  durum() {
    return { durum, modelUri: aktifModelUri };
  },

  async yukle(modelUri: string) {
    const normalizeUri = dosyaYolunuDuzelt(modelUri);
    if (baglam && aktifModelUri === normalizeUri) return;

    yayinla("yukleniyor", "Qwen yerel çıkarım motoruna yükleniyor…");
    try {
      if (baglam) await baglam.release();
      const { initLlama } = await import("llama.rn");
      baglam = await initLlama(
        {
          model: normalizeUri,
          n_ctx: 2048,
          n_batch: 256,
          n_threads: 4,
          n_gpu_layers: 99,
          use_mlock: false,
          flash_attn_type: "auto",
          cache_type_k: "q8_0",
          cache_type_v: "q8_0",
        },
        (ilerleme) => yayinla("yukleniyor", `Model yükleniyor: %${Math.round(ilerleme * 100)}`),
      );
      aktifModelUri = normalizeUri;
      yayinla("hazir", "Qwen çevrimdışı kullanıma hazır.");
    } catch (hata) {
      baglam = null;
      aktifModelUri = null;
      yayinla("hata", hata instanceof Error ? hata.message : "Yerel model yüklenemedi.");
      throw hata;
    }
  },

  async yanitla(hamMetin: string, parca?: (metin: string) => void): Promise<YerelQwenSonucu> {
    if (!baglam) {
      const komut = komutuAyristir(hamMetin);
      return { metin: komut.aciklama, komut, modelKullanildi: false };
    }

    yayinla("uretiyor", "Qwen yanıt hazırlıyor…");
    let akanMetin = "";
    try {
      const sonuc = await baglam.completion(
        {
          messages: [
            { role: "system", content: SISTEM_ISTEMI },
            { role: "user", content: hamMetin },
          ],
          n_predict: 220,
          temperature: 0.2,
          top_k: 30,
          top_p: 0.9,
          stop: ["<|im_end|>", "<|endoftext|>"],
        },
        (veri) => {
          akanMetin += veri.token;
          parca?.(akanMetin);
        },
      );

      const metin = sonuc.text.trim();
      const modelKomutu = guvenliJsonIslevCagrisiniCoz(metin);
      const komut = modelKomutu ?? komutuAyristir(hamMetin);
      yayinla("hazir", "Qwen çevrimdışı kullanıma hazır.");
      return {
        metin: modelKomutu ? modelKomutu.aciklama : metin || komut.aciklama,
        komut,
        modelKullanildi: true,
      };
    } catch (hata) {
      yayinla("hata", hata instanceof Error ? hata.message : "Yerel çıkarım tamamlanamadı.");
      const komut = komutuAyristir(hamMetin);
      return { metin: komut.aciklama, komut, modelKullanildi: false };
    }
  },

  async kapat() {
    if (baglam) await baglam.release();
    baglam = null;
    aktifModelUri = null;
    yayinla("kapali", "Yerel model kapatıldı.");
  },
};
