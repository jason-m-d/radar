import fs from "fs";
import path from "path";
import prisma from "@/lib/db";

async function restore() {
  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    console.error("[restore] No backups directory found!");
    return;
  }

  const files = fs.readdirSync(backupDir).filter((fileName) => fileName.startsWith("backup-"));
  if (files.length === 0) {
    console.error("[restore] No backup files found!");
    return;
  }

  files.sort().reverse();
  const latestBackup = path.join(backupDir, files[0]);

  console.log(`[restore] Restoring from: ${latestBackup}`);

  const backupContents = JSON.parse(fs.readFileSync(latestBackup, "utf-8"));

  console.log("[restore] Counts:", backupContents.counts);
  console.log("[restore] Note: This requires manual review and adjustment of data structure!");
  console.log("[restore] Backup data is available but restore needs custom handling.");
  console.log("[restore] Use Prisma Studio or manual SQL to restore if needed.");
}

restore()
  .catch((error) => {
    console.error("[restore] Restore helper failed", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
