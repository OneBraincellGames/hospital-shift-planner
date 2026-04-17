import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        Welcome, {session?.user.name}
      </h1>
      <p className="text-sm text-gray-500">
        {session?.user.role === "MANAGER"
          ? "Manage staff, stations, and schedules from the navigation above."
          : "View your schedule and manage your availability from the navigation above."}
      </p>
    </div>
  );
}
