import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StaffForm } from "../../StaffForm";

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "MANAGER") redirect("/dashboard");

  const { id } = await params;

  const [user, stations] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: {
        staffProfile: { include: { stationAssignments: true } },
      },
    }),
    prisma.station.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  if (!user) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Edit {user.name}</h1>
      <StaffForm
        stations={stations}
        defaultValues={{
          id: user.id,
          name: user.name,
          email: user.email,
          stationIds: user.staffProfile?.stationAssignments.map((a) => a.stationId) ?? [],
        }}
      />
    </div>
  );
}
