"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type StaffProfile = { id: string; user: { name: string } };
type ShiftSlot = {
  id: string;
  date: Date;
  shiftType: string;
  station: { name: string };
  schedule: { name: string };
};
type Swap = {
  id: string;
  status: string;
  note: string | null;
  createdAt: Date;
  shiftSlot: ShiftSlot;
  requester: StaffProfile;
  target: StaffProfile | null;
};

type Props = { swaps: Swap[] };

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
};

export function SwapsClient({ swaps }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState<string | null>(null);

  async function act(id: string, action: "approve" | "reject") {
    setLoading(`${id}-${action}`);
    await fetch(`/api/swaps/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(null);
    startTransition(() => router.refresh());
  }

  const pending = swaps.filter((s) => s.status === "PENDING");
  const resolved = swaps.filter((s) => s.status !== "PENDING");

  function renderSwap(swap: Swap) {
    const isPending = swap.status === "PENDING";
    return (
      <div key={swap.id} className="py-3 border-b border-gray-100 last:border-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[swap.status]}`}>
                {swap.status}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(swap.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {swap.requester.user.name} →{" "}
              {swap.target ? swap.target.user.name : <span className="text-gray-400">Open</span>}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(swap.shiftSlot.date).toLocaleDateString(undefined, {
                weekday: "short", month: "short", day: "numeric",
              })}{" "}
              · {swap.shiftSlot.shiftType} · {swap.shiftSlot.station.name}
              {" · "}{swap.shiftSlot.schedule.name}
            </p>
            {swap.note && (
              <p className="text-xs text-gray-400 mt-0.5 italic">"{swap.note}"</p>
            )}
          </div>
          {isPending && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => act(swap.id, "approve")}
                disabled={!!loading || !swap.target}
                title={!swap.target ? "No target yet — wait for a colleague to claim" : undefined}
                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-40"
              >
                {loading === `${swap.id}-approve` ? "…" : "Approve"}
              </button>
              <button
                onClick={() => act(swap.id, "reject")}
                disabled={!!loading}
                className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                {loading === `${swap.id}-reject` ? "…" : "Reject"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-2">
          Pending ({pending.length})
        </h2>
        {pending.length > 0 ? pending.map(renderSwap) : (
          <p className="text-sm text-gray-400">No pending swap requests.</p>
        )}
      </div>
      {resolved.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Resolved</h2>
          {resolved.map(renderSwap)}
        </div>
      )}
    </div>
  );
}
