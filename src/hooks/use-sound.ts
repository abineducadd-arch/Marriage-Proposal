import { useCallback, useEffect, useState } from "react";
import { getSoundEnabled, setSoundEnabled } from "@/lib/sounds";

/**
 * Hook that exposes whether sounds are enabled and a toggle function.
 * Stays in sync with other tabs / components via a custom window event.
 */
export function useSound() {
  const [soundEnabled, setSoundState] = useState<boolean>(() => getSoundEnabled());

  useEffect(() => {
    const handler = (e: Event) => {
      const { enabled } = (e as CustomEvent<{ enabled: boolean }>).detail;
      setSoundState(enabled);
    };
    window.addEventListener("romantic_sound_pref_changed", handler);
    return () => window.removeEventListener("romantic_sound_pref_changed", handler);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(!soundEnabled);
  }, [soundEnabled]);

  return { soundEnabled, toggleSound };
}
