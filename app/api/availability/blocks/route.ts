import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get("staffId") ?? undefined;

  const profile = await prisma.staffProfile.findFirst({
    where: staffId ? { id: staffId } : { userId: session.user.id },
  });
  if (!profile) return NextResponse.json([]);

  const blocks = await prisma.availabilityBlock.findMany({
    where: { staffProfileId: profile.id },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(blocks);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, available, note, staffId } = await req.json();

  const profile = await prisma.staffProfile.findFirst({
    where: staffId && session.user.role === "MANAGER"
      ? { id: staffId }
      : { userId: session.user.id },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const block = await prisma.availabilityBlock.upsert({
    where: { staffProfileId_date: { staffProfileId: profile.id, date: new Date(date) } },
    create: { staffProfileId: profile.id, date: new Date(date), available, note },
    update: { available, note },
  });
  return NextResponse.json(block, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const blockId = searchParams.get("id");
  if (!blockId) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.availabilityBlock.delete({ where: { id: blockId } });
  return NextResponse.json({ ok: true });
}
