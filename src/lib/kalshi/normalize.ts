import { formatDistanceToNow, differenceInMilliseconds } from "date-fns";
import type {
  KalshiMarket,
  KalshiOrderbook,
  NormalizedMarket,
  NormalizedOrderbook,
} from "./types";

/** Convert yes_ask cents (1-99) to implied probability (0-1) */
export function centsToProb(priceCents: number): number {
  return Math.max(0, Math.min(1, priceCents / 100));
}

/** Midpoint of yes bid/ask in cents */
function midpoint(market: KalshiMarket): number {
  return (market.yes_bid + market.yes_ask) / 2;
}

export function normalizeMarket(
  market: KalshiMarket,
  maxVolume: number,
  maxLiquidity: number
): NormalizedMarket {
  const now = Date.now();
  const expiryTime = market.close_time
    ? new Date(market.close_time).getTime()
    : now + 86_400_000;
  const expiresInMs = Math.max(0, expiryTime - now);

  const spread = market.yes_ask - market.yes_bid;
  const prob = centsToProb(midpoint(market));

  const prevPrice = market.previous_price ?? market.last_price ?? midpoint(market);
  const priceDeltaCents = Math.abs(midpoint(market) - prevPrice);

  // Scores (0-100)
  const spreadScore = Math.max(0, 100 - spread * 5);
  const liquidityScore = maxLiquidity > 0
    ? Math.min(100, (market.liquidity / maxLiquidity) * 100)
    : 50;
  const volumeScore = maxVolume > 0
    ? Math.min(100, (market.volume_24h ?? market.volume) / maxVolume * 100)
    : 50;
  const momentumScore = Math.min(100, priceDeltaCents * 10);
  const compositeScore =
    spreadScore * 0.25 + liquidityScore * 0.3 + volumeScore * 0.3 + momentumScore * 0.15;

  // Labels
  const isExpiringSoon = expiresInMs < 86_400_000; // < 24h
  const isHighVolume = volumeScore > 70;
  const isFastMover = momentumScore > 40;
  const isWideSpread = spread >= 10;

  const surfacedReasons: string[] = [];
  if (isHighVolume) surfacedReasons.push("high volume");
  if (isFastMover) surfacedReasons.push("fast mover");
  if (spread <= 3) surfacedReasons.push("tight spread");
  if (isWideSpread) surfacedReasons.push("wide spread");
  if (isExpiringSoon) surfacedReasons.push("expiring soon");
  if (liquidityScore > 70) surfacedReasons.push("liquid");

  let expiresInLabel = "—";
  try {
    expiresInLabel = formatDistanceToNow(new Date(expiryTime), { addSuffix: false });
  } catch {
    // ignore
  }

  return {
    ...market,
    impliedProbability: prob,
    spread,
    spreadScore,
    liquidityScore,
    volumeScore,
    momentumScore,
    compositeScore,
    expiresInMs,
    expiresInLabel,
    surfacedReasons,
    isExpiringSoon,
    isHighVolume,
    isFastMover,
    isWideSpread,
  };
}

export function normalizeMarkets(markets: KalshiMarket[]): NormalizedMarket[] {
  const maxVolume = Math.max(...markets.map((m) => m.volume_24h ?? m.volume ?? 0), 1);
  const maxLiquidity = Math.max(...markets.map((m) => m.liquidity ?? 0), 1);
  return markets.map((m) => normalizeMarket(m, maxVolume, maxLiquidity));
}

export function normalizeOrderbook(ob: KalshiOrderbook): NormalizedOrderbook {
  let cumYes = 0;
  const yesLevels = [...(ob.yes ?? [])]
    .sort((a, b) => b.price - a.price)
    .map((l) => {
      cumYes += l.delta;
      return { price: l.price, quantity: l.delta, cumulative: cumYes };
    });

  let cumNo = 0;
  const noLevels = [...(ob.no ?? [])]
    .sort((a, b) => b.price - a.price)
    .map((l) => {
      cumNo += l.delta;
      return { price: l.price, quantity: l.delta, cumulative: cumNo };
    });

  const bestYesBid = yesLevels[0]?.price ?? 0;
  const bestYesAsk = noLevels.length > 0 ? 100 - noLevels[0].price : 100;
  const midpoint = (bestYesBid + bestYesAsk) / 2;
  const spread = bestYesAsk - bestYesBid;

  return { yesLevels, noLevels, bestYesBid, bestYesAsk, midpoint, spread };
}
