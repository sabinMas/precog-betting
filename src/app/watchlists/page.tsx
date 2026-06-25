"use client";
import useSWR from "swr";
import Link from "next/link";
import { Star, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface WatchlistItem {
  id: string;
  ticker: string;
  title?: string;
  notes?: string;
  addedAt: string;
}

export default function WatchlistsPage() {
  const { data, mutate } = useSWR<{ items: WatchlistItem[] }>("/api/kalshi/watchlist", fetcher);

  async function remove(ticker: string) {
    await fetch("/api/kalshi/watchlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker }),
    });
    mutate();
  }

  const items = data?.items ?? [];

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Star className="h-6 w-6 text-yellow-400" />
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Watchlists</h1>
          <p className="text-sm text-zinc-400">Markets you're tracking</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 py-16 text-center">
          <Star className="mx-auto h-10 w-10 text-zinc-600 mb-3" />
          <p className="text-zinc-500">No markets watched yet.</p>
          <p className="text-sm text-zinc-600 mt-1">Click the star icon on any market card to add it here.</p>
          <Link href="/">
            <Button variant="outline" className="mt-4">Go to Scanner</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm line-clamp-2">{item.title ?? item.ticker}</CardTitle>
                    <p className="text-xs text-zinc-500 mt-0.5">{item.ticker}</p>
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/markets/${item.ticker}`}>
                      <Button size="icon" variant="ghost" className="h-7 w-7">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300" onClick={() => remove(item.ticker)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {item.notes && (
                <CardContent>
                  <p className="text-xs text-zinc-400 italic">{item.notes}</p>
                </CardContent>
              )}
              <CardContent>
                <Badge variant="secondary" className="text-[10px]">
                  Added {new Date(item.addedAt).toLocaleDateString()}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
