import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StaffForm } from "../StaffForm";

export default async function NewStaffPage() {
  const session = await auth();
  if (session?.user.role !== "MANAGER") redirect("/dashboard");

  const stations = await prisma.station.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Add staff member</h1>
      <StaffForm stations={stations} />
    </div>
  );
}
