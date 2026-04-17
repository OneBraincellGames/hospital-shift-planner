import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StationActions } from "./StationActions";
import { getT } from "@/lib/i18n/server";

export default async function StationsPage() {
  const [session, t] = await Promise.all([auth(), getT()]);
  if (session?.user.role !== "MANAGER") redirect("/dashboard");

  const stations = await prisma.station.findMany({
    include: { headcountRules: true },
    orderBy: { name: "asc" },
  });

  const allDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">{t.stations.title}</h1>
        <Link href="/stations/new" className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
          {t.stations.add}
        </Link>
      </div>

      <div className="space-y-3">
        {stations.map((station) => (
          <div key={station.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-900">{station.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  station.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {station.active ? t.common.active : t.common.inactive}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Link href={`/stations/${station.id}/edit`} className="text-blue-600 hover:underline">
                  {t.common.edit}
                </Link>
                <StationActions id={station.id} active={station.active} />
              </div>
            </div>
            {station.headcountRules.length > 0 && (
              <div className="overflow-x-auto">
                <table className="text-xs text-gray-600 border-collapse">
                  <thead>
                    <tr>
                      <th className="pr-3 pb-1 text-left font-normal text-gray-400"></th>
                      {allDays.map((d) => (
                        <th key={d} className="px-2 pb-1 text-center font-medium text-gray-500 w-10">
                          {t.days[d]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(["EARLY", "LATE", "NIGHT", "DAY"] as const).map((shift) => {
                      const applicableDays = ["EARLY", "LATE", "NIGHT"].includes(shift)
                        ? ["MON", "TUE", "WED", "THU", "FRI"]
                        : ["SAT", "SUN"];
                      const hasAny = station.headcountRules.some((r) => r.shiftType === shift);
                      if (!hasAny) return null;
                      return (
                        <tr key={shift}>
                          <td className="pr-3 py-0.5 text-gray-400">{t.shifts[shift]}</td>
                          {allDays.map((d) => {
                            const rule = station.headcountRules.find(
                              (r) => r.dayOfWeek === d && r.shiftType === shift
                            );
                            const applicable = applicableDays.includes(d);
                            return (
                              <td key={d} className="px-2 py-0.5 text-center">
                                {applicable ? (
                                  <span className={rule?.required ? "text-gray-700 font-medium" : "text-gray-300"}>
                                    {rule?.required ?? 0}
                                  </span>
                                ) : (
                                  <span className="text-gray-200">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
        {stations.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">{t.stations.noStationsYet}</p>
        )}
      </div>
    </div>
  );
}
