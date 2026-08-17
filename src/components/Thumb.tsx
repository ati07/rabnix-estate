import { thumbGradient } from "@/modules/demo/dummy";

// Deterministic gradient thumbnail — a self-contained stand-in for a photo (no external images).
// The same seed always yields the same gradient, so a card looks stable across renders.
export function Thumb({
  seed,
  icon,
  badge,
  tall = false,
}: {
  seed: string;
  icon: string;
  badge?: string;
  tall?: boolean;
}) {
  return (
    <div
      className={`thumb${tall ? " thumb-tall" : ""}`}
      style={{ backgroundImage: thumbGradient(seed) }}
      aria-hidden
    >
      {badge && <span className="thumb-badge">{badge}</span>}
      <span className="thumb-icon">{icon}</span>
    </div>
  );
}
