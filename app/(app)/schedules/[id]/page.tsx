import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ScheduleView } from "./ScheduleView";

export default async function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "MANAGER") redirect("/dashboard");

  const { id } = await params;

  const [schedule, allStaff] = await Promise.all([
    prisma.schedule.findUnique({
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
    }),
    prisma.staffProfile.findMany({
      where: { active: true },
      include: { user: true, stationAssignments: true },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  if (!schedule) notFound();

  const stations = await prisma.station.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <ScheduleView
      schedule={schedule}
      allStaff={allStaff}
      stations={stations}
    />
  );
}
