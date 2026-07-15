import { z } from "zod";

export const riskSeviyesiSemasi = z.enum(["dusuk", "orta", "yuksek"]);

const temel = {
  istekId: z.string().min(6),
  hamMetin: z.string().min(1),
  guven: z.number().min(0).max(1),
  aciklama: z.string().min(1),
};

export const cihazKomutuSemasi = z.discriminatedUnion("eylem", [
  z.object({ ...temel, eylem: z.literal("ARAMA_YAP"), hedef: z.string().min(1), numara: z.string().optional(), risk: z.literal("yuksek"), onayGerekli: z.literal(true) }),
  z.object({ ...temel, eylem: z.literal("SMS_HAZIRLA"), hedef: z.string().min(1), mesaj: z.string().min(1), risk: z.literal("yuksek"), onayGerekli: z.literal(true) }),
  z.object({ ...temel, eylem: z.literal("KAMERA_AC"), kamera: z.enum(["arka", "on"]), mod: z.enum(["fotograf", "video"]), risk: z.literal("orta"), onayGerekli: z.boolean() }),
  z.object({ ...temel, eylem: z.literal("FENER_AYARLA"), durum: z.enum(["ac", "kapat"]), risk: z.literal("orta"), onayGerekli: z.boolean() }),
  z.object({ ...temel, eylem: z.literal("MEDYA_KONTROL"), komut: z.enum(["oynat", "duraklat", "sonraki", "onceki"]), risk: z.literal("dusuk"), onayGerekli: z.literal(false) }),
  z.object({ ...temel, eylem: z.literal("UYGULAMA_AC"), uygulama: z.string().min(1), paket: z.string().optional(), sema: z.string().optional(), risk: z.literal("dusuk"), onayGerekli: z.literal(false) }),
  z.object({ ...temel, eylem: z.literal("SISTEM_AYARI_AC"), ayar: z.enum(["wifi", "bluetooth", "konum", "ucak-modu", "ses", "ekran", "pil", "erisilebilirlik", "bildirim"]), risk: z.literal("orta"), onayGerekli: z.boolean() }),
  z.object({ ...temel, eylem: z.literal("SES_AYARLA"), seviye: z.number().int().min(0).max(100), risk: z.literal("orta"), onayGerekli: z.boolean() }),
  z.object({ ...temel, eylem: z.literal("PARLAKLIK_AYARLA"), seviye: z.number().int().min(0).max(100), risk: z.literal("orta"), onayGerekli: z.boolean() }),
  z.object({ ...temel, eylem: z.literal("BILGI_SOR"), konu: z.string().min(1), risk: z.literal("dusuk"), onayGerekli: z.literal(false) }),
  z.object({ ...temel, eylem: z.literal("SOHBET"), yanit: z.string().min(1), risk: z.literal("dusuk"), onayGerekli: z.literal(false) }),
  z.object({ ...temel, eylem: z.literal("DESTEKLENMIYOR"), neden: z.string().min(1), onerilenAyar: z.string().optional(), risk: z.literal("dusuk"), onayGerekli: z.literal(false) }),
]);

export type CihazKomutu = z.infer<typeof cihazKomutuSemasi>;
export type CihazEylemi = CihazKomutu["eylem"];

export type KomutSonucu = {
  basarili: boolean;
  mesaj: string;
  kod:
    | "TAMAMLANDI"
    | "ONAY_BEKLIYOR"
    | "IPTAL"
    | "IZIN_GEREKLI"
    | "YEREL_MODUL_GEREKLI"
    | "DESTEKLENMIYOR"
    | "HATA";
};

export function jsonIslevCagrisiniDogrula(girdi: unknown): CihazKomutu {
  return cihazKomutuSemasi.parse(girdi);
}

export function guvenliJsonIslevCagrisiniCoz(metin: string): CihazKomutu | null {
  const temiz = metin.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return jsonIslevCagrisiniDogrula(JSON.parse(temiz));
  } catch {
    return null;
  }
}
