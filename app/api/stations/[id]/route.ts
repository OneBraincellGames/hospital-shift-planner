import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name, active, headcountRules } = await req.json();

  const station = await prisma.station.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(typeof active === "boolean" && { active }),
    },
  });

  if (headcountRules !== undefined) {
    await prisma.headcountRule.deleteMany({ where: { stationId: id } });
    await prisma.headcountRule.createMany({
      data: headcountRules.map((r: { dayOfWeek: string; shiftType: string; required: number }) => ({
        stationId: id,
        dayOfWeek: r.dayOfWeek,
        shiftType: r.shiftType,
        required: r.required,
      })),
    });
  }

  return NextResponse.json(station);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.station.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
