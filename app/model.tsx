import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { QWEN_MODEL, qwenModelYoneticisi, type QwenModelState } from "@/lib/qwen-model";
import { yerelQwen, type YerelQwenDurumu } from "@/lib/yerel-qwen";

function boyutla(bayt: number) {
  return `${(bayt / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default function ModelScreen() {
  const router = useRouter();
  const [model, setModel] = useState<QwenModelState>(qwenModelYoneticisi.durumAl());
  const [motorDurumu, setMotorDurumu] = useState<YerelQwenDurumu>(yerelQwen.durum().durum);
  const [motorMesaji, setMotorMesaji] = useState("Yerel çıkarım motoru kapalı.");

  useEffect(() => {
    const abonelik = qwenModelYoneticisi.aboneOl(setModel);
    const motorAbonelik = yerelQwen.aboneOl((yeniDurum, mesaj) => {
      setMotorDurumu(yeniDurum);
      setMotorMesaji(mesaj);
    });
    qwenModelYoneticisi.denetle().catch(() => undefined);
    return () => {
      abonelik();
      motorAbonelik();
    };
  }, []);

  const islem = useCallback(async () => {
    try {
      if (model.durum === "indiriliyor") await qwenModelYoneticisi.duraklat();
      else if (model.durum === "hazir" && model.uri) await yerelQwen.yukle(model.uri);
      else await qwenModelYoneticisi.indir();
    } catch (hata) {
      Alert.alert("Model işlemi tamamlanamadı", hata instanceof Error ? hata.message : "Bilinmeyen hata");
    }
  }, [model]);

  const sil = useCallback(() => {
    Alert.alert("Qwen modelini sil", "Yaklaşık 1,1 GB boyutundaki GGUF dosyası cihazdan silinecek.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          yerelQwen.kapat().then(() => qwenModelYoneticisi.sil()).catch(() => undefined);
        },
      },
    ]);
  }, []);

  const butonMetni = model.durum === "indiriliyor"
    ? "İndirmeyi duraklat"
    : model.durum === "hazir"
      ? motorDurumu === "hazir" ? "Model bellekte hazır" : "Modeli çalıştır"
      : model.durum === "duraklatildi" ? "İndirmeye devam et" : "Modeli indir";

  const islemDevamEdiyor = model.durum === "dogrulaniyor" || motorDurumu === "yukleniyor" || motorDurumu === "uretiyor";

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} containerClassName="bg-background">
      <ScrollView style={styles.kapsayici} contentContainerStyle={styles.icerik}>
        <View style={styles.baslikSatiri}>
          <Pressable accessibilityRole="button" accessibilityLabel="Geri dön" onPress={() => router.back()} style={({ pressed }) => [styles.geri, pressed && styles.basili]}>
            <MaterialIcons name="arrow-back" size={22} color="#F2FFF7" />
          </Pressable>
          <View style={styles.baslikMetinleri}>
            <Text style={styles.ustEtiket}>YEREL YAPAY ZEKÂ</Text>
            <Text style={styles.baslik}>Model Yönetimi</Text>
          </View>
        </View>

        <View style={styles.modelKarti}>
          <View style={styles.modelIkon}><MaterialIcons name="memory" size={30} color="#FFD34E" /></View>
          <Text style={styles.modelAdi}>{QWEN_MODEL.ad}</Text>
          <Text style={styles.modelDetay}>GGUF · {QWEN_MODEL.quantization} · Apache-2.0 · Android ARM64</Text>
          <View style={styles.durumRozeti}><View style={[styles.nokta, model.durum === "hazir" && styles.noktaHazir]} /><Text style={styles.durumMetni}>{model.mesaj}</Text></View>
        </View>

        <View style={styles.ilerlemeKarti}>
          <View style={styles.ilerlemeBaslik}>
            <Text style={styles.kartBaslik}>Cihaz depolaması</Text>
            <Text style={styles.yuzde}>%{Math.round(model.ilerleme * 100)}</Text>
          </View>
          <View style={styles.ilerlemeArka}><View style={[styles.ilerlemeOn, { width: `${Math.max(2, model.ilerleme * 100)}%` }]} /></View>
          <Text style={styles.boyut}>{boyutla(model.indirilenBayt)} / {boyutla(model.toplamBayt)}</Text>
        </View>

        <View style={styles.motorKarti}>
          <View style={styles.motorBaslik}>
            <MaterialIcons name="offline-bolt" size={21} color="#52F58A" />
            <Text style={styles.kartBaslik}>llama.cpp motoru</Text>
          </View>
          <Text style={styles.motorMetni}>{motorMesaji}</Text>
          <Text style={styles.motorNotu}>Model, yalnızca özel Android geliştirme veya Publish derlemesinde cihaz içinde çalışır. Expo Go yerel llama.rn modülünü içermez.</Text>
        </View>

        <Pressable disabled={islemDevamEdiyor || (model.durum === "hazir" && motorDurumu === "hazir")} onPress={islem} style={({ pressed }) => [styles.anaButon, pressed && styles.basili, islemDevamEdiyor && styles.pasif]}>
          <MaterialIcons name={model.durum === "indiriliyor" ? "pause" : model.durum === "hazir" ? "play-arrow" : "download"} size={21} color="#031109" />
          <Text style={styles.anaButonMetni}>{butonMetni}</Text>
        </Pressable>

        {model.durum === "hazir" || model.durum === "duraklatildi" ? (
          <Pressable onPress={sil} style={({ pressed }) => [styles.silButonu, pressed && styles.basili]}>
            <MaterialIcons name="delete-outline" size={19} color="#FF9A9F" />
            <Text style={styles.silMetni}>Model dosyasını sil</Text>
          </Pressable>
        ) : null}

        <Text style={styles.not}>İndirme bağlantısı resmî Qwen Hugging Face deposunu kullanır. GGUF başlığı ve en düşük dosya boyutu cihaz üzerinde doğrulanır.</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: "#030806" },
  icerik: { padding: 18, gap: 18, paddingBottom: 38 },
  baslikSatiri: { flexDirection: "row", alignItems: "center", gap: 13 },
  geri: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, borderColor: "#1D3D2D", backgroundColor: "#0B1712", alignItems: "center", justifyContent: "center" },
  basili: { opacity: 0.65, transform: [{ scale: 0.98 }] },
  baslikMetinleri: { flex: 1 },
  ustEtiket: { color: "#FFD34E", fontSize: 10, fontWeight: "800", letterSpacing: 1.4, lineHeight: 14 },
  baslik: { color: "#F2FFF7", fontSize: 25, fontWeight: "900", lineHeight: 32 },
  modelKarti: { alignItems: "center", borderRadius: 28, borderWidth: 1, borderColor: "#4A3B11", backgroundColor: "#171407", padding: 22 },
  modelIkon: { width: 62, height: 62, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: "#FFD34E18", borderWidth: 1, borderColor: "#FFD34E55" },
  modelAdi: { marginTop: 15, color: "#F2FFF7", fontSize: 17, fontWeight: "900", lineHeight: 23, textAlign: "center" },
  modelDetay: { marginTop: 6, color: "#BDB48A", fontSize: 12, lineHeight: 18, textAlign: "center" },
  durumRozeti: { marginTop: 15, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: "#0B1712", maxWidth: "100%" },
  nokta: { width: 7, height: 7, borderRadius: 99, backgroundColor: "#FFD34E" },
  noktaHazir: { backgroundColor: "#52F58A" },
  durumMetni: { flexShrink: 1, color: "#B8D7C3", fontSize: 11, fontWeight: "700", lineHeight: 16 },
  ilerlemeKarti: { gap: 10, borderRadius: 20, padding: 16, backgroundColor: "#0B1712", borderWidth: 1, borderColor: "#173526" },
  ilerlemeBaslik: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kartBaslik: { color: "#F2FFF7", fontSize: 14, lineHeight: 20, fontWeight: "800" },
  yuzde: { color: "#52F58A", fontSize: 13, fontWeight: "900" },
  ilerlemeArka: { height: 8, borderRadius: 99, overflow: "hidden", backgroundColor: "#17251D" },
  ilerlemeOn: { height: 8, borderRadius: 99, backgroundColor: "#52F58A" },
  boyut: { color: "#668A74", fontSize: 11, lineHeight: 16 },
  motorKarti: { borderRadius: 20, padding: 16, gap: 8, backgroundColor: "#07110D", borderWidth: 1, borderColor: "#173526" },
  motorBaslik: { flexDirection: "row", alignItems: "center", gap: 8 },
  motorMetni: { color: "#B8D7C3", fontSize: 12, lineHeight: 18 },
  motorNotu: { color: "#668A74", fontSize: 11, lineHeight: 17 },
  anaButon: { minHeight: 54, borderRadius: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, backgroundColor: "#52F58A" },
  anaButonMetni: { color: "#031109", fontSize: 14, fontWeight: "900" },
  pasif: { opacity: 0.55 },
  silButonu: { minHeight: 48, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1, borderColor: "#652C31", backgroundColor: "#1E0D0F" },
  silMetni: { color: "#FF9A9F", fontSize: 13, fontWeight: "800" },
  not: { color: "#668A74", fontSize: 11, lineHeight: 18 },
});
