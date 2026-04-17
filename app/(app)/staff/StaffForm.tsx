"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";

type Station = { id: string; name: string };

type Props = {
  stations: Station[];
  defaultValues?: {
    id: string;
    name: string;
    stationIds: string[];
    primaryStationId: string | null;
    monthlyHours: number;
  };
};

export function StaffForm({ stations, defaultValues }: Props) {
  const router = useRouter();
  const t = useT();
  const isEdit = !!defaultValues;

  const [name, setName] = useState(defaultValues?.name ?? "");
  const [monthlyHours, setMonthlyHours] = useState(defaultValues?.monthlyHours ?? 160);
  const [stationIds, setStationIds] = useState<string[]>(defaultValues?.stationIds ?? []);
  const [primaryId, setPrimaryId] = useState<string | null>(defaultValues?.primaryStationId ?? null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleStation(id: string) {
    setStationIds((prev) => {
      if (prev.includes(id)) {
        if (primaryId === id) setPrimaryId(null);
        return prev.filter((s) => s !== id);
      }
      return [...prev, id];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = isEdit ? `/api/staff/${defaultValues.id}` : "/api/staff";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, monthlyHours, stationIds, primaryStationId: primaryId }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t.common.somethingWentWrong);
      return;
    }
    router.push("/staff");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-200 rounded-xl p-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t.common.name}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t.staff.monthlyHoursTarget}</label>
        <input
          type="number"
          min={1}
          max={400}
          value={monthlyHours}
          onChange={(e) => setMonthlyHours(parseInt(e.target.value) || 160)}
          required
          className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t.staff.stationsLabel}</label>
        {stations.length === 0 ? (
          <p className="text-sm text-gray-400">{t.staff.noStationsYet}</p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_auto] gap-x-4 mb-1">
              <span className="text-xs text-gray-400">{t.staff.stationsLabel}</span>
              <span className="text-xs text-gray-400">{t.staff.primaryLabel}</span>
            </div>
            {stations.map((s) => {
              const checked = stationIds.includes(s.id);
              return (
                <div key={s.id} className="grid grid-cols-[1fr_auto] gap-x-4 items-center">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleStation(s.id)}
                      className="rounded"
                    />
                    {s.name}
                  </label>
                  <input
                    type="radio"
                    name="primaryStation"
                    checked={primaryId === s.id}
                    disabled={!checked}
                    onChange={() => setPrimaryId(s.id)}
                    className="disabled:opacity-30 cursor-pointer"
                    title={t.staff.primaryLabel}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t.common.saving : isEdit ? t.common.saveChanges : t.common.create}
        </button>
        <button
          type="button"
          onClick={() => router.push("/staff")}
          className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
        >
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}
