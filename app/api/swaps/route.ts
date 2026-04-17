import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.staffProfile.findFirst({
    where: { userId: session.user.id },
  });

  if (session.user.role === "MANAGER") {
    const swaps = await prisma.swapRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        shiftSlot: { include: { station: true, schedule: true } },
        requester: { include: { user: true } },
        target: { include: { user: true } },
      },
    });
    return NextResponse.json(swaps);
  }

  if (!profile) return NextResponse.json([]);

  // Staff: their own requests + open requests they can claim
  const [myRequests, openRequests] = await Promise.all([
    prisma.swapRequest.findMany({
      where: { requesterId: profile.id },
      orderBy: { createdAt: "desc" },
      include: {
        shiftSlot: { include: { station: true, schedule: true } },
        requester: { include: { user: true } },
        target: { include: { user: true } },
      },
    }),
    prisma.swapRequest.findMany({
      where: {
        targetId: null,
        status: "PENDING",
        requesterId: { not: profile.id },
        shiftSlot: {
          assignments: { some: { staffProfileId: profile.id } },
        },
      },
      include: {
        shiftSlot: { include: { station: true, schedule: true } },
        requester: { include: { user: true } },
      },
    }),
  ]);

  // For open requests: filter to slots where staff is eligible (same station)
  const stationIds = (
    await prisma.stationAssignment.findMany({ where: { staffProfileId: profile.id } })
  ).map((a) => a.stationId);

  const claimableSwaps = await prisma.swapRequest.findMany({
    where: {
      targetId: null,
      status: "PENDING",
      requesterId: { not: profile.id },
      shiftSlot: { stationId: { in: stationIds } },
    },
    include: {
      shiftSlot: { include: { station: true, schedule: true } },
      requester: { include: { user: true } },
    },
  });

  return NextResponse.json({ myRequests, claimableSwaps: claimableSwaps.filter(
    (s) => !myRequests.some((m) => m.id === s.id)
  )});
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shiftSlotId, targetId, note } = await req.json();
  if (!shiftSlotId) return NextResponse.json({ error: "shiftSlotId required" }, { status: 400 });

  const profile = await prisma.staffProfile.findFirst({
    where: { userId: session.user.id },
  });
  if (!profile) return NextResponse.json({ error: "Staff profile not found" }, { status: 404 });

  // Verify staff is actually assigned to this slot
  const assignment = await prisma.shiftAssignment.findFirst({
    where: { shiftSlotId, staffProfileId: profile.id },
  });
  if (!assignment) {
    return NextResponse.json({ error: "You are not assigned to this shift" }, { status: 400 });
  }

  // Prevent duplicate pending request
  const existing = await prisma.swapRequest.findFirst({
    where: { shiftSlotId, requesterId: profile.id, status: "PENDING" },
  });
  if (existing) {
    return NextResponse.json({ error: "A pending swap request already exists for this shift" }, { status: 409 });
  }

  const swap = await prisma.swapRequest.create({
    data: {
      shiftSlotId,
      requesterId: profile.id,
      targetId: targetId ?? null,
      note: note ?? null,
    },
    include: {
      shiftSlot: { include: { station: true } },
      requester: { include: { user: true } },
      target: { include: { user: true } },
    },
  });
  return NextResponse.json(swap, { status: 201 });
}
