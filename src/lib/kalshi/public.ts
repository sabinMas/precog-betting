import { KALSHI_BASE_URL } from "./config";
import type {
  KalshiMarket,
  KalshiMarketsResponse,
  KalshiOrderbookResponse,
  KalshiEvent,
} from "./types";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

async function kalshiFetch<T>(
  path: string,
  options?: RequestInit,
  revalidate = 10
): Promise<T> {
  const url = `${KALSHI_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...DEFAULT_HEADERS, ...(options?.headers ?? {}) },
    next: { revalidate },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Kalshi API ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json() as Promise<T>;
}

export interface GetMarketsOptions {
  status?: "open" | "closed" | "settled";
  series_ticker?: string;
  event_ticker?: string;
  limit?: number;
  cursor?: string;
  min_close_ts?: number;
  max_close_ts?: number;
}

export async function getMarkets(
  opts: GetMarketsOptions = {}
): Promise<KalshiMarketsResponse> {
  const params = new URLSearchParams();
  if (opts.status) params.set("status", opts.status);
  if (opts.series_ticker) params.set("series_ticker", opts.series_ticker);
  if (opts.event_ticker) params.set("event_ticker", opts.event_ticker);
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.cursor) params.set("cursor", opts.cursor);
  if (opts.min_close_ts) params.set("min_close_ts", String(opts.min_close_ts));
  if (opts.max_close_ts) params.set("max_close_ts", String(opts.max_close_ts));

  const qs = params.toString();
  return kalshiFetch<KalshiMarketsResponse>(
    `/markets${qs ? `?${qs}` : ""}`,
    undefined,
    10
  );
}

export async function getMarket(ticker: string): Promise<{ market: KalshiMarket }> {
  return kalshiFetch<{ market: KalshiMarket }>(`/markets/${ticker}`, undefined, 10);
}

export async function getOrderbook(
  ticker: string
): Promise<KalshiOrderbookResponse> {
  return kalshiFetch<KalshiOrderbookResponse>(
    `/markets/${ticker}/orderbook`,
    undefined,
    5
  );
}

export async function getEvent(
  eventTicker: string
): Promise<{ event: KalshiEvent }> {
  return kalshiFetch<{ event: KalshiEvent }>(
    `/events/${eventTicker}?with_nested_markets=true`,
    undefined,
    30
  );
}

export async function getSeries(
  seriesTicker: string
): Promise<{ series: unknown }> {
  return kalshiFetch<{ series: unknown }>(
    `/series/${seriesTicker}`,
    undefined,
    60
  );
}

/** Fetch multiple pages of open markets up to maxMarkets */
export async function getAllOpenMarkets(
  maxMarkets = 200
): Promise<KalshiMarket[]> {
  const markets: KalshiMarket[] = [];
  let cursor: string | undefined;

  do {
    const resp = await getMarkets({
      status: "open",
      limit: 100,
      cursor,
    });
    markets.push(...(resp.markets ?? []));
    cursor = resp.cursor;
  } while (cursor && markets.length < maxMarkets);

  return markets.slice(0, maxMarkets);
}
