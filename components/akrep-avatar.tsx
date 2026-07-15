import { memo, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from "react-native-svg";

export type AsistanDurumu = "hazir" | "dinliyor" | "dusunuyor" | "konusuyor";

type AkrepAvatarProps = {
  durum: AsistanDurumu;
  boyut?: number;
};

const DURUM_RENKLERI: Record<AsistanDurumu, string> = {
  hazir: "#37F58A",
  dinliyor: "#37F58A",
  dusunuyor: "#FFD34E",
  konusuyor: "#FF6B55",
};

function AkrepAvatarBileseni({ durum, boyut = 210 }: AkrepAvatarProps) {
  const nefes = useSharedValue(0);
  const konusma = useSharedValue(0);

  useEffect(() => {
    nefes.value = withRepeat(
      withTiming(1, {
        duration: durum === "dinliyor" ? 760 : durum === "dusunuyor" ? 1100 : 1800,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );

    konusma.value = withRepeat(
      withTiming(1, {
        duration: durum === "konusuyor" ? 230 : 900,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [durum, konusma, nefes]);

  const haloStili = useAnimatedStyle(() => ({
    opacity: interpolate(nefes.value, [0, 1], [0.25, durum === "hazir" ? 0.52 : 0.9]),
    transform: [{ scale: interpolate(nefes.value, [0, 1], [0.92, 1.08]) }],
  }));

  const govdeStili = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(nefes.value, [0, 1], [0.985, 1.015]) },
      { translateY: interpolate(nefes.value, [0, 1], [1.5, -1.5]) },
    ],
  }));

  const cekirdekStili = useAnimatedStyle(() => ({
    transform: [
      {
        scaleY:
          durum === "konusuyor"
            ? interpolate(konusma.value, [0, 1], [0.72, 1.28])
            : interpolate(nefes.value, [0, 1], [0.94, 1.06]),
      },
    ],
  }));

  const vurgu = DURUM_RENKLERI[durum];

  return (
    <View
      accessibilityLabel={`AKREP avatarı, ${durum} durumunda`}
      style={[styles.kapsayici, { width: boyut, height: boyut }]}
    >
      <Animated.View
        style={[
          styles.halo,
          { width: boyut * 0.82, height: boyut * 0.82, borderColor: vurgu, shadowColor: vurgu },
          haloStili,
        ]}
      />

      <Animated.View style={[styles.svgKatmani, govdeStili]}>
        <Svg width={boyut} height={boyut} viewBox="0 0 220 220">
          <Defs>
            <RadialGradient id="core" cx="50%" cy="42%" r="62%">
              <Stop offset="0%" stopColor="#FFF8C5" stopOpacity="1" />
              <Stop offset="36%" stopColor="#FFD34E" stopOpacity="0.95" />
              <Stop offset="100%" stopColor={vurgu} stopOpacity="0.08" />
            </RadialGradient>
            <RadialGradient id="shell" cx="50%" cy="35%" r="80%">
              <Stop offset="0%" stopColor="#204A35" />
              <Stop offset="65%" stopColor="#0B1712" />
              <Stop offset="100%" stopColor="#020604" />
            </RadialGradient>
          </Defs>

          <Circle cx="110" cy="110" r="77" fill="#06100B" stroke="#1D3D2D" strokeWidth="1.5" />
          <Circle cx="110" cy="110" r="68" fill="none" stroke={vurgu} strokeOpacity="0.3" strokeWidth="1.2" />

          <G fill="none" stroke={vurgu} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M73 88 C52 77, 35 83, 29 101 C42 96, 53 101, 61 111" strokeWidth="8" opacity="0.78" />
            <Path d="M147 88 C168 77, 185 83, 191 101 C178 96, 167 101, 159 111" strokeWidth="8" opacity="0.78" />
            <Path d="M81 133 C61 139, 47 152, 42 168" strokeWidth="6" opacity="0.58" />
            <Path d="M139 133 C159 139, 173 152, 178 168" strokeWidth="6" opacity="0.58" />
            <Path d="M91 148 C76 159, 69 171, 68 184" strokeWidth="5" opacity="0.44" />
            <Path d="M129 148 C144 159, 151 171, 152 184" strokeWidth="5" opacity="0.44" />
            <Path d="M119 66 C139 44, 157 29, 166 37 C176 48, 158 63, 145 69 C162 69, 174 76, 177 87" strokeWidth="7" opacity="0.82" />
            <Path d="M177 87 L171 79 L182 79 Z" fill={vurgu} strokeWidth="2" />
          </G>

          <Ellipse cx="110" cy="111" rx="39" ry="51" fill="url(#shell)" stroke={vurgu} strokeWidth="2.2" />
          <Path d="M84 101 C97 92, 123 92, 136 101" fill="none" stroke="#4CFF9A" strokeOpacity="0.45" strokeWidth="1.5" />
          <Path d="M88 124 C100 133, 120 133, 132 124" fill="none" stroke="#4CFF9A" strokeOpacity="0.26" strokeWidth="1.5" />
          <Circle cx="95" cy="104" r="4.5" fill={vurgu} />
          <Circle cx="125" cy="104" r="4.5" fill={vurgu} />
          <Circle cx="95" cy="104" r="9" fill="none" stroke={vurgu} strokeOpacity="0.25" />
          <Circle cx="125" cy="104" r="9" fill="none" stroke={vurgu} strokeOpacity="0.25" />
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          styles.cekirdek,
          {
            backgroundColor: vurgu,
            shadowColor: vurgu,
            width: boyut * 0.11,
            height: boyut * 0.21,
            borderRadius: boyut * 0.06,
          },
          cekirdekStili,
        ]}
      />
    </View>
  );
}

export const AkrepAvatar = memo(AkrepAvatarBileseni);

const styles = StyleSheet.create({
  kapsayici: {
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    shadowOpacity: 0.65,
    shadowRadius: 22,
    elevation: 12,
  },
  svgKatmani: {
    alignItems: "center",
    justifyContent: "center",
  },
  cekirdek: {
    position: "absolute",
    top: "52%",
    opacity: 0.84,
    shadowOpacity: 0.95,
    shadowRadius: 14,
    elevation: 10,
  },
});
