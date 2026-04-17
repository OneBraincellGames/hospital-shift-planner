import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: {
      shiftSlots: {
        include: {
          station: true,
          assignments: {
            include: { staffProfile: { include: { user: true } } },
          },
        },
        orderBy: [{ date: "asc" }, { shiftType: "asc" }],
      },
    },
  });

  if (!schedule) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(schedule);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { published } = await req.json();

  const schedule = await prisma.schedule.update({
    where: { id },
    data: { ...(typeof published === "boolean" && { published }) },
  });
  return NextResponse.json(schedule);
}
