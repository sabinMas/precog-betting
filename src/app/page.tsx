"use client";
import { useState, useMemo } from "react";
import useSWR from "swr";
import { MarketCard } from "@/components/market/MarketCard";
import { MarketFilters, type SortKey, type FilterCategory } from "@/components/market/MarketFilters";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NormalizedMarket } from "@/lib/kalshi/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ScannerPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("compositeScore");
  const [category, setCategory] = useState<FilterCategory>("all");
  const [onlyHighVolume, setOnlyHighVolume] = useState(false);
  const [onlyTightSpread, setOnlyTightSpread] = useState(false);
  const [onlyExpiringSoon, setOnlyExpiringSoon] = useState(false);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  const { data, error, isLoading, mutate } = useSWR<{
    markets: NormalizedMarket[];
    cursor?: string;
    _mock?: boolean;
  }>("/api/kalshi/markets?status=open&limit=100", fetcher, {
    refreshInterval: 15_000,
  });

  const filtered = useMemo(() => {
    if (!data?.markets) return [];
    let markets = [...data.markets];
    if (search) {
      const q = search.toLowerCase();
      markets = markets.filter(
        (m) => m.ticker.toLowerCase().includes(q) || m.title.toLowerCase().includes(q) || m.category?.toLowerCase().includes(q)
      );
    }
    if (category !== "all") markets = markets.filter((m) => m.category === category);
    if (onlyHighVolume) markets = markets.filter((m) => m.isHighVolume);
    if (onlyTightSpread) markets = markets.filter((m) => m.spread <= 5);
    if (onlyExpiringSoon) markets = markets.filter((m) => m.isExpiringSoon);
    markets.sort((a, b) => {
      switch (sortBy) {
        case "compositeScore": return b.compositeScore - a.compositeScore;
        case "volume_24h": return (b.volume_24h ?? b.volume) - (a.volume_24h ?? a.volume);
        case "spread": return a.spread - b.spread;
        case "expiresInMs": return a.expiresInMs - b.expiresInMs;
        case "impliedProbability": return b.impliedProbability - a.impliedProbability;
        default: return 0;
      }
    });
    return markets;
  }, [data, search, sortBy, category, onlyHighVolume, onlyTightSpread, onlyExpiringSoon]);

  async function toggleWatch(ticker: string) {
    const isWatched = watchlist.has(ticker);
    if (isWatched) {
      await fetch("/api/kalshi/watchlist", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker }) });
      setWatchlist((prev) => { const next = new Set(prev); next.delete(ticker); return next; });
    } else {
      const market = data?.markets.find((m) => m.ticker === ticker);
      await fetch("/api/kalshi/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker, title: market?.title }) });
      setWatchlist((prev) => new Set(prev).add(ticker));
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <MarketFilters
        search={search} onSearch={setSearch}
        sortBy={sortBy} onSort={setSortBy}
        category={category} onCategory={setCategory}
        onlyHighVolume={onlyHighVolume} onToggleHighVolume={() => setOnlyHighVolume((v) => !v)}
        onlyTightSpread={onlyTightSpread} onToggleTightSpread={() => setOnlyTightSpread((v) => !v)}
        onlyExpiringSoon={onlyExpiringSoon} onToggleExpiringSoon={() => setOnlyExpiringSoon((v) => !v)}
      />
      <div className="mx-auto max-w-screen-xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Market Scanner</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {filtered.length} markets
              {data?._mock && <span className="ml-2 rounded bg-yellow-900 px-1.5 py-0.5 text-xs text-yellow-300">Demo data — add Kalshi API key for live data</span>}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => mutate()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {isLoading && <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div>}
        {error && !isLoading && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-zinc-400">Failed to load markets.</p>
          </div>
        )}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((market) => (
              <MarketCard key={market.ticker} market={market} onWatch={toggleWatch} isWatched={watchlist.has(market.ticker)} />
            ))}
          </div>
        )}
        {!isLoading && filtered.length === 0 && !error && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-zinc-500">No markets match your filters.</p>
            <Button variant="ghost" onClick={() => { setSearch(""); setCategory("all"); }}>Clear filters</Button>
          </div>
        )}
      </div>
    </div>
  );
}
