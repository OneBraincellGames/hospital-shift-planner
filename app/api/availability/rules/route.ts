import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get("staffId") ?? undefined;

  const profile = await prisma.staffProfile.findFirst({
    where: staffId
      ? { id: staffId }
      : { userId: session.user.id },
  });
  if (!profile) return NextResponse.json([]);

  const rules = await prisma.availabilityRule.findMany({
    where: { staffProfileId: profile.id },
  });
  return NextResponse.json(rules);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rules, staffId } = await req.json();

  const profile = await prisma.staffProfile.findFirst({
    where: staffId && session.user.role === "MANAGER"
      ? { id: staffId }
      : { userId: session.user.id },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  await prisma.availabilityRule.deleteMany({ where: { staffProfileId: profile.id } });
  await prisma.availabilityRule.createMany({
    data: rules.map((r: { shiftType: string; available: boolean }) => ({
      staffProfileId: profile.id,
      shiftType: r.shiftType,
      available: r.available,
    })),
  });

  return NextResponse.json({ ok: true });
}
