import { memo, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

const CUBUKLAR = [0.5, 0.78, 0.62, 0.95, 0.72, 1, 0.58, 0.84, 0.48, 0.7, 0.54];

type SesDalgasiProps = {
  aktif: boolean;
  genlik?: number;
  renk?: string;
  yukseklik?: number;
};

type CubukProps = {
  indeks: number;
  temel: number;
  ilerleme: SharedValue<number>;
  aktif: boolean;
  genlik: number;
  renk: string;
  yukseklik: number;
};

function DalgaCubugu({ indeks, temel, ilerleme, aktif, genlik, renk, yukseklik }: CubukProps) {
  const stil = useAnimatedStyle(() => {
    const faz = (ilerleme.value + indeks * 0.11) % 1;
    const hareket = interpolate(faz, [0, 0.25, 0.5, 0.75, 1], [0.36, 1, 0.52, 0.84, 0.36]);
    const hedef = aktif ? Math.max(0.24, Math.min(1, hareket * temel * genlik)) : 0.18 + temel * 0.08;

    return {
      height: Math.max(5, yukseklik * hedef),
      opacity: aktif ? 0.72 + hareket * 0.28 : 0.34,
    };
  }, [aktif, genlik, temel, yukseklik]);

  return <Animated.View style={[styles.cubuk, { backgroundColor: renk }, stil]} />;
}

function SesDalgasiBileseni({
  aktif,
  genlik = 0.9,
  renk = "#37F58A",
  yukseklik = 44,
}: SesDalgasiProps) {
  const ilerleme = useSharedValue(0);

  useEffect(() => {
    ilerleme.value = withRepeat(
      withTiming(1, { duration: aktif ? 780 : 1900, easing: Easing.linear }),
      -1,
      false,
    );
  }, [aktif, ilerleme]);

  return (
    <View
      accessibilityLabel={aktif ? "Canlı ses dalgası" : "Ses dalgası beklemede"}
      style={[styles.kapsayici, { height: yukseklik }]}
    >
      {CUBUKLAR.map((temel, indeks) => (
        <DalgaCubugu
          key={`${indeks}-${temel}`}
          indeks={indeks}
          temel={temel}
          ilerleme={ilerleme}
          aktif={aktif}
          genlik={genlik}
          renk={renk}
          yukseklik={yukseklik}
        />
      ))}
    </View>
  );
}

export const SesDalgasi = memo(SesDalgasiBileseni);

const styles = StyleSheet.create({
  kapsayici: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  cubuk: {
    width: 4,
    minHeight: 5,
    borderRadius: 999,
    shadowColor: "#37F58A",
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
});
