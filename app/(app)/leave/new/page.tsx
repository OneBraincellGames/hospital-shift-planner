import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LeaveForm } from "../LeaveForm";

export default async function NewLeavePage() {
  const session = await auth();
  if (session?.user.role !== "MANAGER") redirect("/dashboard");

  const profiles = await prisma.staffProfile.findMany({
    where: { active: true },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  const staff = profiles.map((p) => ({ profileId: p.id, name: p.user.name }));

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Add leave</h1>
      <LeaveForm staff={staff} />
    </div>
  );
}
