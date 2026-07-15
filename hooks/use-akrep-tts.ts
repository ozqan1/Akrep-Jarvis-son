import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import { useCallback, useEffect, useMemo, useState } from "react";

const TTS_AYAR_ANAHTARI = "akrep:tts:v1";

export type TtsAyarlari = {
  voiceId: string | null;
  rate: number;
  pitch: number;
  otomatikKonus: boolean;
};

const VARSAYILAN_AYARLAR: TtsAyarlari = {
  voiceId: null,
  rate: 0.96,
  pitch: 0.94,
  otomatikKonus: true,
};

export function useAkrepTts() {
  const [sesler, setSesler] = useState<Speech.Voice[]>([]);
  const [ayarlar, setAyarlarState] = useState<TtsAyarlari>(VARSAYILAN_AYARLAR);
  const [konusuyor, setKonusuyor] = useState(false);
  const [hazir, setHazir] = useState(false);

  useEffect(() => {
    let etkin = true;
    void (async () => {
      try {
        const [mevcutSesler, kayitliAyarlar] = await Promise.all([
          Speech.getAvailableVoicesAsync(),
          AsyncStorage.getItem(TTS_AYAR_ANAHTARI),
        ]);
        if (!etkin) return;

        setSesler(mevcutSesler);
        if (kayitliAyarlar) {
          const parsed = JSON.parse(kayitliAyarlar) as Partial<TtsAyarlari>;
          setAyarlarState({ ...VARSAYILAN_AYARLAR, ...parsed });
        } else {
          const turkceSes = mevcutSesler.find((ses) => ses.language.toLowerCase().startsWith("tr"));
          if (turkceSes) setAyarlarState((onceki) => ({ ...onceki, voiceId: turkceSes.identifier }));
        }
      } catch {
        // TTS motoru olmayan ortamlarda sistem varsayılanlarıyla devam edilir.
      } finally {
        if (etkin) setHazir(true);
      }
    })();

    return () => {
      etkin = false;
      void Speech.stop();
    };
  }, []);

  const turkceSesler = useMemo(
    () => sesler.filter((ses) => ses.language.toLowerCase().startsWith("tr")),
    [sesler],
  );

  const ayarlariGuncelle = useCallback(async (yeni: Partial<TtsAyarlari>) => {
    setAyarlarState((onceki) => {
      const guncel = { ...onceki, ...yeni };
      void AsyncStorage.setItem(TTS_AYAR_ANAHTARI, JSON.stringify(guncel));
      return guncel;
    });
  }, []);

  const konus = useCallback(
    async (metin: string, zorla = false) => {
      if (!metin.trim() || (!ayarlar.otomatikKonus && !zorla)) return;
      await Speech.stop();
      setKonusuyor(true);
      Speech.speak(metin, {
        language: "tr-TR",
        voice: ayarlar.voiceId ?? undefined,
        rate: ayarlar.rate,
        pitch: ayarlar.pitch,
        onDone: () => setKonusuyor(false),
        onStopped: () => setKonusuyor(false),
        onError: () => setKonusuyor(false),
      });
    },
    [ayarlar],
  );

  const sustur = useCallback(async () => {
    await Speech.stop();
    setKonusuyor(false);
  }, []);

  return {
    hazir,
    sesler,
    turkceSesler,
    ayarlar,
    ayarlariGuncelle,
    konus,
    sustur,
    konusuyor,
  };
}
