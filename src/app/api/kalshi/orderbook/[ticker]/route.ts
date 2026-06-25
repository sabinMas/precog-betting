import { NextRequest, NextResponse } from "next/server";
import { getOrderbook } from "@/lib/kalshi/public";
import { normalizeOrderbook } from "@/lib/kalshi/normalize";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  try {
    const resp = await getOrderbook(ticker);
    const normalized = normalizeOrderbook(resp.orderbook);
    return NextResponse.json({ orderbook: normalized });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 502 }
    );
  }
}
