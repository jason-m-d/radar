import { NextResponse } from "next/server";

import prisma from "@/lib/db";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(
  _request: Request,
  context: RouteParams,
) {
  try {
    const { id } = await context.params;
    if (!id) {
      console.error("[read] missing id");
      return NextResponse.json({ error: "Message id is required" }, { status: 400 });
    }

    console.log("[read] called with id:", id);

    const message = await prisma.message.update({
      where: { id },
      data: {
        isRead: true,
      },
      select: { id: true },
    });

    console.log("[read] success:", message.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[read] error:", error);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}
