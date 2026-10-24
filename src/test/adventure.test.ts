import { describe, expect, it } from "vitest";
import { exploreObject, passageUnlocked, switchInBeam } from "@/components/story/adventure";

describe("Page 2 discovery rules", () => {
  it("unlocks the passage after three distinct objects, not two or repeat visits", () => {
    let visited = exploreObject([], "chocolate");
    visited = exploreObject(visited, "chocolate");
    visited = exploreObject(visited, "gift");
    expect(passageUnlocked(visited)).toBe(false);
    visited = exploreObject(visited, "picture");
    expect(passageUnlocked(visited)).toBe(true);
  });
  it("reveals the switch only within the flashlight's discovery radius", () => {
    expect(switchInBeam(300, 200, 300, 200)).toBe(true);
    expect(switchInBeam(100, 200, 300, 200)).toBe(false);
  });
});
