import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import {
  izinDurumunuGetir,
  izinIste,
  IZIN_TANIMLARI,
  type IzinDurumu,
  type IzinKimligi,
  uygulamaAyarlariniAc,
} from "@/lib/izinler";

const durumMetni: Record<IzinDurumu, string> = {
  verildi: "İzin verildi",
  reddedildi: "İzin gerekli",
  "ayar-gerekli": "Android Ayarları",
  desteklenmiyor: "Desteklenmiyor",
  bilinmiyor: "Denetleniyor",
};

const durumRengi: Record<IzinDurumu, string> = {
  verildi: "#38F5B5",
  reddedildi: "#FFB454",
  "ayar-gerekli": "#A786FF",
  desteklenmiyor: "#768099",
  bilinmiyor: "#64D8FF",
};

export default function IzinlerEkrani() {
  const [durumlar, setDurumlar] = useState<Record<IzinKimligi, IzinDurumu>>(() =>
    Object.fromEntries(IZIN_TANIMLARI.map((izin) => [izin.id, "bilinmiyor"])) as Record<IzinKimligi, IzinDurumu>,
  );
  const [yukleniyor, setYukleniyor] = useState<IzinKimligi | null>(null);

  const yenile = useCallback(async () => {
    const sonuclar = await Promise.all(IZIN_TANIMLARI.map(async (izin) => [izin.id, await izinDurumunuGetir(izin.id)] as const));
    setDurumlar(Object.fromEntries(sonuclar) as Record<IzinKimligi, IzinDurumu>);
  }, []);

  useEffect(() => {
    void yenile();
  }, [yenile]);

  const izinVer = useCallback(async (id: IzinKimligi) => {
    setYukleniyor(id);
    try {
      const yeniDurum = await izinIste(id);
      setDurumlar((onceki) => ({ ...onceki, [id]: yeniDurum }));
      if (yeniDurum === "ayar-gerekli" && id !== "ekran-ustu" && id !== "erisilebilirlik") {
        Alert.alert("Android ayarı gerekli", "Bu izin kalıcı olarak reddedilmiş. AKREP Asistan uygulama ayarlarından yetkilendirilebilir.", [
          { text: "Vazgeç", style: "cancel" },
          { text: "Ayarları aç", onPress: () => void uygulamaAyarlariniAc() },
        ]);
      }
    } catch {
      Alert.alert("İzin işlemi tamamlanamadı", "Android ayarları veya cihaz politikası bu işlemi engelledi.");
    } finally {
      setYukleniyor(null);
    }
  }, []);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Ana ekrana dön" onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <MaterialIcons name="arrow-back" size={23} color="#EAF6FF" />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>AKREP GÜVENLİK KONSOLU</Text>
          <Text style={styles.title}>İzin Merkezi</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="İzin durumlarını yenile" onPress={() => void yenile()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <MaterialIcons name="refresh" size={23} color="#64D8FF" />
        </Pressable>
      </View>

      <View style={styles.notice}>
        <MaterialIcons name="verified-user" size={22} color="#38F5B5" />
        <Text style={styles.noticeText}>İzinler yalnızca ilgili komut çalıştırıldığında kullanılır. Hassas eylemler siz onaylamadan yürütülmez.</Text>
      </View>

      <FlatList
        data={IZIN_TANIMLARI}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const durum = durumlar[item.id];
          const aktif = yukleniyor === item.id;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.baslik}: ${durumMetni[durum]}`}
              onPress={() => void izinVer(item.id)}
              disabled={aktif || durum === "desteklenmiyor"}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <View style={[styles.permissionIcon, { borderColor: durumRengi[durum] }]}>
                <MaterialIcons name={item.ikon as never} size={23} color={durumRengi[durum]} />
              </View>
              <View style={styles.cardCopy}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>{item.baslik}</Text>
                  {item.hassas ? <Text style={styles.sensitive}>HASSAS</Text> : null}
                </View>
                <Text style={styles.description}>{item.aciklama}</Text>
                {item.androidNotu ? <Text style={styles.androidNote}>{item.androidNotu}</Text> : null}
              </View>
              <View style={styles.action}>
                {aktif ? <ActivityIndicator size="small" color="#64D8FF" /> : <><View style={[styles.statusDot, { backgroundColor: durumRengi[durum] }]} /><Text style={[styles.statusText, { color: durumRengi[durum] }]}>{durumMetni[durum]}</Text></>}
              </View>
            </Pressable>
          );
        }}
        ListFooterComponent={
          <View style={styles.footerCard}>
            <Text style={styles.footerTitle}>Android 14 güvenlik sınırı</Text>
            <Text style={styles.footerText}>Uçak modu, erişilebilirlik, ekran üstü gösterim ve bazı çağrı yetkileri uygulama tarafından sessizce açılamaz. AKREP yalnızca ilgili Android ayar ekranını açar; son karar sizindir.</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingTop: 10, paddingBottom: 14, gap: 12 },
  headerCopy: { flex: 1 }, eyebrow: { color: "#64D8FF", fontSize: 10, letterSpacing: 1.7, fontWeight: "800" }, title: { color: "#F4FAFF", fontSize: 27, lineHeight: 33, fontWeight: "800" },
  iconButton: { width: 44, height: 44, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#101B2F", borderWidth: 1, borderColor: "#243655" }, pressed: { opacity: 0.62 },
  notice: { marginHorizontal: 18, padding: 14, borderRadius: 18, flexDirection: "row", gap: 11, alignItems: "flex-start", backgroundColor: "#0F2130", borderWidth: 1, borderColor: "#1C5548" }, noticeText: { flex: 1, color: "#BFD3DE", fontSize: 13, lineHeight: 19 },
  list: { padding: 18, paddingBottom: 36, gap: 11 }, card: { minHeight: 108, borderRadius: 20, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#0D1628", borderWidth: 1, borderColor: "#1B2A46" }, cardPressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  permissionIcon: { width: 45, height: 45, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#111E34", borderWidth: 1 }, cardCopy: { flex: 1, gap: 5 }, cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 }, cardTitle: { color: "#F4FAFF", fontSize: 15, lineHeight: 20, fontWeight: "800" },
  sensitive: { color: "#FFB454", fontSize: 8, lineHeight: 13, letterSpacing: 0.8, fontWeight: "900", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, overflow: "hidden", backgroundColor: "#312315" }, description: { color: "#9EADC3", fontSize: 12, lineHeight: 17 }, androidNote: { color: "#7889A6", fontSize: 10, lineHeight: 14, fontStyle: "italic" },
  action: { width: 76, minHeight: 44, alignItems: "flex-end", justifyContent: "center", gap: 6 }, statusDot: { width: 7, height: 7, borderRadius: 4 }, statusText: { textAlign: "right", fontSize: 9, lineHeight: 12, fontWeight: "800" },
  footerCard: { marginTop: 8, padding: 17, borderRadius: 20, backgroundColor: "#151127", borderWidth: 1, borderColor: "#3B2C64" }, footerTitle: { color: "#CBBEFF", fontSize: 14, lineHeight: 19, fontWeight: "800", marginBottom: 6 }, footerText: { color: "#9F94BF", fontSize: 12, lineHeight: 18 },
});
