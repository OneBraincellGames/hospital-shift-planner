"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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

type StaffProfile = {
  id: string;
  user: { name: string };
  stationAssignments: { stationId: string }[];
};

type Station = { id: string; name: string };

type Schedule = {
  id: string;
  startDate: Date;
  endDate: Date;
  shiftSlots: ShiftSlot[];
};

type Props = {
  schedule: Schedule;
  stations: Station[];
  allStaff: StaffProfile[];
};

const SHIFT_ORDER = ["EARLY", "LATE", "NIGHT", "DAY"];

function dateKey(d: Date): string {
  return new Date(d).toISOString().slice(0, 10);
}

function getDates(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const cur = new Date(start);
  while (cur <= new Date(end)) {
    dates.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

type SlotCellProps = {
  slot: ShiftSlot | undefined;
  scheduleId: string;
  allStaff: StaffProfile[];
  stationId: string;
};

function SlotCell({ slot, scheduleId, allStaff, stationId }: SlotCellProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(
    slot?.assignments.map((a) => a.staffProfileId) ?? []
  );
  const [saving, setSaving] = useState(false);

  if (!slot) return <td className="px-2 py-1.5 border-b border-gray-100 text-gray-300 text-xs">—</td>;

  const eligible = allStaff.filter((s) =>
    s.stationAssignments.some((a) => a.stationId === stationId)
  );

  async function save() {
    if (!slot) return;
    setSaving(true);
    await fetch(`/api/schedules/${scheduleId}/slots/${slot.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffProfileIds: selected }),
    });
    setSaving(false);
    setOpen(false);
    startTransition(() => router.refresh());
  }

  const isEmpty = slot.assignments.length === 0;

  return (
    <td className="px-2 py-1.5 border-b border-gray-100 text-xs relative">
      <button
        onClick={() => { setSelected(slot.assignments.map((a) => a.staffProfileId)); setOpen(true); }}
        className={`text-left w-full ${isEmpty ? "text-red-400" : "text-gray-700 hover:text-blue-600"}`}
      >
        {isEmpty ? "Empty" : slot.assignments.map((a) => a.staffProfile.user.name).join(", ")}
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl p-5 w-72" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-medium text-gray-900 mb-3">
              {slot.shiftType} ·{" "}
              {new Date(slot.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto mb-4">
              {eligible.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.includes(s.id)}
                    onChange={(e) =>
                      setSelected((prev) =>
                        e.target.checked ? [...prev, s.id] : prev.filter((x) => x !== s.id)
                      )
                    }
                  />
                  {s.user.name}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setOpen(false)} className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </td>
  );
}

export function StationView({ schedule, stations, allStaff }: Props) {
  const dates = getDates(schedule.startDate, schedule.endDate);
  const [activeStation, setActiveStation] = useState<string>(stations[0]?.id ?? "");

  const station = stations.find((s) => s.id === activeStation);
  const stationSlots = schedule.shiftSlots.filter((s) => s.stationId === activeStation);

  const slotMap = new Map<string, ShiftSlot>();
  for (const slot of stationSlots) {
    slotMap.set(`${dateKey(new Date(slot.date))}-${slot.shiftType}`, slot);
  }

  return (
    <div>
      {/* Station tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {stations.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveStation(s.id)}
            className={`text-sm px-3 py-1.5 rounded-lg border ${
              s.id === activeStation
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {station && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left font-medium text-gray-700 border-b border-r border-gray-200 min-w-20">
                  Shift
                </th>
                {dates.map((d) => {
                  const dow = d.getUTCDay();
                  const isWE = dow === 0 || dow === 6;
                  return (
                    <th
                      key={dateKey(d)}
                      className={`px-2 py-2 text-center font-medium border-b border-gray-200 whitespace-nowrap min-w-24 ${
                        isWE ? "bg-gray-100 text-gray-500" : "text-gray-700"
                      }`}
                    >
                      <div>{["Su","Mo","Tu","We","Th","Fr","Sa"][dow]}</div>
                      <div className="text-gray-400 font-normal">{d.getUTCDate()}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {SHIFT_ORDER.map((shiftType) => {
                const hasAny = dates.some(
                  (d) => slotMap.has(`${dateKey(d)}-${shiftType}`)
                );
                if (!hasAny) return null;
                return (
                  <tr key={shiftType} className="hover:bg-gray-50">
                    <td className="sticky left-0 z-10 bg-white px-3 py-1.5 font-medium text-gray-700 border-r border-b border-gray-100">
                      {shiftType.charAt(0) + shiftType.slice(1).toLowerCase()}
                    </td>
                    {dates.map((d) => {
                      const key = `${dateKey(d)}-${shiftType}`;
                      return (
                        <SlotCell
                          key={key}
                          slot={slotMap.get(key)}
                          scheduleId={schedule.id}
                          allStaff={allStaff}
                          stationId={activeStation}
                        />
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
  );
}
