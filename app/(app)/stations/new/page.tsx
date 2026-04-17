import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StationForm } from "../StationForm";

export default async function NewStationPage() {
  const session = await auth();
  if (session?.user.role !== "MANAGER") redirect("/dashboard");

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Add station</h1>
      <StationForm />
    </div>
  );
}
