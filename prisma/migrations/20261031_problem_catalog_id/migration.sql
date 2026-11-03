-- AlterTable
ALTER TABLE "Problem" ADD COLUMN IF NOT EXISTS "catalogProblemId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Problem_userId_catalogProblemId_idx" ON "Problem"("userId", "catalogProblemId");
