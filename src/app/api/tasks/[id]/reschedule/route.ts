import { NextResponse } from "next/server";

import prisma from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      console.error("[reschedule] missing id");
      return NextResponse.json({ error: "Task id is required" }, { status: 400 });
    }

    console.log("[reschedule] called with id:", id);

    const { dueAt } = await request.json();
    if (!dueAt) {
      console.error("[reschedule] missing dueAt", { id });
      return NextResponse.json({ error: "'dueAt' is required" }, { status: 400 });
    }

    const dueDate = new Date(dueAt);
    if (Number.isNaN(dueDate.getTime())) {
      console.error("[reschedule] invalid dueAt", { id, dueAt });
      return NextResponse.json({ error: "Invalid 'dueAt' timestamp" }, { status: 400 });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        dueAt: dueDate,
      },
      select: {
        id: true,
        status: true,
        dueAt: true,
        backBurneredAt: true,
        projectId: true,
      },
    });

    console.log("[reschedule] success:", task.id);
    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("[reschedule] error:", error);
    return NextResponse.json({ error: "Failed to reschedule task" }, { status: 500 });
  }
}
