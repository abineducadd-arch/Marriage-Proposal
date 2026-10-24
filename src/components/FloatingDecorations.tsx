const items = [
  { s: "♡", t: "12%", l: "8%", d: "0s", c: "text-rose", z: "text-2xl" },
  { s: "✿", t: "22%", l: "88%", d: "1.5s", c: "text-peach", z: "text-3xl" },
  { s: "✦", t: "8%", l: "60%", d: "0.6s", c: "text-peach", z: "text-lg", tw: true },
  { s: "♡", t: "70%", l: "92%", d: "2.4s", c: "text-blush", z: "text-3xl" },
  { s: "✿", t: "80%", l: "5%", d: "3s", c: "text-rose", z: "text-2xl" },
  { s: "✦", t: "50%", l: "4%", d: "1s", c: "text-rose", z: "text-sm", tw: true },
  { s: "✦", t: "40%", l: "95%", d: "2s", c: "text-peach", z: "text-sm", tw: true },
  { s: "♡", t: "90%", l: "60%", d: "4s", c: "text-blush", z: "text-xl" },
];

export function FloatingDecorations() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((i, k) => (
        <span
          key={k}
          className={`absolute ${i.c} ${i.z} ${i.tw ? "animate-twinkle" : "animate-drift"} opacity-70`}
          style={{ top: i.t, left: i.l, animationDelay: i.d }}
        >
          {i.s}
        </span>
      ))}
    </div>
  );
}
