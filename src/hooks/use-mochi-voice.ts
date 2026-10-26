import { useCallback, useEffect, useState } from "react";
import {
  getMochiVoiceEnabled,
  setMochiVoiceEnabled,
  speakMochiDialogue,
  stopMochiSpeech,
  isMochiSpeaking,
  subscribeMochiSpeechState,
} from "@/lib/mochi-voice";

/**
 * Hook for consuming and toggling Mochi's voice state across components.
 */
export function useMochiVoice(options?: { trackSpeaking?: boolean }) {
  const [mochiVoiceEnabled, setMochiVoiceState] = useState<boolean>(() =>
    getMochiVoiceEnabled(),
  );
  const [isSpeaking, setIsSpeaking] = useState<boolean>(() => isMochiSpeaking());

  useEffect(() => {
    const handler = (e: Event) => {
      const { enabled } = (e as CustomEvent<{ enabled: boolean }>).detail;
      setMochiVoiceState(Boolean(enabled));
    };

    window.addEventListener("mochi_voice_pref_changed", handler);
    let unsubscribeSpeech: (() => void) | undefined;
    if (options?.trackSpeaking) {
      unsubscribeSpeech = subscribeMochiSpeechState(setIsSpeaking);
    }

    return () => {
      window.removeEventListener("mochi_voice_pref_changed", handler);
      unsubscribeSpeech?.();
    };
  }, [options?.trackSpeaking]);

  const toggleMochiVoice = useCallback(() => {
    setMochiVoiceEnabled(!mochiVoiceEnabled);
  }, [mochiVoiceEnabled]);

  const speak = useCallback((text: string) => {
    speakMochiDialogue(text);
  }, []);

  const stop = useCallback(() => {
    stopMochiSpeech();
  }, []);

  return {
    mochiVoiceEnabled,
    toggleMochiVoice,
    speak,
    stop,
    isSpeaking,
  };
}
