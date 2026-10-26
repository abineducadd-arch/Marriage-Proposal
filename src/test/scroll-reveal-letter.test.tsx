import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ScrollRevealLetter } from "@/components/story/ScrollRevealLetter";
import { parseTokens } from "@/components/story/scroll-reveal-utils";
import { PageTwo } from "@/pages/PageTwo";
import { OBJECTS } from "@/components/story/adventure";
import { MOCHI_LETTER_GUIDANCE, speakMochiGuidance, stopMochiVoice } from "@/lib/mochi-voice";
import * as sounds from "@/lib/sounds";

describe("ScrollRevealLetter & Page 2 Scroll-to-Reveal Storybook Experience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    stopMochiVoice();
  });

  describe("1. Token parsing and original text fidelity", () => {
    it("preserves words, spaces, punctuation, emojis and newlines exactly", () => {
      const sample =
        "They say chocolate makes life sweeter, but you make my entire world sweeter just by being in it. ❤️\n\nAnother line.";
      const { tokens, totalWords } = parseTokens(sample);

      expect(totalWords).toBeGreaterThan(0);
      const reconstructed = tokens.map((t) => t.text).join("");
      expect(reconstructed).toBe(sample);
    });

    it("identifies word tokens with sequential indices", () => {
      const sample = "One two three!";
      const { tokens, totalWords } = parseTokens(sample);

      expect(totalWords).toBe(3);
      const wordsOnly = tokens.filter((t) => t.isWord);
      expect(wordsOnly.map((w) => w.wordIndex)).toEqual([0, 1, 2]);
    });
  });

  describe("2. Initial blank letter state", () => {
    it("renders with 0 revealed words initially when scroll position is 0", () => {
      const clue = OBJECTS.chocolate.clue;
      render(<ScrollRevealLetter text={clue} objectId="chocolate" />);

      // Screen reader accessible full text is present
      const srText = screen.getByText(clue);
      expect(srText).toHaveClass("sr-only");

      // Visual tokens: initially none have the 'letter-word-revealed' class
      const revealedWords = document.querySelectorAll(".letter-word-revealed");
      expect(revealedWords.length).toBe(0);

      // All words are in hidden state
      const hiddenWords = document.querySelectorAll(".letter-word-hidden");
      expect(hiddenWords.length).toBeGreaterThan(0);

      // Completion badge is not present initially
      expect(document.querySelector(".letter-completion-badge")).toBeNull();
    });
  });

  describe("3. Progressive reveal on scrolling inside the letter", () => {
    it("reveals words progressively as the user scrolls downward", () => {
      const clue = OBJECTS.chocolate.clue;
      render(<ScrollRevealLetter text={clue} objectId="chocolate" />);

      const viewport = document.querySelector(".scroll-reveal-viewport") as HTMLDivElement;
      expect(viewport).not.toBeNull();

      // Initially 0 revealed
      expect(document.querySelectorAll(".letter-word-revealed").length).toBe(0);

      // Scroll a small amount (approx 15% of track)
      Object.defineProperty(viewport, "scrollTop", { value: 60, writable: true });
      fireEvent.scroll(viewport);

      const firstPassRevealed = document.querySelectorAll(".letter-word-revealed").length;
      expect(firstPassRevealed).toBeGreaterThan(0);

      // Scroll further (approx 50% of track)
      Object.defineProperty(viewport, "scrollTop", { value: 180, writable: true });
      fireEvent.scroll(viewport);

      const secondPassRevealed = document.querySelectorAll(".letter-word-revealed").length;
      expect(secondPassRevealed).toBeGreaterThan(firstPassRevealed);
    });

    it("does not erase previously revealed words when user scrolls back upward", () => {
      const clue = OBJECTS.gift.clue;
      render(<ScrollRevealLetter text={clue} objectId="gift" />);

      const viewport = document.querySelector(".scroll-reveal-viewport") as HTMLDivElement;
      expect(viewport).not.toBeNull();

      // Scroll down to 200px
      Object.defineProperty(viewport, "scrollTop", { value: 200, writable: true });
      fireEvent.scroll(viewport);

      const peakRevealed = document.querySelectorAll(".letter-word-revealed").length;
      expect(peakRevealed).toBeGreaterThan(5);

      // Scroll back up to 20px
      Object.defineProperty(viewport, "scrollTop", { value: 20, writable: true });
      fireEvent.scroll(viewport);

      // Words count should not decrease
      const afterScrollUpRevealed = document.querySelectorAll(".letter-word-revealed").length;
      expect(afterScrollUpRevealed).toBe(peakRevealed);

      // Scroll all the way back to top (0px)
      Object.defineProperty(viewport, "scrollTop", { value: 0, writable: true });
      fireEvent.scroll(viewport);

      const atTopRevealed = document.querySelectorAll(".letter-word-revealed").length;
      expect(atTopRevealed).toBe(peakRevealed);
    });

    it("reveals the entire message and shows the completion badge at the end of the scroll", () => {
      const clue = OBJECTS.picture.clue;
      const onCompleteSpy = vi.fn();
      render(<ScrollRevealLetter text={clue} objectId="picture" onComplete={onCompleteSpy} />);

      const viewport = document.querySelector(".scroll-reveal-viewport") as HTMLDivElement;
      expect(viewport).not.toBeNull();

      // Scroll to bottom (>= 340px)
      Object.defineProperty(viewport, "scrollTop", { value: 450, writable: true });
      fireEvent.scroll(viewport);

      const hiddenWords = document.querySelectorAll(".letter-word-hidden");
      expect(hiddenWords.length).toBe(0);

      const completionBadge = document.querySelector(".letter-completion-badge");
      expect(completionBadge).not.toBeNull();
      expect(onCompleteSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("4. Resetting reveal progress for different objects", () => {
    it("resets reveal progress when objectId changes", () => {
      const { rerender } = render(
        <ScrollRevealLetter text={OBJECTS.chocolate.clue} objectId="chocolate" />,
      );

      const viewport = document.querySelector(".scroll-reveal-viewport") as HTMLDivElement;
      Object.defineProperty(viewport, "scrollTop", { value: 350, writable: true });
      fireEvent.scroll(viewport);

      expect(document.querySelectorAll(".letter-word-revealed").length).toBeGreaterThan(0);

      // Switch object to "gift"
      rerender(<ScrollRevealLetter text={OBJECTS.gift.clue} objectId="gift" />);

      // Should be reset to 0 revealed
      expect(document.querySelectorAll(".letter-word-revealed").length).toBe(0);
      expect(document.querySelector(".letter-completion-badge")).toBeNull();
    });
  });

  describe("5. PageTwo integration & Mochi guidance", () => {
    it("displays Mochi's scroll guidance when an object popup opens, and transitions to clue dialogue on completion", () => {
      vi.useFakeTimers();
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

      // Activate light switch
      const switchBtn = screen.getByRole("button", { name: /turn on the light switch/i });
      act(() => {
        fireEvent.focus(switchBtn);
        fireEvent.click(switchBtn, { detail: 0 });
      });

      // Advance light dialogue
      for (let i = 0; i < 3; i++) {
        const cBtn = screen.queryByRole("button", { name: /continue|let's explore/i });
        if (cBtn) {
          act(() => {
            fireEvent.click(cBtn);
          });
        }
      }

      // Open chocolate box
      const chocolateBtn = screen.getByRole("button", { name: /explore chocolate box/i });
      act(() => {
        fireEvent.click(chocolateBtn);
      });

      // 1. Popup opens
      const dialog = document.querySelector(".vintage-parchment-note");
      expect(dialog).not.toBeNull();

      // 2. Mochi's guidance is shown in the dialogue UI
      const guidance = screen.getByText(MOCHI_LETTER_GUIDANCE);
      expect(guidance).toBeInTheDocument();

      // 3. The letter initially has 0 revealed words
      expect(document.querySelectorAll(".letter-word-revealed").length).toBe(0);

      // 4. Scroll inside the letter to the end
      const viewport = document.querySelector(".scroll-reveal-viewport") as HTMLDivElement;
      expect(viewport).not.toBeNull();

      act(() => {
        Object.defineProperty(viewport, "scrollTop", { value: 450, writable: true });
        fireEvent.scroll(viewport);
      });

      // 5. All words revealed & completion badge appears
      expect(document.querySelectorAll(".letter-word-hidden").length).toBe(0);
      expect(document.querySelector(".letter-completion-badge")).not.toBeNull();

      // 6. Dialogue UI updates to Mochi's object dialogue
      expect(screen.getByText(OBJECTS.chocolate.dialogue)).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe("6. Mochi voice safety and fallback", () => {
    it("handles speech synthesis gracefully without crashing if unavailable or muted", () => {
      // Calling speakMochiGuidance directly should not throw
      expect(() => speakMochiGuidance("Test speech")).not.toThrow();
      expect(() => stopMochiVoice()).not.toThrow();
    });

    it("respects sound disabled state", () => {
      const cancelSpy = vi.fn();
      const speakSpy = vi.fn();
      window.speechSynthesis = {
        cancel: cancelSpy,
        speak: speakSpy,
      } as unknown as SpeechSynthesis;

      sounds.setSoundEnabled(false);
      speakMochiGuidance("Should be silent");
      expect(speakSpy).not.toHaveBeenCalled();

      // Restore sound setting
      sounds.setSoundEnabled(true);
    });
  });
});
