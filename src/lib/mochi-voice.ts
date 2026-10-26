import { getSoundEnabled, getSharedAudioContext } from "./sounds";
import { setBgmVolume, DEFAULT_BGM_VOLUME, isBgmPlaying, isVideoBgmActive } from "./bgm";

/**
 * Client-Side Mochi Voice Coordinator.
 *
 * Requirements:
 * 1. Speaks all Mochi dialogue using one consistent character voice (voice ID JwxwlY78dl6Z7tocY1a6).
 * 2. Avoids overlapping speech: stops previous speech before beginning the next line.
 * 3. Preserves background music (with smooth ducking during speech) and all sound effects.
 * 4. Supports independent mute/unmute control (stored in localStorage under `mochi_voice_enabled`).
 * 5. Uses Mochi's authentic cute character audio identity from `bunny voice.mp3`.
 *    NEVER uses robotic, flat system TTS voices.
 */

const STORAGE_KEY = "mochi_voice_enabled";
export const BUNNY_VOICE_SAMPLE_URL = "/audio/mochi/bunny%20voice.mp3";

export type MochiEmotion = "happy" | "curious" | "laughing" | "worried" | "celebration" | "secret";

/**
 * The 6 distinct expressive vocal phrases in /audio/mochi/bunny voice.mp3.
 * Sliced with exact timestamps to match Mochi's emotional expressions.
 */
export const BUNNY_VOCAL_PHRASES: Record<MochiEmotion, { start: number; duration: number }> = {
  happy: { start: 0.1, duration: 2.7 },
  curious: { start: 3.2, duration: 2.7 },
  laughing: { start: 6.4, duration: 2.7 },
  worried: { start: 9.8, duration: 2.9 },
  celebration: { start: 13.5, duration: 2.8 },
  secret: { start: 16.8, duration: 3.0 },
};

/**
 * Maps dialogue content to Mochi's matching vocal expression in bunny voice.mp3.
 */
export function inferMochiEmotion(text: string): MochiEmotion {
  const lower = text.toLowerCase();
  if (
    lower.includes("yay") ||
    lower.includes("did it") ||
    lower.includes("forever") ||
    lower.includes("yes!") ||
    lower.includes("accomplished")
  ) {
    return "celebration";
  }
  if (lower.includes("hehe") || lower.includes("laugh") || lower.includes("haha")) {
    return "laughing";
  }
  if (
    lower.includes("?") ||
    lower.includes("wonder") ||
    /\bwait\b/.test(lower) ||
    lower.includes("look") ||
    lower.includes("clue") ||
    lower.includes("what's") ||
    /\bwho\b/.test(lower)
  ) {
    return "curious";
  }
  if (
    lower.includes("dark") ||
    lower.includes("worry") ||
    lower.includes("sweetheart") ||
    lower.includes("careful") ||
    lower.includes("umm")
  ) {
    return "worried";
  }
  if (
    lower.includes("shhh") ||
    lower.includes("secret") ||
    lower.includes("tablet") ||
    lower.includes("quiet") ||
    lower.includes("surprise")
  ) {
    return "secret";
  }
  return "happy";
}

// In-memory cache for generated TTS audio blob URLs
const audioBlobCache = new Map<string, string>();

let activeAudio: HTMLAudioElement | null = null;
let activeBufferSource: AudioBufferSourceNode | null = null;
let activeSourceStopTimer: ReturnType<typeof setTimeout> | null = null;
let activeAbortController: AbortController | null = null;
let isSpeakingState = false;
let bgmDucked = false;

// Cached decoded AudioBuffer of bunny voice.mp3 for zero-latency Web Audio playback
let cachedBunnyAudioBuffer: AudioBuffer | null = null;
let isDecodingBunnyVoice = false;

const speechListeners = new Set<(speaking: boolean) => void>();

function notifySpeechState(speaking: boolean) {
  isSpeakingState = speaking;
  speechListeners.forEach((fn) => {
    try {
      fn(speaking);
    } catch (err) {
      console.error("Speech state listener error:", err);
    }
  });
}

/** Subscribe to Mochi speech state changes (speaking / idle) */
export function subscribeMochiSpeechState(listener: (speaking: boolean) => void): () => void {
  speechListeners.add(listener);
  return () => {
    speechListeners.delete(listener);
  };
}

export function isMochiSpeaking(): boolean {
  return isSpeakingState;
}

// ─── Preference helpers ──────────────────────────────────────────────────────

export function getMochiVoiceEnabled(): boolean {
  if (typeof localStorage === "undefined") return false;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "true";
}

export function setMochiVoiceEnabled(enabled: boolean): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, String(enabled));
  if (!enabled) {
    stopMochiSpeech();
  }
  window.dispatchEvent(
    new CustomEvent("mochi_voice_pref_changed", { detail: { enabled } }),
  );
}

