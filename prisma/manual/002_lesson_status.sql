-- Adds the "status" column to Lesson (Attended / Scheduled / Cancelled / Missed)
-- so the Sessions tracker can auto-flag attendance. Safe to re-run.
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "status" TEXT;
