import { auth } from "@/auth";
import { getT } from "@/lib/i18n/server";

export default async function DashboardPage() {
  const [session, t] = await Promise.all([auth(), getT()]);
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        {t.dashboard.welcome}, {session?.user.name}
      </h1>
      <p className="text-sm text-gray-500">
        {session?.user.role === "MANAGER" ? t.dashboard.managerSubtitle : t.dashboard.staffSubtitle}
      </p>
    </div>
  );
}
