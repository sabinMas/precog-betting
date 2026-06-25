"use client";
import Link from "next/link";
import { Star, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { formatProb, formatCompact } from "@/lib/utils/format";
import type { NormalizedMarket } from "@/lib/kalshi/types";

interface MarketCardProps {
  market: NormalizedMarket;
  onWatch?: (ticker: string) => void;
  isWatched?: boolean;
}

export function MarketCard({ market, onWatch, isWatched }: MarketCardProps) {
  const prob = market.impliedProbability;
  const probColor = prob >= 0.65 ? "text-green-400" : prob <= 0.35 ? "text-red-400" : "text-yellow-400";

  return (
    <div className="group relative rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-all hover:border-zinc-600 hover:bg-zinc-850">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Link
            href={`/markets/${market.ticker}`}
            className="block text-sm font-semibold text-zinc-100 hover:text-blue-400 transition-colors line-clamp-2"
          >
            {market.title}
          </Link>
          <p className="mt-0.5 text-xs text-zinc-500">{market.ticker}</p>
        </div>
        <button
          onClick={() => onWatch?.(market.ticker)}
          className="shrink-0 p-1 text-zinc-500 hover:text-yellow-400 transition-colors"
          title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
        >
          <Star className={cn("h-4 w-4", isWatched && "fill-yellow-400 text-yellow-400")} />
        </button>
      </div>

      {/* Prices */}
      <div className="mb-3 flex items-center gap-4">
        <div>
          <div className={cn("text-2xl font-bold", probColor)}>{formatProb(prob)}</div>
          <div className="text-xs text-zinc-500">implied prob</div>
        </div>
        <div className="text-xs text-zinc-400 space-y-0.5">
          <div>YES {market.yes_bid}¢ / {market.yes_ask}¢</div>
          <div>Spread <span className={cn(market.spread <= 3 ? "text-green-400" : market.spread >= 10 ? "text-red-400" : "text-yellow-400")}>{market.spread}¢</span></div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-zinc-400">
        <div>Vol 24h <span className="text-zinc-200">{formatCompact(market.volume_24h ?? market.volume)}</span></div>
        <div>Liquidity <span className="text-zinc-200">{formatCompact(market.liquidity)}</span></div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {market.surfacedReasons.map((reason) => (
          <Badge
            key={reason}
            variant={
              reason === "tight spread" ? "green"
              : reason === "wide spread" ? "red"
              : reason === "high volume" ? "default"
              : reason === "expiring soon" ? "yellow"
              : "secondary"
            }
            className="text-[10px]"
          >
            {reason}
          </Badge>
        ))}
        {market.category && (
          <Badge variant="outline" className="text-[10px]">
            {market.category}
          </Badge>
        )}
      </div>

      {/* Expiry */}
      <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
        <Clock className="h-3 w-3" />
        <span>Expires in {market.expiresInLabel}</span>
      </div>

      {/* Score bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
          <span>Composite score</span>
          <span>{market.compositeScore.toFixed(0)}/100</span>
        </div>
        <div className="h-1 rounded-full bg-zinc-800">
          <div
            className="h-1 rounded-full bg-blue-500 transition-all"
            style={{ width: `${Math.min(100, market.compositeScore)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
