import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Replace all assignments on a slot (manager override)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; slotId: string }> }
) {
  const session = await auth();
  if (session?.user.role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slotId } = await params;
  const { staffProfileIds } = await req.json();

  await prisma.shiftAssignment.deleteMany({ where: { shiftSlotId: slotId } });

  if (staffProfileIds?.length) {
    await prisma.shiftAssignment.createMany({
      data: (staffProfileIds as string[]).map((pid) => ({
        shiftSlotId: slotId,
        staffProfileId: pid,
      })),
    });
  }

  const slot = await prisma.shiftSlot.findUnique({
    where: { id: slotId },
    include: { assignments: { include: { staffProfile: { include: { user: true } } } } },
  });
  return NextResponse.json(slot);
}
