import { describe, expect, it } from "vitest";
import { nextNoClickStage, NO_REACTIONS, proposalVideoSrc } from "@/components/story/proposal";

describe("Page 3 proposal interactions", () => {
  it("keeps the No response at stage one after one click", () => {
    expect(nextNoClickStage(0)).toBe(1);
    expect(NO_REACTIONS[nextNoClickStage(0) - 1]).toBe(
      "Ehehe... are you sure? Someone worked really hard on this message! 🥺",
    );
  });

  it("keeps the No response visible at stage two after two clicks", () => {
    expect(nextNoClickStage(nextNoClickStage(0))).toBe(2);
    expect(NO_REACTIONS[nextNoClickStage(nextNoClickStage(0)) - 1]).toContain(
      "My little No button is cracking",
    );
  });

  it("limits the No response to the third stage", () => {
    expect(nextNoClickStage(nextNoClickStage(nextNoClickStage(0)))).toBe(3);
    expect(nextNoClickStage(3)).toBe(3);
    expect(NO_REACTIONS[2]).toContain("Your answer is still yours to choose");
  });

  it("starts with no video source until the personal video is supplied", () => {
    expect(proposalVideoSrc).toBeNull();
  });
});
