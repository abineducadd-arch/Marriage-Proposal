import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  sanitizeDialogueForSpeech,
  generateMochiSpeech,
  handleTtsRequest,
  DEFAULT_MOCHI_VOICE_ID,
} from "@/lib/server-tts";
import {
  getMochiVoiceEnabled,
  setMochiVoiceEnabled,
  stopMochiSpeech,
  speakMochiDialogue,
  _resetMochiVoiceForTesting,
  speakMochiGuidance,
  stopMochiVoice,
  MOCHI_LETTER_GUIDANCE,
  BUNNY_VOCAL_PHRASES,
  inferMochiEmotion,
  playBunnyCharacterVoice,
} from "@/lib/mochi-voice";
import * as sounds from "@/lib/sounds";

describe("Mochi Character Voice System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    _resetMochiVoiceForTesting();
    sounds.setSoundEnabled(true);
  });

  afterEach(() => {
    _resetMochiVoiceForTesting();
  });

  describe("1. Text sanitization for speech", () => {
    it("strips UI emojis and decorative symbols so they are not read aloud", () => {
      const raw = "Hiii, you! ♡ Someone has been waiting to tell you something special... ✨👀";
      const sanitized = sanitizeDialogueForSpeech(raw);
      expect(sanitized).toBe("Hiii, you! Someone has been waiting to tell you something special...");
      expect(sanitized).not.toContain("♡");
      expect(sanitized).not.toContain("✨");
      expect(sanitized).not.toContain("👀");
    });

    it("normalizes excessive whitespace and punctuation", () => {
      const raw = "YAYYY!!!!!   You found it!   ♡   ";
      const sanitized = sanitizeDialogueForSpeech(raw);
      expect(sanitized).toBe("YAYYY! You found it!");
    });

    it("caps dialogue length to prevent abuse", () => {
      const longText = "a".repeat(700);
      const sanitized = sanitizeDialogueForSpeech(longText);
      expect(sanitized.length).toBeLessThanOrEqual(500);
    });

    it("handles empty or whitespace-only strings safely", () => {
      expect(sanitizeDialogueForSpeech("")).toBe("");
      expect(sanitizeDialogueForSpeech("   ")).toBe("");
      expect(sanitizeDialogueForSpeech("♡ ✨")).toBe("");
    });
  });

  describe("2. Server TTS generation & provider handling", () => {
    it("uses the configured Mochi voice ID JwxwlY78dl6Z7tocY1a6 by default", () => {
      expect(DEFAULT_MOCHI_VOICE_ID).toBe("JwxwlY78dl6Z7tocY1a6");
    });

    it("returns graceful fallback if ELEVENLABS_API_KEY is not configured", async () => {
      const result = await generateMochiSpeech("Hello world!", {
        apiKey: "",
        voiceId: DEFAULT_MOCHI_VOICE_ID,
      });

      expect(result.fallback).toBe(true);
      expect(result.message).toContain("ElevenLabs API key is not configured");
    });

    it("calls ElevenLabs TTS endpoint with proper headers when API key is provided", async () => {
      const mockAudioData = new Uint8Array([1, 2, 3, 4]);
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(mockAudioData, {
          status: 200,
          headers: { "Content-Type": "audio/mpeg" },
        }),
      );

      const result = await generateMochiSpeech("Hello sweet bunny!", {
        apiKey: "test_key_123",
        voiceId: "JwxwlY78dl6Z7tocY1a6",
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.elevenlabs.io/v1/text-to-speech/JwxwlY78dl6Z7tocY1a6",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "xi-api-key": "test_key_123",
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          }),
        }),
      );

      expect(result.fallback).toBeFalsy();
      expect(result.buffer).toBeDefined();
      expect(result.contentType).toBe("audio/mpeg");
    });

    it("handles /api/tts HTTP requests gracefully", async () => {
      const request = new Request("http://localhost/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Hiii, you! ♡" }),
      });

      const response = await handleTtsRequest(request);
      expect(response).toBeDefined();
      expect([200, 400, 405]).toContain(response.status);

      const json = await response.json();
      expect(json.fallback).toBe(true);
    });
  });

  describe("3. Client voice preferences & mute control", () => {
    it("defaults to voice disabled if nothing in localStorage", () => {
      expect(getMochiVoiceEnabled()).toBe(false);
    });

    it("persists voice mute/unmute state in localStorage", () => {
      setMochiVoiceEnabled(false);
      expect(getMochiVoiceEnabled()).toBe(false);
      expect(localStorage.getItem("mochi_voice_enabled")).toBe("false");

      setMochiVoiceEnabled(true);
      expect(getMochiVoiceEnabled()).toBe(true);
      expect(localStorage.getItem("mochi_voice_enabled")).toBe("true");
    });

    it("dispatches window event on preference change", () => {
      const listener = vi.fn();
      window.addEventListener("mochi_voice_pref_changed", listener);

      setMochiVoiceEnabled(false);
      expect(listener).toHaveBeenCalled();

      window.removeEventListener("mochi_voice_pref_changed", listener);
    });
  });

  describe("4. Authentic Bunny Voice Sample Mapping", () => {
    it("defines 6 distinct vocal phrases matching Mochi's emotional expressions", () => {
      expect(BUNNY_VOCAL_PHRASES.happy.duration).toBeGreaterThan(0);
      expect(BUNNY_VOCAL_PHRASES.curious.duration).toBeGreaterThan(0);
      expect(BUNNY_VOCAL_PHRASES.laughing.duration).toBeGreaterThan(0);
      expect(BUNNY_VOCAL_PHRASES.worried.duration).toBeGreaterThan(0);
      expect(BUNNY_VOCAL_PHRASES.celebration.duration).toBeGreaterThan(0);
      expect(BUNNY_VOCAL_PHRASES.secret.duration).toBeGreaterThan(0);
    });

    it("infers matching emotions from dialogue text accurately", () => {
      expect(inferMochiEmotion("YAYYY! You did it!")).toBe("celebration");
      expect(inferMochiEmotion("Hehe! That was so fun!")).toBe("laughing");
      expect(inferMochiEmotion("Wait... what is that on the wall?")).toBe("curious");
      expect(inferMochiEmotion("Umm... it's a little dark in here...")).toBe("worried");
      expect(inferMochiEmotion("Shhh... it's a little secret!")).toBe("secret");
      expect(inferMochiEmotion("Hiii, you! Someone has been waiting for you.")).toBe("happy");
    });

    it("plays bunny character voice without throwing errors", async () => {
      await expect(playBunnyCharacterVoice("happy")).resolves.not.toThrow();
    });
  });

  describe("5. Overlap prevention & speech sequencing", () => {
    it("aborts in-flight request and stops audio before starting new dialogue", async () => {
      const cancelSpy = vi.fn();
      window.speechSynthesis = {
        cancel: cancelSpy,
        speak: vi.fn(),
        getVoices: vi.fn().mockReturnValue([]),
      } as unknown as SpeechSynthesis;

      // First line
      await speakMochiDialogue("First line of dialogue", { fallbackOnly: true });
      expect(cancelSpy).toHaveBeenCalledTimes(1);

      // Second line stops the previous one immediately
      await speakMochiDialogue("Second line of dialogue", { fallbackOnly: true });
      expect(cancelSpy).toHaveBeenCalledTimes(2);
    });

    it("does not play when Mochi voice is muted", async () => {
      const playSpy = vi.fn();
      const originalAudio = window.Audio;
      window.Audio = vi.fn().mockImplementation(() => ({
        play: playSpy,
        pause: vi.fn(),
      })) as unknown as typeof Audio;

      try {
        setMochiVoiceEnabled(false);
        await speakMochiDialogue("Should not speak", { fallbackOnly: true });
        expect(playSpy).not.toHaveBeenCalled();
      } finally {
        window.Audio = originalAudio;
      }
    });

    it("does not play when global sounds are muted", async () => {
      const playSpy = vi.fn();
      const originalAudio = window.Audio;
      window.Audio = vi.fn().mockImplementation(() => ({
        play: playSpy,
        pause: vi.fn(),
      })) as unknown as typeof Audio;

      try {
        sounds.setSoundEnabled(false);
        await speakMochiDialogue("Should not speak", { fallbackOnly: true });
        expect(playSpy).not.toHaveBeenCalled();
      } finally {
        window.Audio = originalAudio;
      }
    });
  });

  describe("6. Compatibility and helper exports", () => {
    it("exports MOCHI_LETTER_GUIDANCE as a non-empty string", () => {
      expect(typeof MOCHI_LETTER_GUIDANCE).toBe("string");
      expect(MOCHI_LETTER_GUIDANCE.length).toBeGreaterThan(0);
    });

    it("provides speakMochiGuidance and stopMochiVoice without throwing", () => {
      expect(() => speakMochiGuidance("Test speech")).not.toThrow();
      expect(() => stopMochiVoice()).not.toThrow();
    });
  });
});
