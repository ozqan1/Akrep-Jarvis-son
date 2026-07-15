import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, Defs, LinearGradient, Line, Rect, Stop } from "react-native-svg";

import { AkrepAvatar, type AsistanDurumu } from "@/components/akrep-avatar";
import { ScreenContainer } from "@/components/screen-container";
import { SesDalgasi } from "@/components/ses-dalgasi";
import { useAkrepTts } from "@/hooks/use-akrep-tts";
import { useAkrepVoice } from "@/hooks/use-akrep-voice";

const RENK = {
  arkaPlan: "#030806",
  yuzey: "#0B1712",
  yuzeyParlak: "#10271B",
  yazi: "#F2FFF7",
  ikincil: "#93B8A2",
  yesil: "#37F58A",
  sari: "#FFD34E",
  kirmizi: "#FF5A5F",
  kenar: "#1D3D2D",
};

const DURUM_METNI: Record<AsistanDurumu, { baslik: string; aciklama: string }> = {
  hazir: { baslik: "Hazır", aciklama: "Bir komut vermek için düğmeye basılı tutun." },
  dinliyor: { baslik: "Dinliyorum", aciklama: "Konuşmanız bitene kadar düğmeyi bırakmayın." },
  dusunuyor: { baslik: "İşleniyor", aciklama: "Komut yerel niyet motorunda çözümleniyor." },
  konusuyor: { baslik: "Yanıtlanıyor", aciklama: "AKREP yanıtı cihazınızda seslendiriyor." },
};

// Memoize space grid to prevent re-renders
const UzayIzgarasi = memo(function UzayIzgarasi() {
  const noktalar = useMemo(
    () => [
      [24, 32, 1.4], [78, 68, 1], [142, 28, 1.2], [202, 84, 1.5], [286, 42, 1],
      [334, 106, 1.3], [44, 154, 0.9], [116, 132, 1.4], [260, 166, 1.2], [316, 212, 0.8],
      [62, 252, 1.2], [168, 232, 0.9], [228, 286, 1.4], [352, 310, 1], [24, 360, 1.1],
      [108, 402, 0.9], [278, 386, 1.3], [332, 452, 0.9], [58, 498, 1.5], [196, 474, 1],
      [244, 536, 1.2], [92, 584, 1], [340, 622, 1.4], [178, 658, 0.8],
    ],
    [],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 390 700" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="space" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#06120C" />
            <Stop offset="0.48" stopColor="#030806" />
            <Stop offset="1" stopColor="#07100B" />
          </LinearGradient>
          <LinearGradient id="grid" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#37F58A" stopOpacity="0" />
            <Stop offset="0.5" stopColor="#37F58A" stopOpacity="0.15" />
            <Stop offset="1" stopColor="#37F58A" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width="390" height="700" fill="url(#space)" />
        {[420, 470, 520, 570, 620, 670].map((y) => (
          <Line key={y} x1="0" y1={y} x2="390" y2={y} stroke="url(#grid)" strokeWidth="0.7" />
        ))}
        {noktalar.map(([cx, cy, r], indeks) => (
          <Circle key={indeks} cx={cx} cy={cy} r={r} fill={indeks % 5 === 0 ? RENK.sari : RENK.yesil} opacity="0.34" />
        ))}
      </Svg>
    </View>
  );
});

type HızlıKartProps = {
  ikon: keyof typeof MaterialIcons.glyphMap;
  baslik: string;
  aciklama: string;
  vurgu: string;
  onPress: () => void;
};

