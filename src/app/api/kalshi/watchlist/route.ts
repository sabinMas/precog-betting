import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

const DEFAULT_USER_ID = "default";

export async function GET() {
  try {
    const items = await prisma.watchlistItem.findMany({
      where: { watchlist: { userId: DEFAULT_USER_ID } },
      orderBy: { addedAt: "desc" },
    });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ticker, title, notes } = await req.json();

    let watchlist = await prisma.watchlist.findFirst({
      where: { userId: DEFAULT_USER_ID },
    });
    if (!watchlist) {
      let user = await prisma.user.findFirst({ where: { id: DEFAULT_USER_ID } });
      if (!user) {
        user = await prisma.user.create({ data: { id: DEFAULT_USER_ID } });
      }
      watchlist = await prisma.watchlist.create({
        data: { name: "My Watchlist", userId: DEFAULT_USER_ID },
      });
    }

    const item = await prisma.watchlistItem.upsert({
      where: { watchlistId_ticker: { watchlistId: watchlist.id, ticker } },
      update: { notes, title },
      create: { watchlistId: watchlist.id, ticker, title, notes },
    });
    return NextResponse.json({ item });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { ticker } = await req.json();
    await prisma.watchlistItem.deleteMany({
      where: { ticker, watchlist: { userId: DEFAULT_USER_ID } },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
