// =============================================================================
// Seed Script: Seed Problem Catalog into Neon PostgreSQL
// =============================================================================

import { PrismaClient } from "@prisma/client";
import { CURATED_CATALOG_PROBLEMS } from "../src/lib/catalog/catalog-data";

const prisma = new PrismaClient();

async function main() {
  console.log(`Starting seeding of ${CURATED_CATALOG_PROBLEMS.length} catalog problems...`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const problem of CURATED_CATALOG_PROBLEMS) {
    const existing = await prisma.catalogProblem.findFirst({
      where: { title: problem.title },
    });

    if (existing) {
      await prisma.catalogProblem.update({
        where: { id: existing.id },
        data: {
          difficulty: problem.difficulty,
          topicTags: problem.topicTags,
          patternTag: problem.patternTag,
          summary: problem.summary,
        },
      });
      updatedCount++;
    } else {
      await prisma.catalogProblem.create({
        data: {
          title: problem.title,
          difficulty: problem.difficulty,
          topicTags: problem.topicTags,
          patternTag: problem.patternTag,
          summary: problem.summary,
        },
      });
      createdCount++;
    }
  }

  console.log(
    `✅ Seeding complete! Created: ${createdCount}, Updated: ${updatedCount}, Total: ${CURATED_CATALOG_PROBLEMS.length}`
  );
}

main()
  .catch((e) => {
    console.error("❌ Error seeding problem catalog:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
