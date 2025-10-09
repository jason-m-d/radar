import prisma from "../src/lib/db";

async function resetDock() {
  console.log("Resetting dock data...");

  // Clear all snoozed/ignored/seen states
  await prisma.message.updateMany({
    where: {
      OR: [
        { snoozedUntil: { not: null } },
        { ignoredAt: { not: null } },
        { seenAt: { not: null } },
        { isInteracted: true },
      ],
    },
    data: {
      snoozedUntil: null,
      ignoredAt: null,
      seenAt: null,
      isInteracted: false,
    },
  });

  await prisma.task.updateMany({
    where: {
      OR: [
        { ignoredAt: { not: null } },
        { backBurneredAt: { not: null } },
      ],
    },
    data: {
      ignoredAt: null,
      backBurneredAt: null,
    },
  });

  console.log("✅ All dock items reset to fresh state");
}

resetDock()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
