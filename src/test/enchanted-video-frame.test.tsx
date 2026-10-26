import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { EnchantedVideoFrame } from "@/components/story/EnchantedVideoFrame";
import * as bgm from "@/lib/bgm";
import * as sounds from "@/lib/sounds";

// Mock canvas-confetti
vi.mock("canvas-confetti", () => ({
  default: Object.assign(vi.fn(), { reset: vi.fn() }),
}));

beforeAll(() => {
  window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(function (this: HTMLMediaElement) {
    this.paused = false;
    return Promise.resolve();
  });
  window.HTMLMediaElement.prototype.pause = vi.fn().mockImplementation(function (this: HTMLMediaElement) {
    this.paused = true;
  });
});


describe("EnchantedVideoFrame Component", () => {
  it("renders the enchanted holographic video frame container and headers", () => {
    render(<EnchantedVideoFrame videoSrc={null} senderName="Leo" />);

    // Container
    const frame = screen.getByTestId("enchanted-video-frame");
    expect(frame).toBeInTheDocument();
    expect(frame).toHaveClass("enchanted-video-presentation");

    // Heading
    const heading = screen.getByRole("heading", {
      name: /a little message from my heart/i,
    });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toContain("❤️");

    // Glowing badge / subtitle
    expect(screen.getByText(/made with love, just for you/i)).toBeInTheDocument();

    // Personal dedication with senderName
    expect(screen.getByText(/made with all my love, just for you — Leo\. ♡/i)).toBeInTheDocument();
  });

  it("renders fallback dedication when senderName is not specified", () => {
    render(<EnchantedVideoFrame videoSrc={null} />);

    expect(screen.getByText("Made with all my love, just for you. ♡")).toBeInTheDocument();
  });

  it("renders enchanted placeholder with play portal and ambient stars when videoSrc is null", () => {
    const { container } = render(<EnchantedVideoFrame videoSrc={null} />);

    // Placeholder content
    expect(screen.getByText(/a little message just for you ♡/i)).toBeInTheDocument();
    expect(screen.getByText(/your special video will appear here\./i)).toBeInTheDocument();
    expect(container.querySelector(".video-play-icon")).toHaveTextContent("▶");
    expect(container.querySelector(".portal-ring-outer")).toBeInTheDocument();
    expect(container.querySelector(".portal-ring-inner")).toBeInTheDocument();
    expect(container.querySelector(".placeholder-ambient-stars")).toBeInTheDocument();

    // Video element should not be rendered
    expect(container.querySelector("video")).not.toBeInTheDocument();
  });

  it("renders video element with original aspect ratio, controls, and aria-label when videoSrc is provided", () => {
    const sampleVideoUrl = "https://example.com/proposal-video.mp4";
    const { container } = render(
      <EnchantedVideoFrame videoSrc={sampleVideoUrl} senderName="Alex" />,
    );

    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("src", sampleVideoUrl);
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("playsinline");
    expect(video).toHaveAttribute("preload", "metadata");
    expect(video).toHaveAttribute("aria-label", "A personal message from your hero");
    expect(video).toHaveClass("enchanted-video-player");

    // Placeholder should not be present
    expect(screen.queryByText(/your special video will appear here/i)).not.toBeInTheDocument();
  });

  it("renders minimal double-gold frame with 4 engraved corners and no excessive clutter", () => {
    const { container } = render(<EnchantedVideoFrame videoSrc={null} />);

    // 4 Symmetrical engraved corner ornaments
    expect(container.querySelector(".enchanted-corner-tl")).toBeInTheDocument();
    expect(container.querySelector(".enchanted-corner-tr")).toBeInTheDocument();
    expect(container.querySelector(".enchanted-corner-bl")).toBeInTheDocument();
    expect(container.querySelector(".enchanted-corner-br")).toBeInTheDocument();

    // Double gold frame outer and inner layers
    expect(container.querySelector(".enchanted-frame-outer")).toBeInTheDocument();
    expect(container.querySelector(".enchanted-frame-inner")).toBeInTheDocument();

    // Subtle border reflection and glass sheen
    expect(container.querySelector(".enchanted-border-sheen")).toBeInTheDocument();
    expect(container.querySelector(".enchanted-holographic-sheen")).toBeInTheDocument();

    // Excessive clutter should be cleanly removed
    expect(container.querySelector(".enchanted-crest-top")).not.toBeInTheDocument();
    expect(container.querySelector(".enchanted-crest-bottom")).not.toBeInTheDocument();
    expect(container.querySelector(".enchanted-sweep-beam")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".enchanted-particle")).toHaveLength(0);
  });
});

