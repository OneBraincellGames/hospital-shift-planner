"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";

export function ScheduleForm() {
  const router = useRouter();
  const t = useT();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (endDate < startDate) { setError(t.schedules.endBeforeStart); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, startDate, endDate }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? t.common.somethingWentWrong);
      return;
    }
    const schedule = await res.json();
    router.push(`/schedules/${schedule.id}`);
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-200 rounded-xl p-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t.schedules.scheduleName}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.schedules.schedulePlaceholder}
          required
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.schedules.startDate}</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.schedules.endDate}</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className={inputClass} />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? t.common.saving : t.common.create}
        </button>
        <button type="button" onClick={() => router.push("/schedules")} className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}
