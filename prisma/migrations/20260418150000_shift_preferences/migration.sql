-- CreateTable
CREATE TABLE "ShiftPreference" (
    "id"             TEXT    NOT NULL,
    "staffProfileId" TEXT    NOT NULL,
    "shiftType"      "ShiftType" NOT NULL,
    "preferred"      BOOLEAN NOT NULL,

    CONSTRAINT "ShiftPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShiftPreference_staffProfileId_shiftType_key"
    ON "ShiftPreference"("staffProfileId", "shiftType");

-- AddForeignKey
ALTER TABLE "ShiftPreference"
    ADD CONSTRAINT "ShiftPreference_staffProfileId_fkey"
    FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfile"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
