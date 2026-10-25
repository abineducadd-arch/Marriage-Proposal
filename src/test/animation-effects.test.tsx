import { beforeAll, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { MagicalPopupSparkles } from "@/components/story/MagicalPopupSparkles";
import { PartyCelebration } from "@/components/story/PartyCelebration";

// Mock canvas-confetti
vi.mock("canvas-confetti", () => ({
  default: Object.assign(vi.fn(), { reset: vi.fn() }),
}));

// Mock getContext for jsdom
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);
});

describe("Feature 1: MagicalPopupSparkles component", () => {
  it("does not render any DOM elements when inactive", () => {
    const { container } = render(<MagicalPopupSparkles active={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders sparkle burst particles when active", () => {
    const { container } = render(<MagicalPopupSparkles active={true} />);
    const sparkleContainer = container.querySelector(".popup-sparkle-container");
    expect(sparkleContainer).not.toBeNull();

    const particles = container.querySelectorAll(".popup-sparkle-item");
    expect(particles.length).toBeGreaterThan(0);
  });
});

describe("Feature 2: PartyCelebration component", () => {
  it("does not render celebration overlay when inactive", () => {
    const { container } = render(<PartyCelebration active={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders light burst, floating canvas, and celebratory banner when active", () => {
    const { container } = render(<PartyCelebration active={true} />);
    const celebrationContainer = container.querySelector(".party-celebration-container");
    expect(celebrationContainer).not.toBeNull();

    const lightBurst = container.querySelector(".magical-light-burst");
    expect(lightBurst).not.toBeNull();

    const canvas = container.querySelector(".celebration-floating-canvas");
    expect(canvas).not.toBeNull();

    const victoryToast = container.querySelector(".celebration-victory-toast");
    expect(victoryToast).not.toBeNull();
    expect(victoryToast?.textContent).toContain("SHE SAID YES! ❤️");
    expect(victoryToast?.textContent).toContain("Our forever begins here...");
  });
});
