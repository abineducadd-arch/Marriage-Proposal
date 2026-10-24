import { useRef, useState } from "react";
import { Mochi, type MochiExpression } from "@/components/Mochi";
import { DialogueBubble } from "@/components/DialogueBubble";
import { FoldedCorner } from "@/components/FoldedCorner";
import { FloatingDecorations } from "@/components/FloatingDecorations";
import { useProposalConfig } from "@/hooks/use-proposal-config";
import { getWelcomeDialogue } from "@/lib/proposal-config";
import { PreviewBanner } from "@/components/PreviewBanner";
import { SoundToggle } from "@/components/SoundToggle";
import { playChime, playTransition } from "@/lib/sounds";

export const DIALOGUE: { text: string; expression: MochiExpression }[] = [
  { text: "Hiii, you! ♡", expression: "happy" },
  {
    text: "Oh! You finally made it! Someone has been waiting to tell you something special...",
    expression: "curious",
  },
  {
    text: "Someone who thinks you're the most special person in his world has prepared a little adventure just for you.",
    expression: "happy",
  },
  {
    text: "Shhh... it's a little secret! Shall we discover what he has planned for you? ♡",
    expression: "laughing",
  },
];

export function WelcomePage({ onNext }: { onNext?: () => void }) {
  const { config, preview } = useProposalConfig();
  const dialogueList = getWelcomeDialogue(config.personalDetails);
  const [index, setIndex] = useState(0);
  const [textVisible, setTextVisible] = useState(true);
  const [introComplete, setIntroComplete] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const busy = useRef(false);
  const isLast = index === dialogueList.length - 1;
  const line = dialogueList[index] || DIALOGUE[index]!;

  const advance = () => {
    if (busy.current) return;
    if (isLast) {
      playTransition();
      setIntroComplete(true);
      return;
    }
    playChime();
    busy.current = true;
    setTextVisible(false);
    setTimeout(() => {
      setIndex((i) => i + 1);
      setTextVisible(true);
      setTimeout(() => (busy.current = false), 500);
    }, 320);
  };

  const recipient = config.personalDetails.recipientName?.trim();
  const introSubtitle = config.personalDetails.introMessage?.trim();

  return (
    <main className="paper-bg relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-5 py-10">
      <PreviewBanner preview={preview} />
      <FloatingDecorations />

      <header className="animate-rise relative z-10 text-center">
        <h1 className="font-display text-4xl font-semibold italic text-cocoa sm:text-5xl md:text-6xl">
          {recipient ? `A Little Story Just for ${recipient}` : "A Little Story Just for You"}
        </h1>
        <p className="mt-3 font-display text-lg italic text-rose md:text-xl">
          "{introSubtitle || "Someone special has created a little adventure just for you..."}"
        </p>
      </header>
      <SoundToggle />

      <section className="relative z-10 mt-6 flex w-full max-w-4xl flex-col items-center gap-6 md:mt-8">
        <Mochi expression={line.expression} reactKey={index} />
        <DialogueBubble text={line.text} visible={textVisible} />
        <button
          type="button"
          onClick={advance}
          disabled={introComplete}
          className="btn-blush rounded-full px-8 py-3 text-lg font-semibold"
        >
          {isLast ? "Let's explore! ♡" : "Continue ♡"}
        </button>
      </section>

      <FoldedCorner
        active={introComplete}
        onPeelComplete={() => {
          setShowTransition(true);
          onNext?.();
        }}
      />

      {showTransition && (
        <div
          className="animate-glow-in fixed inset-0 z-50 flex items-center justify-center bg-cream px-6"
          style={{
            backgroundImage: "radial-gradient(circle at 50% 45%, var(--petal), var(--cream) 60%)",
          }}
        >
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {["15% 20%", "30% 80%", "70% 15%", "80% 75%", "50% 10%", "20% 60%", "85% 45%"].map(
              (p, i) => (
                <span
                  key={i}
                  className="animate-twinkle absolute text-peach"
                  style={{
                    top: p.split(" ")[0],
                    left: p.split(" ")[1],
                    animationDelay: `${i * 0.4}s`,
                  }}
                >
                  ✦
                </span>
              ),
            )}
          </div>
          <h2 className="animate-rise text-center font-display text-4xl italic text-cocoa md:text-6xl">
            Your love story is about to unfold... ♡
          </h2>
        </div>
      )}
    </main>
  );
}
