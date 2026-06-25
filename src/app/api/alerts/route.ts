import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

const DEFAULT_USER_ID = "default";

export async function GET() {
  try {
    const alerts = await prisma.alertRule.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ alerts });
  } catch {
    return NextResponse.json({ alerts: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    let user = await prisma.user.findFirst({ where: { id: DEFAULT_USER_ID } });
    if (!user) user = await prisma.user.create({ data: { id: DEFAULT_USER_ID } });

    const { ticker, type, threshold } = await req.json();
    const alert = await prisma.alertRule.create({
      data: { userId: DEFAULT_USER_ID, ticker, type, threshold },
    });
    return NextResponse.json({ alert });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.alertRule.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
