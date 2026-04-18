import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { DEFAULT_PLANNER_CONFIG } from "@/lib/scheduler";
import { PlannerConfigForm } from "./PlannerConfigForm";

export default async function PlannerConfigPage() {
  const session = await auth();
  if (session?.user.role !== "MANAGER") redirect("/dashboard");

  const [t, config] = await Promise.all([
    getT(),
    prisma.plannerConfig.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, ...DEFAULT_PLANNER_CONFIG },
    }),
  ]);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">{t.plannerConfig.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{t.plannerConfig.subtitle}</p>
      </div>
      <PlannerConfigForm initialConfig={config} />
    </div>
  );
}
