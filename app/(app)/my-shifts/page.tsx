import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MyShiftsClient } from "./MyShiftsClient";

export default async function MyShiftsPage() {
  const session = await auth();

  const profile = await prisma.staffProfile.findFirst({
    where: { userId: session!.user.id },
    include: { stationAssignments: true },
  });

  const assignments = profile
    ? await prisma.shiftAssignment.findMany({
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
      })
    : [];

  // Colleagues at same stations (for targeted swap)
  const stationIds = profile?.stationAssignments.map((a) => a.stationId) ?? [];
  const colleagues = profile
    ? await prisma.staffProfile.findMany({
        where: {
          id: { not: profile.id },
          active: true,
          stationAssignments: { some: { stationId: { in: stationIds } } },
        },
        include: { user: true },
        orderBy: { user: { name: "asc" } },
      })
    : [];

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">My Shifts</h1>
      <MyShiftsClient assignments={assignments} colleagues={colleagues} profileId={profile?.id ?? ""} />
    </div>
  );
}
