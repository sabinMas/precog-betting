export const KALSHI_BASE_URL =
  process.env.KALSHI_BASE_URL ?? "https://trading-api.kalshi.com/trade-api/v2";

export const KALSHI_API_KEY_ID = process.env.KALSHI_API_KEY_ID ?? "";
export const KALSHI_PRIVATE_KEY = process.env.KALSHI_PRIVATE_KEY ?? "";

export const DEFAULT_PAGE_SIZE = 50;
export const PUBLIC_CACHE_TTL_MS = 10_000; // 10 seconds
export const ORDER_CACHE_TTL_MS = 2_000;   // 2 seconds

export function hasKalshiCredentials(): boolean {
  return Boolean(KALSHI_API_KEY_ID && KALSHI_PRIVATE_KEY);
}

/** Normalize the private key PEM from env (handles base64 or raw PEM) */
export function getPrivateKeyPem(): string {
  const raw = KALSHI_PRIVATE_KEY;
  if (!raw) return "";
  // If it looks like base64 (no newlines, long string), decode it
  if (!raw.includes("-----BEGIN")) {
    try {
      return Buffer.from(raw, "base64").toString("utf-8");
    } catch {
      return raw;
    }
  }
  // Replace literal \n with actual newlines (common env var issue)
  return raw.replace(/\\n/g, "\n");
}
