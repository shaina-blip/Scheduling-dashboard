import { prisma } from "./prisma";
import type { DashboardSnapshot } from "./ai/types";
import { differenceInCalendarDays } from "date-fns";

export async function loadIdeas(userEmail: string) {
  return prisma.idea.findMany({
    where: { userEmail },
    orderBy: [{ status: "asc" }, { priority: "desc" }, { updatedAt: "desc" }],
  });
}

export async function loadReminders(userEmail: string) {
  return prisma.reminder.findMany({
    where: { userEmail },
    orderBy: [{ done: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });
}

export async function loadStudents(userEmail: string) {
  return prisma.student.findMany({
    where: { userEmail },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function loadPendingSchedule(userEmail: string) {
  return prisma.scheduleItem.findMany({
    where: { userEmail, status: "PENDING" },
    orderBy: [{ startsAt: "asc" }],
    take: 50,
  });
}

export async function loadKpis(userEmail: string) {
  return prisma.kpi.findMany({
    where: { userEmail },
    orderBy: [{ createdAt: "asc" }],
  });
}

export async function loadDismissedEmailIds(userEmail: string) {
  const rows = await prisma.dismissedEmail.findMany({
    where: { userEmail },
    select: { gmailId: true },
  });
  return new Set(rows.map((r) => r.gmailId));
}

/**
 * Build the snapshot the suggestion engine reasons over. `emails` is passed in
 * because it comes from Gmail (a live API call) rather than the database.
 */
export async function buildSnapshot(
  userEmail: string,
  emails: { from: string; fromName: string; date: string }[],
  now = new Date(),
): Promise<DashboardSnapshot> {
  const [students, schedule, reminders, kpis, ideas, sessions] =
    await Promise.all([
      prisma.student.findMany({ where: { userEmail } }),
      prisma.scheduleItem.findMany({ where: { userEmail } }),
      prisma.reminder.findMany({ where: { userEmail, done: false } }),
      prisma.kpi.findMany({ where: { userEmail } }),
      prisma.idea.findMany({ where: { userEmail } }),
      prisma.scheduleItem.findMany({
        where: {
          userEmail,
          startsAt: {
            gte: new Date(now.getTime() - 30 * 86400000),
            lte: now,
          },
        },
      }),
    ]);

  // Emails
  const emailDates = emails
    .map((e) => new Date(e.date))
    .filter((d) => !isNaN(d.getTime()));
  const oldestDays =
    emailDates.length > 0
      ? Math.max(
          ...emailDates.map((d) => differenceInCalendarDays(now, d)),
        )
      : null;
  const senderCounts = new Map<string, number>();
  for (const e of emails) {
    const key = e.fromName || e.from;
    senderCounts.set(key, (senderCounts.get(key) ?? 0) + 1);
  }
  const topSenders = [...senderCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  // Students
  const newStudents = students.filter((s) => s.status === "NEW");
  const needsInstructorEmail = newStudents.filter(
    (s) => !s.instructorNotified,
  ).length;
  const needsNotes = students.filter(
    (s) => s.status !== "INACTIVE" && !s.notesComplete,
  ).length;
  const loadMap = new Map<string, number>();
  for (const s of students) {
    if (s.status === "INACTIVE" || !s.instructor) continue;
    loadMap.set(s.instructor, (loadMap.get(s.instructor) ?? 0) + 1);
  }
  const instructorLoad = [...loadMap.entries()].map(([instructor, count]) => ({
    instructor,
    count,
  }));

  // College Launch
  const clOwed = students.filter((s) => s.collegeLaunch && s.collegeLaunchUpdate);

  // Schedule patterns
  const pendingItems = schedule.filter((s) => s.status === "PENDING");
  const nextStart =
    pendingItems
      .map((s) => s.startsAt)
      .filter((d): d is Date => !!d && d >= now)
      .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
  const cancellationsLast30 = sessions.filter(
    (s) => s.status === "CANCELLED",
  ).length;

  // Reminders
  const overdue: { title: string; days: number }[] = [];
  const dueSoon: { title: string; days: number }[] = [];
  for (const r of reminders) {
    if (!r.dueDate) continue;
    const days = differenceInCalendarDays(r.dueDate, now);
    if (days < 0) overdue.push({ title: r.title, days: Math.abs(days) });
    else if (days <= 3) dueSoon.push({ title: r.title, days });
  }
  const inventoryReminders = reminders.filter((r) =>
    (r.category ?? "").toLowerCase().includes("inventory"),
  );
  const inventoryDue = inventoryReminders.some(
    (r) => !r.dueDate || differenceInCalendarDays(r.dueDate, now) <= 0,
  );

  // KPIs
  const offTarget = kpis
    .filter((k) => {
      if (k.target == null) return false;
      return k.higherIsBetter ? k.value < k.target : k.value > k.target;
    })
    .map((k) => ({
      name: k.name,
      value: k.value,
      target: k.target!,
      unit: k.unit,
    }));

  // Projects
  const staleActive = ideas
    .filter((i) => i.kind === "PROJECT" && i.status === "ACTIVE")
    .map((i) => ({
      title: i.title,
      days: differenceInCalendarDays(now, i.updatedAt),
    }))
    .filter((p) => p.days >= 14);
  const parkedCount = ideas.filter((i) => i.status === "PARKED").length;

  return {
    now: now.toISOString(),
    emails: { total: emails.length, oldestDays, topSenders },
    schedule: {
      pending: pendingItems.length,
      nextStart: nextStart ? nextStart.toISOString() : null,
      cancellationsLast30,
      sessionsLast30: sessions.length,
    },
    students: {
      newCount: newStudents.length,
      needsInstructorEmail,
      needsNotes,
      instructorLoad,
    },
    collegeLaunch: {
      updatesOwed: clOwed.length,
      names: clOwed.map((s) => s.name),
    },
    reminders: { overdue, dueSoon, inventoryDue },
    kpis: { offTarget },
    projects: { staleActive, parkedCount },
  };
}
