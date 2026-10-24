import { useRef, useState } from "react";

type Props = { active: boolean; onPeelComplete: () => void };

/** A peelable paper corner. Click/tap or drag it to peel once `active`. */
export function FoldedCorner({ active, onPeelComplete }: Props) {
  const [size, setSize] = useState(72);
  const [peeling, setPeeling] = useState(false);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const BASE = 72;

  const peel = () => {
    if (!active || peeling) return;
    setPeeling(true);
    setSize(Math.max(window.innerWidth, window.innerHeight) * 2.2);
    setTimeout(onPeelComplete, 1100);
  };

  const onDown = (e: React.PointerEvent) => {
    if (!active || peeling) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const d = Math.max(drag.current.x - e.clientX, e.clientY - drag.current.y, 0);
    if (d > 4) drag.current.moved = true;
    setSize(BASE + Math.min(d, 220));
  };
  const onUp = () => {
    if (!drag.current) return;
    const { moved } = drag.current;
    drag.current = null;
    if (!moved || size > BASE + 60) peel();
    else setSize(BASE);
  };

  return (
    <>
      {active && !peeling && (
        <p className="animate-rise pointer-events-none fixed right-20 top-6 z-30 rotate-[-6deg] font-hand text-2xl text-rose md:right-24">
          Psst... peel the page! ↗
        </p>
      )}
      <button
        type="button"
        aria-label="Peel the page corner"
        disabled={!active}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), peel())}
        className={`fixed right-0 top-0 z-40 touch-none select-none focus-visible:outline-2 focus-visible:outline-rose ${active && !peeling ? "animate-nudge cursor-grab origin-top-right" : ""} ${peeling ? "transition-all duration-[1100ms] ease-in-out" : "transition-all duration-200"}`}
        style={{ width: size, height: size }}
      >
        {/* the revealed underside (next page) */}
        <span
          className="absolute inset-0 bg-cream"
          style={{ clipPath: "polygon(0 0,100% 0,100% 100%)" }}
        />
        {/* the curled flap */}
        <span
          className="absolute inset-0"
          style={{
            clipPath: "polygon(0 0,100% 100%,0 100%)",
            background:
              "linear-gradient(225deg, var(--blush) 0%, var(--petal) 45%, var(--cream) 100%)",
            filter: "drop-shadow(-4px 6px 6px color-mix(in oklab, var(--cocoa) 25%, transparent))",
          }}
        />
        {!peeling && (
          <span aria-hidden className="absolute bottom-3 left-3 text-sm text-rose">
            ♡
          </span>
        )}
      </button>
    </>
  );
}
