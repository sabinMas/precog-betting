"use client";
import { useState } from "react";
import useSWR from "swr";
import { Bell, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type AlertType = "PRICE_ABOVE" | "PRICE_BELOW" | "SPREAD_TIGHTENS" | "SPREAD_WIDENS" | "VOLUME_SPIKE" | "EXPIRY_SOON";

interface AlertRule {
  id: string;
  ticker: string;
  type: AlertType;
  threshold?: number;
  isActive: boolean;
  lastFiredAt?: string;
  createdAt: string;
}

const ALERT_TYPES: { value: AlertType; label: string; hasThreshold: boolean }[] = [
  { value: "PRICE_ABOVE", label: "Price above threshold", hasThreshold: true },
  { value: "PRICE_BELOW", label: "Price below threshold", hasThreshold: true },
  { value: "SPREAD_TIGHTENS", label: "Spread tightens", hasThreshold: false },
  { value: "SPREAD_WIDENS", label: "Spread widens", hasThreshold: false },
  { value: "VOLUME_SPIKE", label: "Volume spike", hasThreshold: false },
  { value: "EXPIRY_SOON", label: "Expiry within 24h", hasThreshold: false },
];

export default function AlertsPage() {
  const { data, mutate } = useSWR<{ alerts: AlertRule[] }>("/api/alerts", fetcher);
  const [ticker, setTicker] = useState("");
  const [type, setType] = useState<AlertType>("PRICE_ABOVE");
  const [threshold, setThreshold] = useState("");
  const [creating, setCreating] = useState(false);

  const hasThreshold = ALERT_TYPES.find((a) => a.value === type)?.hasThreshold;

  async function create() {
    if (!ticker.trim()) return;
    setCreating(true);
    await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker: ticker.toUpperCase(), type, threshold: hasThreshold ? parseFloat(threshold) : undefined }),
    });
    setTicker("");
    setThreshold("");
    mutate();
    setCreating(false);
  }

  async function remove(id: string) {
    await fetch("/api/alerts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    mutate();
  }

  const alerts = data?.alerts ?? [];

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Bell className="h-6 w-6 text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Alerts</h1>
          <p className="text-sm text-zinc-400">Get notified when markets hit your conditions</p>
        </div>
      </div>

      {/* Create alert */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Create Alert</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              placeholder="Ticker (e.g. FED-23DEC-HOLD)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AlertType)}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {ALERT_TYPES.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
            {hasThreshold ? (
              <Input
                type="number"
                placeholder="Threshold (cents, e.g. 70)"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            ) : (
              <div className="flex items-center text-sm text-zinc-500 px-3">No threshold needed</div>
            )}
          </div>
          <Button onClick={create} disabled={creating || !ticker.trim()}>
            <Plus className="h-4 w-4" />
            Create Alert
          </Button>
        </CardContent>
      </Card>

      {/* Alert list */}
      {alerts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 py-16 text-center">
          <Bell className="mx-auto h-10 w-10 text-zinc-600 mb-3" />
          <p className="text-zinc-500">No alerts set. Create one above to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-mono text-zinc-300">{alert.ticker}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {ALERT_TYPES.find((a) => a.value === alert.type)?.label}
                      {alert.threshold !== null && alert.threshold !== undefined && ` @ ${alert.threshold}¢`}
                    </p>
                    {alert.lastFiredAt && (
                      <p className="text-xs text-yellow-500 mt-1">Last fired: {new Date(alert.lastFiredAt).toLocaleString()}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={alert.isActive ? "green" : "secondary"}>
                      {alert.isActive ? "Active" : "Paused"}
                    </Badge>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => remove(alert.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
