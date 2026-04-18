import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { DEFAULT_PLANNER_CONFIG } from "@/lib/scheduler";

/** GET — return current config (seeded defaults if the row is missing) */
export async function GET() {
  const config = await prisma.plannerConfig.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, ...DEFAULT_PLANNER_CONFIG },
  });
  return NextResponse.json(config);
}

/** PATCH — update config fields (manager only) */
export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user.role !== "MANAGER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  const intFields = [
    "minRestHours",
    "maxConsecutiveDays",
    "earlyShiftStart",
    "earlyShiftEnd",
    "lateShiftStart",
    "lateShiftEnd",
    "nightShiftStart",
    "nightShiftEnd",
    "dayShiftStart",
    "dayShiftEnd",
  ] as const;

  const data: Record<string, number> = {};
  for (const field of intFields) {
    const val = body[field];
    if (val !== undefined) {
      const n = parseInt(String(val), 10);
      if (isNaN(n)) return NextResponse.json({ error: `Invalid value for ${field}` }, { status: 400 });
      data[field] = n;
    }
  }

  const config = await prisma.plannerConfig.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...DEFAULT_PLANNER_CONFIG, ...data },
  });

  return NextResponse.json(config);
}
