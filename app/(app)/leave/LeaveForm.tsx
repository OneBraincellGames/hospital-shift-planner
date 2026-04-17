"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";

type StaffOption = { profileId: string; name: string };

type Props = {
  staff: StaffOption[];
  defaultValues?: {
    id: string;
    staffProfileId: string;
    type: string;
    startDate: string;
    endDate: string;
    note: string | null;
  };
};

export function LeaveForm({ staff, defaultValues }: Props) {
  const router = useRouter();
  const t = useT();
  const isEdit = !!defaultValues;

  const [staffProfileId, setStaffProfileId] = useState(defaultValues?.staffProfileId ?? "");
  const [type, setType] = useState(defaultValues?.type ?? "VACATION");
  const [startDate, setStartDate] = useState(defaultValues?.startDate ?? "");
  const [endDate, setEndDate] = useState(defaultValues?.endDate ?? "");
  const [note, setNote] = useState(defaultValues?.note ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const leaveTypes = [
    { value: "VACATION", label: t.leave.types.VACATION },
    { value: "TRAINING", label: t.leave.types.TRAINING },
    { value: "ABSENCE", label: t.leave.types.ABSENCE },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = isEdit ? `/api/leave/${defaultValues.id}` : "/api/leave";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffProfileId, type, startDate, endDate, note: note || null }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t.common.somethingWentWrong);
      return;
    }
    router.push("/leave");
    router.refresh();
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-200 rounded-xl p-6">
      {!isEdit && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.leave.staffMember}</label>
          <select value={staffProfileId} onChange={(e) => setStaffProfileId(e.target.value)} required className={inputClass}>
            <option value="">{t.leave.selectStaffMember}</option>
            {staff.map((s) => (
              <option key={s.profileId} value={s.profileId}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t.leave.type}</label>
        <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
          {leaveTypes.map((lt) => (
            <option key={lt.value} value={lt.value}>{lt.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.leave.startDate}</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.leave.endDate}</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t.leave.noteOptional}</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? t.common.saving : isEdit ? t.common.saveChanges : t.leave.add}
        </button>
        <button type="button" onClick={() => router.push("/leave")} className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}
