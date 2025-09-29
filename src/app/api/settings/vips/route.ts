import { NextResponse } from "next/server";
import { z } from "zod";
import { getVipList, setVipList } from "@/server/settings";

const vipSchema = z.object({
  vips: z
    .array(z.string().min(1))
    .transform((entries) =>
      entries
        .map((entry) => entry.trim().toLowerCase())
        .filter((entry) => entry.length > 0),
    )
    .optional(),
});

export async function GET() {
  const vips = await getVipList();
  return NextResponse.json({ vips });
}

export async function PUT(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = vipSchema.safeParse(payload);
  if (!parsed.success || !parsed.data.vips) {
    return NextResponse.json({ message: "Provide an array of VIP entries." }, { status: 400 });
  }

  const deduped = Array.from(new Set(parsed.data.vips));

  await setVipList(deduped);

  return NextResponse.json({ ok: true, vips: deduped });
}