const HizliKart = memo(function HizliKart({ ikon, baslik, aciklama, vurgu, onPress }: HızlıKartProps) {
  const handlePress = useCallback(() => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${baslik}. ${aciklama}`}
      onPress={handlePress}
      style={({ pressed }) => [styles.hizliKart, pressed && styles.hizliKartBasili]}
    >
      <View style={[styles.hizliIkon, { borderColor: `${vurgu}66`, backgroundColor: `${vurgu}15` }]}>
        <MaterialIcons name={ikon} size={22} color={vurgu} />
      </View>
      <View style={styles.hizliMetinAlani}>
        <Text style={styles.hizliBaslik}>{baslik}</Text>
        <Text numberOfLines={2} style={styles.hizliAciklama}>{aciklama}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={RENK.ikincil} />
    </Pressable>
  );
});

export default function HomeScreen() {
  const router = useRouter();
  const [durum, setDurum] = useState<AsistanDurumu>("hazir");
  const [kullaniciAltYazi, setKullaniciAltYazi] = useState("Henüz bir komut kaydedilmedi.");
  const [asistanAltYazi, setAsistanAltYazi] = useState("Hazırım. Komutunuzu bekliyorum.");
  const { konus, konusuyor } = useAkrepTts();
  const {
    baslat,
    birak,
    kaydediyor,
    oturumDurumu,
    normalizeGenlik,
    hata: sesHatasi,
  } = useAkrepVoice({
    onKayitTamamlandi: async ({ sureMs }) => {
      setKullaniciAltYazi(`Yerel ses kaydı hazır · ${(sureMs / 1000).toFixed(1)} sn`);
      setDurum("dusunuyor");
      await new Promise((resolve) => setTimeout(resolve, 250));
      const yanit = "Ses kaydını cihazda hazırladım. Yerel komut motoru bağlantıya hazır.";
      setAsistanAltYazi(yanit);
      setDurum("konusuyor");
      await konus(yanit, true);
    },
  });
  const metin = DURUM_METNI[durum];

  useEffect(() => {
    if (kaydediyor) setDurum("dinliyor");
    else if (oturumDurumu === "isleniyor") setDurum("dusunuyor");
  }, [kaydediyor, oturumDurumu]);

  useEffect(() => {
    if (konusuyor) setDurum("konusuyor");
    else if (durum === "konusuyor") setDurum("hazir");
  }, [konusuyor, durum]);

  const dinlemeyiBaslat = useCallback(async () => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const basladi = await baslat();
    if (basladi) {
      setKullaniciAltYazi("Dinleniyor… konuşmanız sessizlik algılanana kadar tek oturumda kaydedilir.");
      setAsistanAltYazi("Komutunuzu dinliyorum.");
    }
  }, [baslat]);

  const dinlemeyiBitir = useCallback(() => {
    birak();
  }, [birak]);

  const handleIzinlerPress = useCallback(() => {
    router.push("/izinler");
  }, [router]);

  const handleModelPress = useCallback(() => {
    router.push("/model");
  }, [router]);

  const handleAyarlarPress = useCallback(() => {
    router.push("/ayarlar");
  }, [router]);

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} containerClassName="bg-background">
      <StatusBar barStyle="light-content" backgroundColor={RENK.arkaPlan} />
      <UzayIzgarasi />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.icerik}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={true}
        scrollEventThrottle={16}
      >
        <View style={styles.ustSatir}>
          <View style={styles.markaAlani}>
            <View style={styles.markaNoktasi} />
            <View>
              <Text style={styles.marka}>AKREP</Text>
              <Text style={styles.gelistirici}>Geliştirici: Nebi Özkan</Text>
            </View>
          </View>
          <View style={styles.yerelRozet}>
            <MaterialIcons name="shield" size={14} color={RENK.yesil} />
            <Text style={styles.yerelMetin}>YEREL</Text>
          </View>
        </View>

        <View style={styles.avatarBolumu}>
          <AkrepAvatar durum={durum} boyut={220} />
          <View style={styles.durumSatiri}>
            <View style={[styles.durumNoktasi, { backgroundColor: durum === "dusunuyor" ? RENK.sari : RENK.yesil }]} />
            <Text style={styles.durumBaslik}>{metin.baslik}</Text>
          </View>
          <Text style={styles.durumAciklama}>{metin.aciklama}</Text>
        </View>

        <View style={styles.canliPanel}>
          <View style={styles.canliUst}>
            <Text style={styles.canliEtiket}>CANLI SES</Text>
            <Text style={styles.canliDeger}>{kaydediyor ? "Mikrofon açık" : durum === "dusunuyor" ? "İşleniyor" : "Beklemede"}</Text>
          </View>
          <SesDalgasi aktif={durum === "dinliyor" || durum === "konusuyor"} genlik={durum === "dinliyor" ? normalizeGenlik : 0.72} />
        </View>

        <View style={styles.altyaziPaneli}>
          <View style={styles.altyaziSatiri}>
            <Text style={styles.altyaziKimlik}>SİZ</Text>
            <Text style={styles.altyaziMetni}>{kullaniciAltYazi}</Text>
          </View>
          <View style={styles.altyaziAyirac} />
          <View style={styles.altyaziSatiri}>
            <Text style={[styles.altyaziKimlik, styles.altyaziAkrep]}>AKREP</Text>
            <Text style={styles.altyaziMetni}>{sesHatasi ?? asistanAltYazi}</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Konuşmak için basılı tut"
          accessibilityHint="Basılı tuttuğunuz sürece mikrofon dinler"
          onPressIn={dinlemeyiBaslat}
          onPressOut={dinlemeyiBitir}
          style={({ pressed }) => [styles.konusButonu, pressed && styles.konusButonuBasili]}
        >
          <View style={styles.konusIkon}>
            <MaterialIcons name={durum === "dinliyor" ? "graphic-eq" : "mic"} size={29} color={RENK.arkaPlan} />
          </View>
          <View>
            <Text style={styles.konusBaslik}>{durum === "dinliyor" ? "Dinliyorum…" : "Konuşmak için basılı tut"}</Text>
            <Text style={styles.konusAlt}>Kesintisiz tek kayıt oturumu</Text>
          </View>
        </Pressable>

        <View style={styles.kartlar}>
          <HizliKart
            ikon="security"
            baslik="İzin Merkezi"
            aciklama="Cihaz yetkilerini ve gizlilik durumunu yönetin."
            vurgu={RENK.yesil}
            onPress={handleIzinlerPress}
          />
          <HizliKart
            ikon="memory"
            baslik="Model Yönetimi"
            aciklama="Qwen modelini indirin, doğrulayın ve yönetin."
            vurgu={RENK.sari}
            onPress={handleModelPress}
          />
          <HizliKart
            ikon="tune"
            baslik="Ayarlar"
            aciklama="Ses, avatar, sağlayıcı ve güvenlik seçenekleri."
            vurgu={RENK.kirmizi}
            onPress={handleAyarlarPress}
          />
        </View>

        <View style={styles.altImza}>
          <Text style={styles.altImzaMetin}>Geliştirici: Nebi Özkan</Text>
          <View style={styles.altAyirac} />
          <Text style={styles.altImzaMarka}>Marka: AKREP</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  icerik: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 16,
  },
  ustSatir: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  markaAlani: { flexDirection: "row", alignItems: "center", gap: 10 },
  markaNoktasi: {
    width: 9,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#37F58A",
    shadowColor: "#37F58A",
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  marka: { color: "#F2FFF7", fontSize: 19, fontWeight: "900", letterSpacing: 4.2, lineHeight: 23 },
  gelistirici: { color: "#93B8A2", fontSize: 10, fontWeight: "600", letterSpacing: 0.25, lineHeight: 14 },
  yerelRozet: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#245D3D",
    backgroundColor: "#0B1B12",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  yerelMetin: { color: "#37F58A", fontSize: 10, fontWeight: "800", letterSpacing: 1.3 },
  avatarBolumu: { alignItems: "center", marginTop: -6 },
  durumSatiri: { marginTop: -8, flexDirection: "row", alignItems: "center", gap: 8 },
  durumNoktasi: { width: 7, height: 7, borderRadius: 999 },
  durumBaslik: { color: "#F2FFF7", fontSize: 18, fontWeight: "800", lineHeight: 24 },
  durumAciklama: { marginTop: 4, color: "#93B8A2", fontSize: 13, lineHeight: 19, textAlign: "center", maxWidth: 310 },
  canliPanel: {
    borderWidth: 1,
    borderColor: "#1D3D2D",
    backgroundColor: "#07110CCC",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 8,
  },
  canliUst: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  canliEtiket: { color: "#93B8A2", fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  canliDeger: { color: "#37F58A", fontSize: 11, fontWeight: "700" },
  altyaziPaneli: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#173325",
    backgroundColor: "#07100CCC",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
  },
  altyaziSatiri: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  altyaziKimlik: { width: 42, color: "#FFD34E", fontSize: 9, fontWeight: "900", letterSpacing: 1.1, lineHeight: 16 },
  altyaziAkrep: { color: "#37F58A" },
  altyaziMetni: { flex: 1, color: "#93B8A2", fontSize: 11, lineHeight: 16 },
  altyaziAyirac: { height: 1, backgroundColor: "#173325" },
  konusButonu: {
    minHeight: 78,
    borderRadius: 26,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: "#37F58A",
    shadowColor: "#37F58A",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  konusButonuBasili: { transform: [{ scale: 0.975 }], backgroundColor: "#69FFAA" },
  konusIkon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D7FFE8",
  },
  konusBaslik: { color: "#030806", fontSize: 16, fontWeight: "900", lineHeight: 22 },
  konusAlt: { marginTop: 2, color: "#164C2D", fontSize: 11, fontWeight: "700", lineHeight: 16 },
  kartlar: { gap: 10 },
  hizliKart: {
    minHeight: 77,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "#1D3D2D",
    backgroundColor: "#0A1510E8",
  },
  hizliKartBasili: { opacity: 0.72, transform: [{ scale: 0.987 }] },
  hizliIkon: { width: 44, height: 44, borderRadius: 17, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  hizliMetinAlani: { flex: 1 },
  hizliBaslik: { color: "#F2FFF7", fontSize: 14, fontWeight: "800", lineHeight: 20 },
  hizliAciklama: { marginTop: 2, color: "#93B8A2", fontSize: 11, lineHeight: 16 },
  altImza: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 4 },
  altImzaMetin: { color: "#668A74", fontSize: 10, lineHeight: 15 },
  altImzaMarka: { color: "#37F58A", fontSize: 10, fontWeight: "800", letterSpacing: 0.8, lineHeight: 15 },
  altAyirac: { width: 3, height: 3, borderRadius: 99, backgroundColor: "#315A42" },
});