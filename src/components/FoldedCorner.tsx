import { useEffect, useRef, useState } from "react";
import { playPeelSound, stopPeelSound } from "@/lib/sounds";

type Props = { active: boolean; onPeelComplete: () => void };

/**
 * Responsive folded corner dimensions:
 * - < 390px (compact mobile): 56px base width/height
 * - 390px - 639px (standard mobile): 64px base width/height
 * - >= 640px (tablet / desktop): 76px base width/height
 * All configurations provide a touch target >= 56px, exceeding the 44-48px mobile accessibility minimum.
 */
function getFoldBaseSize(width: number): number {
  if (width < 390) return 56;
  if (width < 640) return 64;
  return 76;
}

function getSafeViewportDimensions() {
  const w = typeof window !== "undefined" && window.innerWidth > 0 ? window.innerWidth : 1024;
  const h = typeof window !== "undefined" && window.innerHeight > 0 ? window.innerHeight : 768;
  return { width: w, height: h };
}

/**
 * A touch-friendly, responsive peelable paper corner for Page 1.
 * Supports tap, click, keyboard, and one-finger or mouse drag.
 * Fully responsive and reliable across desktop, Android, iPhone, and tablets.
 */
export function FoldedCorner({ active, onPeelComplete }: Props) {
  const [baseSize, setBaseSize] = useState(() =>
    typeof window !== "undefined" ? getFoldBaseSize(window.innerWidth) : 76,
  );
  const [size, setSize] = useState(baseSize);
  const [peeling, setPeeling] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const currentSizeRef = useRef(baseSize);
  const drag = useRef<{
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const capturedPointerId = useRef<number | null>(null);
  const peelingRef = useRef(false);
  const completedRef = useRef(false);
  const preventClickRef = useRef(false);

  // Sync size when viewport resizes or rotates
  useEffect(() => {
    const handleResize = () => {
      const newBase = getFoldBaseSize(window.innerWidth);
      setBaseSize(newBase);
      if (!peelingRef.current && !drag.current) {
        currentSizeRef.current = newBase;
        setSize(newBase);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Stop sound on unmount
  useEffect(() => {
    return () => {
      stopPeelSound();
    };
  }, []);

  const peel = () => {
    if (!active || peelingRef.current) return;
    peelingRef.current = true;
    setPeeling(true);
    setIsDragging(false);
    playPeelSound();

    const { width, height } = getSafeViewportDimensions();
    // Sizing large enough to diagonal-sweep across the whole viewport regardless of orientation
    const fullSize = Math.max(width, height) * 2.5;
    currentSizeRef.current = fullSize;
    setSize(fullSize);

    // Complete transition and navigate to the next scene exactly once
    setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onPeelComplete();
      }
    }, 1100);
  };

  const onDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!active || peelingRef.current) return;
    const pointerId = e.pointerId ?? 1;

    // Prevent multi-touch interference; only track one active pointer
    if (capturedPointerId.current !== null && capturedPointerId.current !== pointerId) {
      return;
    }

    // Capture the pointer on the button element so dragging continues even outside boundaries
    try {
      e.currentTarget.setPointerCapture(pointerId);
      capturedPointerId.current = pointerId;
    } catch {
      capturedPointerId.current = pointerId;
    }

    drag.current = {
      startX: e.clientX ?? 0,
      startY: e.clientY ?? 0,
      moved: false,
    };
    setIsDragging(true);
  };

  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag.current || peelingRef.current) return;
    const pointerId = e.pointerId ?? 1;
    if (capturedPointerId.current !== null && pointerId !== capturedPointerId.current) return;

    const currentX = e.clientX ?? 0;
    const currentY = e.clientY ?? 0;
    const dx = drag.current.startX - currentX; // Leftward displacement
    const dy = currentY - drag.current.startY; // Downward displacement

    // Peeling top-right corner responds to inward dragging (down and/or left)
    const diagonal = (dx + dy) / 1.414;
    const effectiveDrag = Math.max(0, Math.max(dx, dy, diagonal));

    if (effectiveDrag > 5) {
      drag.current.moved = true;
      preventClickRef.current = true;
    }

    const { width, height } = getSafeViewportDimensions();
    // Limit preview drag size to 65% of viewport before triggering completion
    const maxDrag = Math.min(width, height) * 0.65;
    const newSize = Math.round(baseSize + Math.min(effectiveDrag, maxDrag));
    currentSizeRef.current = newSize;
    setSize(newSize);
  };

  const releaseCapture = (e: React.PointerEvent<HTMLButtonElement>, pointerId: number) => {
    if (capturedPointerId.current !== null) {
      try {
        if (e.currentTarget.hasPointerCapture?.(pointerId)) {
          e.currentTarget.releasePointerCapture(pointerId);
        }
      } catch {
        // Ignored
      }
      capturedPointerId.current = null;
    }
  };

  const onUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const pointerId = e.pointerId ?? 1;
    releaseCapture(e, pointerId);

    if (!drag.current) return;
    const { moved } = drag.current;
    drag.current = null;
    setIsDragging(false);

    if (peelingRef.current) return;

    if (moved) {
      preventClickRef.current = true;
      setTimeout(() => {
        preventClickRef.current = false;
      }, 150);
    }

    const { width } = getSafeViewportDimensions();
    // Responsive completion threshold
    const threshold = baseSize + (width < 640 ? 36 : 50);

    if (!moved) {
      // Direct tap or click without dragging -> peel
      peel();
    } else if (currentSizeRef.current >= threshold) {
      // Dragged past threshold -> complete peel
      peel();
    } else {
      // Released too early -> smoothly spring back to base size
      currentSizeRef.current = baseSize;
      setSize(baseSize);
    }
  };

  const onCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    const pointerId = e.pointerId ?? 1;
    releaseCapture(e, pointerId);
    drag.current = null;
    setIsDragging(false);
    preventClickRef.current = false;
    // Do not leave paper stuck halfway on interrupted gestures
    if (!peelingRef.current) {
      currentSizeRef.current = baseSize;
      setSize(baseSize);
    }
  };

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (preventClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      preventClickRef.current = false;
      return;
    }
    if (active && !peelingRef.current) {
      peel();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if ((e.key === "Enter" || e.key === " ") && active && !peelingRef.current) {
      e.preventDefault();
      peel();
    }
  };

  return (
    <>
      {active && !peeling && (
        <div
          className={`pointer-events-none fixed z-30 transition-opacity duration-300 ${
            isDragging ? "opacity-0" : "animate-rise opacity-100"
          }`}
          style={{
            top: "0.85rem",
            right: `${baseSize + 12}px`,
          }}
        >
          <p className="flex items-center gap-1 font-hand text-rose select-none drop-shadow-xs text-base sm:text-lg md:text-2xl whitespace-nowrap rotate-[-4deg]">
            Psst... peel the page!
            <span aria-hidden="true" className="inline-block text-xl md:text-2xl">
              ↗
            </span>
          </p>
        </div>
      )}
      <button
        type="button"
        aria-label="Peel the page corner"
        disabled={!active}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
        onClick={onClick}
        onKeyDown={onKeyDown}
        className={`fixed right-0 top-0 z-40 touch-none select-none focus-visible:outline-2 focus-visible:outline-rose ${
          active && !peeling
            ? "animate-nudge cursor-grab origin-top-right active:cursor-grabbing"
            : ""
        } ${
          isDragging
            ? "transition-none"
            : peeling
              ? "transition-all duration-[1100ms] ease-in-out"
              : "transition-all duration-300 ease-out"
        }`}
        style={{
          width: size,
          height: size,
          minWidth: "48px",
          minHeight: "48px",
        }}
      >
        {/* the revealed underside (next page) */}
        <span
          className="absolute inset-0 bg-cream"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
        />
        {/* the curled flap */}
        <span
          className="absolute inset-0"
          style={{
            clipPath: "polygon(0 0, 100% 100%, 0 100%)",
            background:
              "linear-gradient(225deg, var(--blush) 0%, var(--petal) 45%, var(--cream) 100%)",
            filter: "drop-shadow(-4px 6px 6px color-mix(in oklab, var(--cocoa) 25%, transparent))",
          }}
        />
        {!peeling && (
          <span
            aria-hidden
            className="absolute bottom-2.5 left-2.5 text-xs text-rose select-none sm:bottom-3 sm:left-3 sm:text-sm"
          >
            ♡
          </span>
        )}
      </button>
    </>
  );
}
