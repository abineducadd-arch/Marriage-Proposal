import { useEffect, useState } from "react";

export function DialogueBubble({ text, visible }: { text: string; visible: boolean }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(text.length);
      return;
    }
    setShown(0);
    const id = setInterval(
      () => setShown((n) => (n >= text.length ? (clearInterval(id), n) : n + 1)),
      28,
    );
    return () => clearInterval(id);
  }, [text, visible]);

  return (
    <div
      className="bubble relative mx-auto flex min-h-[7.5rem] w-full max-w-md items-center px-7 py-6"
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden
        className="absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 rotate-45 border-l-[1.5px] border-t-[1.5px] border-blush bg-cream"
      />
      <span aria-hidden className="absolute right-4 top-3 text-sm text-rose">
        ♡
      </span>
      <p
        className="w-full text-center text-lg leading-relaxed text-cocoa transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <span className="sr-only">{text}</span>
        <span aria-hidden>
          {text.slice(0, shown)}
          <span className="opacity-0">{text.slice(shown)}</span>
        </span>
      </p>
    </div>
  );
}
