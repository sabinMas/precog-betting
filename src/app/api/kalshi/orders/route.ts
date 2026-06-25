import { NextRequest, NextResponse } from "next/server";
import { createOrder, type CreateOrderInput } from "@/lib/kalshi/private";
import { prisma } from "@/lib/db/client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (process.env.ENABLE_TRADING !== "true") {
    return NextResponse.json(
      { error: "Trading is disabled. Set ENABLE_TRADING=true to enable." },
      { status: 403 }
    );
  }

  try {
    const body = (await req.json()) as CreateOrderInput & { userId?: string };
    const { userId, ...orderInput } = body;

    const result = await createOrder(orderInput);

    // Audit log
    if (userId) {
      await prisma.orderAuditLog.create({
        data: {
          userId,
          ticker: orderInput.ticker,
          side: orderInput.side,
          action: orderInput.action,
          count: orderInput.count,
          price: orderInput.yes_price ?? orderInput.no_price ?? 0,
          status: result.order.status,
          kalshiId: result.order.order_id,
        },
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
