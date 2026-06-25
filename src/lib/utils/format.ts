/** Format cents (0-100) as a percentage string */
export function formatPrice(cents: number): string {
  return `${cents}¢`;
}

/** Format probability (0-1) as percentage */
export function formatProb(prob: number): string {
  return `${(prob * 100).toFixed(1)}%`;
}

/** Format cents to dollar string */
export function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Format large numbers with K/M suffix */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/** Clamp a number between min and max */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/** Get color class for probability */
export function probColorClass(prob: number): string {
  if (prob >= 0.7) return "text-green-400";
  if (prob >= 0.4) return "text-yellow-400";
  return "text-red-400";
}

/** Format user edge as string with sign */
export function formatEdge(edge: number): string {
  const sign = edge >= 0 ? "+" : "";
  return `${sign}${(edge * 100).toFixed(1)}pp`;
}
