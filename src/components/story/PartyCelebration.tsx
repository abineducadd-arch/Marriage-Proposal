import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

const ROMANTIC_PALETTE = [
  "#f472b6", // Rose pink
  "#fb7185", // Romantic rose
  "#fbbf24", // Soft gold
  "#fef08a", // Shimmering light gold
  "#c084fc", // Lavender
  "#38bdf8", // Magical cyan
  "#ffffff", // White sparkle
];

interface FloatingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  type: "heart" | "star" | "sparkle";
  alpha: number;
  phase: number;
  lifespan: number;
  age: number;
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;

  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(0, topCurveHeight);
  // Top left curve
  ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurveHeight);
  // Bottom left curve
  ctx.bezierCurveTo(
    -size / 2,
    (size + topCurveHeight) / 2,
    0,
    (size + topCurveHeight) / 1.4,
    0,
    size,
  );
  // Bottom right curve
  ctx.bezierCurveTo(
    0,
    (size + topCurveHeight) / 1.4,
    size / 2,
    (size + topCurveHeight) / 2,
    size / 2,
    topCurveHeight,
  );
  // Top right curve
  ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurveHeight);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  color: string,
  alpha: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;

  // 4-pointed sparkle star
  ctx.beginPath();
  const half = size / 2;
  const inner = size * 0.18;
  ctx.moveTo(0, -half);
  ctx.quadraticCurveTo(0, 0, half, 0);
  ctx.quadraticCurveTo(0, 0, 0, half);
  ctx.quadraticCurveTo(0, 0, -half, 0);
  ctx.quadraticCurveTo(0, 0, 0, -half);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Full-screen party-popper celebration component.
 * Triggers confetti cannons from both sides & bottom, floating glowing hearts & sparkles,
 * party-popper cones, an elegant magical light burst, and a joyful victory banner.
 */
