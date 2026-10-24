/**
 * Proposal Configuration and State Management.
 * Manages personal details, Page 2 clue messages, proposal video metadata,
 * settings, and the draft vs published workflow.
 */

import { OBJECTS, type ObjectId } from "@/components/story/adventure";
import { PROPOSAL_LETTER } from "@/components/story/proposal";

export interface PersonalDetails {
  senderName: string;
  recipientName: string;
  recipientNickname: string;
  greeting: string;
  anniversaryDate: string;
  introMessage: string;
  closingMessage: string;
}

export interface PageTwoMessage {
  title: string;
  clue: string;
}

export type PageTwoConfig = Record<ObjectId, PageTwoMessage>;

export interface VideoMetadata {
  hasVideo: boolean;
  name: string;
  size: number;
  type: string;
  duration?: number;
  externalUrl?: string;
  updatedAt: number;
}

export interface AdminSettings {
  maxVideoSizeMB: number;
}

export interface ProposalConfig {
  personalDetails: PersonalDetails;
  pageTwo: PageTwoConfig;
  video: VideoMetadata | null;
  settings: AdminSettings;
  version: number;
  updatedAt: number;
  isPublished?: boolean;
}

export const DEFAULT_PERSONAL_DETAILS: PersonalDetails = {
  senderName: "",
  recipientName: "",
  recipientNickname: "",
  greeting: "",
  anniversaryDate: "",
  introMessage: "",
  closingMessage: "",
};

export const DEFAULT_PAGE_TWO: PageTwoConfig = {
  chocolate: {
    title: OBJECTS.chocolate.title,
    clue: OBJECTS.chocolate.clue,
  },
  gift: {
    title: OBJECTS.gift.title,
    clue: OBJECTS.gift.clue,
  },
  picture: {
    title: OBJECTS.picture.title,
    clue: OBJECTS.picture.clue,
  },
};

export const DEFAULT_SETTINGS: AdminSettings = {
  maxVideoSizeMB: 100,
};

export const DEFAULT_PROPOSAL_CONFIG: ProposalConfig = {
  personalDetails: DEFAULT_PERSONAL_DETAILS,
  pageTwo: DEFAULT_PAGE_TWO,
  video: null,
  settings: DEFAULT_SETTINGS,
  version: 1,
  updatedAt: Date.now(),
  isPublished: true,
};

export const PUBLISHED_STORAGE_KEY = "romantic_proposal_published_v1";
export const DRAFT_STORAGE_KEY = "romantic_proposal_draft_v1";
export const CONFIG_CHANGE_EVENT = "romantic_proposal_config_changed";

function isClient(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/**
 * Reads the published configuration from localStorage, or returns defaults.
 */
export function getPublishedConfig(): ProposalConfig {
  if (!isClient()) return DEFAULT_PROPOSAL_CONFIG;

  try {
    const raw = localStorage.getItem(PUBLISHED_STORAGE_KEY);
    if (!raw) return DEFAULT_PROPOSAL_CONFIG;
    const parsed = JSON.parse(raw);
    return mergeWithDefaults(parsed, true);
  } catch (e) {
    console.error("Error reading published proposal config:", e);
    return DEFAULT_PROPOSAL_CONFIG;
  }
}

/**
 * Reads the draft configuration from localStorage.
 * If no draft exists, falls back to the published configuration.
 */
export function getDraftConfig(): ProposalConfig {
  if (!isClient()) return DEFAULT_PROPOSAL_CONFIG;

  try {
    const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (rawDraft) {
      return mergeWithDefaults(JSON.parse(rawDraft), false);
    }
    // If no draft exists yet, initialize draft from published config
    return { ...getPublishedConfig(), isPublished: false };
  } catch (e) {
    console.error("Error reading draft proposal config:", e);
    return DEFAULT_PROPOSAL_CONFIG;
  }
}

/**
 * Saves a draft configuration into localStorage.
 */
export function saveDraftConfig(config: ProposalConfig): void {
  if (!isClient()) return;

  const toSave: ProposalConfig = {
    ...config,
    updatedAt: Date.now(),
    isPublished: false,
  };

  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(toSave));
  notifyConfigChanged("draft", toSave);
}

/**
 * Publishes the given configuration (or current draft) to published state.
 */
export function publishConfig(config?: ProposalConfig): ProposalConfig {
  if (!isClient()) return DEFAULT_PROPOSAL_CONFIG;

  const target = config || getDraftConfig();
  const published: ProposalConfig = {
    ...target,
    updatedAt: Date.now(),
    isPublished: true,
  };

  localStorage.setItem(PUBLISHED_STORAGE_KEY, JSON.stringify(published));
  // Keep draft in sync with newly published version
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ ...published, isPublished: true }));

  notifyConfigChanged("published", published);
  return published;
}

/**
 * Discards draft changes and resets draft to match current published state.
 */
export function discardDraft(): ProposalConfig {
  if (!isClient()) return DEFAULT_PROPOSAL_CONFIG;

  const published = getPublishedConfig();
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ ...published, isPublished: true }));
  notifyConfigChanged("draft", published);
  return published;
}

/**
 * Resets both draft and published configuration back to factory defaults.
 */
export function resetAllToDefaults(): ProposalConfig {
  if (!isClient()) return DEFAULT_PROPOSAL_CONFIG;

  localStorage.removeItem(DRAFT_STORAGE_KEY);
  localStorage.removeItem(PUBLISHED_STORAGE_KEY);
  notifyConfigChanged("all", DEFAULT_PROPOSAL_CONFIG);
  return DEFAULT_PROPOSAL_CONFIG;
}

