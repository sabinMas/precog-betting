import { NextRequest, NextResponse } from "next/server";
import { getMarkets } from "@/lib/kalshi/public";
import { normalizeMarkets } from "@/lib/kalshi/normalize";
import { MOCK_MARKETS } from "@/lib/kalshi/mock";

export const runtime = "nodejs";
export const revalidate = 10;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = (searchParams.get("status") ?? "open") as "open" | "closed" | "settled";
  const limit = parseInt(searchParams.get("limit") ?? "100");
  const cursor = searchParams.get("cursor") ?? undefined;
  const series_ticker = searchParams.get("series_ticker") ?? undefined;
  const event_ticker = searchParams.get("event_ticker") ?? undefined;

  try {
    const resp = await getMarkets({ status, limit, cursor, series_ticker, event_ticker });
    const normalized = normalizeMarkets(resp.markets ?? []);
    return NextResponse.json({ markets: normalized, cursor: resp.cursor });
  } catch (err) {
    console.warn("Kalshi API unavailable, using mock data:", (err as Error).message);
    // Fallback to mock data so the UI always shows something
    const normalized = normalizeMarkets(MOCK_MARKETS);
    return NextResponse.json({ markets: normalized, cursor: undefined, _mock: true });
  }
}
