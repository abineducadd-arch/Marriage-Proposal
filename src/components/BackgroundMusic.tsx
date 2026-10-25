import { useEffect, useState } from "react";
import {
  initGlobalBgmListeners,
  subscribeBgmState,
  isBgmAutoplayBlocked,
  isBgmPlaying,
  playBackgroundMusic,
  handleBgmUserInteraction,
} from "@/lib/bgm";
import { getSoundEnabled } from "@/lib/sounds";

/**
 * Global persistent background music controller component.
 * Mounted at the application root level (in `RootComponent`), keeping
 * background music playing continuously across all page transitions.
 *
 * If the browser blocks audio autoplay before any user gesture,
 * it renders a discreet romantic floating pill so the user can easily start it.
 */
export function BackgroundMusic() {
  const [blocked, setBlocked] = useState<boolean>(() => isBgmAutoplayBlocked());
  const [playing, setPlaying] = useState<boolean>(() => isBgmPlaying());
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => getSoundEnabled());

  useEffect(() => {
    // Start global interaction listeners (clicks/taps across any page start music)
    const cleanupListeners = initGlobalBgmListeners();

    const unsubscribe = subscribeBgmState(() => {
      setBlocked(isBgmAutoplayBlocked());
      setPlaying(isBgmPlaying());
    });

    const handlePrefChanged = (e: Event) => {
      const { enabled } = (e as CustomEvent<{ enabled: boolean }>).detail ?? {};
      setSoundEnabledState(Boolean(enabled));
    };

    window.addEventListener("romantic_sound_pref_changed", handlePrefChanged);

    return () => {
      cleanupListeners();
      unsubscribe();
      window.removeEventListener("romantic_sound_pref_changed", handlePrefChanged);
    };
  }, []);

  const handleStartMusic = () => {
    handleBgmUserInteraction();
    playBackgroundMusic();
  };

  // Only show the discreet prompt if autoplay was blocked by the browser,
  // sound is currently enabled in settings, and music is not already playing.
  const showDiscreetPrompt = blocked && !playing && soundEnabled;

  if (!showDiscreetPrompt) {
    return null;
  }

  return (
    <aside
      aria-label="Background music notice"
      className="fixed bottom-4 left-4 z-40 animate-rise"
    >
      <button
        type="button"
        id="bgm-play-button"
        onClick={handleStartMusic}
        className="flex items-center gap-2 rounded-full border border-rose/30 bg-cream/95 px-3.5 py-1.5 font-sans text-xs font-medium text-cocoa shadow-md backdrop-blur-sm transition-all hover:bg-cream hover:shadow-lg focus-visible:outline-2 focus-visible:outline-rose cursor-pointer"
        aria-label="Play romantic background music"
      >
        <span className="text-sm text-rose animate-pulse" aria-hidden="true">
          🎵
        </span>
        <span className="font-serif italic text-cocoa">
          Play romantic music ♡
        </span>
      </button>
    </aside>
  );
}
