"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Rule = { id: string; shiftType: string; available: boolean };
type Block = { id: string; date: Date | string; available: boolean; note: string | null };

const ALL_SHIFTS = ["EARLY", "LATE", "NIGHT", "DAY"];

type Props = { rules: Rule[]; blocks: Block[] };

export function AvailabilityClient({ rules, blocks }: Props) {
  const router = useRouter();

  const [localRules, setLocalRules] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    ALL_SHIFTS.forEach((s) => {
      const r = rules.find((r) => r.shiftType === s);
      map[s] = r ? r.available : true;
    });
    return map;
  });
  const [rulesLoading, setRulesLoading] = useState(false);

  const [newDate, setNewDate] = useState("");
  const [newAvailable, setNewAvailable] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [blockLoading, setBlockLoading] = useState(false);

  async function saveRules() {
    setRulesLoading(true);
    await fetch("/api/availability/rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rules: ALL_SHIFTS.map((s) => ({ shiftType: s, available: localRules[s] })),
      }),
    });
    setRulesLoading(false);
    router.refresh();
  }

  async function addBlock(e: React.FormEvent) {
    e.preventDefault();
    setBlockLoading(true);
    await fetch("/api/availability/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate, available: newAvailable, note: newNote }),
    });
    setBlockLoading(false);
    setNewDate("");
    setNewNote("");
    router.refresh();
  }

  async function deleteBlock(id: string) {
    await fetch(`/api/availability/blocks?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Recurring rules */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-medium text-gray-900 mb-4">Recurring preferences</h2>
        <div className="space-y-2 mb-4">
          {ALL_SHIFTS.map((shift) => (
            <label key={shift} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={localRules[shift]}
                onChange={(e) =>
                  setLocalRules((prev) => ({ ...prev, [shift]: e.target.checked }))
                }
                className="rounded"
              />
              <span>Available for <strong>{shift.charAt(0) + shift.slice(1).toLowerCase()}</strong> shifts</span>
            </label>
          ))}
        </div>
        <button
          onClick={saveRules}
          disabled={rulesLoading}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {rulesLoading ? "Saving…" : "Save preferences"}
        </button>
      </div>

      {/* One-off overrides */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-medium text-gray-900 mb-4">Date overrides</h2>

        {blocks.length > 0 && (
          <div className="mb-4 space-y-2">
            {blocks.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  {new Date(b.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  —{" "}
                  <span className={b.available ? "text-green-600" : "text-red-600"}>
                    {b.available ? "Available" : "Unavailable"}
                  </span>
                  {b.note && <span className="text-gray-400 ml-1">({b.note})</span>}
                </span>
                <button
                  onClick={() => deleteBlock(b.id)}
                  className="text-gray-400 hover:text-red-500 ml-4"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={addBlock} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={newAvailable ? "available" : "unavailable"}
              onChange={(e) => setNewAvailable(e.target.value === "available")}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="unavailable">Unavailable</option>
              <option value="available">Available</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Note (optional)</label>
            <input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="e.g. doctor appointment"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={blockLoading}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {blockLoading ? "Adding…" : "Add override"}
          </button>
        </form>
      </div>
    </div>
  );
}
