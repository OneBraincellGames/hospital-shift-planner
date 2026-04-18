-- CreateTable
CREATE TABLE "PlannerConfig" (
    "id"                 INTEGER NOT NULL DEFAULT 1,
    "minRestHours"       INTEGER NOT NULL DEFAULT 11,
    "maxConsecutiveDays" INTEGER NOT NULL DEFAULT 6,
    "earlyShiftStart"    INTEGER NOT NULL DEFAULT 6,
    "earlyShiftEnd"      INTEGER NOT NULL DEFAULT 14,
    "lateShiftStart"     INTEGER NOT NULL DEFAULT 14,
    "lateShiftEnd"       INTEGER NOT NULL DEFAULT 22,
    "nightShiftStart"    INTEGER NOT NULL DEFAULT 22,
    "nightShiftEnd"      INTEGER NOT NULL DEFAULT 6,
    "dayShiftStart"      INTEGER NOT NULL DEFAULT 8,
    "dayShiftEnd"        INTEGER NOT NULL DEFAULT 20,

    CONSTRAINT "PlannerConfig_pkey" PRIMARY KEY ("id")
);

-- Seed the single config row with defaults
INSERT INTO "PlannerConfig" ("id") VALUES (1);
