"use client";
import useSWR from "swr";
import { Wallet, Lock, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCompact } from "@/lib/utils/format";
import type { KalshiBalance, KalshiPosition, KalshiOrder, KalshiFill } from "@/lib/kalshi/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AccountData {
  balance?: KalshiBalance;
  positions?: KalshiPosition[];
  orders?: KalshiOrder[];
  fills?: KalshiFill[];
  configured: boolean;
  error?: string;
}

export default function AccountPage() {
  const { data, isLoading } = useSWR<AccountData>("/api/kalshi/account", fetcher, {
    refreshInterval: 30_000,
  });

  const tradingEnabled = process.env.NEXT_PUBLIC_ENABLE_TRADING === "true";

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-400" />
      </div>
    );
  }

  if (!data?.configured) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Wallet className="h-6 w-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-zinc-100">Account</h1>
        </div>
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-8 text-center">
          <Lock className="mx-auto h-10 w-10 text-zinc-500 mb-4" />
          <h2 className="text-lg font-semibold text-zinc-300 mb-2">API Credentials Not Configured</h2>
          <p className="text-sm text-zinc-500 max-w-md mx-auto mb-4">
            To view your Kalshi balance, positions, orders, and fills, add your API key ID and RSA private key to your environment variables.
          </p>
          <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4 text-left text-sm font-mono text-zinc-400 max-w-sm mx-auto">
            <div>KALSHI_API_KEY_ID=your-key-id</div>
            <div>KALSHI_PRIVATE_KEY=-----BEGIN...</div>
          </div>
          <p className="mt-4 text-xs text-zinc-600">
            See the README for instructions on generating and registering an RSA key pair.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Account</h1>
            <p className="text-sm text-zinc-400">Live Kalshi portfolio data</p>
          </div>
        </div>
        {!tradingEnabled && (
          <Badge variant="secondary" className="text-xs">
            <Lock className="h-3 w-3 mr-1" />
            Read-only mode
          </Badge>
        )}
      </div>

      {data?.error && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-950/30 p-3 flex gap-2 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {data.error}
        </div>
      )}

      {/* Balance */}
      {data?.balance && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Portfolio Value", value: `$${(data.balance.balance / 100).toFixed(2)}`, icon: Wallet },
            { label: "Payout", value: `$${(data.balance.payout / 100).toFixed(2)}`, icon: TrendingUp },
            { label: "Fees Paid", value: `$${((data.balance.fees_paid ?? 0) / 100).toFixed(2)}`, icon: CheckCircle },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-blue-400" />
                  <div>
                    <div className="text-2xl font-bold text-zinc-100">{value}</div>
                    <div className="text-xs text-zinc-500">{label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Positions */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" />Open Positions</CardTitle></CardHeader>
          <CardContent>
            {!data?.positions?.length ? (
              <p className="text-sm text-zinc-500">No open positions.</p>
            ) : (
              <div className="space-y-2">
                {data.positions.map((pos) => (
                  <div key={pos.ticker} className="flex items-center justify-between rounded-lg bg-zinc-800 p-3">
                    <div>
                      <p className="text-sm font-mono text-zinc-300">{pos.ticker}</p>
                      <p className="text-xs text-zinc-500">{pos.market_title}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={pos.position > 0 ? "green" : "red"}>
                        {pos.position > 0 ? "YES" : "NO"} ×{Math.abs(pos.position)}
                      </Badge>
                      <p className="text-xs text-zinc-500 mt-1">
                        P&L: {pos.realized_pnl >= 0 ? "+" : ""}{(pos.realized_pnl / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Open Orders */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" />Resting Orders</CardTitle></CardHeader>
          <CardContent>
            {!data?.orders?.length ? (
              <p className="text-sm text-zinc-500">No resting orders.</p>
            ) : (
              <div className="space-y-2">
                {data.orders.map((order) => (
                  <div key={order.order_id} className="flex items-center justify-between rounded-lg bg-zinc-800 p-3">
                    <div>
                      <p className="text-sm font-mono text-zinc-300">{order.ticker}</p>
                      <p className="text-xs text-zinc-500">
                        {order.action.toUpperCase()} {order.side.toUpperCase()} ×{order.count}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-zinc-200">{order.yes_price}¢</p>
                      <Badge variant="secondary" className="text-[10px] mt-1">{order.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Fills */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle className="h-4 w-4" />Recent Fills</CardTitle></CardHeader>
          <CardContent>
            {!data?.fills?.length ? (
              <p className="text-sm text-zinc-500">No recent fills.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-zinc-500 border-b border-zinc-800">
                      <th className="pb-2 text-left">Ticker</th>
                      <th className="pb-2 text-left">Action</th>
                      <th className="pb-2 text-left">Side</th>
                      <th className="pb-2 text-right">Count</th>
                      <th className="pb-2 text-right">Price</th>
                      <th className="pb-2 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.fills.slice(0, 20).map((fill) => (
                      <tr key={fill.trade_id} className="border-b border-zinc-800/50">
                        <td className="py-2 font-mono text-zinc-300">{fill.ticker}</td>
                        <td className="py-2">
                          <Badge variant={fill.action === "buy" ? "green" : "red"} className="text-[10px]">{fill.action}</Badge>
                        </td>
                        <td className="py-2 text-zinc-300">{fill.side.toUpperCase()}</td>
                        <td className="py-2 text-right text-zinc-300">×{fill.count}</td>
                        <td className="py-2 text-right text-zinc-300">{fill.yes_price}¢</td>
                        <td className="py-2 text-right text-zinc-500 text-xs">
                          {new Date(fill.created_time).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
