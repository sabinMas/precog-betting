"use client";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type SortKey = "compositeScore" | "volume_24h" | "spread" | "expiresInMs" | "impliedProbability";
export type FilterCategory = "all" | "economics" | "financials" | "crypto" | "politics" | "commodities" | "forex";

interface MarketFiltersProps {
  search: string;
  onSearch: (v: string) => void;
  sortBy: SortKey;
  onSort: (v: SortKey) => void;
  category: FilterCategory;
  onCategory: (v: FilterCategory) => void;
  onlyHighVolume: boolean;
  onToggleHighVolume: () => void;
  onlyTightSpread: boolean;
  onToggleTightSpread: () => void;
  onlyExpiringSoon: boolean;
  onToggleExpiringSoon: () => void;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "compositeScore", label: "Score" },
  { value: "volume_24h", label: "Volume" },
  { value: "spread", label: "Spread" },
  { value: "expiresInMs", label: "Expiry" },
  { value: "impliedProbability", label: "Prob" },
];

const CATEGORIES: FilterCategory[] = ["all", "economics", "financials", "crypto", "politics", "commodities", "forex"];

export function MarketFilters({
  search, onSearch, sortBy, onSort, category, onCategory,
  onlyHighVolume, onToggleHighVolume,
  onlyTightSpread, onToggleTightSpread,
  onlyExpiringSoon, onToggleExpiringSoon,
}: MarketFiltersProps) {
  return (
    <div className="sticky top-14 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
      <div className="mx-auto max-w-screen-xl px-4 py-3 space-y-3">
        {/* Search + Sort */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Search ticker or title..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1">
            <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
            {SORT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={sortBy === opt.value ? "default" : "ghost"}
                onClick={() => onSort(opt.value)}
                className="text-xs"
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Category pills + quick filters */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                category === cat
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
              }`}
            >
              {cat}
            </button>
          ))}
          <div className="ml-2 h-4 w-px bg-zinc-700" />
          {[
            { label: "High Volume", active: onlyHighVolume, toggle: onToggleHighVolume },
            { label: "Tight Spread", active: onlyTightSpread, toggle: onToggleTightSpread },
            { label: "Expiring Soon", active: onlyExpiringSoon, toggle: onToggleExpiringSoon },
          ].map(({ label, active, toggle }) => (
            <button
              key={label}
              onClick={toggle}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? "bg-yellow-700 text-yellow-100"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
