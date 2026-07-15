import {
  RecordingPresets,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";

const SESSIZLIK_ESIGI_DB = -46;
const KONUSMA_ESIGI_DB = -37;
const SESSIZLIK_SURESI_MS = 950;
const AZAMI_KAYIT_MS = 20_000;

export type SesOturumuDurumu = "hazir" | "izin-gerekli" | "kaydediyor" | "isleniyor" | "hata";

export type SesOturumuSonucu = {
  uri: string;
  sureMs: number;
};

type UseAkrepVoiceOptions = {
  onKayitTamamlandi?: (sonuc: SesOturumuSonucu) => void | Promise<void>;
};

const KAYIT_SECENEKLERI = {
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
};

export function useAkrepVoice({ onKayitTamamlandi }: UseAkrepVoiceOptions = {}) {
  const recorder = useAudioRecorder(KAYIT_SECENEKLERI);
  const recorderState = useAudioRecorderState(recorder, 90);
  const [oturumDurumu, setOturumDurumu] = useState<SesOturumuDurumu>("hazir");
  const [hata, setHata] = useState<string | null>(null);
  const [sonKayitUri, setSonKayitUri] = useState<string | null>(null);
  const konusmaAlgilandiRef = useRef(false);
  const sessizlikBaslangiciRef = useRef<number | null>(null);
  const durduruluyorRef = useRef(false);
  const onKayitTamamlandiRef = useRef(onKayitTamamlandi);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onKayitTamamlandiRef.current = onKayitTamamlandi;
  }, [onKayitTamamlandi]);

  const durdur = useCallback(async () => {
    if (durduruluyorRef.current || !recorderState.isRecording) return;
    durduruluyorRef.current = true;
    setOturumDurumu("isleniyor");

    try {
      const sureMs = recorderState.durationMillis;
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error("Kayıt dosyası oluşturulamadı.");

      setSonKayitUri(uri);
      await onKayitTamamlandiRef.current?.({ uri, sureMs });
      setOturumDurumu("hazir");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ses kaydı durdurulamadı.";
      setHata(errorMessage);
      setOturumDurumu("hata");
      console.warn("Recording stop error:", error);
    } finally {
      durduruluyorRef.current = false;
      sessizlikBaslangiciRef.current = null;
      konusmaAlgilandiRef.current = false;
    }
  }, [recorder, recorderState.durationMillis, recorderState.isRecording]);

  useEffect(() => {
    if (!recorderState.isRecording) return;

    if (recorderState.durationMillis >= AZAMI_KAYIT_MS) {
      void durdur();
      return;
    }

    const metering = recorderState.metering;
    if (typeof metering !== "number") return;

    if (metering >= KONUSMA_ESIGI_DB) {
      konusmaAlgilandiRef.current = true;
      sessizlikBaslangiciRef.current = null;
      return;
    }

    if (konusmaAlgilandiRef.current && metering <= SESSIZLIK_ESIGI_DB) {
      const simdi = Date.now();
      sessizlikBaslangiciRef.current ??= simdi;
      if (simdi - sessizlikBaslangiciRef.current >= SESSIZLIK_SURESI_MS) void durdur();
    } else {
      sessizlikBaslangiciRef.current = null;
    }
  }, [durdur, recorderState.durationMillis, recorderState.isRecording, recorderState.metering]);

  const baslat = useCallback(async () => {
    if (recorderState.isRecording || durduruluyorRef.current) return true;
    setHata(null);

    try {
      let izin = await getRecordingPermissionsAsync();
      if (!izin.granted) izin = await requestRecordingPermissionsAsync();
      if (!izin.granted) {
        setOturumDurumu("izin-gerekli");
        setHata("Mikrofon izni verilmedi.");
        return false;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
        interruptionMode: "doNotMix",
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      konusmaAlgilandiRef.current = false;
      sessizlikBaslangiciRef.current = null;
      setOturumDurumu("kaydediyor");
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ses kaydı başlatılamadı.";
      setHata(errorMessage);
      setOturumDurumu("hata");
      console.warn("Recording start error:", error);
      return false;
    }
  }, [recorder, recorderState.isRecording]);

  const birak = useCallback(() => {
    if (!recorderState.isRecording) return;
    if (typeof recorderState.metering !== "number") {
      void durdur();
    }
  }, [durdur, recorderState.isRecording, recorderState.metering]);

  const sifirla = useCallback(() => {
    setHata(null);
    setOturumDurumu("hazir");
  }, []);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      durduruluyorRef.current = false;
    };
  }, []);

  const normalizeGenlik = Math.max(0.18, Math.min(1, ((recorderState.metering ?? -60) + 60) / 42));

  return {
    baslat,
    birak,
    durdur,
    sifirla,
    oturumDurumu,
    kaydediyor: recorderState.isRecording,
    sureMs: recorderState.durationMillis,
    metering: recorderState.metering ?? null,
    normalizeGenlik,
    sonKayitUri,
    hata,
  };
}