import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash("admin123", 10);
  const manager = await prisma.user.upsert({
    where: { email: "admin@hospital.local" },
    update: {},
    create: {
      email: "admin@hospital.local",
      name: "Admin Manager",
      password,
      role: "MANAGER",
    },
  });
  console.log("Seeded manager:", manager.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
