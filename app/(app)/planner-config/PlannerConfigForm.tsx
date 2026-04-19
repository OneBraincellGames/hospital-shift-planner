"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import type { PlannerConfigValues } from "@/lib/scheduler";

type Props = {
  initialConfig: PlannerConfigValues & { id: number };
};

type FieldKey = keyof PlannerConfigValues;

function shiftDuration(start: number, end: number): number {
  return end < start ? end + 24 - start : end - start;
}

function NumInput({
  value,
  onChange,
  min = 0,
  max = 23,
}: {
  value: number;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}

export function PlannerConfigForm({ initialConfig }: Props) {
  const t = useT();

  const [values, setValues] = useState<PlannerConfigValues>({
    minRestHours: initialConfig.minRestHours,
    maxConsecutiveDays: initialConfig.maxConsecutiveDays,
    earlyShiftStart: initialConfig.earlyShiftStart,
    earlyShiftEnd: initialConfig.earlyShiftEnd,
    lateShiftStart: initialConfig.lateShiftStart,
    lateShiftEnd: initialConfig.lateShiftEnd,
    nightShiftStart: initialConfig.nightShiftStart,
    nightShiftEnd: initialConfig.nightShiftEnd,
    dayShiftStart: initialConfig.dayShiftStart,
    dayShiftEnd: initialConfig.dayShiftEnd,
    weekendNightShiftStart: initialConfig.weekendNightShiftStart,
    weekendNightShiftEnd: initialConfig.weekendNightShiftEnd,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setHour(field: FieldKey, raw: string) {
    const n = parseInt(raw, 10);
    setValues((v) => ({ ...v, [field]: isNaN(n) ? 0 : Math.max(0, Math.min(23, n)) }));
    setSaved(false);
  }

  function setPositive(field: FieldKey, raw: string) {
    const n = parseInt(raw, 10);
    setValues((v) => ({ ...v, [field]: isNaN(n) ? 1 : Math.max(1, n) }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/planner-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? t.common.somethingWentWrong);
      }
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.somethingWentWrong);
    } finally {
      setSaving(false);
    }
  }

  type ShiftRow = { label: string; startField: FieldKey; endField: FieldKey };

  const weekdayRows: ShiftRow[] = [
    { label: t.shifts.EARLY, startField: "earlyShiftStart", endField: "earlyShiftEnd" },
    { label: t.shifts.LATE,  startField: "lateShiftStart",  endField: "lateShiftEnd"  },
    { label: t.shifts.NIGHT, startField: "nightShiftStart", endField: "nightShiftEnd" },
  ];

  const weekendRows: ShiftRow[] = [
    { label: t.shifts.DAY,   startField: "dayShiftStart",          endField: "dayShiftEnd"          },
    { label: t.shifts.NIGHT, startField: "weekendNightShiftStart",  endField: "weekendNightShiftEnd"  },
  ];

  function ShiftTable({ rows }: { rows: ShiftRow[] }) {
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
            <th className="pb-2 font-medium w-20">{/* shift name */}</th>
            <th className="pb-2 font-medium w-36">{t.plannerConfig.startLabel}</th>
            <th className="pb-2 font-medium w-36">{t.plannerConfig.endLabel}</th>
            <th className="pb-2 font-medium">{t.plannerConfig.durationLabel}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map(({ label, startField, endField }) => {
            const start = values[startField];
            const end = values[endField];
            const dur = shiftDuration(start, end);
            const crosses = end < start;
            return (
              <tr key={startField}>
                <td className="py-3 pr-4 font-medium text-gray-700">{label}</td>
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-1.5">
                    <NumInput value={start} onChange={(v) => setHour(startField, v)} />
                    <span className="text-gray-400 text-xs">{t.plannerConfig.hours}</span>
                  </div>
                </td>
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-1.5">
                    <NumInput value={end} onChange={(v) => setHour(endField, v)} />
                    <span className="text-gray-400 text-xs">{t.plannerConfig.hours}</span>
                  </div>
                </td>
                <td className="py-2">
                  <span className="text-gray-700 font-medium">
                    {dur} {t.plannerConfig.hours}
                  </span>
                  {crosses && (
                    <span className="ml-2 text-xs text-amber-600">
                      ({t.plannerConfig.crossesMidnight})
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Constraints ─────────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          {t.plannerConfig.constraintsTitle}
        </h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.plannerConfig.minRestHours}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={24}
                value={values.minRestHours}
                onChange={(e) => setPositive("minRestHours", e.target.value)}
                className="w-24 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">{t.plannerConfig.hours}</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">{t.plannerConfig.minRestHoursHint}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.plannerConfig.maxConsecutiveDays}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={14}
                value={values.maxConsecutiveDays}
                onChange={(e) => setPositive("maxConsecutiveDays", e.target.value)}
                className="w-24 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">{t.plannerConfig.days}</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">{t.plannerConfig.maxConsecutiveDaysHint}</p>
          </div>
        </div>
      </section>

      {/* ── Shift times ─────────────────────────────────────────────────── */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">
          {t.plannerConfig.shiftTimesTitle}
        </h2>
        <p className="text-xs text-gray-400 mb-6">{t.plannerConfig.shiftTimesHint}</p>

        <div className="space-y-6">
          {/* Weekday */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t.plannerConfig.weekdayShifts}
            </p>
            <div className="overflow-x-auto">
              <ShiftTable rows={weekdayRows} />
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Weekend */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t.plannerConfig.weekendShifts}
            </p>
            <div className="overflow-x-auto">
              <ShiftTable rows={weekendRows} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Save bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? t.common.saving : t.common.saveChanges}
        </button>
        {saved && <span className="text-sm text-green-600">{t.plannerConfig.saved}</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
