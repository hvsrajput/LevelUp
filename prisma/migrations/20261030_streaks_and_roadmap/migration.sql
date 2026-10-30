-- AlterTable User: add timezone
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata';

-- AlterTable Problem: add solvedDay and index
ALTER TABLE "Problem" ADD COLUMN IF NOT EXISTS "solvedDay" TEXT;
CREATE INDEX IF NOT EXISTS "Problem_userId_solvedDay_idx" ON "Problem"("userId", "solvedDay");

-- AlterTable RoadmapItem: add dayNumber and scheduledDate and index
ALTER TABLE "RoadmapItem" ADD COLUMN IF NOT EXISTS "dayNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "RoadmapItem" ADD COLUMN IF NOT EXISTS "scheduledDate" TEXT;
CREATE INDEX IF NOT EXISTS "RoadmapItem_roadmapId_scheduledDate_idx" ON "RoadmapItem"("roadmapId", "scheduledDate");
