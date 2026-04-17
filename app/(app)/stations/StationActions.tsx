"use client";

import { useRouter } from "next/navigation";

export function StationActions({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();

  async function toggle() {
    await fetch(`/api/stations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    router.refresh();
  }

  return (
    <button onClick={toggle} className="text-gray-500 hover:text-gray-900 text-sm">
      {active ? "Deactivate" : "Activate"}
    </button>
  );
}
