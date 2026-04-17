import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ScheduleForm } from "../ScheduleForm";

export default async function NewSchedulePage() {
  const session = await auth();
  if (session?.user.role !== "MANAGER") redirect("/dashboard");
  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">New schedule</h1>
      <ScheduleForm />
    </div>
  );
}
