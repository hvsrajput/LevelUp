-- DropIndex
DROP INDEX IF EXISTS "Problem_leetcodeQuestionId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Problem_userId_leetcodeQuestionId_key" ON "Problem"("userId", "leetcodeQuestionId");
