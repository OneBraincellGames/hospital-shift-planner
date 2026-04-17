"use client";

import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";

export function StaffActions({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const t = useT();

  async function toggle() {
    await fetch(`/api/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    router.refresh();
  }

  return (
    <button onClick={toggle} className="text-gray-500 hover:text-gray-900 text-sm">
      {active ? t.common.deactivate : t.common.activate}
    </button>
  );
}
