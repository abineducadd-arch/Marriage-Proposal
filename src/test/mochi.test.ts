import { describe, expect, it } from "vitest";
import { MOCHI_ASSETS, resolveMochiExpression, type MochiExpression } from "@/components/Mochi";

describe("Mochi component and assets", () => {
  it("has valid image source URLs for all expressions", () => {
    const expressions: MochiExpression[] = ["happy", "curious", "worried", "laughing", "sad"];
    for (const exp of expressions) {
      expect(MOCHI_ASSETS[exp]).toBeDefined();
      expect(typeof MOCHI_ASSETS[exp].src).toBe("string");
      expect(MOCHI_ASSETS[exp].src.length).toBeGreaterThan(0);
      expect(MOCHI_ASSETS[exp].alt).toBeTruthy();
    }
  });

  it("maps sad alias to worried", () => {
    expect(resolveMochiExpression("sad")).toBe("worried");
    expect(MOCHI_ASSETS.sad.src).toBe(MOCHI_ASSETS.worried.src);
  });

  it("resolves valid primary expressions correctly", () => {
    expect(resolveMochiExpression("happy")).toBe("happy");
    expect(resolveMochiExpression("curious")).toBe("curious");
    expect(resolveMochiExpression("worried")).toBe("worried");
    expect(resolveMochiExpression("laughing")).toBe("laughing");
  });

  it("falls back to happy when given undefined, null, or unknown expressions", () => {
    expect(resolveMochiExpression(undefined)).toBe("happy");
    expect(resolveMochiExpression(null)).toBe("happy");
    expect(resolveMochiExpression("unknown-expression")).toBe("happy");
  });
});
