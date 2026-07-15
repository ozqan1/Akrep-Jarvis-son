import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useAkrepTts } from "@/hooks/use-akrep-tts";
import {
  apiAnahtariKaydet,
  apiAnahtariSil,
  apiAnahtariVarMi,
  kullaniciAyarlariAl,
  kullaniciAyarlariKaydet,
  VARSAYILAN_KULLANICI_AYARLARI,
  type AiSaglayicisi,
  type AvatarStili,
  type KullaniciAyarlari,
} from "@/lib/kullanici-ayarlari";

const AVATARLAR: { id: AvatarStili; ad: string; ikon: keyof typeof MaterialIcons.glyphMap; renk: string }[] = [
  { id: "akrep", ad: "AKREP", ikon: "bug-report", renk: "#52F58A" },
  { id: "robot", ad: "Robot", ikon: "smart-toy", renk: "#FFD34E" },
  { id: "insan", ad: "İnsan", ikon: "face", renk: "#FF7276" },
  { id: "minimal", ad: "Minimal", ikon: "blur-on", renk: "#9EB7FF" },
];

const SAGLAYICILAR: { id: AiSaglayicisi; ad: string; not: string }[] = [
  { id: "yerel-qwen", ad: "Yerel Qwen", not: "Varsayılan · çevrimdışı · cihaz içinde" },
  { id: "gemini", ad: "Gemini", not: "İsteğe bağlı · internet gerekir" },
  { id: "openai", ad: "OpenAI", not: "İsteğe bağlı · internet gerekir" },
];

