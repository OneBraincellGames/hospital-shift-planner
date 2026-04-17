import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SwapsClient } from "./SwapsClient";

export default async function SwapsPage() {
  const session = await auth();
  if (session?.user.role !== "MANAGER") redirect("/my-shifts");

  const swaps = await prisma.swapRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      shiftSlot: { include: { station: true, schedule: true } },
      requester: { include: { user: true } },
      target: { include: { user: true } },
    },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Swap Requests</h1>
      <SwapsClient swaps={swaps} />
    </div>
  );
}