// Global listener to stop speech immediately if muted
if (typeof window !== "undefined") {
  window.addEventListener("mochi_voice_pref_changed", (e: Event) => {
    const { enabled } = (e as CustomEvent<{ enabled: boolean }>).detail ?? {};
    if (!enabled) {
      stopMochiSpeech();
    }
  });

  window.addEventListener("romantic_sound_pref_changed", (e: Event) => {
    const { enabled } = (e as CustomEvent<{ enabled: boolean }>).detail ?? {};
    if (!enabled) {
      stopMochiSpeech();
    }
  });
}

// ─── Ducking helpers for Background Music ────────────────────────────────────

function duckBgm() {
  if (typeof window === "undefined") return;
  if (isBgmPlaying() && !bgmDucked) {
    bgmDucked = true;
    setBgmVolume(0.12);
  }
}

function restoreBgm() {
  if (typeof window === "undefined" || isVideoBgmActive()) return;
  if (bgmDucked) {
    bgmDucked = false;
    setBgmVolume(DEFAULT_BGM_VOLUME);
  }
}

// ─── Overlap prevention & Stop Speech ────────────────────────────────────────

/**
 * Immediately stops any currently playing or in-flight Mochi speech.
 * Ensures the previous line stops completely before a new one can begin (Requirement 5).
 */
export function stopMochiSpeech(): void {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }

  if (activeSourceStopTimer) {
    clearTimeout(activeSourceStopTimer);
    activeSourceStopTimer = null;
  }

  if (activeBufferSource) {
    try {
      activeBufferSource.stop();
      activeBufferSource.disconnect();
    } catch {
      // ignore
    }
    activeBufferSource = null;
  }

  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio.src = "";
    } catch {
      // ignore
    }
    activeAudio = null;
  }

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }

  restoreBgm();
  notifySpeechState(false);
}

// ─── Authentic Bunny Character Voice (Direct from bunny voice.mp3) ──────────

/**
 * Plays Mochi's authentic cute character voice directly from bunny voice.mp3.
 * Slices the corresponding emotional phrase (happy, curious, laughing, worried, secret, celebration).
 */
export async function playBunnyCharacterVoice(
  emotionOrText: string,
  onEnded?: () => void,
): Promise<void> {
  if (typeof window === "undefined" || !getMochiVoiceEnabled() || !getSoundEnabled()) {
    onEnded?.();
    return;
  }

  const emotion: MochiEmotion =
    emotionOrText in BUNNY_VOCAL_PHRASES
      ? (emotionOrText as MochiEmotion)
      : inferMochiEmotion(emotionOrText);

  const phrase = BUNNY_VOCAL_PHRASES[emotion] ?? BUNNY_VOCAL_PHRASES["happy"];

  duckBgm();
  notifySpeechState(true);

  // Attempt Web Audio API for instantaneous, frame-accurate playback
  const ctx = getSharedAudioContext();

  if (ctx) {
    try {
      // Load and decode buffer once
      if (!cachedBunnyAudioBuffer && !isDecodingBunnyVoice) {
        isDecodingBunnyVoice = true;
        try {
          const res = await fetch(BUNNY_VOICE_SAMPLE_URL);
          const arrayBuf = await res.arrayBuffer();
          cachedBunnyAudioBuffer = await ctx.decodeAudioData(arrayBuf);
        } catch (e) {
          console.warn("Could not decode bunny voice with Web Audio:", e);
        } finally {
          isDecodingBunnyVoice = false;
        }
      }

      if (cachedBunnyAudioBuffer) {
        const source = ctx.createBufferSource();
        source.buffer = cachedBunnyAudioBuffer;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.9, ctx.currentTime);

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        activeBufferSource = source;

        source.onended = () => {
          if (activeBufferSource === source) {
            activeBufferSource = null;
          }
          restoreBgm();
          notifySpeechState(false);
          onEnded?.();
        };

        source.start(0, phrase.start, phrase.duration);

        activeSourceStopTimer = setTimeout(() => {
          try {
            source.stop();
          } catch {
            // ignore
          }
        }, phrase.duration * 1000 + 50);

        return;
      }
    } catch {
      // Fall through to HTMLAudioElement
    }
  }

  // Fallback to HTMLAudioElement
  try {
    const AudioCtor = window.Audio || Audio;
    if (!AudioCtor) {
      restoreBgm();
      notifySpeechState(false);
      onEnded?.();
      return;
    }

    const audio = new AudioCtor(BUNNY_VOICE_SAMPLE_URL);
    audio.volume = 0.9;
    activeAudio = audio;

    let stopped = false;
    const stopAudio = () => {
      if (stopped) return;
      stopped = true;
      try {
        audio.pause();
      } catch {
        // ignore
      }
      if (activeAudio === audio) {
        activeAudio = null;
      }
      restoreBgm();
      notifySpeechState(false);
      onEnded?.();
    };

    audio.currentTime = phrase.start;
    const timer = setTimeout(stopAudio, phrase.duration * 1000);

    audio.onended = () => {
      clearTimeout(timer);
      stopAudio();
    };
    audio.onerror = () => {
      clearTimeout(timer);
      stopAudio();
    };

    const p = audio.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        clearTimeout(timer);
        stopAudio();
      });
    }
  } catch {
    restoreBgm();
    notifySpeechState(false);
    onEnded?.();
  }
}

