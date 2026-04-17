"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type SwapRequest = { id: string; status: string };
type ShiftSlot = {
  id: string;
  date: Date;
  shiftType: string;
  station: { name: string };
  schedule: { name: string };
  swapRequests: SwapRequest[];
};
type Assignment = { id: string; shiftSlotId: string; shiftSlot: ShiftSlot };
type Colleague = { id: string; user: { name: string } };

type Props = {
  assignments: Assignment[];
  colleagues: Colleague[];
  profileId: string;
};

const SHIFT_COLORS: Record<string, string> = {
  EARLY: "bg-blue-100 text-blue-800",
  LATE: "bg-purple-100 text-purple-800",
  NIGHT: "bg-gray-700 text-white",
  DAY: "bg-green-100 text-green-800",
};

export function MyShiftsClient({ assignments, colleagues }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [swapModal, setSwapModal] = useState<ShiftSlot | null>(null);
  const [targetId, setTargetId] = useState("");
  const [note, setNote] = useState("");
  const [swapType, setSwapType] = useState<"open" | "targeted">("open");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submitSwap() {
    if (!swapModal) return;
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/swaps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shiftSlotId: swapModal.id,
        targetId: swapType === "targeted" && targetId ? targetId : null,
        note: note || null,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Something went wrong.");
      return;
    }
    setSwapModal(null);
    setTargetId("");
    setNote("");
    startTransition(() => router.refresh());
  }

  const upcoming = assignments.filter(
    (a) => new Date(a.shiftSlot.date) >= new Date(new Date().toDateString())
  );
  const past = assignments.filter(
    (a) => new Date(a.shiftSlot.date) < new Date(new Date().toDateString())
  );

  function renderAssignment(a: Assignment) {
    const slot = a.shiftSlot;
    const hasPending = slot.swapRequests.length > 0;
    return (
      <div key={a.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${SHIFT_COLORS[slot.shiftType] ?? "bg-gray-100 text-gray-700"}`}>
            {slot.shiftType.charAt(0) + slot.shiftType.slice(1).toLowerCase()}
          </span>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {new Date(slot.date).toLocaleDateString(undefined, {
                weekday: "long", month: "short", day: "numeric",
              })}
            </p>
            <p className="text-xs text-gray-500">{slot.station.name} · {slot.schedule.name}</p>
          </div>
        </div>
        {hasPending ? (
          <span className="text-xs text-amber-600 font-medium">Swap pending</span>
        ) : (
          <button
            onClick={() => { setSwapModal(slot); setSwapType("open"); setTargetId(""); setNote(""); setError(""); }}
            className="text-xs text-blue-600 hover:underline"
          >
            Request swap
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {swapModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setSwapModal(null)}>
          <div className="bg-white rounded-xl shadow-xl p-5 w-80" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-medium text-gray-900 mb-1">Request swap</h3>
            <p className="text-xs text-gray-500 mb-4">
              {new Date(swapModal.date).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
              {" · "}{swapModal.shiftType} · {swapModal.station.name}
            </p>
            <div className="flex gap-2 mb-4">
              {(["open", "targeted"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSwapType(t)}
                  className={`text-xs px-3 py-1.5 rounded border ${swapType === t ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600"}`}
                >
                  {t === "open" ? "Open (anyone)" : "Targeted"}
                </button>
              ))}
            </div>
            {swapType === "targeted" && (
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">Colleague</label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900"
                >
                  <option value="">Select colleague…</option>
                  {colleagues.map((c) => (
                    <option key={c.id} value={c.id}>{c.user.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Note (optional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. family event"
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900"
              />
            </div>
            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
            <div className="flex gap-2">
              <button onClick={submitSwap} disabled={submitting} className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {submitting ? "Submitting…" : "Submit request"}
              </button>
              <button onClick={() => setSwapModal(null)} className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-1">Upcoming shifts</h2>
          {upcoming.map(renderAssignment)}
        </div>
      )}
      {past.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-sm font-medium text-gray-500 mb-1">Past shifts</h2>
          {past.map(renderAssignment)}
        </div>
      )}
      {assignments.length === 0 && (
        <p className="text-sm text-gray-400">No shifts assigned yet.</p>
      )}
    </>
  );
}
