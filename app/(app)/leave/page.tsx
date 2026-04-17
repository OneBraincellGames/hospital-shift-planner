import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LeaveActions } from "./LeaveActions";
import { getT } from "@/lib/i18n/server";

const TYPE_COLORS: Record<string, string> = {
  VACATION: "bg-blue-100 text-blue-700",
  TRAINING: "bg-green-100 text-green-700",
  ABSENCE: "bg-amber-100 text-amber-700",
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function LeavePage() {
  const [session, t] = await Promise.all([auth(), getT()]);
  if (session?.user.role !== "MANAGER") redirect("/dashboard");

  const leaves = await prisma.leaveBlock.findMany({
    include: { staffProfile: { include: { user: true } } },
    orderBy: { startDate: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">{t.leave.title}</h1>
        <Link href="/leave/new" className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
          {t.leave.add}
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">{t.leave.staffMember}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">{t.leave.type}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">{t.leave.from}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">{t.leave.to}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">{t.common.note}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leaves.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{l.staffProfile.user.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[l.type] ?? "bg-gray-100 text-gray-600"}`}>
                    {t.leave.types[l.type as keyof typeof t.leave.types] ?? l.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{formatDate(l.startDate)}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(l.endDate)}</td>
                <td className="px-4 py-3 text-gray-500">{l.note ?? "—"}</td>
                <td className="px-4 py-3 text-right flex items-center justify-end gap-4">
                  <Link href={`/leave/${l.id}/edit`} className="text-blue-600 hover:underline">
                    {t.common.edit}
                  </Link>
                  <LeaveActions id={l.id} />
                </td>
              </tr>
            ))}
            {leaves.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">{t.leave.noLeaveYet}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
