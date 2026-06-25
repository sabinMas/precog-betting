"use client";
import { use, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { ArrowLeft, Star, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderbookChart } from "@/components/charts/OrderbookChart";
import { cn } from "@/lib/utils/cn";
import { formatProb, formatCompact, formatEdge } from "@/lib/utils/format";
import type { NormalizedMarket, NormalizedOrderbook } from "@/lib/kalshi/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MarketPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params);
  const [userProb, setUserProb] = useState<string>("");
  const [userThesis, setUserThesis] = useState("");
  const [watched, setWatched] = useState(false);

  const { data: marketData } = useSWR<{ market: NormalizedMarket; _mock?: boolean }>(
    `/api/kalshi/market/${ticker}`,
    fetcher,
    { refreshInterval: 10_000 }
  );
  const { data: obData } = useSWR<{ orderbook: NormalizedOrderbook }>(
    `/api/kalshi/orderbook/${ticker}`,
    fetcher,
    { refreshInterval: 5_000 }
  );

  const market = marketData?.market;
  const orderbook = obData?.orderbook;

  const userProbNum = parseFloat(userProb) / 100;
  const userEdge = market && !isNaN(userProbNum)
    ? formatEdge(userProbNum - market.impliedProbability)
    : null;
  const evEstimate = market && !isNaN(userProbNum)
    ? ((userProbNum * (100 - market.yes_ask)) - ((1 - userProbNum) * market.yes_ask)).toFixed(1)
    : null;

  async function toggleWatch() {
    if (!market) return;
    if (watched) {
      await fetch("/api/kalshi/watchlist", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker }) });
    } else {
      await fetch("/api/kalshi/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker, title: market.title }) });
    }
    setWatched((v) => !v);
  }

  if (!market) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      {/* Back */}
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200">
        <ArrowLeft className="h-4 w-4" /> Back to scanner
      </Link>

      {marketData?._mock && (
        <div className="mb-4 rounded-lg border border-yellow-800 bg-yellow-950/50 px-4 py-2 text-sm text-yellow-300">
          Showing demo data. Configure Kalshi API key for live market data.
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-zinc-500">{market.ticker}</span>
            <Badge variant={market.status === "open" ? "green" : "secondary"}>{market.status}</Badge>
            {market.category && <Badge variant="outline">{market.category}</Badge>}
            {market.isExpiringSoon && <Badge variant="yellow">Expiring Soon</Badge>}
          </div>
          <h1 className="text-xl font-bold text-zinc-100">{market.title}</h1>
          <div className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
            <Clock className="h-3 w-3" />
            Expires in {market.expiresInLabel}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={toggleWatch}>
          <Star className={cn("h-4 w-4", watched && "fill-yellow-400 text-yellow-400")} />
          {watched ? "Watching" : "Watch"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Pricing + Orderbook */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live pricing */}
          <Card>
            <CardHeader><CardTitle>Live Pricing</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={cn("text-3xl font-bold", market.impliedProbability >= 0.65 ? "text-green-400" : market.impliedProbability <= 0.35 ? "text-red-400" : "text-yellow-400")}>
                    {formatProb(market.impliedProbability)}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">Implied probability</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-zinc-100">
                    {market.yes_bid}¢ / {market.yes_ask}¢
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">YES bid / ask</div>
                </div>
                <div className="text-center">
                  <div className={cn("text-2xl font-bold", market.spread <= 3 ? "text-green-400" : market.spread >= 10 ? "text-red-400" : "text-yellow-400")}>
                    {market.spread}¢
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">Spread</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-3 text-sm">
                {[
                  { label: "Vol 24h", value: formatCompact(market.volume_24h ?? market.volume) },
                  { label: "Liquidity", value: formatCompact(market.liquidity) },
                  { label: "Open Interest", value: market.open_interest ? formatCompact(market.open_interest) : "—" },
                  { label: "Score", value: `${market.compositeScore.toFixed(0)}/100` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-zinc-800 p-3">
                    <div className="text-lg font-semibold text-zinc-100">{value}</div>
                    <div className="text-xs text-zinc-500">{label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {market.surfacedReasons.map((r) => (
                  <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Orderbook */}
          <Card>
            <CardHeader><CardTitle>Order Book Depth</CardTitle></CardHeader>
            <CardContent>
              {orderbook ? (
                <>
                  <OrderbookChart orderbook={orderbook} />
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <div className="mb-2 text-xs font-semibold text-green-400">YES Bids (top 5)</div>
                      <div className="space-y-1">
                        {orderbook.yesLevels.slice(0, 5).map((l, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-zinc-300">{l.price}¢</span>
                            <span className="text-zinc-500">×{l.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 text-xs font-semibold text-red-400">NO Bids (top 5)</div>
                      <div className="space-y-1">
                        {orderbook.noLevels.slice(0, 5).map((l, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-zinc-300">{l.price}¢</span>
                            <span className="text-zinc-500">×{l.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-zinc-500 text-sm">Loading orderbook…</div>
              )}
            </CardContent>
          </Card>

          {/* Resolution rules */}
          {market.rules_primary && (
            <Card>
              <CardHeader><CardTitle>Resolution Rules</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-300">{market.rules_primary}</p>
                {market.rules_secondary && <p className="mt-2 text-sm text-zinc-400">{market.rules_secondary}</p>}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Analysis panel */}
        <div className="space-y-6">
          {/* EV Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                EV Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Your probability estimate (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={userProb}
                  onChange={(e) => setUserProb(e.target.value)}
                  placeholder="e.g. 70"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {userEdge && (
                <div className="rounded-lg bg-zinc-800 p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Market implies</span>
                    <span className="text-zinc-200">{formatProb(market.impliedProbability)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Your estimate</span>
                    <span className="text-zinc-200">{userProb}%</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-zinc-400">Edge</span>
                    <span className={parseFloat(userEdge) >= 0 ? "text-green-400" : "text-red-400"}>{userEdge}</span>
                  </div>
                  <div className="border-t border-zinc-700 pt-2">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-zinc-400">EV per contract</span>
                      <span className={parseFloat(evEstimate ?? "0") >= 0 ? "text-green-400" : "text-red-400"}>
                        {evEstimate}¢
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-yellow-900 bg-yellow-950/30 p-3">
                <div className="flex gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-yellow-500 mt-0.5" />
                  <p className="text-xs text-yellow-400">
                    EV calculations depend entirely on your probability estimate. This is for research only — not trading advice.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thesis notes */}
          <Card>
            <CardHeader><CardTitle>Research Notes</CardTitle></CardHeader>
            <CardContent>
              <textarea
                value={userThesis}
                onChange={(e) => setUserThesis(e.target.value)}
                placeholder="Write your thesis, assumptions, or notes here…"
                rows={5}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
              <Button
                size="sm"
                variant="secondary"
                className="mt-2 w-full"
                onClick={async () => {
                  await fetch("/api/kalshi/watchlist", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ticker, title: market.title, notes: userThesis }),
                  });
                }}
              >
                Save note
              </Button>
            </CardContent>
          </Card>

          {/* Score breakdown */}
          <Card>
            <CardHeader><CardTitle>Score Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Spread score", value: market.spreadScore, desc: "Tighter spread = higher" },
                { label: "Liquidity score", value: market.liquidityScore, desc: "More liquidity = higher" },
                { label: "Volume score", value: market.volumeScore, desc: "More 24h volume = higher" },
                { label: "Momentum score", value: market.momentumScore, desc: "Bigger price move = higher" },
                { label: "Composite score", value: market.compositeScore, desc: "Weighted aggregate" },
              ].map(({ label, value, desc }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300">{label}</span>
                    <span className="text-zinc-400">{value.toFixed(0)}/100</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800">
                    <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${Math.min(100, value)}%` }} />
                  </div>
                  <div className="mt-0.5 text-[10px] text-zinc-600">{desc}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
