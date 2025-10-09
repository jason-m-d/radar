-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "threadId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL DEFAULT 'REGULAR',
    "taskId" TEXT,
    "projectId" TEXT,
    "confidence" REAL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isInteracted" BOOLEAN NOT NULL DEFAULT false,
    "snoozedUntil" DATETIME,
    "metadata" JSONB,
    CONSTRAINT "Message_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Message_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("confidence", "content", "createdAt", "id", "isRead", "metadata", "projectId", "role", "snoozedUntil", "taskId", "threadId", "type") SELECT "confidence", "content", "createdAt", "id", "isRead", "metadata", "projectId", "role", "snoozedUntil", "taskId", "threadId", "type" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE INDEX "Message_threadId_createdAt_idx" ON "Message"("threadId", "createdAt");
CREATE INDEX "Message_type_isRead_idx" ON "Message"("type", "isRead");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
