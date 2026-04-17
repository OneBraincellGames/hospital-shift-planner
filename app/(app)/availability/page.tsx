import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AvailabilityClient } from "./AvailabilityClient";

export default async function AvailabilityPage() {
  const session = await auth();

  const profile = await prisma.staffProfile.findFirst({
    where: { userId: session!.user.id },
    include: {
      availabilityRules: true,
      availabilityBlocks: { orderBy: { date: "asc" } },
    },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">My Availability</h1>
      <AvailabilityClient
        rules={profile?.availabilityRules ?? []}
        blocks={profile?.availabilityBlocks ?? []}
      />
    </div>
  );
}
