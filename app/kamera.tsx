import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraView, useCameraPermissions, type CameraType } from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";

export default function KameraEkrani() {
  const params = useLocalSearchParams<{ facing?: string; torch?: string; mode?: string }>();
  const [izin, izinIste] = useCameraPermissions();
  const [yon, setYon] = useState<CameraType>(params.facing === "on" ? "front" : "back");
  const [fener, setFener] = useState(params.torch === "1");
  const [sonFotograf, setSonFotograf] = useState<string | null>(null);
  const kamera = useRef<CameraView>(null);

  const fotografCek = useCallback(async () => {
    const sonuc = await kamera.current?.takePictureAsync({ quality: 0.86, shutterSound: true });
    if (sonuc?.uri) setSonFotograf(sonuc.uri);
  }, []);

  if (!izin) {
    return <ScreenContainer edges={["top", "bottom"]}><View style={styles.center}><Text style={styles.info}>Kamera izni denetleniyor…</Text></View></ScreenContainer>;
  }

  if (!izin.granted) {
    return (
      <ScreenContainer edges={["top", "bottom"]}>
        <View style={styles.center}>
          <MaterialIcons name="photo-camera" size={52} color="#64D8FF" />
          <Text style={styles.permissionTitle}>Kamera izni gerekli</Text>
          <Text style={styles.info}>Fotoğraf ve fener komutlarını çalıştırmak için kamera erişimini onaylayın.</Text>
          <Pressable onPress={() => void izinIste()} style={({ pressed }) => [styles.allowButton, pressed && styles.pressed]}>
            <Text style={styles.allowText}>İzin ver</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
            <Text style={styles.cancelText}>Geri dön</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView ref={kamera} style={StyleSheet.absoluteFill} facing={yon} enableTorch={fener} mode="picture" />
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Kamerayı kapat" onPress={() => router.back()} style={({ pressed }) => [styles.circle, pressed && styles.pressed]}>
          <MaterialIcons name="close" size={25} color="#FFFFFF" />
        </Pressable>
        <View style={styles.modeBadge}><View style={styles.liveDot} /><Text style={styles.modeText}>{params.mode === "video" ? "VİDEO HAZIR" : "AKREP GÖRÜŞ"}</Text></View>
        <Pressable accessibilityLabel={fener ? "Feneri kapat" : "Feneri aç"} onPress={() => setFener((deger) => !deger)} style={({ pressed }) => [styles.circle, fener && styles.circleActive, pressed && styles.pressed]}>
          <MaterialIcons name={fener ? "flash-on" : "flash-off"} size={25} color={fener ? "#08130D" : "#FFFFFF"} />
        </Pressable>
      </View>

      <View style={styles.reticle} pointerEvents="none"><View style={styles.reticleInner} /><Text style={styles.reticleText}>AKREP OPTİK SİSTEMİ</Text></View>

      <View style={styles.bottomBar}>
        <View style={styles.thumbnail}>{sonFotograf ? <Image source={{ uri: sonFotograf }} style={styles.thumbImage} /> : <MaterialIcons name="image" size={23} color="#7F91A8" />}</View>
        <Pressable accessibilityLabel="Fotoğraf çek" onPress={() => void fotografCek()} style={({ pressed }) => [styles.shutterOuter, pressed && styles.shutterPressed]}><View style={styles.shutterInner} /></Pressable>
        <Pressable accessibilityLabel="Kamerayı çevir" onPress={() => setYon((deger) => deger === "back" ? "front" : "back")} style={({ pressed }) => [styles.circle, pressed && styles.pressed]}>
          <MaterialIcons name="flip-camera-android" size={25} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#030806" }, center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 16, backgroundColor: "#030806" }, permissionTitle: { color: "#F2FFF7", fontSize: 24, lineHeight: 31, fontWeight: "900" }, info: { color: "#93B8A2", fontSize: 14, lineHeight: 21, textAlign: "center" },
  allowButton: { marginTop: 10, minWidth: 180, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 18, alignItems: "center", backgroundColor: "#37F58A" }, allowText: { color: "#07120C", fontSize: 14, fontWeight: "900" }, cancelButton: { padding: 12 }, cancelText: { color: "#8AA296", fontSize: 13, fontWeight: "700" },
  topBar: { position: "absolute", top: 54, left: 18, right: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, circle: { width: 48, height: 48, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(2,8,14,0.72)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" }, circleActive: { backgroundColor: "#37F58A", borderColor: "#9AFFC4" }, pressed: { opacity: 0.62 },
  modeBadge: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 14, backgroundColor: "rgba(2,8,14,0.72)", borderWidth: 1, borderColor: "rgba(55,245,138,0.38)" }, liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#37F58A" }, modeText: { color: "#D8FFE7", fontSize: 10, letterSpacing: 1.3, fontWeight: "900" },
  reticle: { position: "absolute", top: "35%", left: "25%", width: "50%", aspectRatio: 1, borderRadius: 1000, borderWidth: 1, borderColor: "rgba(55,245,138,0.66)", alignItems: "center", justifyContent: "center" }, reticleInner: { width: "62%", aspectRatio: 1, borderRadius: 1000, borderWidth: 1, borderColor: "rgba(100,216,255,0.52)" }, reticleText: { position: "absolute", bottom: -29, color: "#D8FFE7", fontSize: 9, letterSpacing: 1.7, fontWeight: "900" },
  bottomBar: { position: "absolute", bottom: 45, left: 24, right: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, thumbnail: { width: 52, height: 52, borderRadius: 16, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(2,8,14,0.74)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }, thumbImage: { width: "100%", height: "100%" },
  shutterOuter: { width: 82, height: 82, borderRadius: 41, borderWidth: 4, borderColor: "#FFFFFF", padding: 6 }, shutterInner: { flex: 1, borderRadius: 32, backgroundColor: "#37F58A" }, shutterPressed: { transform: [{ scale: 0.94 }], opacity: 0.82 },
});
