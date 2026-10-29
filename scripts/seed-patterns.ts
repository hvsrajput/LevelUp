// =============================================================================
// Seeding Script: Seed Curated DSA Patterns into Knowledge Base
// =============================================================================

import { PrismaClient } from "@prisma/client";
import { CURATED_DSA_PATTERNS } from "../src/lib/rag/patterns-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Curated DSA Patterns Knowledge Base...");

  for (const pattern of CURATED_DSA_PATTERNS) {
    const existing = await prisma.dsaPattern.findFirst({
      where: { topic: pattern.topic },
    });

    if (existing) {
      await prisma.dsaPattern.update({
        where: { id: existing.id },
        data: {
          signals: pattern.signals,
          description: pattern.description,
          approaches: pattern.approaches,
          hints: pattern.hints,
        },
      });
      console.log(`  ✓ Updated pattern: "${pattern.topic}"`);
    } else {
      await prisma.dsaPattern.create({
        data: {
          topic: pattern.topic,
          signals: pattern.signals,
          description: pattern.description,
          approaches: pattern.approaches,
          hints: pattern.hints,
        },
      });
      console.log(`  ✓ Created pattern: "${pattern.topic}"`);
    }
  }

  const count = await prisma.dsaPattern.count();
  console.log(`\n✅ Successfully seeded ${count} DSA knowledge base patterns!`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding patterns:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
