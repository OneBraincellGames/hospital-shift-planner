"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type HeadcountRule = {
  dayKind: "WEEKDAY" | "WEEKEND";
  shiftType: string;
  required: number;
};

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
    ...WEEKDAY_SHIFTS.map((s) => ({ dayKind: "WEEKDAY" as const, shiftType: s, required: 1 })),
    ...WEEKEND_SHIFTS.map((s) => ({ dayKind: "WEEKEND" as const, shiftType: s, required: 1 })),
  ];
}

export function StationForm({ defaultValues }: Props) {
  const router = useRouter();
  const isEdit = !!defaultValues;

  const [name, setName] = useState(defaultValues?.name ?? "");
  const [rules, setRules] = useState<HeadcountRule[]>(
    defaultValues?.headcountRules ?? buildDefaultRules()
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateRequired(dayKind: "WEEKDAY" | "WEEKEND", shiftType: string, value: number) {
    setRules((prev) =>
      prev.map((r) =>
        r.dayKind === dayKind && r.shiftType === shiftType ? { ...r, required: value } : r
      )
    );
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
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.push("/stations");
    router.refresh();
  }

  function renderShiftRows(dayKind: "WEEKDAY" | "WEEKEND", shifts: string[]) {
    return shifts.map((shift) => {
      const rule = rules.find((r) => r.dayKind === dayKind && r.shiftType === shift);
      return (
        <tr key={`${dayKind}-${shift}`} className="border-t border-gray-100">
          <td className="py-2 pr-4 text-sm text-gray-600">
            {shift.charAt(0) + shift.slice(1).toLowerCase()}
          </td>
          <td className="py-2">
            <input
              type="number"
              min={0}
              max={20}
              value={rule?.required ?? 1}
              onChange={(e) => updateRequired(dayKind, shift, parseInt(e.target.value) || 0)}
              className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </td>
        </tr>
      );
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-gray-200 rounded-xl p-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Station name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Required headcount per shift</p>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Mon–Fri</p>
            <table>
              <tbody>{renderShiftRows("WEEKDAY", WEEKDAY_SHIFTS)}</tbody>
            </table>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Sat–Sun</p>
            <table>
              <tbody>{renderShiftRows("WEEKEND", WEEKEND_SHIFTS)}</tbody>
            </table>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : isEdit ? "Save changes" : "Create"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/stations")}
          className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
