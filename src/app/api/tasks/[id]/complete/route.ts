import { NextResponse } from "next/server";
import { TaskStatus } from "@prisma/client";

import prisma from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      console.error("[complete] missing id");
      return NextResponse.json({ error: "Task id is required" }, { status: 400 });
    }

    console.log("[complete] called with id:", id);

    const task = await prisma.task.update({
      where: { id },
      data: { status: TaskStatus.DONE },
      select: {
        id: true,
        status: true,
        backBurneredAt: true,
        dueAt: true,
        projectId: true,
      },
    });

    console.log("[complete] success:", task.id);
    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("[complete] error:", error);
    return NextResponse.json({ error: "Failed to complete task" }, { status: 500 });
  }
}
