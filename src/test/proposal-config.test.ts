import { describe, expect, it, beforeEach } from "vitest";
import {
  DEFAULT_PERSONAL_DETAILS,
  DEFAULT_PAGE_TWO,
  getPublishedConfig,
  getDraftConfig,
  saveDraftConfig,
  publishConfig,
  discardDraft,
  resetAllToDefaults,
  getWelcomeDialogue,
  getPersonalizedProposalLetter,
  exportConfigAsJSON,
  parseImportedConfig,
  type ProposalConfig,
} from "@/lib/proposal-config";

describe("Proposal Configuration and State Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns defaults when no configuration is saved in localStorage", () => {
    const config = getPublishedConfig();
    expect(config.personalDetails).toEqual(DEFAULT_PERSONAL_DETAILS);
    expect(config.pageTwo.chocolate.title).toBe(DEFAULT_PAGE_TWO.chocolate.title);
    expect(config.video).toBeNull();
  });

  it("saves draft without altering published configuration", () => {
    const customConfig: ProposalConfig = {
      ...getDraftConfig(),
      personalDetails: {
        ...DEFAULT_PERSONAL_DETAILS,
        recipientName: "Maya",
        senderName: "Alex",
      },
    };

    saveDraftConfig(customConfig);

    const draft = getDraftConfig();
    expect(draft.personalDetails.recipientName).toBe("Maya");
    expect(draft.personalDetails.senderName).toBe("Alex");

    const published = getPublishedConfig();
    expect(published.personalDetails.recipientName).toBe("");
  });

  it("publishes draft configuration to live site", () => {
    const customConfig: ProposalConfig = {
      ...getDraftConfig(),
      personalDetails: {
        ...DEFAULT_PERSONAL_DETAILS,
        recipientName: "Sophia",
        senderName: "Liam",
      },
      pageTwo: {
        ...DEFAULT_PAGE_TWO,
        chocolate: {
          title: "Our Sweet Moments",
          clue: "Every day with you is sweet.",
        },
      },
    };

    publishConfig(customConfig);

    const published = getPublishedConfig();
    expect(published.personalDetails.recipientName).toBe("Sophia");
    expect(published.pageTwo.chocolate.title).toBe("Our Sweet Moments");
    expect(published.isPublished).toBe(true);
  });

  it("discards draft and reverts to published state", () => {
    publishConfig({
      ...getDraftConfig(),
      personalDetails: {
        ...DEFAULT_PERSONAL_DETAILS,
        recipientName: "Original Recipient",
      },
    });

    saveDraftConfig({
      ...getDraftConfig(),
      personalDetails: {
        ...DEFAULT_PERSONAL_DETAILS,
        recipientName: "Temporary Draft",
      },
    });

    expect(getDraftConfig().personalDetails.recipientName).toBe("Temporary Draft");

    discardDraft();

    expect(getDraftConfig().personalDetails.recipientName).toBe("Original Recipient");
  });

  it("resets all configurations to factory defaults", () => {
    publishConfig({
      ...getDraftConfig(),
      personalDetails: {
        ...DEFAULT_PERSONAL_DETAILS,
        recipientName: "Elena",
      },
    });

    resetAllToDefaults();

    expect(getPublishedConfig().personalDetails.recipientName).toBe("");
    expect(getDraftConfig().personalDetails.recipientName).toBe("");
  });

  it("generates personalized Page 1 Mochi dialogues with nickname and sender", () => {
    const dialogues = getWelcomeDialogue({
      senderName: "Julian",
      recipientName: "Emma",
      recipientNickname: "Sunshine",
      greeting: "Hello, my Sunshine! ♡",
      anniversaryDate: "",
      introMessage: "A romantic quest awaits you.",
      closingMessage: "",
    });

    expect(dialogues[0].text).toBe("Hello, my Sunshine! ♡");
    expect(dialogues[1].text).toContain("Julian has been waiting");
    expect(dialogues[2].text).toBe("A romantic quest awaits you.");
    expect(dialogues[3].text).toContain("what Julian has planned for you");
  });

  it("generates personalized Page 3 proposal letter with anniversary and custom closing", () => {
    const letter = getPersonalizedProposalLetter({
      senderName: "Julian",
      recipientName: "Emma",
      recipientNickname: "Cutie",
      greeting: "",
      anniversaryDate: "October 12, 2022",
      introMessage: "",
      closingMessage: "You are the greatest dream of my life.",
    });

    expect(letter.heading).toBe("To the most special person in my world, Cutie ♡");
    expect(letter.paragraphs[0]).toContain("Cutie");
    expect(letter.paragraphs[3]).toContain("October 12, 2022");
    expect(letter.question).toBe("Will you marry me?");
    expect(letter.closing[0]).toBe("You are the greatest dream of my life.");
    expect(letter.closing[2]).toContain("Julian");
  });

  it("exports and imports valid JSON configuration", () => {
    const original: ProposalConfig = {
      ...getPublishedConfig(),
      personalDetails: {
        ...DEFAULT_PERSONAL_DETAILS,
        recipientName: "Zoe",
        senderName: "Noah",
      },
      pageTwo: {
        ...DEFAULT_PAGE_TWO,
        gift: {
          title: "A Special Gift Box",
          clue: "Unwrap this love.",
        },
      },
    };

    const jsonStr = exportConfigAsJSON(original);
    const parsed = parseImportedConfig(jsonStr);

    expect(parsed.personalDetails.recipientName).toBe("Zoe");
    expect(parsed.personalDetails.senderName).toBe("Noah");
    expect(parsed.pageTwo.gift.title).toBe("A Special Gift Box");
  });
});
