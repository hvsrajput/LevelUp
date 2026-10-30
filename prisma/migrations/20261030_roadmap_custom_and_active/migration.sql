-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "RoadmapSource" AS ENUM ('GENERATED', 'CUSTOM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable Roadmap
ALTER TABLE "Roadmap" ADD COLUMN IF NOT EXISTS "source" "RoadmapSource" NOT NULL DEFAULT 'GENERATED';
ALTER TABLE "Roadmap" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Roadmap" ADD COLUMN IF NOT EXISTS "customDraft" JSONB;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Roadmap_userId_isActive_idx" ON "Roadmap"("userId", "isActive");
