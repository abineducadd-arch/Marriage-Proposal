import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { FoldedCorner } from "@/components/FoldedCorner";
import * as sounds from "@/lib/sounds";

describe("FoldedCorner Mobile & Desktop Peeling Interaction", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(sounds, "playPeelSound").mockImplementation(() => null);
    vi.spyOn(sounds, "stopPeelSound").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("1. Visual & Accessibility Requirements on Initial Load", () => {
    it("renders the folded corner button on initial load with correct accessibility label", () => {
      render(<FoldedCorner active={false} onPeelComplete={vi.fn()} />);
      const btn = screen.getByRole("button", { name: /peel the page corner/i });
      expect(btn).toBeInTheDocument();
      expect(btn).toBeDisabled();
    });

    it("has touch-action: none (touch-none) and minimum 48px touch target size", () => {
      render(<FoldedCorner active={true} onPeelComplete={vi.fn()} />);
      const btn = screen.getByRole("button", { name: /peel the page corner/i });
      expect(btn.className).toContain("touch-none");
      expect(btn.style.minWidth).toBe("48px");
      expect(btn.style.minHeight).toBe("48px");
      const width = parseInt(btn.style.width, 10);
      expect(width).toBeGreaterThanOrEqual(48);
    });

    it("does NOT display Mochi's instruction text until active is true", () => {
      const { rerender } = render(<FoldedCorner active={false} onPeelComplete={vi.fn()} />);
      expect(screen.queryByText(/psst\.\.\. peel the page!/i)).not.toBeInTheDocument();

      rerender(<FoldedCorner active={true} onPeelComplete={vi.fn()} />);
      expect(screen.getByText(/psst\.\.\. peel the page!/i)).toBeInTheDocument();
    });

    it("positions Mochi's instruction with pointer-events-none and spacing that does not overlap the fold", () => {
      render(<FoldedCorner active={true} onPeelComplete={vi.fn()} />);
      const instructionText = screen.getByText(/psst\.\.\. peel the page!/i);
      const instructionContainer = instructionText.closest(".pointer-events-none");
      expect(instructionContainer).toBeInTheDocument();
      const rightStyle = (instructionContainer as HTMLElement).style.right;
      expect(rightStyle).toMatch(/^\d+px$/);
      expect(parseInt(rightStyle, 10)).toBeGreaterThanOrEqual(68);
    });
  });

  describe("2. Tap & Click Interaction (Desktop and Mobile)", () => {
    it("triggers peel animation, plays sound, and navigates exactly once on tap/click", () => {
      const onPeelComplete = vi.fn();
      render(<FoldedCorner active={true} onPeelComplete={onPeelComplete} />);
      const btn = screen.getByRole("button", { name: /peel the page corner/i });

      // Tap without drag (moved = false)
      act(() => {
        fireEvent.pointerDown(btn, { clientX: 300, clientY: 20 });
        fireEvent.pointerUp(btn, { clientX: 300, clientY: 20 });
      });

      expect(sounds.playPeelSound).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(1100);
      });

      expect(onPeelComplete).toHaveBeenCalledTimes(1);
    });

    it("triggers peel when clicking directly or via keyboard space/enter", () => {
      const onPeelComplete = vi.fn();
      render(<FoldedCorner active={true} onPeelComplete={onPeelComplete} />);
      const btn = screen.getByRole("button", { name: /peel the page corner/i });

      act(() => {
        fireEvent.keyDown(btn, { key: "Enter" });
      });
      expect(sounds.playPeelSound).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(1100);
      });
      expect(onPeelComplete).toHaveBeenCalledTimes(1);
    });

    it("does not trigger navigation multiple times if click event fires after pointerup", () => {
      const onPeelComplete = vi.fn();
      render(<FoldedCorner active={true} onPeelComplete={onPeelComplete} />);
      const btn = screen.getByRole("button", { name: /peel the page corner/i });

      act(() => {
        fireEvent.pointerDown(btn, { clientX: 300, clientY: 20 });
        fireEvent.pointerUp(btn, { clientX: 300, clientY: 20 });
        fireEvent.click(btn);
      });

      act(() => {
        vi.advanceTimersByTime(1100);
      });
      expect(onPeelComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe("3. Dragging Behavior on Touch and Mouse", () => {
    it("responds to inward dragging (down and left) by increasing size", () => {
      render(<FoldedCorner active={true} onPeelComplete={vi.fn()} />);
      const btn = screen.getByRole("button", { name: /peel the page corner/i });
      const initialSize = parseInt(btn.style.width, 10);

      btn.setPointerCapture = vi.fn();
      btn.hasPointerCapture = vi.fn().mockReturnValue(true);
      btn.releasePointerCapture = vi.fn();

      act(() => {
        fireEvent.pointerDown(btn, { pointerId: 1, clientX: 360, clientY: 10 });
      });
      expect(btn.setPointerCapture).toHaveBeenCalled();

      act(() => {
        fireEvent.pointerMove(btn, { pointerId: 1, clientX: 310, clientY: 60 });
      });
      const midDragSize = parseInt(btn.style.width, 10);
      expect(midDragSize).toBeGreaterThan(initialSize);
    });

    it("smoothly returns to original base size if released before threshold", () => {
      const onPeelComplete = vi.fn();
      render(<FoldedCorner active={true} onPeelComplete={onPeelComplete} />);
      const btn = screen.getByRole("button", { name: /peel the page corner/i });
      const initialSize = parseInt(btn.style.width, 10);

      btn.setPointerCapture = vi.fn();
      btn.hasPointerCapture = vi.fn().mockReturnValue(true);
      btn.releasePointerCapture = vi.fn();

      act(() => {
        fireEvent.pointerDown(btn, { pointerId: 1, clientX: 360, clientY: 10 });
        fireEvent.pointerMove(btn, { pointerId: 1, clientX: 350, clientY: 20 });
      });

      // Release early
      act(() => {
        fireEvent.pointerUp(btn, { pointerId: 1, clientX: 350, clientY: 20 });
      });

      expect(parseInt(btn.style.width, 10)).toBe(initialSize);
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(onPeelComplete).not.toHaveBeenCalled();
    });

    it("completes peel when dragged past completion threshold", () => {
      const onPeelComplete = vi.fn();
      render(<FoldedCorner active={true} onPeelComplete={onPeelComplete} />);
      const btn = screen.getByRole("button", { name: /peel the page corner/i });

      btn.setPointerCapture = vi.fn();
      btn.hasPointerCapture = vi.fn().mockReturnValue(true);
      btn.releasePointerCapture = vi.fn();

      act(() => {
        fireEvent.pointerDown(btn, { pointerId: 1, clientX: 375, clientY: 0 });
        fireEvent.pointerMove(btn, { pointerId: 1, clientX: 255, clientY: 120 });
        fireEvent.pointerUp(btn, { pointerId: 1, clientX: 255, clientY: 120 });
      });

      expect(sounds.playPeelSound).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(1100);
      });
      expect(onPeelComplete).toHaveBeenCalledTimes(1);
    });

    it("handles pointercancel without leaving paper stuck halfway", () => {
      const onPeelComplete = vi.fn();
      render(<FoldedCorner active={true} onPeelComplete={onPeelComplete} />);
      const btn = screen.getByRole("button", { name: /peel the page corner/i });
      const initialSize = parseInt(btn.style.width, 10);

      btn.setPointerCapture = vi.fn();
      btn.hasPointerCapture = vi.fn().mockReturnValue(true);
      btn.releasePointerCapture = vi.fn();

      act(() => {
        fireEvent.pointerDown(btn, { pointerId: 1, clientX: 360, clientY: 10 });
        fireEvent.pointerMove(btn, { pointerId: 1, clientX: 300, clientY: 70 });
      });
      expect(parseInt(btn.style.width, 10)).toBeGreaterThan(initialSize);

      act(() => {
        fireEvent.pointerCancel(btn, { pointerId: 1 });
      });

      expect(parseInt(btn.style.width, 10)).toBe(initialSize);
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(onPeelComplete).not.toHaveBeenCalled();
    });
  });

  describe("4. Responsive Viewport Adaptations", () => {
    it("adapts base size when window resizes to mobile viewport", () => {
      window.innerWidth = 375;
      render(<FoldedCorner active={true} onPeelComplete={vi.fn()} />);
      const btn = screen.getByRole("button", { name: /peel the page corner/i });

      act(() => {
        fireEvent(window, new Event("resize"));
      });

      expect(btn.style.width).toBe("56px");
      expect(btn.style.height).toBe("56px");
    });

    it("adapts base size when window resizes to 430px phablet", () => {
      window.innerWidth = 430;
      render(<FoldedCorner active={true} onPeelComplete={vi.fn()} />);
      const btn = screen.getByRole("button", { name: /peel the page corner/i });

      act(() => {
        fireEvent(window, new Event("resize"));
      });

      expect(btn.style.width).toBe("64px");
      expect(btn.style.height).toBe("64px");
    });
  });
});
