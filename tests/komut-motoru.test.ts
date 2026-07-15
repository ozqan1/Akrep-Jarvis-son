import { describe, expect, it } from "vitest";

import { komutuAyristir, turkceMetniNormallestir } from "../lib/komut-ayristirici";
import { KOMUT_KATALOG_OZETI, KOMUT_ORNEKLERI } from "../lib/komut-katalogu";
import { guvenliJsonIslevCagrisiniCoz, jsonIslevCagrisiniDogrula } from "../lib/komut-sozlesmesi";

describe("AKREP komut kataloğu", () => {
  it("en az 250 Türkçe örnek ve tüm ana kategorileri içerir", () => {
    expect(KOMUT_KATALOG_OZETI.toplam).toBeGreaterThanOrEqual(250);
    expect(KOMUT_ORNEKLERI).toHaveLength(KOMUT_KATALOG_OZETI.toplam);
    expect(KOMUT_KATALOG_OZETI.kategoriSayisi).toBe(11);
  });
});

describe("Türkçe komut ayrıştırıcı", () => {
  it("Türkçe büyük harfleri ve fazla boşlukları normalize eder", () => {
    expect(turkceMetniNormallestir("  İSTANBUL’da   Wi-Fi AÇ!  ")).toBe("istanbul'da wi-fi aç");
  });

  it("aramayı yüksek riskli ve onay gerektiren eylem olarak işaretler", () => {
    const komut = komutuAyristir("Annemi telefonla ara");
    expect(komut.eylem).toBe("ARAMA_YAP");
    expect(komut.risk).toBe("yuksek");
    expect(komut.onayGerekli).toBe(true);
  });

  it("SMS isteğini gönderim yerine onaylı taslak olarak hazırlar", () => {
    const komut = komutuAyristir("Ayşe'yi mesaj yaz yoldayım de");
    expect(komut.eylem).toBe("SMS_HAZIRLA");
    expect(komut.onayGerekli).toBe(true);
  });

  it.each([
    ["el fenerini kapat", "FENER_AYARLA"],
    ["Spotify uygulamasını başlat", "UYGULAMA_AC"],
    ["parlaklığı yüzde 75 yap", "PARLAKLIK_AYARLA"],
    ["müziği duraklat", "MEDYA_KONTROL"],
  ])("%s metnini %s eylemine dönüştürür", (metin, eylem) => {
    expect(komutuAyristir(metin).eylem).toBe(eylem);
  });
});

describe("JSON işlev çağrısı güvenliği", () => {
  const guvenliArama = {
    istekId: "akrep-test-1",
    hamMetin: "annemi ara",
    guven: 0.92,
    aciklama: "Arama onayı hazırlanacak.",
    eylem: "ARAMA_YAP",
    hedef: "annem",
    risk: "yuksek",
    onayGerekli: true,
  };

  it("kod bloğundaki geçerli JSON komutunu çözer", () => {
    const sonuc = guvenliJsonIslevCagrisiniCoz(`\`\`\`json\n${JSON.stringify(guvenliArama)}\n\`\`\``);
    expect(sonuc?.eylem).toBe("ARAMA_YAP");
  });

  it("arama onayını kaldıran model çıktısını reddeder", () => {
    expect(guvenliJsonIslevCagrisiniCoz(JSON.stringify({ ...guvenliArama, onayGerekli: false }))).toBeNull();
  });

  it("geçersiz parlaklık yüzdesini reddeder", () => {
    expect(() => jsonIslevCagrisiniDogrula({
      istekId: "akrep-test-2",
      hamMetin: "parlaklığı 180 yap",
      guven: 0.8,
      aciklama: "Parlaklık ayarlanacak.",
      eylem: "PARLAKLIK_AYARLA",
      seviye: 180,
      risk: "orta",
      onayGerekli: false,
    })).toThrow();
  });
});
