import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import "./ScrollRevealLetter.css";

export interface ScrollRevealLetterProps {
  /** The full romantic letter text */
  text: string;
  /** Current object id (e.g. 'chocolate', 'gift', 'picture') to trigger independent resets */
  objectId?: string;
  /** Optional callback fired when the entire letter has been revealed */
  onComplete?: () => void;
  /** Optional className for the root element */
  className?: string;
}

import { parseTokens } from "./scroll-reveal-utils";

export function ScrollRevealLetter({
  text,
  objectId,
  onComplete,
  className,
}: ScrollRevealLetterProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const maxRevealedRef = useRef(0);
  const isCompleteRef = useRef(false);

  const [revealedCount, setRevealedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Parse tokens and count of words
  const { tokens, totalWords } = useMemo(() => parseTokens(text), [text]);

  // Calculate a comfortable, sensible scroll track height
  // About 7.5px of scroll per word ensures small scrolls reveal a few words,
  // with a minimum range of 300px for pleasant pacing.
  const DEFAULT_VIEWPORT_H = 175;
  const SCROLL_DISTANCE = Math.max(300, Math.round(totalWords * 7.5));
  const trackHeight = DEFAULT_VIEWPORT_H + SCROLL_DISTANCE;

  // Reset reveal progress whenever a different object is opened or text changes
  useEffect(() => {
    maxRevealedRef.current = 0;
    isCompleteRef.current = false;
    setRevealedCount(0);
    setIsComplete(false);

    if (viewportRef.current) {
      viewportRef.current.scrollTop = 0;
    }
    if (contentRef.current) {
      contentRef.current.style.transform = "translate3d(0, 0, 0)";
    }
  }, [objectId, text]);

  // Handle scroll events and synchronize word reveals
  const handleScroll = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const scrollTop = viewport.scrollTop;
    // Calculate usable scroll range with fallback for test environments (jsdom)
    const nativeScrollRange = viewport.scrollHeight - viewport.clientHeight;
    const scrollRange = nativeScrollRange > 0 ? nativeScrollRange : SCROLL_DISTANCE;
    const maxScroll = Math.max(1, scrollRange);
    const progress = Math.min(1, Math.max(0, scrollTop / maxScroll));

    // Dynamic vertical shift so revealed lines remain in the comfortable reading area
    const contentH = contentRef.current?.offsetHeight ?? 0;
    const viewportH = viewport.clientHeight || DEFAULT_VIEWPORT_H;
    const overflow = Math.max(0, contentH - viewportH + 24);
    const offset = scrollTop - overflow * progress;

    if (contentRef.current) {
      contentRef.current.style.transform = `translate3d(0, ${offset}px, 0)`;
    }

    // Calculate words to reveal; at progress === 0, exactly 0 words are revealed
    const wordsToReveal =
      progress <= 0.005 ? 0 : Math.min(totalWords, Math.ceil(progress * totalWords * 1.02));

    // Monotonically non-decreasing: upward scrolling does NOT erase revealed words
    if (wordsToReveal > maxRevealedRef.current) {
      maxRevealedRef.current = wordsToReveal;
      setRevealedCount(wordsToReveal);
    }

    // Check completion when reaching near the bottom or all words are revealed
    if (progress >= 0.96 || wordsToReveal >= totalWords) {
      if (!isCompleteRef.current) {
        isCompleteRef.current = true;
        setIsComplete(true);
        if (maxRevealedRef.current < totalWords) {
          maxRevealedRef.current = totalWords;
          setRevealedCount(totalWords);
        }
        onComplete?.();
      }
    }
  };

  return (
    <blockquote
      className={cn("handwritten-note parchment-message-text scroll-reveal-letter-card", className)}
      role="region"
      aria-label="Magical parchment letter"
    >
      {/* Hidden text for screen readers so assistive technology has instant access */}
      <span className="sr-only">{text}</span>

      <div
        ref={viewportRef}
        className="scroll-reveal-viewport"
        onScroll={handleScroll}
        tabIndex={0}
        aria-hidden="false"
      >
        <div className="scroll-reveal-track" style={{ minHeight: `${trackHeight}px` }}>
          <div ref={contentRef} className="scroll-reveal-content" aria-hidden="true">
            {tokens.map((token) => {
              if (token.isNewline) {
                return <br key={token.id} className="letter-br" />;
              }

              if (!token.isWord) {
                return (
                  <span key={token.id} className="letter-space">
                    {token.text}
                  </span>
                );
              }

              const isRevealed = token.wordIndex < revealedCount;

              return (
                <span
                  key={token.id}
                  data-word-index={token.wordIndex}
                  className={cn(
                    "letter-word",
                    isRevealed ? "letter-word-revealed" : "letter-word-hidden",
                  )}
                >
                  {token.text}
                </span>
              );
            })}

            {isComplete && (
              <div className="letter-completion-badge font-hand" aria-hidden="true">
                <span className="completion-flourish">❧</span>
                <span className="completion-heart">♡</span>
                <span className="completion-sparkle">✨</span>
                <span className="completion-flourish">☙</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </blockquote>
  );
}
