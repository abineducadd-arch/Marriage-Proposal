import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import * as sounds from "@/lib/sounds";
import * as bgm from "@/lib/bgm";
import { WelcomePage } from "@/pages/WelcomePage";
import { PageTwo } from "@/pages/PageTwo";
import { PageThree } from "@/pages/PageThree";
import { SoundToggle } from "@/components/SoundToggle";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import { FoldedCorner } from "@/components/FoldedCorner";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

type GlobalAudioTarget = { Audio: typeof Audio | undefined };

describe("Romantic Proposal Website Sound Effects Mapping & Verification", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    sounds.setSoundEnabled(true);
    sounds._resetAudioCooldowns();
    bgm._resetBgmForTesting();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    bgm._resetBgmForTesting();
  });

  describe("1. Audio file mapping", () => {
    it("maps the exact audio files provided by the user with their file extensions", () => {
      expect(decodeURIComponent(sounds.SOUND_URLS.continue)).toContain("continue button.wav");
      expect(decodeURIComponent(sounds.SOUND_URLS.switch)).toContain("switch sound.wav");
      expect(decodeURIComponent(sounds.SOUND_URLS.transmission)).toContain(
        "transmission sound.wav",
      );
      expect(decodeURIComponent(sounds.SOUND_URLS.peel)).toContain("paper peeling.mp3");
      expect(decodeURIComponent(sounds.SOUND_URLS.bgm)).toContain("background sound.mp3");
      expect(decodeURIComponent(sounds.SOUND_URLS.peel)).not.toContain("peel-sound.wav");
    });
  });

  describe("2. Mochi conversation buttons play continue sound", () => {
    it("plays continue sound on WelcomePage when clicking Continue during Mochi's dialogue", () => {
      const playContinueSpy = vi.spyOn(sounds, "playContinue");
      render(<WelcomePage />);

      const continueBtn = screen.getByRole("button", { name: /continue/i });
      act(() => {
        fireEvent.click(continueBtn);
      });

      expect(playContinueSpy).toHaveBeenCalledTimes(1);
    });

    it("plays continue sound on Page 2 during Mochi's door guidance", () => {
      const playContinueSpy = vi.spyOn(sounds, "playContinue");
      render(<PageTwo />);

      const mochiActionBtn = screen.getByRole("button", { name: /what's behind it\?/i });
      act(() => {
        fireEvent.click(mochiActionBtn);
      });

      expect(playContinueSpy).toHaveBeenCalledTimes(1);
    });

    it("plays continue sound on Page 2 during Mochi's dark room dialogue", () => {
      const playContinueSpy = vi.spyOn(sounds, "playContinue");
      render(<PageTwo />);

      // Knock and open door
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: /what's behind it\?/i }));
      });
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: /open the mysterious door/i }));
      });
      // Advance past opening animation (1800ms)
      act(() => {
        vi.advanceTimersByTime(1900);
      });
      // Advance past dark room guide delay (900ms)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Mochi dark room guidance
      const continueBtn = screen.getByRole("button", { name: /continue/i });
      act(() => {
        fireEvent.click(continueBtn);
      });

      expect(playContinueSpy).toHaveBeenCalledTimes(2); // 1 from earlier door dialogue + 1 now
    });

    it("plays continue sound on Page 3 during Mochi's intro guide conversation", () => {
      const playContinueSpy = vi.spyOn(sounds, "playContinue");
      render(<PageThree />);

      act(() => {
        vi.advanceTimersByTime(2500);
      });

      const mochiContinue = screen.getByRole("button", { name: /continue/i });
      act(() => {
        fireEvent.click(mochiContinue);
      });

      expect(playContinueSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("3. Hidden switch on Page 2 plays switch sound", () => {
    it("plays switch sound exactly once when activating the hidden switch and lights the room", () => {
      const playSwitchSpy = vi.spyOn(sounds, "playLightSwitch");
      render(<PageTwo />);

      // Open door and transition to dark room
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: /what's behind it\?/i }));
      });
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: /open the mysterious door/i }));
      });
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const switchBtn = screen.getByRole("button", { name: /turn on the light switch/i });

      // Focus / reveal switch
      act(() => {
        fireEvent.focus(switchBtn);
      });

      // Activate switch
      act(() => {
        fireEvent.click(switchBtn, { detail: 0 });
      });

      expect(playSwitchSpy).toHaveBeenCalledTimes(1);

      // Subsequent clicks when room is lit do not re-trigger
      act(() => {
        fireEvent.click(switchBtn, { detail: 0 });
      });
      expect(playSwitchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("4. Page 3 transmission screen buttons play transmission sound", () => {
    it("plays transmission sound on Activate the screen, transmission progression, and Open the message", () => {
      const playTransmissionSpy = vi.spyOn(sounds, "playTransmission");
      const playContinueSpy = vi.spyOn(sounds, "playContinue");
      render(<PageThree />);

      act(() => {
        vi.advanceTimersByTime(2500);
      });

      // 1. Advance Mochi guide (plays continue, NOT transmission)
      const continueIntro = screen.getByRole("button", { name: /continue/i });
      act(() => {
        fireEvent.click(continueIntro);
      });
      expect(playContinueSpy).toHaveBeenCalledTimes(1);
      expect(playTransmissionSpy).toHaveBeenCalledTimes(0);

      // 2. Activate the screen button on transmission screen
      const activateScreenBtn = screen.getByRole("button", { name: /activate the screen/i });
      act(() => {
        fireEvent.click(activateScreenBtn);
      });
      expect(playTransmissionSpy).toHaveBeenCalledTimes(1);

      // 3. Continue transmission buttons on transmission screen
      for (let i = 0; i < 5; i++) {
        const transBtn = screen.queryByRole("button", { name: /continue transmission/i });
        if (transBtn) {
          act(() => {
            fireEvent.click(transBtn);
          });
        }
      }
      expect(playTransmissionSpy).toHaveBeenCalledTimes(6);

      // 4. Check the incoming message button on transmission screen
      const checkIncomingBtn = screen.getByRole("button", { name: /check the incoming message/i });
      act(() => {
        fireEvent.click(checkIncomingBtn);
      });
      expect(playTransmissionSpy).toHaveBeenCalledTimes(7);

      // 5. Open the message button on transmission screen
      const openMsgBtn = screen.getByRole("button", { name: /open the message/i });
      act(() => {
        fireEvent.click(openMsgBtn);
      });
      expect(playTransmissionSpy).toHaveBeenCalledTimes(8);
    });
  });

  describe("5. Unrelated buttons do not trigger these sounds", () => {
    it("SoundToggle does NOT trigger playContinue, playSwitch, or playTransmission", () => {
      const playContinueSpy = vi.spyOn(sounds, "playContinue");
      const playSwitchSpy = vi.spyOn(sounds, "playSwitch");
      const playTransmissionSpy = vi.spyOn(sounds, "playTransmission");
      const playChimeSpy = vi.spyOn(sounds, "playChime");

      render(<SoundToggle />);
      const toggle = screen.getByRole("button", { name: /sound effects/i });

      // Turn off
      act(() => {
        fireEvent.click(toggle);
      });
      // Turn back on
      act(() => {
        fireEvent.click(toggle);
        vi.advanceTimersByTime(100);
      });

      expect(playChimeSpy).toHaveBeenCalled();
      expect(playContinueSpy).not.toHaveBeenCalled();
      expect(playSwitchSpy).not.toHaveBeenCalled();
      expect(playTransmissionSpy).not.toHaveBeenCalled();
    });

    it("clicking room objects on Page 2 plays sparkle, not continue/switch/transmission", () => {
      const playSparkleSpy = vi.spyOn(sounds, "playSparkle");
      const playContinueSpy = vi.spyOn(sounds, "playContinue");
      const playSwitchSpy = vi.spyOn(sounds, "playSwitch");
      const playTransmissionSpy = vi.spyOn(sounds, "playTransmission");

      render(<PageTwo />);

      // Knock and open door
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: /what's behind it\?/i }));
      });
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: /open the mysterious door/i }));
      });
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Activate switch
      const switchBtn = screen.getByRole("button", { name: /turn on the light switch/i });
      act(() => {
        fireEvent.focus(switchBtn);
        fireEvent.click(switchBtn, { detail: 0 });
      });

      // Advance Mochi's light lines
      for (let i = 0; i < 3; i++) {
        const cBtn = screen.queryByRole("button", { name: /continue|let's explore/i });
        if (cBtn) {
          act(() => {
            fireEvent.click(cBtn);
          });
        }
      }

      playContinueSpy.mockClear();
      playSwitchSpy.mockClear();

      // Click treasure object
      const chocolateBtn = screen.getByRole("button", { name: /explore chocolate box/i });
      act(() => {
        fireEvent.click(chocolateBtn);
      });

      expect(playSparkleSpy).toHaveBeenCalledTimes(1);
      expect(playContinueSpy).not.toHaveBeenCalled();
      expect(playSwitchSpy).not.toHaveBeenCalled();
      expect(playTransmissionSpy).not.toHaveBeenCalled();
    });
  });

  describe("6. Single click duplicate protection", () => {
    it("ignores duplicate audio playback within minimal interval threshold", () => {
      const audioPlayMock = vi.fn().mockResolvedValue(undefined);
      const originalWindowAudio = window.Audio;
      const originalGlobalAudio = (globalThis as unknown as GlobalAudioTarget).Audio;

      class MockAudio {
        play = audioPlayMock;
        volume = 1;
      }

      window.Audio = MockAudio as unknown as typeof Audio;
      (globalThis as unknown as GlobalAudioTarget).Audio = MockAudio as unknown as typeof Audio;

      try {
        sounds._resetAudioCooldowns();

        // First click
        sounds.playContinue();
        expect(audioPlayMock).toHaveBeenCalledTimes(1);

        // Immediate second invocation from duplicate event in same tick / under 60ms
        sounds.playContinue();
        expect(audioPlayMock).toHaveBeenCalledTimes(1);

        // After cooldown interval passes
        vi.advanceTimersByTime(100);
        sounds.playContinue();
        expect(audioPlayMock).toHaveBeenCalledTimes(2);
      } finally {
        window.Audio = originalWindowAudio;
        (globalThis as unknown as GlobalAudioTarget).Audio = originalGlobalAudio;
      }
    });

    it("does not play any audio when sound is muted via toggle preference", () => {
      const audioPlayMock = vi.fn().mockResolvedValue(undefined);
      const originalWindowAudio = window.Audio;
      const originalGlobalAudio = (globalThis as unknown as GlobalAudioTarget).Audio;

      class MockAudio {
        play = audioPlayMock;
        volume = 1;
      }

      window.Audio = MockAudio as unknown as typeof Audio;
      (globalThis as unknown as GlobalAudioTarget).Audio = MockAudio as unknown as typeof Audio;

      try {
        sounds._resetAudioCooldowns();
        sounds.setSoundEnabled(false);

        sounds.playContinue();
        sounds.playSwitch();
        sounds.playTransmission();

        expect(audioPlayMock).not.toHaveBeenCalled();
      } finally {
        window.Audio = originalWindowAudio;
        (globalThis as unknown as GlobalAudioTarget).Audio = originalGlobalAudio;
      }
    });
  });

  describe("7. Page 1 Paper-Peeling Sound (paper peeling.mp3)", () => {
    it("plays paper peeling.mp3 during FoldedCorner peeling on Page 1 and does not play old sound", () => {
      const playPeelSpy = vi.spyOn(sounds, "playPeelSound");
      const onPeelComplete = vi.fn();

      render(<FoldedCorner active={true} onPeelComplete={onPeelComplete} />);
      const cornerButton = screen.getByRole("button", { name: /peel the page corner/i });

      act(() => {
        fireEvent.click(cornerButton);
      });

      expect(playPeelSpy).toHaveBeenCalledTimes(1);
      expect(decodeURIComponent(sounds.SOUND_URLS.peel)).toContain("paper peeling.mp3");
      expect(decodeURIComponent(sounds.SOUND_URLS.peel)).not.toContain("peel-sound.wav");
    });

    it("does NOT play paper-peeling sound on Page 2 or Page 3 interactions", () => {
      const playPeelSpy = vi.spyOn(sounds, "playPeelSound");

      // Render Page 2 and perform interactions
      const { unmount: unmountP2 } = render(<PageTwo />);
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: /what's behind it\?/i }));
      });
      expect(playPeelSpy).not.toHaveBeenCalled();
      unmountP2();

      // Render Page 3 and advance timers
      render(<PageThree />);
      act(() => {
        vi.advanceTimersByTime(2500);
      });
      expect(playPeelSpy).not.toHaveBeenCalled();
    });

    it("cleans up active peeling audio when stopPeelSound is invoked", () => {
      const audioPauseMock = vi.fn();
      const originalWindowAudio = window.Audio;
      const originalGlobalAudio = (globalThis as unknown as GlobalAudioTarget).Audio;

      class MockAudio {
        play = vi.fn().mockResolvedValue(undefined);
        pause = audioPauseMock;
        volume = 1;
        currentTime = 0.5;
      }

      window.Audio = MockAudio as unknown as typeof Audio;
      (globalThis as unknown as GlobalAudioTarget).Audio = MockAudio as unknown as typeof Audio;

      try {
        sounds.playPeelSound();
        sounds.stopPeelSound();
        expect(audioPauseMock).toHaveBeenCalled();
      } finally {
        window.Audio = originalWindowAudio;
        (globalThis as unknown as GlobalAudioTarget).Audio = originalGlobalAudio;
      }
    });
  });

  describe("8. Global Persistent Background Music (background sound.mp3)", () => {
    it("configures continuous loop, romantic volume, and exact background sound.mp3", () => {
      const audio = bgm.getBgmAudio();
      expect(audio).not.toBeNull();
      expect(audio?.loop).toBe(true);
      expect(audio?.volume).toBeCloseTo(bgm.DEFAULT_BGM_VOLUME, 2);
      expect(decodeURIComponent(audio?.src || "")).toContain("background sound.mp3");
    });

    it("uses a persistent singleton audio controller across multiple calls", () => {
      const audio1 = bgm.getBgmAudio();
      const audio2 = bgm.getBgmAudio();
      expect(audio1).toBe(audio2);
    });

    it("starts background music on first user interaction on Page 1", () => {
      const bgmSpy = vi.spyOn(bgm, "handleBgmUserInteraction");
      render(<WelcomePage />);

      const advanceBtn = screen.getByRole("button", { name: /continue/i });
      act(() => {
        fireEvent.click(advanceBtn);
      });

      expect(bgmSpy).toHaveBeenCalled();
    });

    it("pauses background music when sound is muted and resumes from current position when unmuted", async () => {
      const currentTime = 14.5;
      const playSpy = vi.fn();
      const pauseSpy = vi.fn();

      const originalWindowAudio = window.Audio;
      const originalGlobalAudio = (globalThis as unknown as GlobalAudioTarget).Audio;

      class MockAudio {
        currentTime = currentTime;
        loop = true;
        volume = 0.28;
        paused = true;
        ended = false;
        preload = "auto";
        addEventListener = vi.fn();
        removeEventListener = vi.fn();
        play = playSpy.mockImplementation(() => {
          this.paused = false;
          return Promise.resolve();
        });
        pause = pauseSpy.mockImplementation(() => {
          this.paused = true;
        });
      }

      window.Audio = MockAudio as unknown as typeof Audio;
      (globalThis as unknown as GlobalAudioTarget).Audio = MockAudio as unknown as typeof Audio;

      try {
        bgm._resetBgmForTesting();
        sounds.setSoundEnabled(true);

        // Start playback
        await act(async () => {
          await bgm.playBackgroundMusic();
        });
        const audio = bgm.getBgmAudio() as unknown as MockAudio;
        expect(playSpy).toHaveBeenCalledTimes(1);
        expect(audio.paused).toBe(false);

        // User mutes sound via toggle preference
        act(() => {
          sounds.setSoundEnabled(false);
        });
        expect(pauseSpy).toHaveBeenCalled();
        expect(audio.paused).toBe(true);
        // Playback position remains preserved
        expect(audio.currentTime).toBe(currentTime);

        // User unmutes sound
        act(() => {
          sounds.setSoundEnabled(true);
        });
        expect(playSpy).toHaveBeenCalledTimes(2);
        expect(audio.currentTime).toBe(currentTime);
      } finally {
        window.Audio = originalWindowAudio;
        (globalThis as unknown as GlobalAudioTarget).Audio = originalGlobalAudio;
      }
    });

    it("handles browser autoplay block gracefully and displays discreet prompt to start music", async () => {
      const notAllowedErr = new Error("Autoplay prevented");
      notAllowedErr.name = "NotAllowedError";

      let allowPlayback = false;
      const mockState = {
        paused: true,
        ended: false,
        loop: true,
        volume: 0.28,
        currentTime: 0,
      };

      const playMock = vi.fn().mockImplementation(() => {
        if (!allowPlayback) {
          return Promise.reject(notAllowedErr);
        }
        mockState.paused = false;
        return Promise.resolve();
      });

      const pauseMock = vi.fn().mockImplementation(() => {
        mockState.paused = true;
      });

      const originalWindowAudio = window.Audio;
      const originalGlobalAudio = (globalThis as unknown as GlobalAudioTarget).Audio;

      class MockAudio {
        play = playMock;
        pause = pauseMock;
        addEventListener = vi.fn();
        removeEventListener = vi.fn();
        paused = mockState.paused;
        ended = mockState.ended;
        loop = mockState.loop;
        volume = mockState.volume;
        currentTime = mockState.currentTime;
      }

      window.Audio = MockAudio as unknown as typeof Audio;
      (globalThis as unknown as GlobalAudioTarget).Audio = MockAudio as unknown as typeof Audio;

      try {
        bgm._resetBgmForTesting();
        sounds.setSoundEnabled(true);

        // Render BackgroundMusic component
        const { queryByRole } = render(<BackgroundMusic />);

        // Autoplay rejection marks state as blocked
        await act(async () => {
          await bgm.playBackgroundMusic();
        });

        expect(bgm.isBgmAutoplayBlocked()).toBe(true);

        // Discreet prompt should be visible
        const discreetButton = queryByRole("button", { name: /romantic background music/i });
        expect(discreetButton).not.toBeNull();

        // Once user clicks to play, playback succeeds
        allowPlayback = true;
        await act(async () => {
          fireEvent.click(discreetButton!);
        });

        // Prompt disappears once playback is unlocked
        expect(bgm.isBgmAutoplayBlocked()).toBe(false);
      } finally {
        window.Audio = originalWindowAudio;
        (globalThis as unknown as GlobalAudioTarget).Audio = originalGlobalAudio;
      }
    });
  });
});
