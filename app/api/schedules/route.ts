import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (session?.user.role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const schedules = await prisma.schedule.findMany({
    orderBy: { startDate: "desc" },
    include: { _count: { select: { shiftSlots: true } } },
  });
  return NextResponse.json(schedules);
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, startDate, endDate } = await req.json();
  if (!name || !startDate || !endDate)
    return NextResponse.json({ error: "name, startDate, endDate required" }, { status: 400 });

  const schedule = await prisma.schedule.create({
    data: { name, startDate: new Date(startDate), endDate: new Date(endDate) },
  });
  return NextResponse.json(schedule, { status: 201 });
}
