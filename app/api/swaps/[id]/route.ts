import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json(); // "approve" | "reject" | "claim"

  const swap = await prisma.swapRequest.findUnique({
    where: { id },
    include: {
      shiftSlot: true,
      requester: true,
    },
  });
  if (!swap) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (swap.status !== "PENDING") {
    return NextResponse.json({ error: "Swap is no longer pending" }, { status: 409 });
  }

  if (action === "claim") {
    // Staff claiming an open swap — sets themselves as target
    if (session.user.role === "MANAGER") {
      return NextResponse.json({ error: "Managers use approve/reject" }, { status: 400 });
    }
    if (swap.targetId !== null) {
      return NextResponse.json({ error: "This swap already has a target" }, { status: 409 });
    }
    const profile = await prisma.staffProfile.findFirst({ where: { userId: session.user.id } });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    if (profile.id === swap.requesterId) {
      return NextResponse.json({ error: "Cannot claim your own swap" }, { status: 400 });
    }
    const updated = await prisma.swapRequest.update({
      where: { id },
      data: { targetId: profile.id },
      include: {
        shiftSlot: { include: { station: true, schedule: true } },
        requester: { include: { user: true } },
        target: { include: { user: true } },
      },
    });
    return NextResponse.json(updated);
  }

  if (session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Only managers can approve or reject" }, { status: 403 });
  }

  if (action === "reject") {
    const updated = await prisma.swapRequest.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    return NextResponse.json(updated);
  }

  if (action === "approve") {
    if (!swap.targetId) {
      return NextResponse.json({ error: "Cannot approve: no target staff member" }, { status: 400 });
    }

    // Execute the swap: remove requester, add target
    await prisma.$transaction([
      prisma.shiftAssignment.deleteMany({
        where: { shiftSlotId: swap.shiftSlotId, staffProfileId: swap.requesterId },
      }),
      prisma.shiftAssignment.create({
        data: { shiftSlotId: swap.shiftSlotId, staffProfileId: swap.targetId },
      }),
      prisma.swapRequest.update({
        where: { id },
        data: { status: "APPROVED" },
      }),
    ]);

    return NextResponse.json({ ok: true, status: "APPROVED" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
