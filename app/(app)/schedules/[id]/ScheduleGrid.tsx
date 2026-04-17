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

type Schedule = {
  id: string;
  startDate: Date;
  endDate: Date;
  shiftSlots: ShiftSlot[];
};

type Props = {
  schedule: Schedule;
  allStaff: StaffProfile[];
  staffHours: Record<string, number>;
};

const SHIFT_COLORS: Record<string, string> = {
  EARLY: "bg-blue-100 text-blue-800",
  LATE: "bg-purple-100 text-purple-800",
  NIGHT: "bg-gray-700 text-white",
  DAY: "bg-green-100 text-green-800",
};

const SHIFT_ABBR: Record<string, string> = {
  EARLY: "E",
  LATE: "L",
  NIGHT: "N",
  DAY: "D",
};

function getDates(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const cur = new Date(start);
  while (cur <= new Date(end)) {
    dates.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

function dateKey(d: Date): string {
  return new Date(d).toISOString().slice(0, 10);
}

type CellEditProps = {
  slot: ShiftSlot;
  scheduleId: string;
  allStaff: StaffProfile[];
  onClose: () => void;
};

function CellEditor({ slot, scheduleId, allStaff, onClose }: CellEditProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>(
    slot.assignments.map((a) => a.staffProfileId)
  );
  const [saving, setSaving] = useState(false);

  const eligible = allStaff.filter((s) =>
    s.stationAssignments.some((a) => a.stationId === slot.stationId)
  );

  async function save() {
    setSaving(true);
    await fetch(`/api/schedules/${scheduleId}/slots/${slot.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffProfileIds: selected }),
    });
    setSaving(false);
    onClose();
    startTransition(() => router.refresh());
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl p-5 w-80"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-medium text-gray-900 mb-1">
          {slot.station.name} · {slot.shiftType}
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          {new Date(slot.date).toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </p>
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
          {eligible.length === 0 && (
            <p className="text-xs text-gray-400">No eligible staff for this station.</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function ScheduleGrid({ schedule, allStaff, staffHours }: Props) {
  const dates = getDates(schedule.startDate, schedule.endDate);
  const [editSlot, setEditSlot] = useState<ShiftSlot | null>(null);

  // Build lookup: staffId → date → slots
  const staffDateSlots = new Map<string, Map<string, ShiftSlot[]>>();
  for (const staff of allStaff) {
    const dateMap = new Map<string, ShiftSlot[]>();
    for (const d of dates) {
      const dk = dateKey(d);
      const slots = schedule.shiftSlots.filter(
        (slot) =>
          dateKey(new Date(slot.date)) === dk &&
          slot.assignments.some((a) => a.staffProfileId === staff.id)
      );
      dateMap.set(dk, slots);
    }
    staffDateSlots.set(staff.id, dateMap);
  }

  return (
    <>
      {editSlot && (
        <CellEditor
          slot={editSlot}
          scheduleId={schedule.id}
          allStaff={allStaff}
          onClose={() => setEditSlot(null)}
        />
      )}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left font-medium text-gray-700 border-b border-r border-gray-200 min-w-36">
                Staff
              </th>
              <th className="px-2 py-2 text-right font-medium text-gray-500 border-b border-gray-200 whitespace-nowrap">
                Hrs
              </th>
              {dates.map((d) => {
                const dow = d.getUTCDay();
                const isWE = dow === 0 || dow === 6;
                return (
                  <th
                    key={dateKey(d)}
                    className={`px-1.5 py-2 text-center font-medium border-b border-gray-200 whitespace-nowrap min-w-10 ${
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
            {allStaff.map((staff) => (
              <tr key={staff.id} className="hover:bg-gray-50">
                <td className="sticky left-0 z-10 bg-white px-3 py-1.5 font-medium text-gray-900 border-r border-b border-gray-100 whitespace-nowrap">
                  {staff.user.name}
                </td>
                <td className="px-2 py-1.5 text-right text-gray-500 border-b border-gray-100">
                  {staffHours[staff.id] ?? 0}
                </td>
                {dates.map((d) => {
                  const dk = dateKey(d);
                  const slots = staffDateSlots.get(staff.id)?.get(dk) ?? [];
                  const dow = d.getUTCDay();
                  const isWE = dow === 0 || dow === 6;
                  return (
                    <td
                      key={dk}
                      className={`px-0.5 py-1 border-b border-gray-100 text-center align-middle ${
                        isWE ? "bg-gray-50" : ""
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 items-center">
                        {slots.map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => setEditSlot(slot)}
                            title={`${slot.station.name} · ${slot.shiftType}`}
                            className={`px-1 py-0.5 rounded text-xs font-medium leading-none cursor-pointer ${
                              SHIFT_COLORS[slot.shiftType] ?? "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {SHIFT_ABBR[slot.shiftType]}
                          </button>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        E = Early · L = Late · N = Night · D = Day · Click a cell to edit
      </p>
    </>
  );
}
