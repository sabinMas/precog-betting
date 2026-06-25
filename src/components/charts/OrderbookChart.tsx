"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { NormalizedOrderbook } from "@/lib/kalshi/types";

interface OrderbookChartProps {
  orderbook: NormalizedOrderbook;
}

export function OrderbookChart({ orderbook }: OrderbookChartProps) {
  // Merge yes bids and no bids into a unified depth chart
  const bids = orderbook.yesLevels.map((l) => ({
    price: l.price,
    bid: l.cumulative,
    ask: 0,
  }));
  const asks = orderbook.noLevels.map((l) => ({
    price: 100 - l.price,
    bid: 0,
    ask: l.cumulative,
  }));

  const combined = [...bids, ...asks].sort((a, b) => a.price - b.price);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={combined} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="price" tickFormatter={(v) => `${v}¢`} tick={{ fontSize: 11, fill: "#71717a" }} />
        <YAxis tick={{ fontSize: 11, fill: "#71717a" }} />
        <Tooltip
          contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 6, fontSize: 11 }}
          formatter={(v: number, name: string) => [v, name === "bid" ? "YES bids" : "YES asks"]}
          labelFormatter={(l) => `Price: ${l}¢`}
        />
        <Area type="stepAfter" dataKey="bid" stroke="#22c55e" fill="#14532d" fillOpacity={0.5} />
        <Area type="stepBefore" dataKey="ask" stroke="#ef4444" fill="#7f1d1d" fillOpacity={0.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