/**
 * Deep merges saved state with default keys to ensure missing fields don't cause errors.
 */
function mergeWithDefaults(data: Partial<ProposalConfig>, isPublished: boolean): ProposalConfig {
  return {
    personalDetails: {
      ...DEFAULT_PERSONAL_DETAILS,
      ...(data.personalDetails || {}),
    },
    pageTwo: {
      chocolate: {
        ...DEFAULT_PAGE_TWO.chocolate,
        ...(data.pageTwo?.chocolate || {}),
      },
      gift: {
        ...DEFAULT_PAGE_TWO.gift,
        ...(data.pageTwo?.gift || {}),
      },
      picture: {
        ...DEFAULT_PAGE_TWO.picture,
        ...(data.pageTwo?.picture || {}),
      },
    },
    video: data.video || null,
    settings: {
      ...DEFAULT_SETTINGS,
      ...(data.settings || {}),
    },
    version: data.version || 1,
    updatedAt: data.updatedAt || Date.now(),
    isPublished,
  };
}

/**
 * Dispatches a custom event so other components/windows update reactively.
 */
function notifyConfigChanged(scope: "draft" | "published" | "all", config: ProposalConfig) {
  if (typeof window === "undefined") return;

  const event = new CustomEvent(CONFIG_CHANGE_EVENT, {
    detail: { scope, config },
  });
  window.dispatchEvent(event);
}

/**
 * Checks if current in-memory draft has differences compared to stored published config.
 */
export function hasDifferences(a: ProposalConfig, b: ProposalConfig): boolean {
  const normA = JSON.stringify({
    personalDetails: a.personalDetails,
    pageTwo: a.pageTwo,
    video: a.video ? { ...a.video, updatedAt: 0 } : null,
    settings: a.settings,
  });
  const normB = JSON.stringify({
    personalDetails: b.personalDetails,
    pageTwo: b.pageTwo,
    video: b.video ? { ...b.video, updatedAt: 0 } : null,
    settings: b.settings,
  });
  return normA !== normB;
}

/**
 * Exports the configuration as a downloadable JSON string.
 */
export function exportConfigAsJSON(config: ProposalConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Parses and validates an imported JSON configuration.
 */
export function parseImportedConfig(jsonString: string): ProposalConfig {
  const parsed = JSON.parse(jsonString);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid configuration file format.");
  }
  return mergeWithDefaults(parsed, false);
}

/**
 * Generates the dynamic dialogue list for Page 1 based on personal details.
 */
export function getWelcomeDialogue(
  details: PersonalDetails,
): [
  { text: string; expression: "happy" | "curious" | "laughing" },
  { text: string; expression: "happy" | "curious" | "laughing" },
  { text: string; expression: "happy" | "curious" | "laughing" },
  { text: string; expression: "happy" | "curious" | "laughing" },
] {
  const recipient = details.recipientNickname?.trim() || details.recipientName?.trim();
  const sender = details.senderName?.trim();

  const line1 = details.greeting?.trim() || (recipient ? `Hiii, ${recipient}! ♡` : "Hiii, you! ♡");
  const line2 = sender
    ? `Oh! You finally made it! ${sender} has been waiting to tell you something special...`
    : "Oh! You finally made it! Someone has been waiting to tell you something special...";
  const line3 =
    details.introMessage?.trim() ||
    (sender
      ? `${sender}, who thinks you're the most special person in their world, has prepared a little adventure just for you.`
      : "Someone who thinks you're the most special person in his world has prepared a little adventure just for you.");
  const line4 = sender
    ? `Shhh... it's a little secret! Shall we discover what ${sender} has planned for you? ♡`
    : "Shhh... it's a little secret! Shall we discover what he has planned for you? ♡";

  return [
    { text: line1, expression: "happy" },
    { text: line2, expression: "curious" },
    { text: line3, expression: "happy" },
    { text: line4, expression: "laughing" },
  ];
}

/**
 * Generates the proposal letter content for Page 3 based on personal details.
 */
export function getPersonalizedProposalLetter(details: PersonalDetails): {
  heading: string;
  paragraphs: string[];
  question: string;
  closing: string[];
} {
  const recipient = details.recipientNickname?.trim() || details.recipientName?.trim();
  const sender = details.senderName?.trim();

  const heading = recipient
    ? `To the most special person in my world, ${recipient} ♡`
    : PROPOSAL_LETTER.heading;

  const p1 = recipient ? `Hey, my beloved ${recipient}...` : PROPOSAL_LETTER.paragraphs[0];
  const p2 = PROPOSAL_LETTER.paragraphs[1];
  const p3 = PROPOSAL_LETTER.paragraphs[2];

  let p4: string = PROPOSAL_LETTER.paragraphs[3];
  if (details.anniversaryDate?.trim()) {
    p4 = `Ever since our journey together began on ${details.anniversaryDate.trim()}, you make my world brighter in ways I never knew were possible. Every little moment with you means more to me than I can explain, and when I imagine my future, you're the person I want beside me.`;
  }

  const p5 = PROPOSAL_LETTER.paragraphs[4];
  const p6 = PROPOSAL_LETTER.paragraphs[5];

  const closing: string[] = [
    details.closingMessage?.trim() || PROPOSAL_LETTER.closing[0],
    "With all my love,",
    sender
      ? `Your person, your partner, and hopefully your forever — ${sender}. ♡`
      : PROPOSAL_LETTER.closing[2],
  ];

  return {
    heading,
    paragraphs: [p1, p2, p3, p4, p5, p6],
    question: PROPOSAL_LETTER.question,
    closing,
  };
}
