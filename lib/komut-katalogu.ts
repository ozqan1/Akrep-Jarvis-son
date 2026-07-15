export type KomutKategorisi =
  | "arama"
  | "sms"
  | "kamera"
  | "fener"
  | "medya"
  | "uygulama"
  | "sistem"
  | "ses"
  | "parlaklik"
  | "bilgi"
  | "sohbet";

export type KomutOrnegi = {
  kategori: KomutKategorisi;
  metin: string;
  etiket: string;
};

const kisiler = ["annemi", "babamı", "Nebi'yi", "Ayşe'yi", "Mehmet'i", "Ali'yi", "ofisi", "eşimi", "kardeşimi", "doktoru"];
const uygulamalar = ["WhatsApp", "Spotify", "YouTube", "Haritalar", "Kamera", "Chrome", "Gmail", "Takvim", "Mesajlar", "Telefon", "Instagram", "X", "Telegram", "Netflix", "Galeri", "Ayarlar", "Hesap Makinesi", "Saat", "Dosyalar", "Notlar"];
const ayarlar = ["wifi", "bluetooth", "konum", "uçak modu", "ses", "ekran", "pil", "erişilebilirlik", "bildirim"];
const seviyeler = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

function carpim(kategori: KomutKategorisi, etiket: string, degerler: string[], kaliplar: ((deger: string) => string)[]): KomutOrnegi[] {
  return degerler.flatMap((deger) => kaliplar.map((kalip) => ({ kategori, etiket, metin: kalip(deger) })));
}

export const KOMUT_ORNEKLERI: KomutOrnegi[] = [
  ...carpim("arama", "ARAMA_YAP", kisiler, [
    (kisi) => `${kisi} ara`,
    (kisi) => `${kisi} telefonla ara`,
    (kisi) => `${kisi} aramayı başlat`,
  ]),
  ...carpim("sms", "SMS_HAZIRLA", kisiler, [
    (kisi) => `${kisi} mesaj yazıyorum yoldayım de`,
    (kisi) => `${kisi} SMS hazırla biraz gecikeceğim`,
    (kisi) => `${kisi} mesaj gönder toplantı başladı`,
  ]),
  ...[
    "kamerayı aç", "arka kamerayı aç", "ön kamerayı aç", "fotoğraf çek", "selfie çek", "video modunu aç", "kamera ile çekim yap", "ön kamerada fotoğraf hazırla",
  ].map((metin) => ({ kategori: "kamera" as const, etiket: "KAMERA_AC", metin })),
  ...[
    "el fenerini aç", "feneri yak", "ışığı aç", "telefon ışığını aç", "el fenerini kapat", "feneri söndür", "ışığı kapat", "telefon ışığını kapat",
  ].map((metin) => ({ kategori: "fener" as const, etiket: "FENER_AYARLA", metin })),
  ...[
    "müziği oynat", "müziği duraklat", "şarkıyı oynat", "şarkıyı durdur", "sonraki şarkı", "önceki şarkı", "sonraki parçaya geç", "önceki parçaya dön",
    "medyayı oynat", "medyayı duraklat", "oynatmaya devam et", "çalana ara ver", "sıradaki parçayı aç", "bir önceki parçayı aç", "müziği başlat", "müziği beklet",
  ].map((metin) => ({ kategori: "medya" as const, etiket: "MEDYA_KONTROL", metin })),
  ...carpim("uygulama", "UYGULAMA_AC", uygulamalar, [
    (uygulama) => `${uygulama} aç`,
    (uygulama) => `${uygulama} uygulamasını başlat`,
    (uygulama) => `${uygulama} uygulamasına git`,
  ]),
  ...carpim("sistem", "SISTEM_AYARI_AC", ayarlar, [
    (ayar) => `${ayar} ayarlarını aç`,
    (ayar) => `${ayar} menüsüne git`,
    (ayar) => `${ayar} yönetimini göster`,
    (ayar) => `${ayar} seçeneklerini aç`,
  ]),
  ...seviyeler.flatMap((seviye) => [
    { kategori: "ses" as const, etiket: "SES_AYARLA", metin: `sesi yüzde ${seviye} yap` },
    { kategori: "ses" as const, etiket: "SES_AYARLA", metin: `ses seviyesini ${seviye} ayarla` },
  ]),
  ...seviyeler.flatMap((seviye) => [
    { kategori: "parlaklik" as const, etiket: "PARLAKLIK_AYARLA", metin: `parlaklığı yüzde ${seviye} yap` },
    { kategori: "parlaklik" as const, etiket: "PARLAKLIK_AYARLA", metin: `ekran parlaklığını ${seviye} ayarla` },
  ]),
  ...["hava nasıl", "bugün yağmur var mı", "saat kaç", "bugün ayın kaçı", "yarın hava nasıl", "pilim kaç", "bağlantım var mı", "konumum neresi", "güncel trafiği göster", "takvimimde ne var"].map((metin) => ({ kategori: "bilgi" as const, etiket: "BILGI_SOR", metin })),
  ...["nasılsın", "kendini tanıt", "bana bir öneri ver", "günümü planla", "odaklanmama yardım et", "kısa bir motivasyon sözü söyle", "bir fikir üret", "bunu açıkla", "özet çıkar", "benimle sohbet et"].map((metin) => ({ kategori: "sohbet" as const, etiket: "SOHBET", metin })),
];

export const KOMUT_KATALOG_OZETI = {
  toplam: KOMUT_ORNEKLERI.length,
  kategoriSayisi: new Set(KOMUT_ORNEKLERI.map((ornek) => ornek.kategori)).size,
  kategoriler: Object.entries(
    KOMUT_ORNEKLERI.reduce<Record<string, number>>((toplam, ornek) => {
      toplam[ornek.kategori] = (toplam[ornek.kategori] ?? 0) + 1;
      return toplam;
    }, {}),
  ).map(([kategori, adet]) => ({ kategori, adet })),
};

if (KOMUT_ORNEKLERI.length < 250) {
  throw new Error("AKREP komut kataloğu en az 250 örnek içermelidir.");
}
