import { useEffect, useState } from "react";

interface SparkleParticle {
  id: number;
  symbol: string;
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
  rotation: number;
}

const SYMBOLS = ["✦", "✧", "★", "•", "♡"];
const COLORS = [
  "#c89b3c", // Warm antique gold
  "#dfba6b", // Soft champagne gold
  "#8b5a2b", // Vintage sepia
  "#d4a373", // Warm parchment amber
  "#e9d5be", // Antique ivory
  "#b07d4f", // Burnished bronze
];

function generateSparkles(count = 18): SparkleParticle[] {
  const particles: SparkleParticle[] = [];
  const angleStep = 360 / count;

  for (let i = 0; i < count; i++) {
    const baseAngle = i * angleStep;
    const jitter = ((i * 13) % 15) - 7;
    const angle = baseAngle + jitter;
    const distance = 80 + ((i * 17) % 50); // 80px to 130px
    const size = 13 + ((i * 7) % 12); // 13px to 25px
    const color = COLORS[i % COLORS.length]!;
    const symbol = SYMBOLS[i % SYMBOLS.length]!;
    const delay = ((i * 37) % 120); // 0 to 120ms
    const rotation = ((i * 43) % 180) - 90;

    particles.push({
      id: i,
      symbol,
      angle,
      distance,
      size,
      color,
      delay,
      rotation,
    });
  }

  return particles;
}

/**
 * Magical sparkle burst that emanates outward around the Page 2 popups
 * when opened. Automatically removes temporary DOM particles after the burst.
 */
export function MagicalPopupSparkles({ active }: { active: boolean }) {
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState<SparkleParticle[]>([]);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    setParticles(generateSparkles(18));
    setVisible(true);

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [active]);

  if (!visible) return null;

  return (
    <div className="popup-sparkle-container" aria-hidden="true">
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.distance;
        const ty = Math.sin(rad) * p.distance;

        return (
          <span
            key={p.id}
            className="popup-sparkle-item"
            style={
              {
                "--tx": `${tx.toFixed(1)}px`,
                "--ty": `${ty.toFixed(1)}px`,
                "--rot": `${p.rotation}deg`,
                "--delay": `${p.delay}ms`,
                "--color": p.color,
                "--size": `${p.size}px`,
              } as React.CSSProperties
            }
          >
            {p.symbol}
          </span>
        );
      })}
    </div>
  );
}
