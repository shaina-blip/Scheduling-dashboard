-- Per-user dashboard layout (widget order + hidden). Safe to re-run.
CREATE TABLE IF NOT EXISTS "UserPrefs" (
    "id" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "widgetOrder" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "hiddenWidgets" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserPrefs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserPrefs_userEmail_key" ON "UserPrefs"("userEmail");
