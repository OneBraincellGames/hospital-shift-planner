import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ShiftType } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { name, email, active, monthlyHours, stationIds, primaryStationId, preferences } = body;

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      ...((typeof active === "boolean" || typeof monthlyHours === "number") && {
        staffProfile: {
          update: {
            ...(typeof active === "boolean" && { active }),
            ...(typeof monthlyHours === "number" && { monthlyHours }),
          },
        },
      }),
    },
  });

  if (stationIds !== undefined) {
    const profile = await prisma.staffProfile.findUnique({ where: { userId: id } });
    if (profile) {
      await prisma.stationAssignment.deleteMany({ where: { staffProfileId: profile.id } });
      await prisma.stationAssignment.createMany({
        data: (stationIds as string[]).map((sid) => ({
          staffProfileId: profile.id,
          stationId: sid,
          isPrimary: sid === primaryStationId,
        })),
      });
    }
  }

  // Upsert shift preferences: Record<ShiftType, true | false | null>
  if (preferences !== undefined) {
    const profile = await prisma.staffProfile.findUnique({ where: { userId: id } });
    if (profile) {
      await prisma.shiftPreference.deleteMany({ where: { staffProfileId: profile.id } });
      const rows = (Object.entries(preferences) as [string, boolean | null][])
        .filter(([, val]) => val !== null)
        .map(([shiftType, preferred]) => ({
          staffProfileId: profile.id,
          shiftType: shiftType as ShiftType,
          preferred: preferred as boolean,
        }));
      if (rows.length > 0) {
        await prisma.shiftPreference.createMany({ data: rows });
      }
    }
  }

  return NextResponse.json(user);
}
