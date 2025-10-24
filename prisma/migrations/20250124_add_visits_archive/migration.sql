-- AlterTable
ALTER TABLE "visits" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "visits_isArchived_idx" ON "visits"("isArchived");
