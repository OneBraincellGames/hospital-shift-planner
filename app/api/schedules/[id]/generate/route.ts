import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  generateSchedule,
  StaffMember,
  HeadcountRule,
  DEFAULT_PLANNER_CONFIG,
} from "@/lib/scheduler";
import { getHolidaySet } from "@/lib/holidays";
import { ShiftType } from "@prisma/client";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const schedule = await prisma.schedule.findUnique({ where: { id } });
  if (!schedule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Load all data needed for the algorithm
  const [staffProfiles, stations, headcountRules, plannerConfig] = await Promise.all([
    prisma.staffProfile.findMany({
      where: { active: true },
      include: {
        user: true,
        stationAssignments: true,
        availabilityRules: true,
        availabilityBlocks: {
          where: {
            date: { gte: schedule.startDate, lte: schedule.endDate },
          },
        },
        leaveBlocks: {
          where: {
            startDate: { lte: schedule.endDate },
            endDate: { gte: schedule.startDate },
          },
        },
        shiftPreferences: true,
      },
    }),
    prisma.station.findMany({ where: { active: true } }),
    prisma.headcountRule.findMany(),
    prisma.plannerConfig.findUnique({ where: { id: 1 } }),
  ]);

  // Build StaffMember objects
  const staffList: StaffMember[] = staffProfiles.map((p) => {
    const availableShifts = new Set<ShiftType>(
      p.availabilityRules.filter((r) => r.available).map((r) => r.shiftType as ShiftType)
    );
    // Default: available for all shifts if no rules set
    if (p.availabilityRules.length === 0) {
      Object.values(ShiftType).forEach((s) => availableShifts.add(s));
    }

    const blockedDates = new Map<string, boolean>();
    // Leave blocks → unavailable
    for (const leave of p.leaveBlocks) {
      const cur = new Date(leave.startDate);
      while (cur <= leave.endDate) {
        blockedDates.set(cur.toISOString().slice(0, 10), false);
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    }
    // Availability blocks override leave
    for (const block of p.availabilityBlocks) {
      blockedDates.set(
        new Date(block.date).toISOString().slice(0, 10),
        block.available
      );
    }

    const preferredShifts = new Set<ShiftType>(
      p.shiftPreferences.filter((pr) => pr.preferred).map((pr) => pr.shiftType as ShiftType)
    );
    const avoidedShifts = new Set<ShiftType>(
      p.shiftPreferences.filter((pr) => !pr.preferred).map((pr) => pr.shiftType as ShiftType)
    );

    return {
      id: p.id,
      userId: p.userId,
      name: p.user.name,
      stationIds: p.stationAssignments.map((a) => a.stationId),
      availableShiftTypes: availableShifts,
      blockedDates,
      preferredShifts,
      avoidedShifts,
    };
  });

  const rules: HeadcountRule[] = headcountRules.map((r) => ({
    stationId: r.stationId,
    dayOfWeek: r.dayOfWeek,
    shiftType: r.shiftType as ShiftType,
    required: r.required,
  }));

  // Run the algorithm
  const cfg = plannerConfig ?? DEFAULT_PLANNER_CONFIG;
  const holidays = cfg.observePublicHolidays
    ? getHolidaySet(schedule.startDate, schedule.endDate)
    : new Set<string>();

  const result = generateSchedule(
    schedule.startDate,
    schedule.endDate,
    staffList,
    rules,
    stations.map((s) => ({ id: s.id, name: s.name })),
    cfg,
    holidays
  );

  // Wipe existing slots and re-create
  await prisma.shiftSlot.deleteMany({ where: { scheduleId: id } });

  for (const slot of result.assignments) {
    if (slot.staffProfileIds.length === 0 && result.conflicts.some(
      (c) => c.date === slot.date && c.stationId === slot.stationId && c.shiftType === slot.shiftType
    )) {
      // Still create the slot so it shows as empty/conflicted
    }
    await prisma.shiftSlot.create({
      data: {
        scheduleId: id,
        stationId: slot.stationId,
        date: new Date(slot.date),
        shiftType: slot.shiftType,
        assignments: {
          create: slot.staffProfileIds.map((pid) => ({ staffProfileId: pid })),
        },
      },
    });
  }

  return NextResponse.json({
    conflicts: result.conflicts,
    hoursPerStaff: result.hoursPerStaff,
    slotsCreated: result.assignments.length,
  });
}
