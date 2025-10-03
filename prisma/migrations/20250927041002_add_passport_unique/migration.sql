/*
  Warnings:

  - A unique constraint covering the columns `[passportNumber]` on the table `cvs` will be added. If there are existing duplicate values, this will fail.
  - Made the column `passportNumber` on table `cvs` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."cvs" ALTER COLUMN "passportNumber" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "cvs_passportNumber_key" ON "public"."cvs"("passportNumber");
