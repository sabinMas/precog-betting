import type { NormalizedMarket, ComboLeg, ComboAnalysis } from "@/lib/kalshi/types";

/**
 * Spread Score: tighter spread = higher score.
 * Score = max(0, 100 - spread_cents * 5)
 */
export function computeSpreadScore(spreadCents: number): number {
  return Math.max(0, 100 - spreadCents * 5);
}

/**
 * Liquidity Score: log-scaled market liquidity vs pool max.
 */
export function computeLiquidityScore(liquidity: number, maxLiquidity: number): number {
  if (maxLiquidity <= 0) return 50;
  const logVal = Math.log1p(liquidity);
  const logMax = Math.log1p(maxLiquidity);
  return Math.min(100, (logVal / logMax) * 100);
}

/**
 * Volume Acceleration: volume_24h vs volume total, signals recent activity.
 */
export function computeVolumeAccelerationScore(
  volume24h: number,
  volumeTotal: number
): number {
  if (volumeTotal <= 0) return 0;
  const ratio = volume24h / volumeTotal;
  return Math.min(100, ratio * 200); // ratio of 0.5+ = max score
}

/**
 * Short-term movement: absolute price change in cents vs some baseline.
 */
export function computeMomentumScore(
  currentMid: number,
  previousMid: number
): number {
  const delta = Math.abs(currentMid - previousMid);
  return Math.min(100, delta * 10); // 10 cent move = 100 score
}

/**
 * User edge: how far user probability deviates from implied.
 * Positive = user thinks it's more likely than market.
 */
export function computeUserEdge(
  userProb: number,
  impliedProb: number
): number {
  return userProb - impliedProb; // -1 to 1
}

/**
 * Detect potentially correlated markets in a combo by checking
 * whether tickers share event_ticker prefixes or keywords.
 */
export function detectCorrelations(legs: ComboLeg[]): string[] {
  const warnings: string[] = [];
  const eventTickers = legs.map((l) => l.ticker.split("-")[0]);
  const uniqueEvents = new Set(eventTickers);

  if (uniqueEvents.size < legs.length) {
    warnings.push(
      "Multiple legs share the same event — outcomes may be correlated and independence assumptions are invalid."
    );
  }

  // Check if all "yes" legs — if one event resolves wrong, correlation affects all
  const allYes = legs.every((l) => l.side === "yes");
  if (allYes && legs.length >= 3) {
    warnings.push(
      "All legs are YES — a single macroeconomic or political shift could move all simultaneously."
    );
  }

  return warnings;
}

/**
 * Analyze a multi-leg combo.
 * Combined probability assumes statistical independence (almost never true).
 */
export function analyzeCombo(legs: ComboLeg[]): ComboAnalysis {
  const impliedProbs = legs.map((l) =>
    l.side === "yes" ? l.impliedProbability : 1 - l.impliedProbability
  );
  const userProbs = legs.map((l) =>
    l.userProbability !== undefined
      ? l.side === "yes"
        ? l.userProbability
        : 1 - l.userProbability
      : null
  );

  const combinedImplied = impliedProbs.reduce((acc, p) => acc * p, 1);
  const allUserProvided = userProbs.every((p) => p !== null);
  const combinedUser = allUserProvided
    ? (userProbs as number[]).reduce((acc, p) => acc * p, 1)
    : undefined;

  // Simple payout: if all legs correct, collect ~100 per leg minus cost
  const totalCostCents = legs.reduce((acc, l) => acc + l.price, 0);
  const potentialPayoutCents = legs.length * 100;
  const netPayoutCents = potentialPayoutCents - totalCostCents;

  const ev =
    combinedUser !== undefined
      ? combinedUser * netPayoutCents - (1 - combinedUser) * totalCostCents
      : undefined;

  const correlationWarnings = detectCorrelations(legs);
  const correlationRiskFlag = correlationWarnings.length > 0;

  return {
    legs,
    combinedImpliedProbability: combinedImplied,
    combinedUserProbability: combinedUser,
    combinedPayout: netPayoutCents,
    expectedValueCents: ev,
    correlationRiskFlag,
    correlationWarnings,
    independenceWarning:
      "These calculations assume complete statistical independence between outcomes, which is rarely true. Use as rough estimates only.",
  };
}

/**
 * Rank markets by composite score descending.
 */
export function rankMarkets(markets: NormalizedMarket[]): NormalizedMarket[] {
  return [...markets].sort((a, b) => b.compositeScore - a.compositeScore);
}
