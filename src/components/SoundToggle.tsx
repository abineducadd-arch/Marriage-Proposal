import { useSound } from "@/hooks/use-sound";
import { useMochiVoice } from "@/hooks/use-mochi-voice";
import { playChime } from "@/lib/sounds";

/**
 * Audio Controls Header:
 * 1. Sound FX & BGM toggle (#sound-toggle)
 * 2. Mochi Spoken Voice toggle (#mochi-voice-toggle)
 *
 * Placed in the top-right corner of every page.
 */
export function SoundToggle() {
  const { soundEnabled, toggleSound } = useSound();
  const { mochiVoiceEnabled, toggleMochiVoice } = useMochiVoice();

  const handleSoundToggle = () => {
    toggleSound();
    if (!soundEnabled) {
      setTimeout(() => playChime(), 50);
    }
  };

  const handleVoiceToggle = () => {
    toggleMochiVoice();
    if (!mochiVoiceEnabled) {
      setTimeout(() => playChime(), 50);
    }
  };

  return (
    <div className="sound-controls-container" role="region" aria-label="Audio controls">
      {/* Mochi Voice Toggle */}
      <button
        type="button"
        id="mochi-voice-toggle"
        onClick={handleVoiceToggle}
        aria-pressed={mochiVoiceEnabled}
        aria-label={mochiVoiceEnabled ? "Mute Mochi's voice" : "Unmute Mochi's voice"}
        className="sound-toggle mochi-voice-toggle"
        title={mochiVoiceEnabled ? "Mochi voice on — click to mute" : "Mochi voice off — click to unmute"}
      >
        <span className="sound-toggle-icon" aria-hidden="true">
          {mochiVoiceEnabled ? "🐰" : "🔇"}
        </span>
        <span className="sound-toggle-label">
          {mochiVoiceEnabled ? "Voice on" : "Voice off"}
        </span>
      </button>

      {/* Main Sound FX & BGM Toggle */}
      <button
        type="button"
        id="sound-toggle"
        onClick={handleSoundToggle}
        aria-pressed={soundEnabled}
        aria-label={soundEnabled ? "Mute sound effects" : "Unmute sound effects"}
        className="sound-toggle"
        title={soundEnabled ? "Sound on — click to mute" : "Sound off — click to unmute"}
      >
        <span className="sound-toggle-icon" aria-hidden="true">
          {soundEnabled ? "🔔" : "🔕"}
        </span>
        <span className="sound-toggle-label">{soundEnabled ? "Sound on" : "Sound off"}</span>
      </button>
    </div>
  );
}
