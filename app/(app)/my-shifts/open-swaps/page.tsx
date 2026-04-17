import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OpenSwapsClient } from "./OpenSwapsClient";

export default async function OpenSwapsPage() {
  const session = await auth();

  const profile = await prisma.staffProfile.findFirst({
    where: { userId: session!.user.id },
    include: { stationAssignments: true },
  });

  const stationIds = profile?.stationAssignments.map((a) => a.stationId) ?? [];

  const openSwaps = profile
    ? await prisma.swapRequest.findMany({
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
        orderBy: { shiftSlot: { date: "asc" } },
      })
    : [];

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Open Swap Requests</h1>
      <p className="text-sm text-gray-500 mb-6">
        Shifts your colleagues want to give up. Claim one and a manager will confirm.
      </p>
      <OpenSwapsClient swaps={openSwaps} />
    </div>
  );
}
