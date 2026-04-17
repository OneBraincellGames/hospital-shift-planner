"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ScheduleGrid } from "./ScheduleGrid";
import { StationView } from "./StationView";
import type { Conflict } from "@/lib/scheduler";
import { useT } from "@/lib/i18n/client";

type StaffProfile = {
  id: string;
  user: { name: string };
  stationAssignments: { stationId: string }[];
};

type Assignment = {
  id: string;
  staffProfileId: string;
  staffProfile: { id: string; user: { name: string } };
};

type ShiftSlot = {
  id: string;
  stationId: string;
  date: Date;
  shiftType: string;
  station: { id: string; name: string };
  assignments: Assignment[];
};

type Schedule = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  published: boolean;
  shiftSlots: ShiftSlot[];
};

type Station = { id: string; name: string };

type Props = {
  schedule: Schedule;
  allStaff: StaffProfile[];
  stations: Station[];
};

type GenerateResult = { conflicts: Conflict[]; hoursPerStaff: Record<string, number>; slotsCreated: number };

export function ScheduleView({ schedule, allStaff, stations }: Props) {
  const router = useRouter();
  const t = useT();
  const [view, setView] = useState<"grid" | "station">("grid");
  const [isPending, startTransition] = useTransition();
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateResult(null);
    const res = await fetch(`/api/schedules/${schedule.id}/generate`, { method: "POST" });
    const data = await res.json();
    setGenerating(false);
    setGenerateResult(data);
    startTransition(() => router.refresh());
  }

  async function togglePublish() {
    await fetch(`/api/schedules/${schedule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !schedule.published }),
    });
    startTransition(() => router.refresh());
  }

  const staffHours: Record<string, number> = {};
  for (const slot of schedule.shiftSlots) {
    const dur = slot.shiftType === "DAY" ? 12 : 8;
    for (const a of slot.assignments) {
      staffHours[a.staffProfileId] = (staffHours[a.staffProfileId] ?? 0) + dur;
    }
  }

  const WEEKLY_CAP = 48;
  const totalDays = Math.ceil(
    (new Date(schedule.endDate).getTime() - new Date(schedule.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  ) + 1;
  const weeks = totalDays / 7;
  const capTotal = WEEKLY_CAP * weeks;

  const overtimeStaff = allStaff.filter((s) => (staffHours[s.id] ?? 0) > capTotal);

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{schedule.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date(schedule.startDate).toLocaleDateString()} –{" "}
            {new Date(schedule.endDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating || isPending}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? t.schedules.generating : t.schedules.generate}
          </button>
          <button
            onClick={togglePublish}
            disabled={isPending}
            className={`text-sm px-4 py-2 rounded-lg border disabled:opacity-50 ${
              schedule.published
                ? "border-gray-300 hover:bg-gray-50"
                : "border-green-500 text-green-700 hover:bg-green-50"
            }`}
          >
            {schedule.published ? t.schedules.unpublish : t.schedules.publish}
          </button>
        </div>
      </div>

      {generateResult && (
        <div className="mb-4 p-4 rounded-xl border bg-white">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {generateResult.slotsCreated} {t.schedules.slotsCreatedLabel}
            {generateResult.conflicts.length > 0 && (
              <span className="ml-2 text-amber-600">
                — {generateResult.conflicts.length} {t.schedules.conflictsLabel}
              </span>
            )}
          </p>
          {generateResult.conflicts.length > 0 && (
            <ul className="space-y-1">
              {generateResult.conflicts.map((c, i) => (
                <li key={i} className="text-xs text-amber-700">
                  {c.date} · {c.stationName} · {c.shiftType}: {c.required} / {c.assigned}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {overtimeStaff.length > 0 && (
        <div className="mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50">
          <p className="text-sm font-medium text-amber-800 mb-1">{t.schedules.staffHoursTitle}</p>
          <ul className="space-y-0.5">
            {overtimeStaff.map((s) => (
              <li key={s.id} className="text-xs text-amber-700">
                {s.user.name}: {staffHours[s.id]}h (cap {Math.round(capTotal)}h)
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {(["grid", "station"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`text-sm px-3 py-1.5 rounded-lg border ${
              view === v ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {v === "grid" ? t.schedules.gridView : t.schedules.stationView}
          </button>
        ))}
      </div>

      {view === "grid" ? (
        <ScheduleGrid schedule={schedule} allStaff={allStaff} staffHours={staffHours} />
      ) : (
        <StationView schedule={schedule} stations={stations} allStaff={allStaff} />
      )}
    </div>
  );
}
