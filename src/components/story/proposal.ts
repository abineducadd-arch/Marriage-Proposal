export const PROPOSAL_LETTER = {
  heading: "To the most special person in my world, ♡",
  paragraphs: [
    "Hey, my love...",
    "If you're reading this, it means my message finally reached you.",
    "I know this adventure has been a little unexpected, but there's something I've wanted to tell you for a long time.",
    "You make my world brighter in ways I never knew were possible. Every little moment with you means more to me than I can explain, and when I imagine my future, you're the person I want beside me.",
    "I don't just want to be part of your happiest days. I want to stand beside you through the difficult ones, grow with you, laugh with you, and keep choosing you, every single day.",
    "So, my favorite person, I have one very important question for you...",
  ],
  question: "Will you marry me?",
  closing: [
    "Will you let me be your hero, not just today, but for the rest of our lives?",
    "With all my love,",
    "Your person, your partner, and hopefully your forever. ♡",
  ],
} as const;

// Replace this single value with a video URL when the personal video is ready.
export const proposalVideoSrc: string | null = null;

export type ProposalScene =
  "intro" | "briefing" | "incoming" | "proposal" | "accepting" | "celebration" | "tablet" | "video";

export const AI_MESSAGES = [
  "ATTENTION. AN IMPORTANT INTERDIMENSIONAL TRANSMISSION HAS BEEN RECEIVED.",
  "A mysterious threat is approaching your world...",
  "According to our calculations, this world is in serious need of one very special hero.",
  "Unfortunately, the hero is currently asleep in another dimension.",
  "There is only one way to bring him into your world.",
  "He must receive an answer to a very important message.",
] as const;

export const NO_REACTIONS = [
  "Ehehe... are you sure? Someone worked really hard on this message! 🥺",
  "O-oh! My little No button is cracking! Are you really going to make me use my emergency cuteness? ♡",
  "Hehe... looks like the universe has run out of No buttons! Your answer is still yours to choose, sweetheart. ♡",
] as const;

export function nextNoClickStage(stage: number): number {
  return Math.min(stage + 1, NO_REACTIONS.length);
}
