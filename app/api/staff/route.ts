import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (session?.user.role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    where: { role: "STAFF" },
    include: {
      staffProfile: {
        include: { stationAssignments: { include: { station: true } } },
      },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, monthlyHours, stationIds, primaryStationId } = await req.json();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const user = await prisma.user.create({
    data: {
      name,
      role: "STAFF",
      staffProfile: {
        create: {
          monthlyHours: monthlyHours ?? 160,
          stationAssignments: {
            create: (stationIds ?? []).map((id: string) => ({
              stationId: id,
              isPrimary: id === primaryStationId,
            })),
          },
        },
      },
    },
    include: { staffProfile: true },
  });
  return NextResponse.json(user, { status: 201 });
}
