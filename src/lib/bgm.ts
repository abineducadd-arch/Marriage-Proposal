import backgroundMusicUrl from "@/assets/sounds/background sound.mp3";
import { getSoundEnabled } from "@/lib/sounds";

/**
 * Global background music volume.
 * Configured at a soft, comfortable level suitable for an intimate romantic experience.
 * Easily adjustable in code here (range: 0.0 to 1.0).
 */
export const DEFAULT_BGM_VOLUME = 0.28;

export const BGM_URL = backgroundMusicUrl;

let bgmAudioInstance: HTMLAudioElement | null = null;
let isAutoplayBlocked = false;
let userHasInteracted = false;
let isInitialized = false;

const stateListeners = new Set<() => void>();

function notifyState(): void {
  stateListeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error("BGM state listener error:", err);
    }
  });
}

/** Subscribe to BGM play/blocked state changes */
export function subscribeBgmState(listener: () => void): () => void {
  stateListeners.add(listener);
  return () => {
    stateListeners.delete(listener);
  };
}

/**
 * Returns the application-wide singleton HTMLAudioElement for background music.
 * Ensures only one audio controller and instance exists across all pages.
 */
export function getBgmAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;

  if (!bgmAudioInstance) {
    try {
      const AudioCtor =
        typeof window !== "undefined" && window.Audio
          ? window.Audio
          : typeof Audio !== "undefined"
            ? Audio
            : null;
      if (!AudioCtor) return null;

      const audio = new AudioCtor(backgroundMusicUrl);
      audio.loop = true;
      audio.volume = DEFAULT_BGM_VOLUME;
      audio.preload = "auto";

      // Handle loading and playback errors gracefully without breaking application flow
      audio.addEventListener("error", (e) => {
        console.warn("Background music loading encountered an error (handled gracefully):", e);
      });

      bgmAudioInstance = audio;
    } catch (err) {
      console.warn("Failed to initialize background music controller:", err);
      return null;
    }
  }

  return bgmAudioInstance;
}

/** Returns whether background music is currently actively playing */
export function isBgmPlaying(): boolean {
  if (!bgmAudioInstance) return false;
  return !bgmAudioInstance.paused && !bgmAudioInstance.ended;
}

/** Returns whether browser autoplay restrictions blocked initial playback */
export function isBgmAutoplayBlocked(): boolean {
  return isAutoplayBlocked;
}

/** Set background music volume safely (0.0 to 1.0) */
export function setBgmVolume(volume: number): void {
  const audio = getBgmAudio();
  if (audio) {
    audio.volume = Math.max(0, Math.min(1, volume));
  }
}

/** Get current background music volume */
export function getBgmVolume(): number {
  const audio = getBgmAudio();
  return audio ? audio.volume : DEFAULT_BGM_VOLUME;
}

let playPromiseInProgress: Promise<boolean> | null = null;

// Module-level sync with sound preference toggle events
if (typeof window !== "undefined") {
  window.addEventListener("romantic_sound_pref_changed", (e: Event) => {
    const { enabled } = (e as CustomEvent<{ enabled: boolean }>).detail ?? {};
    if (enabled) {
      if (userHasInteracted || !isAutoplayBlocked) {
        playBackgroundMusic().catch(() => {});
      }
    } else {
      pauseBackgroundMusic();
    }
  });
}

/**
 * Starts or resumes background music playback.
 * Preserves the existing playback position across page navigation.
 */
export async function playBackgroundMusic(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // Respect user sound preference (mute toggle)
  if (!getSoundEnabled()) {
    pauseBackgroundMusic();
    return false;
  }

  const audio = getBgmAudio();
  if (!audio) return false;

  if (isBgmPlaying()) {
    if (isAutoplayBlocked) {
      isAutoplayBlocked = false;
      notifyState();
    }
    return true;
  }

  if (playPromiseInProgress) {
    return playPromiseInProgress;
  }

  playPromiseInProgress = (async () => {
    try {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.then === "function") {
        await playPromise;
      }
      isAutoplayBlocked = false;
      notifyState();
      return true;
    } catch (err: unknown) {
      const errorName = (err as { name?: string })?.name;
      // Browser autoplay policy rejected playback without user gesture
      if (errorName === "NotAllowedError" || errorName === "AbortError") {
        isAutoplayBlocked = true;
      } else {
        console.warn("Background music playback failed gracefully:", err);
      }
      notifyState();
      return false;
    } finally {
      playPromiseInProgress = null;
    }
  })();

  return playPromiseInProgress;
}

/**
 * Pauses background music without resetting its playback position.
 */
export function pauseBackgroundMusic(): void {
  if (bgmAudioInstance && !bgmAudioInstance.paused) {
    try {
      bgmAudioInstance.pause();
    } catch {
      // ignore
    }
    notifyState();
  }
}

/**
 * Stops background music and resets playback position to the beginning.
 */
export function stopBackgroundMusic(): void {
  if (bgmAudioInstance) {
    try {
      bgmAudioInstance.pause();
      bgmAudioInstance.currentTime = 0;
    } catch {
      // ignore
    }
    notifyState();
  }
}

/**
 * Handles user interaction to unlock and start background music.
 */
export function handleBgmUserInteraction(): void {
  userHasInteracted = true;
  if (getSoundEnabled() && !isBgmPlaying()) {
    playBackgroundMusic().catch(() => {});
  }
}

/**
 * Initializes global browser interaction listeners and sound preference sync.
 * Runs once at application startup.
 */
export function initGlobalBgmListeners(): () => void {
  if (typeof window === "undefined" || isInitialized) {
    return () => {};
  }
  isInitialized = true;

  const onInteraction = () => {
    handleBgmUserInteraction();
    if (isBgmPlaying()) {
      removeInteractionListeners();
    }
  };

  const removeInteractionListeners = () => {
    window.removeEventListener("pointerdown", onInteraction);
    window.removeEventListener("click", onInteraction);
    window.removeEventListener("keydown", onInteraction);
    window.removeEventListener("touchstart", onInteraction);
  };

  window.addEventListener("pointerdown", onInteraction, { passive: true });
  window.addEventListener("click", onInteraction, { passive: true });
  window.addEventListener("keydown", onInteraction, { passive: true });
  window.addEventListener("touchstart", onInteraction, { passive: true });

  // Sync with sound toggle events (romantic_sound_pref_changed)
  const onSoundPrefChanged = (e: Event) => {
    const { enabled } = (e as CustomEvent<{ enabled: boolean }>).detail ?? {};
    if (enabled) {
      if (userHasInteracted || !isAutoplayBlocked) {
        playBackgroundMusic().catch(() => {});
      }
    } else {
      pauseBackgroundMusic();
    }
  };

  window.addEventListener("romantic_sound_pref_changed", onSoundPrefChanged);

  // Attempt initial playback if sound enabled (will succeed if browser allows, or safely flag isAutoplayBlocked)
  if (getSoundEnabled()) {
    playBackgroundMusic().catch(() => {});
  }

  return () => {
    removeInteractionListeners();
    window.removeEventListener("romantic_sound_pref_changed", onSoundPrefChanged);
    isInitialized = false;
  };
}

/** Reset BGM module state for test isolation */
export function _resetBgmForTesting(): void {
  if (bgmAudioInstance) {
    try {
      bgmAudioInstance.pause();
      bgmAudioInstance.currentTime = 0;
    } catch {
      // ignore
    }
    bgmAudioInstance = null;
  }
  isAutoplayBlocked = false;
  userHasInteracted = false;
  isInitialized = false;
  playPromiseInProgress = null;
  stateListeners.clear();
}
