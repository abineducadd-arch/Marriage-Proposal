import { useEffect, useRef, useState, type PointerEvent, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { switchInBeam } from "./adventure";
import switchImg from "@/assets/story/light-switch.png";

export function DarkRoom({
  children,
  position,
  onFound,
  onActivate,
  lit,
}: {
  children: React.ReactNode;
  position: { x: number; y: number };
  onFound: () => void;
  onActivate: () => void;
  lit: boolean;
}) {
  const surface = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const revealRef = useRef(false);
  const moved = useRef(false);
  const down = useRef({ x: 0, y: 0 });
  const update = (x: number, y: number) => {
    const el = surface.current;
    if (!el || lit) return;
    const rect = el.getBoundingClientRect();
    const px = x - rect.left,
      py = y - rect.top;
    el.style.setProperty("--beam-x", `${px}px`);
    el.style.setProperty("--beam-y", `${py}px`);
    const found = switchInBeam(
      px,
      py,
      (rect.width * position.x) / 100,
      (rect.height * position.y) / 100,
    );
    if (found !== revealRef.current) {
      revealRef.current = found;
      setRevealed(found);
    }
    if (found) onFound();
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (Math.hypot(e.clientX - down.current.x, e.clientY - down.current.y) > 8)
      moved.current = true;
    update(e.clientX, e.clientY);
  };
  useEffect(() => {
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
    };
  }, []);
  return (
    <div
      ref={surface}
      className={`room-surface ${lit ? "room-lit" : "room-dark"}`}
      onPointerMove={move}
      onPointerDown={(e) => {
        down.current = { x: e.clientX, y: e.clientY };
        moved.current = false;
        update(e.clientX, e.clientY);
      }}
      onPointerCancel={() => {
        moved.current = false;
      }}
    >
      {children}
      <Button
        variant="ghost"
        aria-label="Turn on the light switch"
        className={`light-switch ${lit ? "switch-on" : ""} ${revealed ? "switch-found" : ""}`}
        style={{ left: `${position.x}%`, top: `${position.y}%` } as CSSProperties}
        onFocus={() => {
          const r = surface.current?.getBoundingClientRect();
          if (r)
            update(r.left + (r.width * position.x) / 100, r.top + (r.height * position.y) / 100);
        }}
        onClick={(e) => {
          if (lit || (e.detail !== 0 && (moved.current || !revealed))) return;
          onActivate();
        }}
      >
        <img src={switchImg} alt="Light switch" className="switch-image" draggable={false} />
      </Button>
      {!lit && <div className="flashlight-mask" aria-hidden="true" />}
    </div>
  );
}