export default function AyarlarScreen() {
  const router = useRouter();
  const { turkceSesler, ayarlar: tts, ayarlariGuncelle } = useAkrepTts();
  const [ayarlar, setAyarlar] = useState<KullaniciAyarlari>(VARSAYILAN_KULLANICI_AYARLARI);
  const [anahtarlar, setAnahtarlar] = useState({ gemini: "", openai: "" });
  const [anahtarDurumu, setAnahtarDurumu] = useState({ gemini: false, openai: false });

  useEffect(() => {
    void (async () => {
      const [kayitli, gemini, openai] = await Promise.all([
        kullaniciAyarlariAl(),
        apiAnahtariVarMi("gemini"),
        apiAnahtariVarMi("openai"),
      ]);
      setAyarlar(kayitli);
      setAnahtarDurumu({ gemini, openai });
    })();
  }, []);

  const ayarGuncelle = useCallback((yeni: Partial<KullaniciAyarlari>) => {
    setAyarlar((onceki) => {
      const guncel = { ...onceki, ...yeni };
      void kullaniciAyarlariKaydet(guncel);
      return guncel;
    });
  }, []);

  const anahtarKaydet = useCallback(async (saglayici: "gemini" | "openai") => {
    try {
      await apiAnahtariKaydet(saglayici, anahtarlar[saglayici]);
      setAnahtarDurumu((onceki) => ({ ...onceki, [saglayici]: true }));
      setAnahtarlar((onceki) => ({ ...onceki, [saglayici]: "" }));
      Alert.alert("Güvenli depoya kaydedildi", `${saglayici === "gemini" ? "Gemini" : "OpenAI"} anahtarı Android Keystore ile korunan alana kaydedildi.`);
    } catch (hata) {
      Alert.alert("Anahtar kaydedilemedi", hata instanceof Error ? hata.message : "Bilinmeyen hata");
    }
  }, [anahtarlar]);

  const anahtarSil = useCallback(async (saglayici: "gemini" | "openai") => {
    await apiAnahtariSil(saglayici);
    setAnahtarDurumu((onceki) => ({ ...onceki, [saglayici]: false }));
    if (ayarlar.saglayici === saglayici) ayarGuncelle({ saglayici: "yerel-qwen" });
  }, [ayarGuncelle, ayarlar.saglayici]);

  const sesler = useMemo(() => turkceSesler.slice(0, 6), [turkceSesler]);

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} containerClassName="bg-background">
      <ScrollView style={styles.kapsayici} contentContainerStyle={styles.icerik} keyboardShouldPersistTaps="handled">
        <View style={styles.baslikSatiri}>
          <Pressable accessibilityRole="button" accessibilityLabel="Geri dön" onPress={() => router.back()} style={({ pressed }) => [styles.geri, pressed && styles.basili]}>
            <MaterialIcons name="arrow-back" size={22} color="#F2FFF7" />
          </Pressable>
          <View style={styles.baslikMetinleri}>
            <Text style={styles.ustEtiket}>KİŞİSELLEŞTİRME</Text>
            <Text style={styles.baslik}>Ayarlar</Text>
          </View>
        </View>

        <AyarBolumu ikon="record-voice-over" renk="#52F58A" baslik="Ses ve Konuşma" aciklama="Android sistem TTS motoru">
          <AyarSatiri etiket="Otomatik seslendir">
            <Switch value={tts.otomatikKonus} onValueChange={(deger) => ayarlariGuncelle({ otomatikKonus: deger })} trackColor={{ false: "#24342B", true: "#287548" }} thumbColor={tts.otomatikKonus ? "#52F58A" : "#7C9184"} />
          </AyarSatiri>
          <DegerAyari etiket="Hız" deger={tts.rate} min={0.6} max={1.4} adim={0.05} onChange={(rate) => ayarlariGuncelle({ rate })} />
          <DegerAyari etiket="Perde" deger={tts.pitch} min={0.5} max={1.5} adim={0.05} onChange={(pitch) => ayarlariGuncelle({ pitch })} />
          <Text style={styles.altBaslik}>Türkçe ses profili</Text>
          <View style={styles.secimIzgarasi}>
            {(sesler.length ? sesler : [{ identifier: "sistem", name: "Sistem varsayılanı", language: "tr-TR", quality: "Default" as const }]).map((ses) => {
              const secili = (tts.voiceId ?? "sistem") === ses.identifier;
              return (
                <Pressable key={ses.identifier} onPress={() => ayarlariGuncelle({ voiceId: ses.identifier === "sistem" ? null : ses.identifier })} style={({ pressed }) => [styles.sesSecim, secili && styles.sesSecimAktif, pressed && styles.basili]}>
                  <MaterialIcons name={secili ? "radio-button-checked" : "radio-button-unchecked"} size={17} color={secili ? "#52F58A" : "#668A74"} />
                  <Text numberOfLines={1} style={[styles.sesMetni, secili && styles.sesMetniAktif]}>{ses.name || ses.language}</Text>
                </Pressable>
              );
            })}
          </View>
        </AyarBolumu>

        <AyarBolumu ikon="face" renk="#FFD34E" baslik="Avatar Stüdyosu" aciklama="Hazır durum animasyonları ve mini asistan görünümü">
          <View style={styles.avatarIzgara}>
            {AVATARLAR.map((avatar) => {
              const secili = ayarlar.avatar === avatar.id;
              return (
                <Pressable key={avatar.id} onPress={() => ayarGuncelle({ avatar: avatar.id })} style={({ pressed }) => [styles.avatarKarti, secili && { borderColor: avatar.renk, backgroundColor: `${avatar.renk}15` }, pressed && styles.basili]}>
                  <MaterialIcons name={avatar.ikon} size={25} color={avatar.renk} />
                  <Text style={styles.avatarMetni}>{avatar.ad}</Text>
                </Pressable>
              );
            })}
          </View>
          <AyarSatiri etiket="Mini asistan">
            <Switch value={ayarlar.miniAsistan} onValueChange={(miniAsistan) => ayarGuncelle({ miniAsistan })} trackColor={{ false: "#24342B", true: "#7B6724" }} thumbColor={ayarlar.miniAsistan ? "#FFD34E" : "#7C9184"} />
          </AyarSatiri>
          <AyarSatiri etiket="“Hey Akrep” uyandırma sözcüğü">
            <Switch value={ayarlar.uyandirmaSozcugu} onValueChange={(uyandirmaSozcugu) => ayarGuncelle({ uyandirmaSozcugu })} trackColor={{ false: "#24342B", true: "#287548" }} thumbColor={ayarlar.uyandirmaSozcugu ? "#52F58A" : "#7C9184"} />
          </AyarSatiri>
          <Text style={styles.servisNotu}>Arka planda ve kilit ekranında dinleme yalnızca görünür mikrofon bildirimiyle, açık izninizden sonra ve özel Android derlemesinde etkinleşir.</Text>
          <Pressable onPress={() => router.push("/mini-asistan")} style={({ pressed }) => [styles.onizlemeButonu, pressed && styles.basili]}>
            <MaterialIcons name="picture-in-picture-alt" size={18} color="#FFD34E" />
            <Text style={styles.onizlemeMetni}>Mini görünümü önizle</Text>
          </Pressable>
        </AyarBolumu>

        <AyarBolumu ikon="hub" renk="#FF7276" baslik="AI Sağlayıcısı" aciklama="Yerel Qwen önceliklidir; bulut servisleri isteğe bağlıdır">
          {SAGLAYICILAR.map((saglayici) => {
            const secili = ayarlar.saglayici === saglayici.id;
            return (
              <Pressable key={saglayici.id} onPress={() => ayarGuncelle({ saglayici: saglayici.id })} style={({ pressed }) => [styles.saglayiciSatiri, secili && styles.saglayiciAktif, pressed && styles.basili]}>
                <MaterialIcons name={secili ? "check-circle" : "radio-button-unchecked"} size={19} color={secili ? "#52F58A" : "#668A74"} />
                <View style={styles.saglayiciMetinleri}><Text style={styles.saglayiciAdi}>{saglayici.ad}</Text><Text style={styles.saglayiciNot}>{saglayici.not}</Text></View>
              </Pressable>
            );
          })}

          {(["gemini", "openai"] as const).map((saglayici) => (
            <View key={saglayici} style={styles.anahtarAlani}>
              <View style={styles.anahtarBaslik}>
                <Text style={styles.altBaslik}>{saglayici === "gemini" ? "Gemini" : "OpenAI"} API anahtarı</Text>
                <Text style={[styles.anahtarDurum, anahtarDurumu[saglayici] && styles.anahtarHazir]}>{anahtarDurumu[saglayici] ? "Kayıtlı" : "Kayıtlı değil"}</Text>
              </View>
              <View style={styles.girdiSatiri}>
                <TextInput
                  value={anahtarlar[saglayici]}
                  onChangeText={(deger) => setAnahtarlar((onceki) => ({ ...onceki, [saglayici]: deger }))}
                  placeholder={Platform.OS === "web" ? "Yalnızca Android uygulamasında" : "Anahtarı güvenli depoya kaydet"}
                  placeholderTextColor="#557262"
                  secureTextEntry
                  editable={Platform.OS !== "web"}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.girdi}
                />
                <Pressable accessibilityLabel="API anahtarını kaydet" onPress={() => anahtarKaydet(saglayici)} style={({ pressed }) => [styles.kaydetButonu, pressed && styles.basili]}><MaterialIcons name="lock" size={18} color="#031109" /></Pressable>
                {anahtarDurumu[saglayici] ? <Pressable accessibilityLabel="API anahtarını sil" onPress={() => anahtarSil(saglayici)} style={({ pressed }) => [styles.silButonu, pressed && styles.basili]}><MaterialIcons name="delete-outline" size={18} color="#FF9A9F" /></Pressable> : null}
              </View>
            </View>
          ))}
        </AyarBolumu>

        <View style={styles.guvenlikNotu}>
          <MaterialIcons name="verified-user" size={19} color="#52F58A" />
          <Text style={styles.guvenlikMetni}>API anahtarları Android Keystore ile korunan SecureStore alanında tutulur; uygulama günlüklerinde veya AsyncStorage içinde gösterilmez.</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function AyarBolumu({ ikon, renk, baslik, aciklama, children }: { ikon: keyof typeof MaterialIcons.glyphMap; renk: string; baslik: string; aciklama: string; children: React.ReactNode }) {
  return <View style={styles.bolum}><View style={styles.bolumBaslik}><View style={[styles.ikon, { backgroundColor: `${renk}16`, borderColor: `${renk}55` }]}><MaterialIcons name={ikon} size={23} color={renk} /></View><View style={styles.baslikMetinleri}><Text style={styles.kartBaslik}>{baslik}</Text><Text style={styles.kartAciklama}>{aciklama}</Text></View></View>{children}</View>;
}

