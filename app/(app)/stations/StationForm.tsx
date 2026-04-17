"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";

type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

type HeadcountRule = {
  dayOfWeek: DayOfWeek;
  shiftType: string;
  required: number;
};

const WEEKDAYS: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI"];
const WEEKEND_DAYS: DayOfWeek[] = ["SAT", "SUN"];
const WEEKDAY_SHIFTS = ["EARLY", "LATE", "NIGHT"];
const WEEKEND_SHIFTS = ["DAY", "NIGHT"];

type Props = {
  defaultValues?: {
    id: string;
    name: string;
    headcountRules: HeadcountRule[];
  };
};

function buildDefaultRules(): HeadcountRule[] {
  return [
    ...WEEKDAYS.flatMap((d) => WEEKDAY_SHIFTS.map((s) => ({ dayOfWeek: d, shiftType: s, required: 1 }))),
    ...WEEKEND_DAYS.flatMap((d) => WEEKEND_SHIFTS.map((s) => ({ dayOfWeek: d, shiftType: s, required: 1 }))),
  ];
}

export function StationForm({ defaultValues }: Props) {
  const router = useRouter();
  const t = useT();
  const isEdit = !!defaultValues;

  const [name, setName] = useState(defaultValues?.name ?? "");
  const [rules, setRules] = useState<HeadcountRule[]>(
    defaultValues?.headcountRules ?? buildDefaultRules()
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function getRequired(day: DayOfWeek, shift: string): number {
    return rules.find((r) => r.dayOfWeek === day && r.shiftType === shift)?.required ?? 0;
  }

  function updateRequired(day: DayOfWeek, shift: string, value: number) {
    setRules((prev) => {
      const existing = prev.find((r) => r.dayOfWeek === day && r.shiftType === shift);
      if (existing) {
        return prev.map((r) =>
          r.dayOfWeek === day && r.shiftType === shift ? { ...r, required: value } : r
        );
      }
      return [...prev, { dayOfWeek: day, shiftType: shift, required: value }];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = isEdit ? `/api/stations/${defaultValues.id}` : "/api/stations";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, headcountRules: rules }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t.common.somethingWentWrong);
      return;
    }
    router.push("/stations");
    router.refresh();
  }

  function renderGrid(days: DayOfWeek[], shifts: string[]) {
    return (
      <table className="text-sm border-collapse">
        <thead>
          <tr>
            <th className="pr-3 pb-1 text-left text-xs text-gray-400 font-normal w-16"></th>
            {days.map((d) => (
              <th key={d} className="pb-1 text-center text-xs text-gray-500 font-medium w-14">
                {t.days[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shifts.map((shift) => (
            <tr key={shift}>
              <td className="pr-3 py-1 text-xs text-gray-500">
                {t.shifts[shift as keyof typeof t.shifts]}
              </td>
              {days.map((d) => (
                <td key={d} className="py-1 px-1 text-center">
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={getRequired(d, shift)}
                    onChange={(e) => updateRequired(d, shift, parseInt(e.target.value) || 0)}
                    className="w-12 border border-gray-300 rounded px-1 py-1 text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-gray-200 rounded-xl p-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t.stations.stationName}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-5">
        <p className="text-sm font-medium text-gray-700">{t.stations.headcountTitle}</p>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{t.stations.monFri}</p>
          {renderGrid(WEEKDAYS, WEEKDAY_SHIFTS)}
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{t.stations.satSun}</p>
          {renderGrid(WEEKEND_DAYS, WEEKEND_SHIFTS)}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t.common.saving : isEdit ? t.common.saveChanges : t.common.create}
        </button>
        <button
          type="button"
          onClick={() => router.push("/stations")}
          className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
        >
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}
