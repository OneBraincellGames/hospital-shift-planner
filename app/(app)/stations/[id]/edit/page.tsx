import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StationForm } from "../../StationForm";

export default async function EditStationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "MANAGER") redirect("/dashboard");

  const { id } = await params;
  const station = await prisma.station.findUnique({
    where: { id },
    include: { headcountRules: true },
  });
  if (!station) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Edit {station.name}</h1>
      <StationForm
        defaultValues={{
          id: station.id,
          name: station.name,
          headcountRules: station.headcountRules.map((r) => ({
            dayKind: r.dayKind,
            shiftType: r.shiftType,
            required: r.required,
          })),
        }}
      />
    </div>
  );
}
