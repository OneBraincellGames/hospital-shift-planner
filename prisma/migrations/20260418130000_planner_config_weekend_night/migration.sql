-- AlterTable
ALTER TABLE "PlannerConfig"
  ADD COLUMN "weekendNightShiftStart" INTEGER NOT NULL DEFAULT 22,
  ADD COLUMN "weekendNightShiftEnd"   INTEGER NOT NULL DEFAULT 6;
