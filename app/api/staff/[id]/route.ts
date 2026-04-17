import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { name, email, active, monthlyHours, stationIds, primaryStationId } = body;

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

  return NextResponse.json(user);
}
