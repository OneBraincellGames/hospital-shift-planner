import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StaffActions } from "./StaffActions";
import { getT } from "@/lib/i18n/server";

export default async function StaffPage() {
  const [session, t] = await Promise.all([auth(), getT()]);
  if (session?.user.role !== "MANAGER") redirect("/dashboard");

  const staff = await prisma.user.findMany({
    where: { role: "STAFF" },
    include: {
      staffProfile: {
        include: { stationAssignments: { include: { station: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">{t.staff.title}</h1>
        <Link href="/staff/new" className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
          {t.staff.add}
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">{t.common.name}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">{t.staff.stationsLabel}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">{t.staff.monthlyHoursLabel}</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">{t.common.status}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staff.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{member.name}</td>
                <td className="px-4 py-3 text-gray-600">
                  {member.staffProfile?.stationAssignments.map((a) => a.station.name).join(", ") || "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">{member.staffProfile?.monthlyHours ?? 160}h</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    member.staffProfile?.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {member.staffProfile?.active ? t.common.active : t.common.inactive}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/staff/${member.id}/edit`} className="text-blue-600 hover:underline mr-4">
                    {t.common.edit}
                  </Link>
                  <StaffActions id={member.id} active={member.staffProfile?.active ?? true} />
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">{t.staff.noStaffYet}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
