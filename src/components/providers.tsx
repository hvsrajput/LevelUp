// =============================================================================
// Session provider wrapper (client component)
// =============================================================================
// Next.js App Router requires a clear server/client boundary.
// This is the ONE place where we wrap the app with client-side providers.
// =============================================================================

"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
