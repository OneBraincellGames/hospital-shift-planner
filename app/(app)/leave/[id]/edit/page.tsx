import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LeaveForm } from "../../LeaveForm";

export default async function EditLeavePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "MANAGER") redirect("/dashboard");

  const { id } = await params;
  const leave = await prisma.leaveBlock.findUnique({
    where: { id },
    include: { staffProfile: { include: { user: true } } },
  });
  if (!leave) notFound();

  function toDateInput(d: Date) {
    return new Date(d).toISOString().slice(0, 10);
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        Edit leave — {leave.staffProfile.user.name}
      </h1>
      <LeaveForm
        staff={[]}
        defaultValues={{
          id: leave.id,
          staffProfileId: leave.staffProfileId,
          type: leave.type,
          startDate: toDateInput(leave.startDate),
          endDate: toDateInput(leave.endDate),
          note: leave.note,
        }}
      />
    </div>
  );
}
