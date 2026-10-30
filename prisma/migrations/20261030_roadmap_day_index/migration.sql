-- AlterTable Roadmap: add limitedTopicsNote
ALTER TABLE "Roadmap" ADD COLUMN IF NOT EXISTS "limitedTopicsNote" TEXT;

-- AlterTable RoadmapItem: add dayIndex and index
ALTER TABLE "RoadmapItem" ADD COLUMN IF NOT EXISTS "dayIndex" INTEGER;
CREATE INDEX IF NOT EXISTS "RoadmapItem_roadmapId_weekNumber_dayIndex_idx" ON "RoadmapItem"("roadmapId", "weekNumber", "dayIndex");