export function PartyCelebration({ active }: { active: boolean }) {
  const [showPoppers, setShowPoppers] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showLightBurst, setShowLightBurst] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!active || firedRef.current) return;
    firedRef.current = true;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Show celebratory banner and light burst
    setShowBanner(true);
    setShowLightBurst(true);

    if (reduced) {
      // Gentle reduced motion: display calm celebratory aura without high-velocity particles
      const bannerTimer = window.setTimeout(() => setShowBanner(false), 6000);
      return () => window.clearTimeout(bannerTimer);
    }

    setShowPoppers(true);

    // Launch confetti cannon bursts via canvas-confetti
    const fireCannons = () => {
      // 1. Left party popper cannon (angled upwards into the room)
      confetti({
        particleCount: 55,
        angle: 58,
        spread: 65,
        origin: { x: 0.04, y: 0.85 },
        colors: ROMANTIC_PALETTE,
        ticks: 320,
        gravity: 0.9,
        scalar: 1.15,
        shapes: ["square", "circle"],
      });

      // 2. Right party popper cannon (angled upwards into the room)
      confetti({
        particleCount: 55,
        angle: 122,
        spread: 65,
        origin: { x: 0.96, y: 0.85 },
        colors: ROMANTIC_PALETTE,
        ticks: 320,
        gravity: 0.9,
        scalar: 1.15,
        shapes: ["square", "circle"],
      });

      // 3. Center-bottom cannon
      confetti({
        particleCount: 65,
        angle: 90,
        spread: 95,
        origin: { x: 0.5, y: 0.96 },
        colors: ROMANTIC_PALETTE,
        ticks: 340,
        gravity: 0.85,
        scalar: 1.1,
      });
    };

    // Initial burst
    fireCannons();

    // Cascading follow-up waves for dreamy celebratory depth
    const wave1 = window.setTimeout(() => {
      confetti({
        particleCount: 40,
        angle: 65,
        spread: 55,
        origin: { x: 0.08, y: 0.8 },
        colors: ROMANTIC_PALETTE,
        ticks: 300,
        gravity: 0.85,
      });
      confetti({
        particleCount: 40,
        angle: 115,
        spread: 55,
        origin: { x: 0.92, y: 0.8 },
        colors: ROMANTIC_PALETTE,
        ticks: 300,
        gravity: 0.85,
      });
    }, 320);

    const wave2 = window.setTimeout(() => {
      confetti({
        particleCount: 45,
        angle: 90,
        spread: 120,
        origin: { x: 0.5, y: 0.9 },
        colors: ROMANTIC_PALETTE,
        ticks: 320,
        gravity: 0.8,
      });
    }, 750);

    // Stardust rain from top
    const wave3 = window.setTimeout(() => {
      confetti({
        particleCount: 30,
        angle: 270,
        spread: 140,
        origin: { x: 0.5, y: -0.05 },
        colors: ["#fbbf24", "#fef08a", "#ffffff", "#f472b6"],
        ticks: 280,
        gravity: 0.6,
        scalar: 0.9,
      });
    }, 1300);

    // Hide popper cones after 2.8s
    const popperTimer = window.setTimeout(() => setShowPoppers(false), 2800);
    // Hide victory toast banner after 5.5s
    const bannerTimer = window.setTimeout(() => setShowBanner(false), 5500);

    // Floating glowing hearts & twinkling stars canvas animation
    const canvas = canvasRef.current;
    let animId: number;

    if (canvas) {
      let ctx: CanvasRenderingContext2D | null = null;
      try {
        ctx = canvas.getContext ? canvas.getContext("2d") : null;
      } catch {
        ctx = null;
      }

      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        const width = (canvas.width = window.innerWidth * dpr);
        const height = (canvas.height = window.innerHeight * dpr);
        ctx.scale(dpr, dpr);

        const w = window.innerWidth;
        const h = window.innerHeight;

        // Generate glowing floating particles
        const particles: FloatingParticle[] = [];
        const particleCount = 42;

        for (let i = 0; i < particleCount; i++) {
          const type: "heart" | "star" | "sparkle" =
            i % 3 === 0 ? "heart" : i % 3 === 1 ? "star" : "sparkle";
          const color =
            type === "heart"
              ? i % 2 === 0
                ? "#f472b6"
                : "#fb7185"
              : i % 2 === 0
                ? "#fbbf24"
                : "#67e8f9";

          particles.push({
            x: Math.random() * w,
            y: h + Math.random() * 80 + 20, // Start below or near bottom
            vx: (Math.random() - 0.5) * 0.8,
            vy: -(Math.random() * 1.5 + 0.8), // Float upward
            size: type === "heart" ? 18 + Math.random() * 14 : 12 + Math.random() * 12,
            color,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.04,
            type,
            alpha: 0,
            phase: Math.random() * Math.PI * 2,
            lifespan: 260 + Math.random() * 100, // ~5-6 seconds at 60fps
            age: 0,
          });
        }

        const render = () => {
          ctx.clearRect(0, 0, w, h);
          let alive = 0;

          for (const p of particles) {
            p.age++;
            if (p.age >= p.lifespan) continue;
            alive++;

            // Position and gentle floating sway
            p.x += p.vx + Math.sin(p.age * 0.03 + p.phase) * 0.7;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;

            // Fade in smoothly, then fade out near end of life
            if (p.age < 30) {
              p.alpha = (p.age / 30) * 0.95;
            } else if (p.age > p.lifespan - 45) {
              p.alpha = ((p.lifespan - p.age) / 45) * 0.95;
            } else {
              p.alpha = 0.95;
            }

            if (p.type === "heart") {
              drawHeart(ctx, p.x, p.y, p.size, p.color, p.alpha);
            } else {
              drawStar(ctx, p.x, p.y, p.size, p.rotation, p.color, p.alpha);
            }
          }

          if (alive > 0) {
            animId = requestAnimationFrame(render);
          }
        };

        animId = requestAnimationFrame(render);
      }
    }

    return () => {
      window.clearTimeout(wave1);
      window.clearTimeout(wave2);
      window.clearTimeout(wave3);
      window.clearTimeout(popperTimer);
      window.clearTimeout(bannerTimer);
      if (animId) cancelAnimationFrame(animId);
      try {
        confetti.reset();
      } catch {
        // no-op
      }
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="party-celebration-container" aria-live="assertive">
      {/* 1. Brief elegant screen glow / magical light burst */}
      {showLightBurst && <div className="magical-light-burst" aria-hidden="true" />}

      {/* 2. Floating glowing hearts & sparkling stars canvas */}
      <canvas ref={canvasRef} className="celebration-floating-canvas" aria-hidden="true" />

      {/* 3. Party-popper bursts near the left and right edges */}
      {showPoppers && (
        <>
          <div className="party-popper popper-left" aria-hidden="true">
            <span className="popper-cone">🎉</span>
            <span className="popper-spark-burst" />
          </div>
          <div className="popper-right party-popper" aria-hidden="true">
            <span className="popper-cone">🎉</span>
            <span className="popper-spark-burst" />
          </div>
        </>
      )}

      {/* 4. Celebratory victory toast/banner */}
      {showBanner && (
        <div className="celebration-victory-toast" role="status">
          <div className="victory-toast-inner">
            <span className="victory-sparkle-icon" aria-hidden="true">
              ✨
            </span>
            <h2 className="victory-title">SHE SAID YES! ❤️</h2>
            <p className="victory-subtitle font-hand">Our forever begins here...</p>
            <span className="victory-sparkle-icon" aria-hidden="true">
              ✨
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