describe("Page 3 Story Integration with EnchantedVideoFrame", () => {
  it("transitions through tablet lines to EnchantedVideoFrame when watching the surprise", async () => {
    vi.useFakeTimers();
    const { PageThree } = await import("@/pages/PageThree");
    render(<PageThree />);

    // Fast-forward past intro
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    const continueIntro = screen.queryByRole("button", { name: /continue/i });
    if (continueIntro) {
      act(() => {
        fireEvent.click(continueIntro);
      });
    }

    // Activate the screen
    const activateBtn = screen.getByRole("button", { name: /activate the screen/i });
    act(() => {
      fireEvent.click(activateBtn);
    });

    // Advance briefing
    for (let i = 0; i < 5; i++) {
      const continueTrans = screen.queryByRole("button", { name: /continue transmission/i });
      if (continueTrans) {
        act(() => {
          fireEvent.click(continueTrans);
        });
      }
    }

    // Check incoming message
    const checkIncoming = screen.getByRole("button", { name: /check the incoming message/i });
    act(() => {
      fireEvent.click(checkIncoming);
    });

    // Open proposal message
    const openMessage = screen.getByRole("button", { name: /open the message/i });
    act(() => {
      fireEvent.click(openMessage);
    });

    // Accept proposal
    const yesButton = screen.getByRole("button", { name: /yes, i accept the proposal/i });
    act(() => {
      fireEvent.click(yesButton);
    });

    // Advance to celebration scene
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Advance through celebration lines
    for (let i = 0; i < 6; i++) {
      const celebrationBtn = screen.queryByRole("button", {
        name: /continue|meet your little surprise/i,
      });
      if (celebrationBtn) {
        act(() => {
          fireEvent.click(celebrationBtn);
        });
      }
    }

    // Now in tablet scene: Mochi dialogue displayed (first line)
    expect(document.querySelector(".tablet-dialogue")).toHaveTextContent(
      /wait, wait! i almost forgot something/i,
    );

    // Advance to second tablet line: "Your hero left you a little message... just for you. ♡"
    const continueTablet1 = screen.getByRole("button", { name: /continue ♡/i });
    act(() => {
      fireEvent.click(continueTablet1);
    });
    expect(document.querySelector(".tablet-dialogue")).toHaveTextContent(
      /your hero left you a little message/i,
    );

    // Advance to third tablet line: "Here! It's on this tablet..."
    const continueTablet2 = screen.getByRole("button", { name: /continue ♡/i });
    act(() => {
      fireEvent.click(continueTablet2);
    });

    const watchSurpriseBtn = screen.getByRole("button", { name: /watch your surprise ♡/i });
    expect(watchSurpriseBtn).toBeInTheDocument();

    // Click "Watch your surprise ♡" -> transitions to scene "video"
    act(() => {
      fireEvent.click(watchSurpriseBtn);
    });

    // Verify Enchanted Video Frame is now displayed in Page 3!
    const enchantedFrame = screen.getByTestId("enchanted-video-frame");
    expect(enchantedFrame).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /a little message from my heart ❤️/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/made with love, just for you/i)).toBeInTheDocument();

    vi.useRealTimers();
  });
});

