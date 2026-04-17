/*
  Warnings:

  - You are about to drop the column `dayKind` on the `HeadcountRule` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stationId,dayOfWeek,shiftType]` on the table `HeadcountRule` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dayOfWeek` to the `HeadcountRule` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- DropIndex
DROP INDEX "HeadcountRule_stationId_dayKind_shiftType_key";

-- AlterTable
ALTER TABLE "HeadcountRule" DROP COLUMN "dayKind",
ADD COLUMN     "dayOfWeek" "DayOfWeek" NOT NULL;

-- DropEnum
DROP TYPE "DayKind";

-- CreateIndex
CREATE UNIQUE INDEX "HeadcountRule_stationId_dayOfWeek_shiftType_key" ON "HeadcountRule"("stationId", "dayOfWeek", "shiftType");
