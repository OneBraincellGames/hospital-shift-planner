"use client";

import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";

export function LeaveActions({ id }: { id: string }) {
  const router = useRouter();
  const t = useT();

  async function handleDelete() {
    if (!confirm(t.leave.deleteConfirm)) return;
    await fetch(`/api/leave/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button onClick={handleDelete} className="text-red-500 hover:underline text-sm">
      {t.common.delete}
    </button>
  );
}
