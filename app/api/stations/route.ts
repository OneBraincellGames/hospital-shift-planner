import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stations = await prisma.station.findMany({
    include: { headcountRules: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(stations);
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, headcountRules } = await req.json();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const station = await prisma.station.create({
    data: {
      name,
      headcountRules: {
        create: headcountRules ?? [],
      },
    },
    include: { headcountRules: true },
  });
  return NextResponse.json(station, { status: 201 });
}
