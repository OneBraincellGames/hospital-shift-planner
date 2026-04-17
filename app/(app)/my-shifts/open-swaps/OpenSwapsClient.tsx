"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Swap = {
  id: string;
  note: string | null;
  shiftSlot: {
    date: Date;
    shiftType: string;
    station: { name: string };
    schedule: { name: string };
  };
  requester: { user: { name: string } };
};

const SHIFT_COLORS: Record<string, string> = {
  EARLY: "bg-blue-100 text-blue-800",
  LATE: "bg-purple-100 text-purple-800",
  NIGHT: "bg-gray-700 text-white",
  DAY: "bg-green-100 text-green-800",
};

export function OpenSwapsClient({ swaps }: { swaps: Swap[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [claiming, setClaiming] = useState<string | null>(null);

  async function claim(id: string) {
    setClaiming(id);
    await fetch(`/api/swaps/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "claim" }),
    });
    setClaiming(null);
    startTransition(() => router.refresh());
  }

  if (swaps.length === 0) {
    return <p className="text-sm text-gray-400">No open swap requests for your stations.</p>;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
      {swaps.map((swap) => (
        <div key={swap.id} className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${SHIFT_COLORS[swap.shiftSlot.shiftType] ?? "bg-gray-100 text-gray-700"}`}>
              {swap.shiftSlot.shiftType.charAt(0) + swap.shiftSlot.shiftType.slice(1).toLowerCase()}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {new Date(swap.shiftSlot.date).toLocaleDateString(undefined, {
                  weekday: "long", month: "short", day: "numeric",
                })}
              </p>
              <p className="text-xs text-gray-500">
                {swap.shiftSlot.station.name} · {swap.shiftSlot.schedule.name}
                {" · "}Posted by {swap.requester.user.name}
                {swap.note && <span className="italic"> — "{swap.note}"</span>}
              </p>
            </div>
          </div>
          <button
            onClick={() => claim(swap.id)}
            disabled={claiming === swap.id}
            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {claiming === swap.id ? "Claiming…" : "Claim"}
          </button>
        </div>
      ))}
    </div>
  );
}