function AyarSatiri({ etiket, children }: { etiket: string; children: React.ReactNode }) {
  return <View style={styles.ayarSatiri}><Text style={styles.ayarEtiket}>{etiket}</Text>{children}</View>;
}

function DegerAyari({ etiket, deger, min, max, adim, onChange }: { etiket: string; deger: number; min: number; max: number; adim: number; onChange: (deger: number) => void }) {
  return <AyarSatiri etiket={etiket}><View style={styles.degerKontrol}><Pressable accessibilityLabel={`${etiket} azalt`} onPress={() => onChange(Math.max(min, Number((deger - adim).toFixed(2))))} style={({ pressed }) => [styles.degerButon, pressed && styles.basili]}><MaterialIcons name="remove" size={17} color="#F2FFF7" /></Pressable><Text style={styles.degerMetni}>{deger.toFixed(2)}×</Text><Pressable accessibilityLabel={`${etiket} artır`} onPress={() => onChange(Math.min(max, Number((deger + adim).toFixed(2))))} style={({ pressed }) => [styles.degerButon, pressed && styles.basili]}><MaterialIcons name="add" size={17} color="#F2FFF7" /></Pressable></View></AyarSatiri>;
}

const styles = StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: "#030806" },
  icerik: { padding: 18, gap: 16, paddingBottom: 44 },
  baslikSatiri: { flexDirection: "row", alignItems: "center", gap: 13 },
  geri: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, borderColor: "#1D3D2D", backgroundColor: "#0B1712", alignItems: "center", justifyContent: "center" },
  basili: { opacity: 0.68, transform: [{ scale: 0.98 }] },
  baslikMetinleri: { flex: 1 },
  ustEtiket: { color: "#FF7276", fontSize: 10, fontWeight: "800", letterSpacing: 1.4, lineHeight: 14 },
  baslik: { color: "#F2FFF7", fontSize: 25, fontWeight: "900", lineHeight: 32 },
  bolum: { gap: 12, borderRadius: 24, borderWidth: 1, borderColor: "#1D3D2D", backgroundColor: "#0B1712", padding: 15 },
  bolumBaslik: { flexDirection: "row", alignItems: "center", gap: 11 },
  ikon: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  kartBaslik: { color: "#F2FFF7", fontSize: 15, fontWeight: "800", lineHeight: 20 },
  kartAciklama: { color: "#7FA08B", marginTop: 2, fontSize: 11, lineHeight: 16 },
  ayarSatiri: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderTopWidth: 1, borderTopColor: "#17271E", paddingTop: 10 },
  ayarEtiket: { color: "#B8D7C3", fontSize: 13, fontWeight: "700" },
  degerKontrol: { flexDirection: "row", alignItems: "center", gap: 8 },
  degerButon: { width: 32, height: 32, borderRadius: 12, backgroundColor: "#17271E", alignItems: "center", justifyContent: "center" },
  degerMetni: { minWidth: 45, color: "#52F58A", textAlign: "center", fontSize: 12, fontWeight: "900" },
  altBaslik: { color: "#B8D7C3", fontSize: 12, fontWeight: "800", lineHeight: 18 },
  secimIzgarasi: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sesSecim: { maxWidth: "100%", flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 13, borderWidth: 1, borderColor: "#263A2E", paddingHorizontal: 10, paddingVertical: 8 },
  sesSecimAktif: { borderColor: "#52F58A77", backgroundColor: "#52F58A0D" },
  sesMetni: { maxWidth: 210, color: "#7FA08B", fontSize: 11, lineHeight: 15 },
  sesMetniAktif: { color: "#DFFFF0" },
  avatarIzgara: { flexDirection: "row", gap: 8 },
  avatarKarti: { flex: 1, minHeight: 71, borderRadius: 16, borderWidth: 1, borderColor: "#263A2E", alignItems: "center", justifyContent: "center", gap: 6 },
  avatarMetni: { color: "#B8D7C3", fontSize: 10, fontWeight: "800" },
  servisNotu: { color: "#668A74", fontSize: 10, lineHeight: 16 },
  onizlemeButonu: { minHeight: 43, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: "#604F17", backgroundColor: "#1A1608" },
  onizlemeMetni: { color: "#FFD34E", fontSize: 12, fontWeight: "800" },
  saglayiciSatiri: { minHeight: 55, borderRadius: 16, borderWidth: 1, borderColor: "#263A2E", flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12 },
  saglayiciAktif: { borderColor: "#52F58A77", backgroundColor: "#52F58A0D" },
  saglayiciMetinleri: { flex: 1 },
  saglayiciAdi: { color: "#E5F7EA", fontSize: 13, fontWeight: "800", lineHeight: 18 },
  saglayiciNot: { color: "#6E8D79", fontSize: 10, lineHeight: 15 },
  anahtarAlani: { gap: 7, borderTopWidth: 1, borderTopColor: "#17271E", paddingTop: 11 },
  anahtarBaslik: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  anahtarDurum: { color: "#7FA08B", fontSize: 10, fontWeight: "800" },
  anahtarHazir: { color: "#52F58A" },
  girdiSatiri: { flexDirection: "row", gap: 7 },
  girdi: { flex: 1, minHeight: 43, borderRadius: 14, borderWidth: 1, borderColor: "#263A2E", backgroundColor: "#050C08", paddingHorizontal: 12, color: "#F2FFF7", fontSize: 12 },
  kaydetButonu: { width: 43, height: 43, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#52F58A" },
  silButonu: { width: 43, height: 43, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#652C31", backgroundColor: "#1E0D0F" },
  guvenlikNotu: { flexDirection: "row", gap: 10, borderRadius: 20, padding: 15, backgroundColor: "#0B1B12", borderWidth: 1, borderColor: "#245D3D" },
  guvenlikMetni: { flex: 1, color: "#93B8A2", fontSize: 12, lineHeight: 18 },
});
