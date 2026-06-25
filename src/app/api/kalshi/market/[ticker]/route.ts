import { NextRequest, NextResponse } from "next/server";
import { getMarket } from "@/lib/kalshi/public";
import { normalizeMarket } from "@/lib/kalshi/normalize";
import { MOCK_MARKETS } from "@/lib/kalshi/mock";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  try {
    const resp = await getMarket(ticker);
    const normalized = normalizeMarket(resp.market, 1000000, 1000000);
    return NextResponse.json({ market: normalized });
  } catch {
    const mock = MOCK_MARKETS.find((m) => m.ticker === ticker) ?? MOCK_MARKETS[0];
    const normalized = normalizeMarket(mock, 1000000, 1000000);
    return NextResponse.json({ market: normalized, _mock: true });
  }
}
