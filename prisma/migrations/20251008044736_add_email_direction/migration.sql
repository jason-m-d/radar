-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gmailId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "subject" TEXT,
    "participants" TEXT NOT NULL,
    "lastMessageAt" DATETIME NOT NULL,
    "isVip" BOOLEAN NOT NULL DEFAULT false,
    "direction" TEXT NOT NULL DEFAULT 'INCOMING',
    "projectId" TEXT,
    CONSTRAINT "EmailThread_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EmailThread" ("gmailId", "id", "isVip", "lastMessageAt", "participants", "projectId", "subject", "threadId") SELECT "gmailId", "id", "isVip", "lastMessageAt", "participants", "projectId", "subject", "threadId" FROM "EmailThread";
DROP TABLE "EmailThread";
ALTER TABLE "new_EmailThread" RENAME TO "EmailThread";
CREATE UNIQUE INDEX "EmailThread_gmailId_key" ON "EmailThread"("gmailId");
CREATE INDEX "EmailThread_threadId_idx" ON "EmailThread"("threadId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
