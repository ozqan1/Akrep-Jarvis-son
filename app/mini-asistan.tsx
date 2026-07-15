import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";

export default function MiniAsistanScreen() {
  const router = useRouter();

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} containerClassName="bg-background">
      <View style={styles.kapsayici}>
        <View style={styles.baslikSatiri}>
          <Pressable accessibilityRole="button" accessibilityLabel="Geri dön" onPress={() => router.back()} style={({ pressed }) => [styles.geri, pressed && styles.basili]}>
            <MaterialIcons name="arrow-back" size={22} color="#F2FFF7" />
          </Pressable>
          <View style={styles.baslikMetinleri}>
            <Text style={styles.ustEtiket}>OVERLAY ÖNİZLEME</Text>
            <Text style={styles.baslik}>Mini Asistan</Text>
          </View>
        </View>

        <View style={styles.aciklamaKarti}>
          <MaterialIcons name="info-outline" size={19} color="#FFD34E" />
          <Text style={styles.aciklama}>Bu ekran, Android “diğer uygulamaların üzerinde göster” izni verildiğinde açılacak yüzen görünümün React Native taslağıdır.</Text>
        </View>

        <View style={styles.sahne}>
          <View style={styles.arkaKart}><Text style={styles.arkaBaslik}>Android ekranı</Text><Text style={styles.arkaMetin}>Kullanıcı başka bir uygulamadayken AKREP alt kenarda erişilebilir kalır.</Text></View>

          <View style={styles.overlay}>
            <View style={styles.tutamac} />
            <View style={styles.overlayBaslik}>
              <View style={styles.avatar}><MaterialIcons name="bug-report" size={22} color="#52F58A" /></View>
              <View style={styles.overlayMetinleri}><Text style={styles.overlayEtiket}>AKREP · HAZIR</Text><Text style={styles.overlayYazi}>Nasıl yardımcı olayım?</Text></View>
              <Pressable accessibilityLabel="Mini asistanı gizle" onPress={() => router.back()} style={({ pressed }) => [styles.gizle, pressed && styles.basili]}><MaterialIcons name="expand-more" size={22} color="#93B8A2" /></Pressable>
            </View>
            <View style={styles.girdiSatiri}>
              <TextInput placeholder="Komutu yaz veya mikrofona bas" placeholderTextColor="#557262" style={styles.girdi} returnKeyType="done" />
              <Pressable accessibilityLabel="Konuşmayı başlat" style={({ pressed }) => [styles.mikrofon, pressed && styles.basili]}><MaterialIcons name="mic" size={20} color="#031109" /></Pressable>
            </View>
          </View>
        </View>

        <Text style={styles.not}>Gerçek sistem overlay penceresi ve erişilebilirlik servisi, Expo Go’da çalışmaz; Publish/özel Android derlemesindeki yerel modül bu görünümü sistem penceresine taşır.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  kapsayici: { flex: 1, padding: 18, gap: 18, backgroundColor: "#030806" },
  baslikSatiri: { flexDirection: "row", alignItems: "center", gap: 13 },
  geri: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, borderColor: "#1D3D2D", backgroundColor: "#0B1712", alignItems: "center", justifyContent: "center" },
  basili: { opacity: 0.68, transform: [{ scale: 0.98 }] },
  baslikMetinleri: { flex: 1 },
  ustEtiket: { color: "#FFD34E", fontSize: 10, fontWeight: "800", letterSpacing: 1.4, lineHeight: 14 },
  baslik: { color: "#F2FFF7", fontSize: 25, fontWeight: "900", lineHeight: 32 },
  aciklamaKarti: { flexDirection: "row", gap: 10, borderRadius: 18, borderWidth: 1, borderColor: "#604F17", backgroundColor: "#1A1608", padding: 14 },
  aciklama: { flex: 1, color: "#CABF8E", fontSize: 12, lineHeight: 18 },
  sahne: { flex: 1, borderRadius: 28, borderWidth: 1, borderColor: "#15271D", backgroundColor: "#060E09", overflow: "hidden", padding: 16, justifyContent: "space-between" },
  arkaKart: { borderRadius: 20, padding: 18, backgroundColor: "#101A14", borderWidth: 1, borderColor: "#1D3024" },
  arkaBaslik: { color: "#7FA08B", fontSize: 13, fontWeight: "800", lineHeight: 18 },
  arkaMetin: { marginTop: 5, color: "#50685A", fontSize: 11, lineHeight: 17 },
  overlay: { borderRadius: 26, padding: 14, gap: 12, backgroundColor: "#0B1712", borderWidth: 1, borderColor: "#52F58A88", shadowColor: "#52F58A", shadowOpacity: 0.18, shadowRadius: 18, elevation: 8 },
  tutamac: { width: 38, height: 4, alignSelf: "center", borderRadius: 99, backgroundColor: "#375545" },
  overlayBaslik: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 43, height: 43, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#52F58A16", borderWidth: 1, borderColor: "#52F58A55" },
  overlayMetinleri: { flex: 1 },
  overlayEtiket: { color: "#52F58A", fontSize: 9, fontWeight: "900", letterSpacing: 1, lineHeight: 13 },
  overlayYazi: { color: "#F2FFF7", fontSize: 13, fontWeight: "800", lineHeight: 19 },
  gizle: { width: 38, height: 38, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#13231A" },
  girdiSatiri: { flexDirection: "row", gap: 8 },
  girdi: { flex: 1, minHeight: 45, borderRadius: 15, borderWidth: 1, borderColor: "#263A2E", backgroundColor: "#050C08", paddingHorizontal: 13, color: "#F2FFF7", fontSize: 12 },
  mikrofon: { width: 45, height: 45, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#52F58A" },
  not: { color: "#668A74", fontSize: 11, lineHeight: 18 },
});
