// =============================================================================
// Timezone Sync: Detects and sets browser timezone on first load
// =============================================================================

"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { isValidIanaTimezone } from "@/lib/date";

export function TimezoneSync() {
  const { data: session, status } = useSession();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user || syncedRef.current) return;

    try {
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!browserTz || !isValidIanaTimezone(browserTz)) return;

      const lastSynced = localStorage.getItem(`levelup_tz_${session.user.id}`);
      if (lastSynced === browserTz) {
        syncedRef.current = true;
        return;
      }

      // Sync timezone to backend
      fetch("/api/user/timezone", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone: browserTz }),
      })
        .then((res) => {
          if (res.ok) {
            localStorage.setItem(`levelup_tz_${session.user.id}`, browserTz);
            syncedRef.current = true;
          }
        })
        .catch(() => {});
    } catch {
      // Ignore browser environment errors
    }
  }, [session, status]);

  return null;
}
