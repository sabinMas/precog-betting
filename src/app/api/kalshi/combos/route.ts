import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

const DEFAULT_USER_ID = "default";

async function ensureUser() {
  let user = await prisma.user.findFirst({ where: { id: DEFAULT_USER_ID } });
  if (!user) user = await prisma.user.create({ data: { id: DEFAULT_USER_ID } });
  return user;
}

export async function GET() {
  try {
    const combos = await prisma.savedCombo.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ combos });
  } catch {
    return NextResponse.json({ combos: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureUser();
    const { name, description, tickers, sides, notes } = await req.json();
    const combo = await prisma.savedCombo.create({
      data: { userId: DEFAULT_USER_ID, name, description, tickers, sides, notes },
    });
    return NextResponse.json({ combo });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.savedCombo.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
