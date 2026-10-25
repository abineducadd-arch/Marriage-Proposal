import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { PageThree } from "@/pages/PageThree";
import * as sounds from "@/lib/sounds";

// Mock canvas-confetti
vi.mock("canvas-confetti", () => ({
  default: Object.assign(vi.fn(), { reset: vi.fn() }),
}));

// Mock audio context and HTMLCanvasElement for jsdom
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: query.includes("prefers-reduced-motion: reduce") ? false : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

describe("Page 3 Proposal Letter: No Button 3D Flip to Yes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(sounds, "playCelebration").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  async function navigateToProposal() {
    render(<PageThree />);

    // Fast-forward past intro ready timer
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    // Advance intro line if needed
    const continueIntro = screen.queryByRole("button", { name: /continue/i });
    if (continueIntro) {
      act(() => {
        fireEvent.click(continueIntro);
      });
    }

    // Activate the screen -> briefing
    const activateBtn = screen.getByRole("button", { name: /activate the screen/i });
    act(() => {
      fireEvent.click(activateBtn);
    });

    // Fast-forward briefing messages to the end
    for (let i = 0; i < 5; i++) {
      const continueTrans = screen.queryByRole("button", { name: /continue transmission/i });
      if (continueTrans) {
        act(() => {
          fireEvent.click(continueTrans);
        });
      }
    }

    // Check the incoming message -> incoming
    const checkIncoming = screen.getByRole("button", { name: /check the incoming message/i });
    act(() => {
      fireEvent.click(checkIncoming);
    });

    // Open the message -> proposal letter
    const openMessage = screen.getByRole("button", { name: /open the message/i });
    act(() => {
      fireEvent.click(openMessage);
    });
  }

  it("renders the 3D flip No button initially with No attributes and without flipped state", async () => {
    await navigateToProposal();

    const noButton = screen.getByRole("button", { name: /no/i });
    expect(noButton).toBeInTheDocument();
    expect(noButton).toHaveAttribute("type", "button");
    expect(noButton).toHaveClass("btn-flip");
    expect(noButton).not.toHaveClass("is-flipped");
    expect(noButton).toHaveAttribute("data-front", "No");
    expect(noButton).toHaveAttribute("data-back", "Yes! ❤️");

    // Congratulatory message should NOT be present initially
    expect(screen.queryByText(/surprise! you just said yes!/i)).not.toBeInTheDocument();
  });

  it("flips the No button to Yes! ❤️ and displays the congratulatory message on click", async () => {
    await navigateToProposal();

    const noButton = screen.getByRole("button", { name: /no/i });

    act(() => {
      fireEvent.click(noButton);
    });

    // Button should now have the is-flipped class
    expect(noButton).toHaveClass("is-flipped");
    expect(noButton).toHaveAttribute("aria-label", "Yes! ❤️");

    // Congratulatory message should appear
    const congratsMsg = screen.getByText(/surprise! you just said yes! ❤️/i);
    expect(congratsMsg).toBeInTheDocument();

    // Golden sparkle & heart burst should be rendered
    const sparkles = document.querySelector(".no-button-sparkle-burst");
    expect(sparkles).toBeInTheDocument();

    // Celebration sound sequence should have been triggered
    expect(sounds.playCelebration).toHaveBeenCalledTimes(1);

    // After animation delay, the button remains in Yes state
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(noButton).toHaveClass("is-flipped");
    expect(noButton).toHaveAttribute("aria-label", "Yes! ❤️");

    // Clicking again should not re-trigger celebration
    act(() => {
      fireEvent.click(noButton);
    });
    expect(sounds.playCelebration).toHaveBeenCalledTimes(1);
  });

  it("preserves the original Yes button functionality without duplicate celebration", async () => {
    await navigateToProposal();

    const yesButton = screen.getByRole("button", { name: /yes, i accept the proposal/i });
    expect(yesButton).toBeInTheDocument();

    act(() => {
      fireEvent.click(yesButton);
    });

    expect(sounds.playCelebration).toHaveBeenCalledTimes(1);

    // Clicking No after Yes already accepted should not fire again
    const noButton = screen.getByRole("button", { name: /no/i });
    act(() => {
      fireEvent.click(noButton);
    });
    expect(sounds.playCelebration).toHaveBeenCalledTimes(1);
  });
});
