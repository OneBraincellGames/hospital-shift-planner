import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { type, startDate, endDate, note } = await req.json();

  if (startDate && endDate && new Date(startDate) > new Date(endDate))
    return NextResponse.json({ error: "startDate must be before endDate" }, { status: 400 });

  const leave = await prisma.leaveBlock.update({
    where: { id },
    data: {
      ...(type && { type }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      note: note ?? undefined,
    },
  });
  return NextResponse.json(leave);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.leaveBlock.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
