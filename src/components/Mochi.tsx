import mochiHappy from "@/assets/mochi/happy.jpg";
import mochiCurious from "@/assets/mochi/curious.jpg";
import mochiWorried from "@/assets/mochi/worried.jpg";
import mochiLaughing from "@/assets/mochi/laughing.jpg";

export type MochiExpression = "happy" | "curious" | "worried" | "laughing" | "sad";

export const MOCHI_EXPRESSIONS = ["happy", "curious", "worried", "laughing"] as const;
export type PrimaryMochiExpression = (typeof MOCHI_EXPRESSIONS)[number];

/** Replace any expression by swapping the image file. */
export const MOCHI_ASSETS: Record<MochiExpression, { src: string; alt: string }> = {
  happy: { src: mochiHappy, alt: "Mochi the bunny winking happily" },
  curious: { src: mochiCurious, alt: "Mochi the bunny looking curious" },
  worried: { src: mochiWorried, alt: "Mochi the bunny looking worried" },
  sad: { src: mochiWorried, alt: "Mochi the bunny looking sad" },
  laughing: { src: mochiLaughing, alt: "Mochi the bunny laughing" },
};

/**
 * Resolves any expression name or alias to a primary expression that has an image,
 * falling back safely to "happy" if an invalid or missing expression is provided.
 */
export function resolveMochiExpression(expression?: string | null): PrimaryMochiExpression {
  if (!expression) return "happy";
  if (expression === "sad") return "worried";
  if (expression in MOCHI_ASSETS) {
    const canonical = expression === "sad" ? "worried" : expression;
    return canonical as PrimaryMochiExpression;
  }
  return "happy";
}

export function Mochi({
  expression,
  reactKey = 0,
}: {
  expression?: MochiExpression | string;
  reactKey?: number;
}) {
  const activeExpression = resolveMochiExpression(expression);

  return (
    <div className="animate-float">
      <div
        key={reactKey}
        className="animate-bounce-soft relative mx-auto aspect-square w-[min(72vw,340px)] md:w-[380px]"
      >
        {MOCHI_EXPRESSIONS.map((e) => (
          <img
            key={e}
            src={MOCHI_ASSETS[e].src}
            alt={e === activeExpression ? MOCHI_ASSETS[e].alt : ""}
            aria-hidden={e !== activeExpression}
            className="watercolor-frame pointer-events-none select-none absolute inset-0 h-full w-full object-contain transition-opacity duration-700"
            style={{ opacity: e === activeExpression ? 1 : 0 }}
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
}
