import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (session?.user.role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const leaves = await prisma.leaveBlock.findMany({
    include: { staffProfile: { include: { user: true } } },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json(leaves);
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { staffProfileId, type, startDate, endDate, note } = await req.json();
  if (!staffProfileId || !type || !startDate || !endDate)
    return NextResponse.json({ error: "staffProfileId, type, startDate and endDate are required" }, { status: 400 });

  if (new Date(startDate) > new Date(endDate))
    return NextResponse.json({ error: "startDate must be before endDate" }, { status: 400 });

  const leave = await prisma.leaveBlock.create({
    data: {
      staffProfileId,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      note: note || null,
    },
    include: { staffProfile: { include: { user: true } } },
  });
  return NextResponse.json(leave, { status: 201 });
}
