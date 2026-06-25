import { NextResponse } from "next/server";
import { getBalance, getPositions, getOrders, getFills } from "@/lib/kalshi/private";
import { hasKalshiCredentials } from "@/lib/kalshi/config";

export const runtime = "nodejs";

export async function GET() {
  if (!hasKalshiCredentials()) {
    return NextResponse.json(
      { error: "Kalshi credentials not configured", configured: false },
      { status: 401 }
    );
  }

  try {
    const [balanceResp, positionsResp, ordersResp, fillsResp] = await Promise.all([
      getBalance(),
      getPositions(),
      getOrders("resting"),
      getFills(),
    ]);

    return NextResponse.json({
      balance: balanceResp,
      positions: positionsResp.market_positions ?? [],
      orders: ordersResp.orders ?? [],
      fills: fillsResp.fills ?? [],
      configured: true,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message, configured: true },
      { status: 502 }
    );
  }
}
