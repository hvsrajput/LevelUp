// =============================================================================
// User Timezone API: GET & PATCH
// =============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidIanaTimezone, sanitizeTimezone, DEFAULT_TIMEZONE } from "@/lib/date";
import { z } from "zod";

const timezoneSchema = z.object({
  timezone: z.string().refine(isValidIanaTimezone, {
    message: "Invalid IANA timezone identifier",
  }),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true },
  });

  return NextResponse.json({
    timezone: sanitizeTimezone(user?.timezone || DEFAULT_TIMEZONE),
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const parsed = timezoneSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { timezone: parsed.data.timezone },
      select: { timezone: true },
    });

    return NextResponse.json({ timezone: updated.timezone });
  } catch (error) {
    console.error("Failed to update timezone:", error);
    return NextResponse.json(
      { error: "Failed to update timezone" },
      { status: 500 }
    );
  }
}
