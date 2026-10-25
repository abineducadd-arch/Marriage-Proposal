import continueSoundUrl from "@/assets/sounds/continue-sound.mp3";
import doorSoundUrl from "@/assets/sounds/door-sound.mp3";
import peelSoundUrl from "@/assets/sounds/peel-sound.wav";

/**
 * Romantic Sound Effects — Audio files and Web Audio API synthesizer.
 * Sounds are silenced when muted via the proposal sound toggle.
 */

const STORAGE_KEY = "romantic_sounds_enabled";

// ─── Preference helpers ────────────────────────────────────────────────────

export function getSoundEnabled(): boolean {
  if (typeof localStorage === "undefined") return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  // Default to enabled if nothing stored yet
  return stored === null ? true : stored === "true";
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, String(enabled));
  window.dispatchEvent(new CustomEvent("romantic_sound_pref_changed", { detail: { enabled } }));
}

// ─── AudioContext singleton ────────────────────────────────────────────────

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_ctx) {
    try {
      _ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  // Resume context if suspended (browser autoplay policy)
  if (_ctx.state === "suspended") {
    _ctx.resume().catch(() => {});
  }
  return _ctx;
}

// ─── Guard — only play when sound pref is on ─────────────────────────────

function canPlay(): boolean {
  return getSoundEnabled();
}

/** Plays an audio asset file with fallback support */
function playAudioFile(url: string, volume = 0.85, fallback?: () => void) {
  if (typeof window === "undefined" || !canPlay()) return;
  try {
    if (typeof Audio === "undefined") {
      fallback?.();
      return;
    }
    const audio = new Audio(url);
    audio.volume = Math.max(0, Math.min(1, volume));
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        fallback?.();
      });
    }
  } catch {
    fallback?.();
  }
}

// ─── Low-level helpers ────────────────────────────────────────────────────

/** Ramps gain from 0 → peak → 0 over the given window. */
function envelope(
  gain: GainNode,
  ctx: AudioContext,
  start: number,
  attack: number,
  sustain: number,
  release: number,
  peak = 0.4,
) {
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + attack);
  gain.gain.setValueAtTime(peak, start + attack + sustain);
  gain.gain.linearRampToValueAtTime(0, start + attack + sustain + release);
}

/** Plays a single sine tone with an ADSR envelope. */
function tone(
  ctx: AudioContext,
  freq: number,
  start: number,
  attack: number,
  sustain: number,
  release: number,
  peak = 0.35,
  type: OscillatorType = "sine",
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0, start);
  envelope(gain, ctx, start, attack, sustain, release, peak);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + attack + sustain + release + 0.05);
}

// ─── Sound library ────────────────────────────────────────────────────────

/**
 * Continue sound — plays continue sound.mp3.
 * Used for dialogue and story "Continue" button clicks.
 */
export function playContinue() {
  if (!canPlay()) return;
  playAudioFile(continueSoundUrl, 0.85, () => {
    // Soft chime fallback if audio file cannot play
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    tone(ctx, 880, t, 0.01, 0.05, 0.3, 0.22);
    tone(ctx, 1320, t + 0.12, 0.01, 0.04, 0.28, 0.18);
  });
}

/**
 * Kept for backward compatibility with components calling playChime.
 * Triggers playContinue() so continue button clicks use continue sound.mp3.
 */
export function playChime() {
  playContinue();
}

/**
 * Magic sparkle — ascending arpeggio.
 * Used when an interactive object is opened on Page 2.
 */
export function playSparkle() {
  if (!canPlay()) return;
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    tone(ctx, freq, t + i * 0.085, 0.01, 0.04, 0.22, 0.2);
  });
}

/**
 * Light switch click — soft "pop" transient.
 * Used when the room lights come on.
 */
export function playLightSwitch() {
  if (!canPlay()) return;
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  // Short noise burst mimicking a switch click
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) * 0.8;
  }
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800;
  filter.Q.value = 0.7;
  src.buffer = buf;
  gain.gain.setValueAtTime(0.5, t);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(t);
  // Warm "pop" tone alongside
  tone(ctx, 330, t, 0.005, 0.01, 0.08, 0.15, "triangle");
}

/**
 * Door creak / open effect — uses door sound.mp3.
 * Used when the mysterious door or secret passage is opened on Page 2.
 */
export function playDoorOpen() {
  if (!canPlay()) return;
  playAudioFile(doorSoundUrl, 0.9, () => {
    // Procedural creak fallback
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.6);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.05);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.55);
    gain.gain.linearRampToValueAtTime(0, t + 0.75);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 600;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.8);
  });
}

/**
 * Peeling sound — realistic paper peeling effect.
 * Plays when peeling the screen off from the 1st page.
 */
export function playPeelSound() {
  if (!canPlay()) return;
  playAudioFile(peelSoundUrl, 0.95, () => {
    playProceduralPeel();
  });
}

