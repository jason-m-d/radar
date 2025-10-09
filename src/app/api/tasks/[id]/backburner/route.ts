import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/db";

type RouteParams = {
  params: {
    id: string;
  };
};

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Task id is required" }, { status: 400 });
    }

    await prisma.task.update({
      where: { id },
      data: { backBurneredAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/tasks/backburner]:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
