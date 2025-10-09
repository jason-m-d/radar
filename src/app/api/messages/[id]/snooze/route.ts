import { NextResponse } from "next/server";

import prisma from "@/lib/db";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  context: RouteParams,
) {
  try {
    const { id } = await context.params;
    if (!id) {
      console.error("[snooze] missing id");
      return NextResponse.json({ error: "Message id is required" }, { status: 400 });
    }

    console.log("[snooze] called with id:", id);

    const { until } = await request.json();
    if (!until) {
      console.error("[snooze] missing until", { id });
      return NextResponse.json({ error: "'until' timestamp is required" }, { status: 400 });
    }

    const untilDate = new Date(until);
    if (Number.isNaN(untilDate.getTime())) {
      console.error("[snooze] invalid timestamp", { id, until });
      return NextResponse.json({ error: "Invalid 'until' timestamp" }, { status: 400 });
    }

    const updated = await prisma.message.update({
      where: { id },
      data: {
        snoozedUntil: untilDate,
        isRead: true,
      },
      select: {
        id: true,
        snoozedUntil: true,
      },
    });

    console.log("[snooze] success:", updated.id);
    return NextResponse.json({ success: true, snoozedUntil: updated.snoozedUntil?.toISOString() ?? untilDate.toISOString() });
  } catch (error) {
    console.error("[snooze] error:", error);
    return NextResponse.json({ error: "Failed to snooze message" }, { status: 500 });
  }
}
