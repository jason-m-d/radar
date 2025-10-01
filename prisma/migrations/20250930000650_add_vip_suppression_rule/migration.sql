-- CreateTable
CREATE TABLE "VipSuppressionRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "unlessContains" TEXT,
    "notes" TEXT,
    "confidence" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "VipSuppressionRule_type_pattern_idx" ON "VipSuppressionRule"("type", "pattern");