/** Procedural Web Audio paper peel synthesizer */
export function playProceduralPeel() {
  if (!canPlay()) return;
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const duration = 1.1;

  // Textured paper noise
  const sampleRate = ctx.sampleRate;
  const frameCount = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);

  let lastOut = 0.0;
  for (let i = 0; i < frameCount; i++) {
    const progress = i / frameCount;
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut * 0.92) + (white * 0.08);
    const crackle = Math.random() > 0.94 ? (Math.random() * 2 - 1) * 0.4 : 0;
    const env = progress < 0.15
      ? progress / 0.15
      : progress < 0.65
        ? 1.0 - (progress - 0.15) * 0.4
        : Math.max(0, 0.8 - (progress - 0.65) * 2.2);
    data[i] = (lastOut * 0.7 + crackle + white * 0.15) * env;
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = buffer;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.setValueAtTime(600, t);
  bandpass.frequency.exponentialRampToValueAtTime(3000, t + 0.5);
  bandpass.frequency.exponentialRampToValueAtTime(1000, t + duration);
  bandpass.Q.setValueAtTime(1.8, t);

  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.setValueAtTime(400, t);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.4, t + 0.08);
  gain.gain.setValueAtTime(0.35, t + 0.4);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  noiseSource.connect(bandpass);
  bandpass.connect(highpass);
  highpass.connect(gain);
  gain.connect(ctx.destination);

  noiseSource.start(t);
  noiseSource.stop(t + duration);

  // Aerodynamic swoosh
  const whooshOsc = ctx.createOscillator();
  const whooshGain = ctx.createGain();
  const whooshFilter = ctx.createBiquadFilter();

  whooshOsc.type = "sine";
  whooshOsc.frequency.setValueAtTime(160, t + 0.2);
  whooshOsc.frequency.exponentialRampToValueAtTime(70, t + 0.85);

  whooshFilter.type = "lowpass";
  whooshFilter.frequency.setValueAtTime(350, t + 0.2);

  whooshGain.gain.setValueAtTime(0, t + 0.2);
  whooshGain.gain.linearRampToValueAtTime(0.18, t + 0.45);
  whooshGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

  whooshOsc.connect(whooshFilter);
  whooshFilter.connect(whooshGain);
  whooshGain.connect(ctx.destination);

  whooshOsc.start(t + 0.2);
  whooshOsc.stop(t + 0.95);

  // Soft sparkle tone
  tone(ctx, 1046.5, t + 0.65, 0.01, 0.04, 0.35, 0.08);
}

/**
 * Celebration fanfare — a bright ascending four-note motif.
 * Used when the user clicks "YES!" on the proposal.
 */
export function playCelebration() {
  if (!canPlay()) return;
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  // Melody line
  const melody = [523.25, 659.25, 783.99, 1046.5, 1318.51];
  melody.forEach((freq, i) => {
    tone(ctx, freq, t + i * 0.11, 0.01, 0.06, 0.35, 0.28);
  });
  // Bass support
  tone(ctx, 130.81, t, 0.02, 0.1, 0.6, 0.18, "triangle");
  tone(ctx, 164.81, t + 0.22, 0.02, 0.08, 0.5, 0.14, "triangle");
}

/**
 * Soft pop — the "No" button getting cracked.
 * Slightly comic, slightly sad.
 */
export function playNoPop() {
  if (!canPlay()) return;
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  // Descending "boing"
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(220, t + 0.18);
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.linearRampToValueAtTime(0, t + 0.22);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.25);
}

/**
 * Transition whoosh — a soft sweeping sound.
 * Used for page transitions and the folded corner reveal.
 */
export function playTransition() {
  if (!canPlay()) return;
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(200, t);
  filter.frequency.exponentialRampToValueAtTime(2000, t + 0.5);
  filter.Q.value = 1.2;
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(80, t);
  osc.frequency.exponentialRampToValueAtTime(440, t + 0.5);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.15, t + 0.1);
  gain.gain.linearRampToValueAtTime(0, t + 0.55);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.6);
  // High sparkle on top
  tone(ctx, 1760, t + 0.35, 0.01, 0.03, 0.25, 0.12);
  tone(ctx, 2093, t + 0.45, 0.01, 0.02, 0.2, 0.1);
}

/**
 * Secret passage unlock — a magical "ding" chord.
 * Used when all three objects are found and the passage appears.
 */
export function playUnlock() {
  if (!canPlay()) return;
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  // Major triad arpeggio
  const chord = [523.25, 659.25, 783.99, 1046.5];
  chord.forEach((freq, i) => {
    tone(ctx, freq, t + i * 0.07, 0.01, 0.08, 0.55, 0.24);
  });
}

/**
 * Heart beat — two soft thuds.
 * Used on the proposal letter reveal.
 */
export function playHeartbeat() {
  if (!canPlay()) return;
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const beat = (start: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(80, start);
    osc.frequency.exponentialRampToValueAtTime(40, start + 0.1);
    gain.gain.setValueAtTime(0.4, start);
    gain.gain.linearRampToValueAtTime(0, start + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.15);
  };
  beat(t);
  beat(t + 0.25);
}
