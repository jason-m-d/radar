import { NextResponse } from "next/server";
import { z } from "zod";
import { RuleAction, RuleType } from "@prisma/client";
import { createRule, deleteRule, listRules, toRuleInput } from "@/server/rules";

const createSchema = z.object({
  type: z.nativeEnum(RuleType),
  pattern: z.string().min(1),
  action: z.nativeEnum(RuleAction),
  unless_contains: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  confidence: z.number().optional().nullable(),
});

export async function GET() {
  const rules = await listRules();
  return NextResponse.json({ rules });
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid rule payload." }, { status: 400 });
  }

  const created = await createRule(toRuleInput(parsed.data));

  return NextResponse.json({ rule: created });
}

const deleteSchema = z.object({ id: z.string().cuid() });

export async function DELETE(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = deleteSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ message: "Provide a valid rule id." }, { status: 400 });
  }

  await deleteRule(parsed.data.id);
  return NextResponse.json({ ok: true });
}
