import { DayOfWeek, ShiftType } from "@prisma/client";

// Shift windows in hours-of-day. NIGHT ends at 30 = 06:00 next day.
const SHIFT_WINDOW: Record<ShiftType, { start: number; end: number }> = {
  EARLY: { start: 6, end: 14 },
  LATE: { start: 14, end: 22 },
  NIGHT: { start: 22, end: 30 },
  DAY: { start: 8, end: 20 },
};

const WEEKDAY_SHIFTS: ShiftType[] = [ShiftType.EARLY, ShiftType.LATE, ShiftType.NIGHT];
const WEEKEND_SHIFTS: ShiftType[] = [ShiftType.DAY, ShiftType.NIGHT];
const MIN_REST_HOURS = 11;
const MAX_CONSECUTIVE_DAYS = 6;

const DOW_MAP: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUN,
  1: DayOfWeek.MON,
  2: DayOfWeek.TUE,
  3: DayOfWeek.WED,
  4: DayOfWeek.THU,
  5: DayOfWeek.FRI,
  6: DayOfWeek.SAT,
};

export type StaffMember = {
  id: string; // staffProfileId
  userId: string;
  name: string;
  stationIds: string[];
  availableShiftTypes: Set<ShiftType>; // recurring rules
  blockedDates: Map<string, boolean>; // ISO date string → available
};

export type HeadcountRule = {
  stationId: string;
  dayOfWeek: DayOfWeek;
  shiftType: ShiftType;
  required: number;
};

export type SlotAssignment = {
  stationId: string;
  date: string; // ISO date string YYYY-MM-DD
  shiftType: ShiftType;
  staffProfileIds: string[];
};

export type Conflict = {
  date: string;
  stationId: string;
  stationName: string;
  shiftType: ShiftType;
  required: number;
  assigned: number;
};

export type ScheduleResult = {
  assignments: SlotAssignment[];
  conflicts: Conflict[];
  hoursPerStaff: Record<string, number>;
};

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isWeekend(d: Date): boolean {
  const dow = d.getUTCDay();
  return dow === 0 || dow === 6;
}

/** Returns the absolute end time as (dayIndex * 24 + hour). dayIndex 0 = startDate. */
function shiftEndAbsolute(dayIndex: number, shiftType: ShiftType): number {
  return dayIndex * 24 + SHIFT_WINDOW[shiftType].end;
}

function shiftStartAbsolute(dayIndex: number, shiftType: ShiftType): number {
  return dayIndex * 24 + SHIFT_WINDOW[shiftType].start;
}

function hasRestViolation(
  staffId: string,
  dayIndex: number,
  shiftType: ShiftType,
  lastShift: Map<string, { dayIndex: number; shiftType: ShiftType }>
): boolean {
  const last = lastShift.get(staffId);
  if (!last) return false;
  const lastEnd = shiftEndAbsolute(last.dayIndex, last.shiftType);
  const nextStart = shiftStartAbsolute(dayIndex, shiftType);
  return nextStart - lastEnd < MIN_REST_HOURS;
}

function hasConsecutiveViolation(
  staffId: string,
  dayIndex: number,
  workedDays: Map<string, number[]>
): boolean {
  const days = workedDays.get(staffId) ?? [];
  let streak = 0;
  for (let i = dayIndex - 1; i >= 0; i--) {
    if (days.includes(i)) streak++;
    else break;
  }
  return streak >= MAX_CONSECUTIVE_DAYS;
}

function isStaffAvailable(
  staff: StaffMember,
  dateStr: string,
  shiftType: ShiftType
): boolean {
  const blockOverride = staff.blockedDates.get(dateStr);
  if (blockOverride !== undefined) return blockOverride;
  return staff.availableShiftTypes.has(shiftType);
}

export function generateSchedule(
  startDate: Date,
  endDate: Date,
  staffList: StaffMember[],
  headcountRules: HeadcountRule[],
  stations: { id: string; name: string }[]
): ScheduleResult {
  const assignments: SlotAssignment[] = [];
  const conflicts: Conflict[] = [];
  const hoursPerStaff: Record<string, number> = {};
  const lastShift = new Map<string, { dayIndex: number; shiftType: ShiftType }>();
  const workedDays = new Map<string, number[]>();

  for (const s of staffList) {
    hoursPerStaff[s.id] = 0;
    workedDays.set(s.id, []);
  }

  const stationMap = new Map(stations.map((s) => [s.id, s.name]));

  let dayIndex = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = dateKey(current);
    const weekend = isWeekend(current);
    const dayOfWeek = DOW_MAP[current.getUTCDay()];
    const shifts = weekend ? WEEKEND_SHIFTS : WEEKDAY_SHIFTS;

    for (const shiftType of shifts) {
      for (const station of stations) {
        const rule = headcountRules.find(
          (r) =>
            r.stationId === station.id &&
            r.dayOfWeek === dayOfWeek &&
            r.shiftType === shiftType
        );
        const required = rule?.required ?? 0;
        if (required === 0) continue;

        const eligible = staffList
          .filter(
            (s) =>
              s.stationIds.includes(station.id) &&
              isStaffAvailable(s, dateStr, shiftType) &&
              !hasRestViolation(s.id, dayIndex, shiftType, lastShift) &&
              !hasConsecutiveViolation(s.id, dayIndex, workedDays)
          )
          .sort((a, b) => (hoursPerStaff[a.id] ?? 0) - (hoursPerStaff[b.id] ?? 0));

        const chosen = eligible.slice(0, required);
        const shiftDuration =
          SHIFT_WINDOW[shiftType].end - SHIFT_WINDOW[shiftType].start;

        for (const s of chosen) {
          hoursPerStaff[s.id] = (hoursPerStaff[s.id] ?? 0) + shiftDuration;
          lastShift.set(s.id, { dayIndex, shiftType });
          const days = workedDays.get(s.id) ?? [];
          if (!days.includes(dayIndex)) days.push(dayIndex);
          workedDays.set(s.id, days);
        }

        assignments.push({
          stationId: station.id,
          date: dateStr,
          shiftType,
          staffProfileIds: chosen.map((s) => s.id),
        });

        if (chosen.length < required) {
          conflicts.push({
            date: dateStr,
            stationId: station.id,
            stationName: stationMap.get(station.id) ?? station.id,
            shiftType,
            required,
            assigned: chosen.length,
          });
        }
      }
    }

    current.setUTCDate(current.getUTCDate() + 1);
    dayIndex++;
  }

  return { assignments, conflicts, hoursPerStaff };
}
