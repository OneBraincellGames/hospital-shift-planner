import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.staffProfile.findFirst({
    where: { userId: session.user.id },
  });
  if (!profile) return NextResponse.json([]);

  const assignments = await prisma.shiftAssignment.findMany({
    where: {
      staffProfileId: profile.id,
      shiftSlot: { schedule: { published: true } },
    },
    include: {
      shiftSlot: {
        include: {
          station: true,
          schedule: true,
          swapRequests: {
            where: { requesterId: profile.id, status: "PENDING" },
          },
        },
      },
    },
    orderBy: { shiftSlot: { date: "asc" } },
  });

  return NextResponse.json(assignments);
}
