import { NextResponse } from "next/server";
import { z } from "zod";
import { getProcessingConfig, setProcessingConfig } from "@/server/settings";

const configSchema = z.object({
  confidence: z.number().min(0).max(1),
  vipOnly: z.boolean(),
});

export async function GET() {
  const config = await getProcessingConfig();
  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = configSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ message: "Provide valid confidence (0-1) and vipOnly flag" }, { status: 400 });
  }

  await setProcessingConfig(parsed.data);
  const config = await getProcessingConfig();

  return NextResponse.json({ ok: true, config });
}
