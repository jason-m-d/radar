import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import packageInfo from "../../../../package.json";

const START_TIME = Date.now();

type HealthPayload = {
  ok: boolean;
  timestamp: string;
  version: string;
  uptimeSeconds: number;
  environment: string;
  checks: {
    database: { ok: boolean; message?: string };
  };
};

export async function GET() {
  const timestamp = new Date().toISOString();
  const uptimeSeconds = Math.round((Date.now() - START_TIME) / 1000);
  const environment = process.env.NODE_ENV ?? "development";

  const health: HealthPayload = {
    ok: true,
    timestamp,
    version: packageInfo.version ?? "0.0.0",
    uptimeSeconds,
    environment,
    checks: {
      database: { ok: true },
    },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    health.ok = false;
    health.checks.database = {
      ok: false,
      message: error instanceof Error ? error.message : "Database check failed",
    };
    return NextResponse.json(health, { status: 503 });
  }

  return NextResponse.json(health);
}