describe("Background Music Control During Proposal Video Playback", () => {
  beforeEach(() => {
    localStorage.clear();
    sounds.setSoundEnabled(true);
    bgm._resetBgmForTesting();
  });

  afterEach(() => {
    bgm._resetBgmForTesting();
    vi.clearAllMocks();
  });

  it("pauses background music when final proposal video begins playing", async () => {
    // Start background music
    await bgm.playBackgroundMusic();
    expect(bgm.isBgmPlaying()).toBe(true);

    const pauseSpy = vi.spyOn(bgm, "pauseBgmForVideo");
    const { container } = render(
      <EnchantedVideoFrame videoSrc="https://example.com/proposal.mp4" senderName="Alex" />,
    );

    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();

    // Video begins playing
    act(() => {
      fireEvent.play(video!);
    });

    expect(pauseSpy).toHaveBeenCalled();
    expect(bgm.isBgmPlaying()).toBe(false);
    expect(bgm.isVideoBgmActive()).toBe(true);
  });

  it("keeps background music paused while video is paused but remains open", async () => {
    await bgm.playBackgroundMusic();
    const playSpy = vi.spyOn(bgm, "playBackgroundMusic");

    const { container } = render(
      <EnchantedVideoFrame videoSrc="https://example.com/proposal.mp4" />,
    );
    const video = container.querySelector("video");

    act(() => {
      fireEvent.play(video!);
    });

    playSpy.mockClear();

    // User pauses video
    act(() => {
      fireEvent.pause(video!);
    });

    // BGM should NOT resume while video is still open
    expect(playSpy).not.toHaveBeenCalled();
    expect(bgm.isVideoBgmActive()).toBe(true);
  });

  it("resumes background music from previous position when video finishes naturally (ended)", async () => {
    await bgm.playBackgroundMusic();
    const bgmAudio = bgm.getBgmAudio();
    if (bgmAudio) {
      bgmAudio.currentTime = 42; // simulate progress
    }

    const { container } = render(
      <EnchantedVideoFrame videoSrc="https://example.com/proposal.mp4" />,
    );
    const video = container.querySelector("video");

    act(() => {
      fireEvent.play(video!);
    });
    expect(bgm.isVideoBgmActive()).toBe(true);

    const playSpy = vi.spyOn(bgm, "playBackgroundMusic");

    // Video ends naturally
    act(() => {
      fireEvent.ended(video!);
    });

    expect(playSpy).toHaveBeenCalled();
    expect(bgm.isVideoBgmActive()).toBe(false);
    expect(bgmAudio?.currentTime).toBe(42); // Previous position preserved
  });

  it("restores background music appropriately when video is closed/unmounted before completion", async () => {
    await bgm.playBackgroundMusic();

    const { container, unmount } = render(
      <EnchantedVideoFrame videoSrc="https://example.com/proposal.mp4" />,
    );
    const video = container.querySelector("video");

    act(() => {
      fireEvent.play(video!);
    });

    const playSpy = vi.spyOn(bgm, "playBackgroundMusic");

    // Video closed early (unmounted)
    unmount();

    expect(playSpy).toHaveBeenCalled();
    expect(bgm.isVideoBgmActive()).toBe(false);
  });

  it("does not leave background music permanently paused if video fails to load or play", async () => {
    await bgm.playBackgroundMusic();

    const { container } = render(
      <EnchantedVideoFrame videoSrc="https://example.com/bad-video.mp4" />,
    );
    const video = container.querySelector("video");

    act(() => {
      fireEvent.play(video!);
    });

    const playSpy = vi.spyOn(bgm, "playBackgroundMusic");

    // Video error occurs
    act(() => {
      fireEvent.error(video!);
    });

    expect(playSpy).toHaveBeenCalled();
    expect(bgm.isVideoBgmActive()).toBe(false);
  });

  it("does not turn music back on if user had manually muted sound", async () => {
    // User had muted sound
    sounds.setSoundEnabled(false);
    expect(bgm.isBgmPlaying()).toBe(false);

    const { container } = render(
      <EnchantedVideoFrame videoSrc="https://example.com/proposal.mp4" />,
    );
    const video = container.querySelector("video");

    act(() => {
      fireEvent.play(video!);
    });

    const playSpy = vi.spyOn(bgm, "playBackgroundMusic");

    // Video ends
    act(() => {
      fireEvent.ended(video!);
    });

    // Should NOT force background music to play when muted
    expect(playSpy).not.toHaveBeenCalled();
  });

  it("handles video replacement and repeated openings without duplicate listeners", async () => {
    await bgm.playBackgroundMusic();

    const { container, rerender, unmount } = render(
      <EnchantedVideoFrame videoSrc="https://example.com/video1.mp4" />,
    );

    let video = container.querySelector("video");
    act(() => {
      fireEvent.play(video!);
    });

    // Replace video
    rerender(<EnchantedVideoFrame videoSrc="https://example.com/video2.mp4" />);
    video = container.querySelector("video");

    act(() => {
      fireEvent.play(video!);
    });

    const playSpy = vi.spyOn(bgm, "playBackgroundMusic");
    act(() => {
      fireEvent.ended(video!);
    });

    expect(playSpy).toHaveBeenCalledTimes(1);

    unmount();
  });
});

