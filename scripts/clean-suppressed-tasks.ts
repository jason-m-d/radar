import prisma from "@/lib/db";
import { listRules } from "@/server/rules";
import { RuleAction, RuleType } from "@prisma/client";

async function cleanSuppressedTasks() {
  const rules = await listRules();
  const suppressRules = rules.filter((rule) => rule.action === RuleAction.SUPPRESS);

  if (!suppressRules.length) {
    console.log("No suppression rules found. Nothing to clean.");
    await prisma.$disconnect();
    return;
  }

  const tasks = await prisma.task.findMany({ include: { thread: true } });

  let deleted = 0;

  for (const task of tasks) {
    if (!task.thread) {
      continue;
    }

    let participants: string[] = [];
    const rawParticipants = task.thread.participants;

    if (typeof rawParticipants === "string" && rawParticipants.length) {
      try {
        const parsed = JSON.parse(rawParticipants);
        if (Array.isArray(parsed)) {
          participants = parsed.filter((entry): entry is string => typeof entry === "string");
        }
      } catch {
        participants = [rawParticipants];
      }
    }

    if (!participants.length) {
      continue;
    }

    const sender = participants[0];
    const senderEmail = sender.match(/<([^>]+)>/)?.[1]?.toLowerCase() ?? sender.toLowerCase();
    const domain = senderEmail.includes("@") ? senderEmail.split("@")[1] : undefined;
    const lowerTitle = task.title.toLowerCase();

    const shouldDelete = suppressRules.some((rule) => {
      const pattern = rule.pattern.toLowerCase();
      switch (rule.type) {
        case RuleType.EMAIL:
          return senderEmail === pattern;
        case RuleType.DOMAIN:
          return domain === pattern;
        case RuleType.TOPIC:
          return lowerTitle.includes(pattern);
        default:
          return false;
      }
    });

    if (!shouldDelete) {
      continue;
    }

    await prisma.task.delete({ where: { id: task.id } });
    deleted += 1;
    console.log(`✓ Deleted task: ${task.title.slice(0, 60)}...`);
  }

  console.log(`✓ Cleaned up ${deleted} suppressed task${deleted === 1 ? "" : "s"}`);
  await prisma.$disconnect();
}

cleanSuppressedTasks().catch(async (error) => {
  console.error("Failed to clean suppressed tasks", error);
  await prisma.$disconnect();
  process.exit(1);
});
