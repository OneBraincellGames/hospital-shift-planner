import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

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

  const body = await req.json();
  const { name, email, password, stationIds } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email and password are required" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: "STAFF",
      staffProfile: {
        create: {
          stationAssignments: {
            create: (stationIds ?? []).map((id: string, i: number) => ({
              stationId: id,
              isPrimary: i === 0,
            })),
          },
        },
      },
    },
    include: { staffProfile: true },
  });
  return NextResponse.json(user, { status: 201 });
}
