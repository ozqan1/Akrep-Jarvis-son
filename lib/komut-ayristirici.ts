import type { CihazKomutu } from "@/lib/komut-sozlesmesi";

const uygulamaPaketleri: Record<string, { ad: string; paket?: string; sema?: string }> = {
  whatsapp: { ad: "WhatsApp", paket: "com.whatsapp", sema: "whatsapp://" },
  spotify: { ad: "Spotify", paket: "com.spotify.music", sema: "spotify://" },
  youtube: { ad: "YouTube", paket: "com.google.android.youtube", sema: "vnd.youtube://" },
  haritalar: { ad: "Haritalar", paket: "com.google.android.apps.maps", sema: "geo:0,0" },
  chrome: { ad: "Chrome", paket: "com.android.chrome", sema: "googlechrome://" },
  gmail: { ad: "Gmail", paket: "com.google.android.gm", sema: "googlegmail://" },
  instagram: { ad: "Instagram", paket: "com.instagram.android", sema: "instagram://" },
  telegram: { ad: "Telegram", paket: "org.telegram.messenger", sema: "tg://" },
  netflix: { ad: "Netflix", paket: "com.netflix.mediaclient", sema: "nflx://" },
  ayarlar: { ad: "Ayarlar", paket: "com.android.settings" },
};

function idUret() {
  return `akrep-${Date.now().toString(36)}`;
}

export function turkceMetniNormallestir(metin: string): string {
  return metin
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/[’']/g, "'")
    .replace(/[^a-zçğıöşü0-9%'\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ortak(hamMetin: string, guven: number, aciklama: string) {
  return { istekId: idUret(), hamMetin, guven, aciklama };
}

function yuzdeBul(metin: string) {
  const eslesme = metin.match(/(?:yüzde\s*)?(\d{1,3})/);
  if (!eslesme) return null;
  return Math.max(0, Math.min(100, Number(eslesme[1])));
}

export function komutuAyristir(hamMetin: string): CihazKomutu {
  const metin = turkceMetniNormallestir(hamMetin);

  if (/(ara|aramayı başlat|telefonla ara)$/.test(metin) && !/ayar/.test(metin)) {
    const hedef = metin.replace(/\s*(telefonla\s+)?ara(mayı başlat)?$/, "").trim();
    return { ...ortak(hamMetin, 0.91, `${hedef} için arama onayı hazırlanacak.`), eylem: "ARAMA_YAP", hedef, risk: "yuksek", onayGerekli: true };
  }

  if (/(mesaj|sms)/.test(metin) && /(yaz|hazırla|gönder|de)/.test(metin)) {
    const hedef = metin.split(/\s+(?:mesaj|sms)/)[0]?.trim() || "alıcı";
    const mesaj = metin.match(/(?:de|yaz|hazırla|gönder)\s+(.+)$/)?.[1] ?? "Mesaj içeriği belirtilmedi";
    return { ...ortak(hamMetin, 0.84, `${hedef} için SMS taslağı hazırlanacak.`), eylem: "SMS_HAZIRLA", hedef, mesaj, risk: "yuksek", onayGerekli: true };
  }

  if (/(kamera|fotoğraf|selfie|video)/.test(metin) && /(aç|çek|başlat|hazırla)/.test(metin)) {
    return { ...ortak(hamMetin, 0.94, "Kamera görünümü açılacak."), eylem: "KAMERA_AC", kamera: /(ön|selfie)/.test(metin) ? "on" : "arka", mod: /video/.test(metin) ? "video" : "fotograf", risk: "orta", onayGerekli: false };
  }

  if (/(fener|ışık)/.test(metin)) {
    const durum = /(kapat|söndür)/.test(metin) ? "kapat" : "ac";
    return { ...ortak(hamMetin, 0.96, `El feneri ${durum === "ac" ? "açılacak" : "kapatılacak"}.`), eylem: "FENER_AYARLA", durum, risk: "orta", onayGerekli: false };
  }

  if (/(müzi|medya|şarkı|parça|çal)/.test(metin)) {
    const komut = /(sonraki|sıradaki)/.test(metin) ? "sonraki" : /(önceki|geri)/.test(metin) ? "onceki" : /(duraklat|durdur|beklet|ara ver)/.test(metin) ? "duraklat" : "oynat";
    return { ...ortak(hamMetin, 0.88, "Medya kontrol komutu yerel Android katmanına iletilecek."), eylem: "MEDYA_KONTROL", komut, risk: "dusuk", onayGerekli: false };
  }

  const uygulamaAnahtari = Object.keys(uygulamaPaketleri).find((ad) => metin.includes(ad));
  if (uygulamaAnahtari && /(aç|başlat|git)/.test(metin)) {
    const uygulama = uygulamaPaketleri[uygulamaAnahtari];
    return { ...ortak(hamMetin, 0.93, `${uygulama.ad} açılacak.`), eylem: "UYGULAMA_AC", uygulama: uygulama.ad, paket: uygulama.paket, sema: uygulama.sema, risk: "dusuk", onayGerekli: false };
  }

  const sistemAyarlari: [RegExp, "wifi" | "bluetooth" | "konum" | "ucak-modu" | "ses" | "ekran" | "pil" | "erisilebilirlik" | "bildirim"][] = [
    [/wi-?fi/, "wifi"], [/bluetooth/, "bluetooth"], [/konum|gps/, "konum"], [/uçak/, "ucak-modu"], [/ses/, "ses"], [/ekran/, "ekran"], [/pil|batarya/, "pil"], [/erişilebilirlik/, "erisilebilirlik"], [/bildirim/, "bildirim"],
  ];
  const ayar = sistemAyarlari.find(([kalip]) => kalip.test(metin))?.[1];
  if (ayar && /(ayar|menü|yönet|seçenek|aç|kapat)/.test(metin)) {
    return { ...ortak(hamMetin, 0.87, `${ayar} Android ayar ekranı açılacak.`), eylem: "SISTEM_AYARI_AC", ayar, risk: "orta", onayGerekli: false };
  }

  if (/ses/.test(metin) && /(yüzde|seviye|ayarla|yap)/.test(metin)) {
    const seviye = yuzdeBul(metin);
    if (seviye !== null) return { ...ortak(hamMetin, 0.9, `Ses seviyesi yüzde ${seviye} olarak ayarlanacak.`), eylem: "SES_AYARLA", seviye, risk: "orta", onayGerekli: false };
  }

  if (/parlaklı/.test(metin)) {
    const seviye = yuzdeBul(metin);
    if (seviye !== null) return { ...ortak(hamMetin, 0.9, `Parlaklık yüzde ${seviye} olarak ayarlanacak.`), eylem: "PARLAKLIK_AYARLA", seviye, risk: "orta", onayGerekli: false };
  }

  if (/(hava|saat|tarih|takvim|trafik|pilim|konumum|bağlantı)/.test(metin)) {
    return { ...ortak(hamMetin, 0.76, "Bilgi isteği asistan sağlayıcısına yönlendirilecek."), eylem: "BILGI_SOR", konu: hamMetin, risk: "dusuk", onayGerekli: false };
  }

  return { ...ortak(hamMetin, 0.62, "Girdi cihaz eylemi değil; sohbet olarak ele alınacak."), eylem: "SOHBET", yanit: hamMetin, risk: "dusuk", onayGerekli: false };
}
