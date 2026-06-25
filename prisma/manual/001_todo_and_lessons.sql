-- Run this once in Neon's SQL Editor to add the To-Do (scheduling) and
-- Lessons (sessions tracker) tables. Safe to run on the existing database.

CREATE TABLE IF NOT EXISTS "Lesson" (
    "id" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "externalKey" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "title" TEXT,
    "educator" TEXT,
    "studentName" TEXT NOT NULL,
    "service" TEXT,
    "location" TEXT,
    "attendedLogged" BOOLEAN NOT NULL DEFAULT false,
    "notesLogged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ScheduleTodoState" (
    "id" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "snoozeUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduleTodoState_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Lesson_userEmail_date_idx" ON "Lesson"("userEmail", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "Lesson_userEmail_externalKey_key" ON "Lesson"("userEmail", "externalKey");
CREATE INDEX IF NOT EXISTS "ScheduleTodoState_userEmail_idx" ON "ScheduleTodoState"("userEmail");
CREATE UNIQUE INDEX IF NOT EXISTS "ScheduleTodoState_userEmail_key_key" ON "ScheduleTodoState"("userEmail", "key");
