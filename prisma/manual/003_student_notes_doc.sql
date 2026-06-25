-- Lets you manually connect a student to their tutoring-notes doc when the
-- auto-match misses. Safe to re-run.
CREATE TABLE IF NOT EXISTS "StudentNotesDoc" (
    "id" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "docName" TEXT,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudentNotesDoc_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "StudentNotesDoc_userEmail_studentName_key"
    ON "StudentNotesDoc"("userEmail", "studentName");
