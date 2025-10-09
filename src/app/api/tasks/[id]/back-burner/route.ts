import { NextResponse } from "next/server";

import prisma from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      console.error("[back-burner] missing id");
      return NextResponse.json({ error: "Task id is required" }, { status: 400 });
    }

    console.log("[back-burner] called with id:", id);

    const task = await prisma.task.update({
      where: { id },
      data: {
        backBurneredAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        backBurneredAt: true,
        dueAt: true,
        projectId: true,
      },
    });

    console.log("[back-burner] success:", task.id);
    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("[back-burner] error:", error);
    return NextResponse.json({ error: "Failed to move task to Back Burner" }, { status: 500 });
  }
}
