"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { Plus, Trash2, Save, AlertTriangle, FlaskConical, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { analyzeCombo } from "@/lib/analysis/heuristics";
import { formatProb } from "@/lib/utils/format";
import type { ComboLeg, ComboAnalysis } from "@/lib/kalshi/types";
import type { NormalizedMarket } from "@/lib/kalshi/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ComboLabPage() {
  const [legs, setLegs] = useState<ComboLeg[]>([]);
  const [tickerInput, setTickerInput] = useState("");
  const [comboName, setComboName] = useState("");
  const [analysis, setAnalysis] = useState<ComboAnalysis | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: marketsData } = useSWR<{ markets: NormalizedMarket[] }>(
    "/api/kalshi/markets?status=open&limit=100",
    fetcher
  );
  const { data: savedCombos, mutate: refreshCombos } = useSWR<{ combos: { id: string; name: string; tickers: string[]; sides: string[] }[] }>(
    "/api/kalshi/combos",
    fetcher
  );

  useEffect(() => {
    if (legs.length >= 2) {
      setAnalysis(analyzeCombo(legs));
    } else {
      setAnalysis(null);
    }
  }, [legs]);

  function addLeg(ticker: string, side: "yes" | "no" = "yes") {
    const market = marketsData?.markets.find((m) => m.ticker.toLowerCase() === ticker.toLowerCase());
    if (!market) {
      alert(`Market "${ticker}" not found. Try searching from the scanner first.`);
      return;
    }
    if (legs.some((l) => l.ticker === market.ticker)) {
      alert("Already added this market.");
      return;
    }
    const price = side === "yes" ? market.yes_ask : market.no_ask;
    const leg: ComboLeg = {
      ticker: market.ticker,
      title: market.title,
      side,
      impliedProbability: market.impliedProbability,
      price,
    };
    setLegs((prev) => [...prev, leg]);
    setTickerInput("");
  }

  function removeLeg(ticker: string) {
    setLegs((prev) => prev.filter((l) => l.ticker !== ticker));
  }

  function toggleSide(ticker: string) {
    const market = marketsData?.markets.find((m) => m.ticker === ticker);
    if (!market) return;
    setLegs((prev) =>
      prev.map((l) => {
        if (l.ticker !== ticker) return l;
        const newSide: "yes" | "no" = l.side === "yes" ? "no" : "yes";
        return {
          ...l,
          side: newSide,
          price: newSide === "yes" ? market.yes_ask : market.no_ask,
          impliedProbability: newSide === "yes" ? market.impliedProbability : 1 - market.impliedProbability,
        };
      })
    );
  }

  function updateUserProb(ticker: string, value: string) {
    const num = parseFloat(value) / 100;
    setLegs((prev) =>
      prev.map((l) => l.ticker === ticker ? { ...l, userProbability: isNaN(num) ? undefined : num } : l)
    );
  }

  async function saveCombo() {
    if (!comboName.trim() || legs.length < 2) return;
    await fetch("/api/kalshi/combos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: comboName,
        tickers: legs.map((l) => l.ticker),
        sides: legs.map((l) => l.side),
      }),
    });
    setSaved(true);
    refreshCombos();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <FlaskConical className="h-6 w-6 text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Combo Lab</h1>
          <p className="text-sm text-zinc-400">Build and analyze multi-leg research combinations</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mb-6 rounded-lg border border-yellow-800 bg-yellow-950/30 p-4">
        <div className="flex gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-500 mt-0.5" />
          <div className="text-sm text-yellow-300">
            <strong>Research tool only.</strong> Combined probability estimates assume statistical independence between outcomes — this is almost never true in practice. Correlations between markets can dramatically change real probabilities. Use for research and hypothesis exploration only, not as trading signals.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Leg builder */}
        <div className="lg:col-span-2 space-y-4">
          {/* Add leg */}
          <Card>
            <CardHeader><CardTitle>Add Markets to Combo</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter ticker (e.g. INXD-23DEC31-B4500)"
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLeg(tickerInput)}
                  className="flex-1"
                />
                <Button onClick={() => addLeg(tickerInput)} disabled={!tickerInput.trim()}>
                  <Plus className="h-4 w-4" /> Add YES
                </Button>
                <Button variant="outline" onClick={() => addLeg(tickerInput, "no")} disabled={!tickerInput.trim()}>
                  Add NO
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {marketsData?.markets.slice(0, 8).map((m) => (
                  <button
                    key={m.ticker}
                    onClick={() => addLeg(m.ticker)}
                    className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
                  >
                    {m.ticker}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Legs list */}
          {legs.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Combo Legs ({legs.length})</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {legs.map((leg) => (
                  <div key={leg.ticker} className="rounded-lg border border-zinc-700 bg-zinc-800 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            onClick={() => toggleSide(leg.ticker)}
                            className={`rounded px-2 py-0.5 text-xs font-bold ${leg.side === "yes" ? "bg-green-700 text-green-100" : "bg-red-700 text-red-100"}`}
                          >
                            {leg.side.toUpperCase()}
                          </button>
                          <span className="text-xs font-mono text-zinc-400">{leg.ticker}</span>
                        </div>
                        <p className="text-sm text-zinc-200 line-clamp-1">{leg.title}</p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                          <span>Market prob: <strong className="text-zinc-200">{formatProb(leg.impliedProbability)}</strong></span>
                          <span>Price: <strong className="text-zinc-200">{leg.price}¢</strong></span>
                        </div>
                      </div>
                      <button onClick={() => removeLeg(leg.ticker)} className="text-zinc-500 hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2">
                      <label className="text-xs text-zinc-500">Your probability estimate (%)</label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="Optional"
                        value={leg.userProbability !== undefined ? String(leg.userProbability * 100) : ""}
                        onChange={(e) => updateUserProb(leg.ticker, e.target.value)}
                        className="mt-1 h-7 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Analysis panel */}
        <div className="space-y-4">
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle>Combo Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Combined prob */}
                <div className="rounded-lg bg-zinc-800 p-4 text-center">
                  <div className="text-3xl font-bold text-blue-400">
                    {formatProb(analysis.combinedImpliedProbability)}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">Combined implied probability*</div>
                </div>

                {analysis.combinedUserProbability !== undefined && (
                  <div className="rounded-lg bg-zinc-800 p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Your combined est.</span>
                      <span className="text-zinc-200">{formatProb(analysis.combinedUserProbability)}</span>
                    </div>
                    {analysis.expectedValueCents !== undefined && (
                      <div className="flex justify-between text-sm mt-2 font-semibold">
                        <span className="text-zinc-400">Est. EV</span>
                        <span className={analysis.expectedValueCents >= 0 ? "text-green-400" : "text-red-400"}>
                          {analysis.expectedValueCents.toFixed(1)}¢ per contract
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-zinc-800 p-2 text-center">
                    <div className="font-semibold text-zinc-200">{analysis.combinedPayout.toFixed(0)}¢</div>
                    <div className="text-xs text-zinc-500">Net payout</div>
                  </div>
                  <div className="rounded-lg bg-zinc-800 p-2 text-center">
                    <div className="font-semibold text-zinc-200">{legs.reduce((a, l) => a + l.price, 0)}¢</div>
                    <div className="text-xs text-zinc-500">Total cost</div>
                  </div>
                </div>

                {/* Correlation warnings */}
                {analysis.correlationRiskFlag && (
                  <div className="rounded-lg border border-red-800 bg-red-950/30 p-3">
                    <div className="flex gap-1.5 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <span className="text-sm font-semibold text-red-400">Correlation Risk</span>
                    </div>
                    {analysis.correlationWarnings.map((w, i) => (
                      <p key={i} className="text-xs text-red-300">{w}</p>
                    ))}
                  </div>
                )}

                {/* Independence warning */}
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
                  <div className="flex gap-1.5">
                    <Info className="h-3.5 w-3.5 text-zinc-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-zinc-500">{analysis.independenceWarning}</p>
                  </div>
                </div>

                {/* Save combo */}
                <div className="space-y-2">
                  <Input
                    placeholder="Combo name (e.g. Fed + CPI Play)"
                    value={comboName}
                    onChange={(e) => setComboName(e.target.value)}
                  />
                  <Button onClick={saveCombo} disabled={!comboName.trim() || legs.length < 2} className="w-full">
                    <Save className="h-4 w-4" />
                    {saved ? "Saved!" : "Save Combo"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Saved combos */}
          {savedCombos?.combos && savedCombos.combos.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Saved Combos</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {savedCombos.combos.map((c) => (
                  <div key={c.id} className="rounded-lg border border-zinc-700 p-3">
                    <div className="font-medium text-sm text-zinc-200">{c.name}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.tickers.map((t, i) => (
                        <Badge key={t} variant={c.sides[i] === "yes" ? "green" : "red"} className="text-[10px]">
                          {c.sides[i].toUpperCase()} {t}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 text-xs text-red-400 hover:text-red-300"
                      onClick={async () => {
                        await fetch("/api/kalshi/combos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id }) });
                        refreshCombos();
                      }}
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {legs.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center">
              <FlaskConical className="mx-auto h-8 w-8 text-zinc-600 mb-3" />
              <p className="text-sm text-zinc-500">Add 2+ markets to see combo analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
