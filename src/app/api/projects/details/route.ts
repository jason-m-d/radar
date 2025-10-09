import { NextResponse } from "next/server";

import prisma from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { ids?: unknown };
    const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === "string") : [];

    if (!ids.length) {
      return NextResponse.json({ projects: [] });
    }

    const projects = await prisma.project.findMany({
      where: { id: { in: ids } },
      include: {
        tasks: { select: { id: true } }
      }
    });

    const now = new Date();

    const payload = projects.map((project) => ({
      id: project.id,
      name: project.name,
      taskCount: project.tasks.length,
      lastActivity: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric"
      }).format(project.updatedAt ?? now),
    }));

    return NextResponse.json({ projects: payload });
  } catch (error) {
    console.error("[api/projects/details]", error);
    return NextResponse.json({ error: "Failed to load project details" }, { status: 500 });
  }
}