// ─── Speak Mochi Dialogue ────────────────────────────────────────────────────

/**
 * Speaks Mochi dialogue using one consistent character voice.
 * - When ElevenLabs is configured with an API key, generates spoken words in Voice ID JwxwlY78dl6Z7tocY1a6.
 * - When ElevenLabs is not configured (or in local mode), immediately plays Mochi's authentic
 *   cute character voice directly from bunny voice.mp3 matching the emotional expression.
 * - Never uses robotic Windows speech synthesis.
 */
export async function speakMochiDialogue(
  rawText: string,
  options?: { onEnded?: () => void; fallbackOnly?: boolean },
): Promise<void> {
  if (typeof window === "undefined") return;

  // Stop any currently playing line immediately before starting another (Requirement 5)
  stopMochiSpeech();

  // Guard: Check sound and voice preferences (Requirement 7)
  if (!getMochiVoiceEnabled() || !getSoundEnabled()) {
    return;
  }

  const text = rawText.trim();
  if (!text) return;

  if (options?.fallbackOnly) {
    await playBunnyCharacterVoice(text, options.onEnded);
    return;
  }

  // Check client-side blob cache for instant repeated playback
  const cachedBlobUrl = audioBlobCache.get(text);
  if (cachedBlobUrl) {
    playAudioUrl(cachedBlobUrl, options?.onEnded);
    return;
  }

  const controller = new AbortController();
  activeAbortController = controller;

  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    if (controller.signal.aborted) {
      return;
    }

    const contentType = response.headers.get("content-type") || "";

    // If server signals fallback or an unconfigured ElevenLabs key,
    // play Mochi's authentic bunny character voice directly!
    if (
      response.headers.get("x-tts-fallback") === "true" ||
      contentType.includes("application/json")
    ) {
      const data = await response.json().catch(() => ({ fallback: true }));
      if (data.fallback) {
        await playBunnyCharacterVoice(text, options?.onEnded);
        return;
      }
    }

    if (!response.ok) {
      await playBunnyCharacterVoice(text, options?.onEnded);
      return;
    }

    const blob = await response.blob();
    if (controller.signal.aborted) {
      return;
    }

    const blobUrl = URL.createObjectURL(blob);
    audioBlobCache.set(text, blobUrl);

    playAudioUrl(blobUrl, options?.onEnded);
  } catch (err: unknown) {
    if ((err as { name?: string })?.name === "AbortError") {
      return; // cancelled intentionally
    }
    // Network or server error: play authentic bunny voice
    await playBunnyCharacterVoice(text, options?.onEnded);
  } finally {
    if (activeAbortController === controller) {
      activeAbortController = null;
    }
  }
}

function playAudioUrl(url: string, onEnded?: () => void): void {
  try {
    const AudioCtor = window.Audio || Audio;
    if (!AudioCtor) {
      onEnded?.();
      return;
    }

    const audio = new AudioCtor(url);
    audio.volume = 0.95;
    activeAudio = audio;

    duckBgm();
    notifySpeechState(true);

    audio.onended = () => {
      if (activeAudio === audio) {
        activeAudio = null;
      }
      restoreBgm();
      notifySpeechState(false);
      onEnded?.();
    };

    audio.onerror = () => {
      if (activeAudio === audio) {
        activeAudio = null;
      }
      restoreBgm();
      notifySpeechState(false);
      onEnded?.();
    };

    const p = audio.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        if (activeAudio === audio) {
          activeAudio = null;
        }
        restoreBgm();
        notifySpeechState(false);
        onEnded?.();
      });
    }
  } catch {
    restoreBgm();
    notifySpeechState(false);
    onEnded?.();
  }
}

/** Reset internal audio state (used for testing) */
export function _resetMochiVoiceForTesting(): void {
  stopMochiSpeech();
  audioBlobCache.clear();
  speechListeners.clear();
  bgmDucked = false;
  isSpeakingState = false;
  cachedBunnyAudioBuffer = null;
}

export const MOCHI_LETTER_GUIDANCE =
  "Scroll down to reveal the heartfelt letter written just for you... ♡";

export const speakMochiGuidance = (text: string) => {
  speakMochiDialogue(text);
};

export const stopMochiVoice = stopMochiSpeech;
