import { useSound } from "@/hooks/use-sound";
import { playChime } from "@/lib/sounds";

/**
 * A floating toggle button that mutes/unmutes sound effects.
 * Appears as a small pill in the top-right corner of every page.
 */
export function SoundToggle() {
  const { soundEnabled, toggleSound } = useSound();

  const handleToggle = () => {
    toggleSound();
    // Play a quick chime when turning sound ON (satisfying feedback)
    if (!soundEnabled) {
      // Sound was off, turning on — schedule chime after the state updates
      setTimeout(() => playChime(), 50);
    }
  };

  return (
    <button
      type="button"
      id="sound-toggle"
      onClick={handleToggle}
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
  );
}
