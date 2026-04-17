import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StationActions } from "./StationActions";

export default async function StationsPage() {
  const session = await auth();
  if (session?.user.role !== "MANAGER") redirect("/dashboard");

  const stations = await prisma.station.findMany({
    include: { headcountRules: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Stations</h1>
        <Link
          href="/stations/new"
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add station
        </Link>
      </div>

      <div className="space-y-3">
        {stations.map((station) => (
          <div
            key={station.id}
            className="bg-white border border-gray-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-900">{station.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    station.active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {station.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Link href={`/stations/${station.id}/edit`} className="text-blue-600 hover:underline">
                  Edit
                </Link>
                <StationActions id={station.id} active={station.active} />
              </div>
            </div>
            {station.headcountRules.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {station.headcountRules.map((r) => (
                  <span
                    key={r.id}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                  >
                    {r.dayKind === "WEEKDAY" ? "Mon–Fri" : "Sat–Sun"}{" "}
                    {r.shiftType.charAt(0) + r.shiftType.slice(1).toLowerCase()}: {r.required} required
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {stations.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No stations yet.</p>
        )}
      </div>
    </div>
  );
}
