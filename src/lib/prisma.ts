// =============================================================================
// Prisma client singleton
// =============================================================================
// In development, Next.js hot-reloads modules, which would create a new
// PrismaClient on every reload and eventually exhaust the connection pool.
// We cache the client on `globalThis` to avoid this.
// In production, this is a no-op — the module is loaded once.
// =============================================================================

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
