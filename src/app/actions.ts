"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserEmail, getUserName } from "@/lib/session";
import {
  parseCsv,
  detectKind,
  mapStudents,
  mapSchedule,
  mapLessons,
  type DetectedKind,
} from "@/lib/teachworks";

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function str(form: FormData, key: string): string | null {
  const v = form.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}
function bool(form: FormData, key: string): boolean {
  return form.get(key) === "on" || form.get(key) === "true";
}
function date(form: FormData, key: string): Date | null {
  const v = str(form, key);
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

const refresh = () => revalidatePath("/");

// --- Ideas / Projects ------------------------------------------------------
export async function createIdea(form: FormData) {
  const userEmail = await requireUserEmail();
  const title = str(form, "title");
  if (!title) return;
  await prisma.idea.create({
    data: {
      userEmail,
      title,
      details: str(form, "details"),
      kind: (str(form, "kind") as any) ?? "IDEA",
    },
  });
  refresh();
}

export async function updateIdeaStatus(id: string, status: string) {
  const userEmail = await requireUserEmail();
  await prisma.idea.updateMany({
    where: { id, userEmail },
    data: { status: status as any },
  });
  refresh();
}

export async function toggleIdeaPriority(id: string) {
  const userEmail = await requireUserEmail();
  const idea = await prisma.idea.findFirst({ where: { id, userEmail } });
  if (!idea) return;
  await prisma.idea.update({
    where: { id },
    data: { priority: idea.priority === 1 ? 0 : 1 },
  });
  refresh();
}

export async function deleteIdea(id: string) {
  const userEmail = await requireUserEmail();
  await prisma.idea.deleteMany({ where: { id, userEmail } });
  refresh();
}

// --- Reminders -------------------------------------------------------------
export async function createReminder(form: FormData) {
  const userEmail = await requireUserEmail();
  const title = str(form, "title");
  if (!title) return;
  await prisma.reminder.create({
    data: {
      userEmail,
      title,
      notes: str(form, "notes"),
      category: str(form, "category"),
      dueDate: date(form, "dueDate"),
      recurrence: (str(form, "recurrence") as any) ?? "NONE",
    },
  });
  refresh();
}

export async function toggleReminderDone(id: string) {
  const userEmail = await requireUserEmail();
  const r = await prisma.reminder.findFirst({ where: { id, userEmail } });
  if (!r) return;

  // For recurring reminders, completing rolls the due date forward instead of
  // marking it permanently done.
  if (!r.done && r.recurrence !== "NONE" && r.dueDate) {
    const next = new Date(r.dueDate);
    if (r.recurrence === "DAILY") next.setDate(next.getDate() + 1);
    if (r.recurrence === "WEEKLY") next.setDate(next.getDate() + 7);
    if (r.recurrence === "MONTHLY") next.setMonth(next.getMonth() + 1);
    if (r.recurrence === "QUARTERLY") next.setMonth(next.getMonth() + 3);
    await prisma.reminder.update({
      where: { id },
      data: { dueDate: next, done: false },
    });
  } else {
    await prisma.reminder.update({ where: { id }, data: { done: !r.done } });
  }
  refresh();
}

export async function deleteReminder(id: string) {
  const userEmail = await requireUserEmail();
  await prisma.reminder.deleteMany({ where: { id, userEmail } });
  refresh();
}

// --- Students --------------------------------------------------------------
export async function createStudent(form: FormData) {
  const userEmail = await requireUserEmail();
  const name = str(form, "name");
  if (!name) return;
  await prisma.student.create({
    data: {
      userEmail,
      name,
      instructor: str(form, "instructor"),
      status: (str(form, "status") as any) ?? "NEW",
      collegeLaunch: bool(form, "collegeLaunch"),
      notesDocUrl: str(form, "notesDocUrl"),
    },
  });
  refresh();
}

export async function toggleStudentFlag(
  id: string,
  field:
    | "instructorNotified"
    | "notesComplete"
    | "collegeLaunch"
    | "collegeLaunchUpdate",
) {
  const userEmail = await requireUserEmail();
  const s = await prisma.student.findFirst({ where: { id, userEmail } });
  if (!s) return;
  await prisma.student.update({
    where: { id },
    data: { [field]: !s[field] },
  });
  refresh();
}

export async function updateStudentStatus(id: string, status: string) {
  const userEmail = await requireUserEmail();
  await prisma.student.updateMany({
    where: { id, userEmail },
    data: { status: status as any },
  });
  refresh();
}

export async function setStudentDocUrl(id: string, url: string) {
  const userEmail = await requireUserEmail();
  await prisma.student.updateMany({
    where: { id, userEmail },
    data: { notesDocUrl: url.trim() || null },
  });
  refresh();
}

export async function deleteStudent(id: string) {
  const userEmail = await requireUserEmail();
  await prisma.student.deleteMany({ where: { id, userEmail } });
  refresh();
}

// --- Lessons (my sessions to log) -----------------------------------------
export async function toggleLessonFlag(
  id: string,
  field: "attendedLogged" | "notesLogged",
) {
  const userEmail = await requireUserEmail();
  const l = await prisma.lesson.findFirst({ where: { id, userEmail } });
  if (!l) return;
  await prisma.lesson.update({
    where: { id },
    data: { [field]: !l[field] },
  });
  refresh();
}

// --- Schedule --------------------------------------------------------------
export async function updateScheduleStatus(id: string, status: string) {
  const userEmail = await requireUserEmail();
  await prisma.scheduleItem.updateMany({
    where: { id, userEmail },
    data: { status: status as any },
  });
  refresh();
}

export async function deleteScheduleItem(id: string) {
  const userEmail = await requireUserEmail();
  await prisma.scheduleItem.deleteMany({ where: { id, userEmail } });
  refresh();
}

// --- KPIs ------------------------------------------------------------------
export async function createKpi(form: FormData) {
  const userEmail = await requireUserEmail();
  const name = str(form, "name");
  if (!name) return;
  await prisma.kpi.create({
    data: {
      userEmail,
      name,
      value: Number(str(form, "value") ?? 0) || 0,
      target: str(form, "target") ? Number(str(form, "target")) : null,
      unit: str(form, "unit"),
      period: str(form, "period"),
      higherIsBetter: str(form, "higherIsBetter") !== "false",
    },
  });
  refresh();
}

export async function updateKpiValue(id: string, value: number) {
  const userEmail = await requireUserEmail();
  await prisma.kpi.updateMany({
    where: { id, userEmail },
    data: { value },
  });
  refresh();
}

export async function deleteKpi(id: string) {
  const userEmail = await requireUserEmail();
  await prisma.kpi.deleteMany({ where: { id, userEmail } });
  refresh();
}

// --- Emails ----------------------------------------------------------------
export async function dismissEmail(gmailId: string) {
  const userEmail = await requireUserEmail();
  await prisma.dismissedEmail.upsert({
    where: { userEmail_gmailId: { userEmail, gmailId } },
    update: {},
    create: { userEmail, gmailId },
  });
  refresh();
}

// --- Scheduling to-do (check off / ignore / snooze) ------------------------
export async function setScheduleTodoState(
  key: string,
  status: "open" | "done" | "ignored" | "snoozed",
  snoozeUntil?: string | null,
) {
  const userEmail = await requireUserEmail();
  const until =
    status === "snoozed" && snoozeUntil ? new Date(snoozeUntil) : null;
  try {
    await prisma.scheduleTodoState.upsert({
      where: { userEmail_key: { userEmail, key } },
      update: { status, snoozeUntil: until },
      create: { userEmail, key, status, snoozeUntil: until },
    });
  } catch (err) {
    // Table may not exist yet (migration pending) — fail soft.
    console.error("setScheduleTodoState failed", err);
  }
  refresh();
}

// --- TeachWorks CSV import -------------------------------------------------
export interface ImportResult {
  ok: boolean;
  kind: DetectedKind;
  created: number;
  updated: number;
  skipped: number;
  message: string;
}

export async function importTeachworksCsv(
  form: FormData,
): Promise<ImportResult> {
  const userEmail = await requireUserEmail();
  const file = form.get("file");
  const override = str(form, "kind"); // optional manual override

  if (!(file instanceof File)) {
    return {
      ok: false,
      kind: "unknown",
      created: 0,
      updated: 0,
      skipped: 0,
      message: "No file received.",
    };
  }

  const text = await file.text();
  const { headers, rows } = parseCsv(text);
  if (rows.length === 0) {
    return {
      ok: false,
      kind: "unknown",
      created: 0,
      updated: 0,
      skipped: 0,
      message: "That file had no data rows.",
    };
  }

  const kind: DetectedKind =
    override === "students" || override === "schedule" || override === "lessons"
      ? (override as DetectedKind)
      : detectKind(headers);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  if (kind === "students") {
    for (const s of mapStudents(rows)) {
      const where = s.externalId
        ? { userEmail_externalId: { userEmail, externalId: s.externalId } }
        : null;
      try {
        if (where) {
          const existing = await prisma.student.findUnique({ where });
          if (existing) {
            await prisma.student.update({
              where,
              data: {
                name: s.name,
                instructor: s.instructor ?? existing.instructor,
                status: s.status,
                startDate: s.startDate ? new Date(s.startDate) : existing.startDate,
              },
            });
            updated++;
          } else {
            await prisma.student.create({
              data: {
                userEmail,
                externalId: s.externalId,
                name: s.name,
                instructor: s.instructor,
                status: s.status,
                startDate: s.startDate ? new Date(s.startDate) : null,
                source: "teachworks",
              },
            });
            created++;
          }
        } else {
          // No external id: de-dupe by name to avoid piling up duplicates.
          const existing = await prisma.student.findFirst({
            where: { userEmail, name: s.name },
          });
          if (existing) {
            skipped++;
          } else {
            await prisma.student.create({
              data: {
                userEmail,
                name: s.name,
                instructor: s.instructor,
                status: s.status,
                startDate: s.startDate ? new Date(s.startDate) : null,
                source: "teachworks",
              },
            });
            created++;
          }
        }
      } catch {
        skipped++;
      }
    }
  } else if (kind === "schedule") {
    for (const it of mapSchedule(rows)) {
      try {
        if (it.externalId) {
          const where = {
            userEmail_externalId: { userEmail, externalId: it.externalId },
          };
          const existing = await prisma.scheduleItem.findUnique({ where });
          if (existing) {
            await prisma.scheduleItem.update({
              where,
              data: {
                studentName: it.studentName,
                instructor: it.instructor,
                subject: it.subject,
                startsAt: it.startsAt ? new Date(it.startsAt) : null,
                endsAt: it.endsAt ? new Date(it.endsAt) : null,
                location: it.location,
                status: it.status,
              },
            });
            updated++;
            continue;
          }
        }
        await prisma.scheduleItem.create({
          data: {
            userEmail,
            externalId: it.externalId,
            studentName: it.studentName,
            instructor: it.instructor,
            subject: it.subject,
            startsAt: it.startsAt ? new Date(it.startsAt) : null,
            endsAt: it.endsAt ? new Date(it.endsAt) : null,
            location: it.location,
            status: it.status,
            source: "teachworks",
          },
        });
        created++;
      } catch {
        skipped++;
      }
    }
  } else if (kind === "lessons") {
    // Only import lessons Shaina personally taught (educator = her), so subs
    // for her don't pollute the list — and her own sub coverage is included.
    const myName = stripAccents((await getUserName()) ?? "");
    const parts = myName.split(" ").filter(Boolean);
    const myFirst = parts[0] ?? "";
    const myLast = parts.slice(1).join(" ");
    for (const l of mapLessons(rows)) {
      const fullEd = stripAccents(l.educator ?? "");
      const edFirst = stripAccents(l.educatorFirst ?? "");
      const edLast = stripAccents(l.educatorLast ?? "");
      // Match Shaina by full name, or first+last (falls back to first-name-only
      // if her account has no last name).
      const mine =
        !!myFirst &&
        (fullEd === myName ||
          (edFirst === myFirst && (!myLast || edLast === myLast)));
      if (!mine || !l.date) {
        skipped++;
        continue;
      }
      const data = {
        date: new Date(l.date),
        startTime: l.startTime,
        endTime: l.endTime,
        title: l.title,
        educator: l.educator,
        studentName: l.studentName,
        service: l.service,
        location: l.location,
        status: l.status,
      };
      try {
        const where = {
          userEmail_externalKey: { userEmail, externalKey: l.externalKey },
        };
        const existing = await prisma.lesson.findUnique({ where });
        if (existing) {
          await prisma.lesson.update({ where, data });
          updated++;
        } else {
          await prisma.lesson.create({
            data: { userEmail, externalKey: l.externalKey, ...data },
          });
          created++;
        }
      } catch {
        skipped++;
      }
    }
  } else {
    return {
      ok: false,
      kind,
      created: 0,
      updated: 0,
      skipped: 0,
      message:
        "Couldn't tell what kind of export this is. Pick the type manually and re-upload.",
    };
  }

  await prisma.importLog.create({
    data: {
      userEmail,
      kind: `teachworks-${kind}`,
      fileName: file.name,
      created,
      updated,
      skipped,
    },
  });

  return {
    ok: true,
    kind,
    created,
    updated,
    skipped,
    message: `Imported ${kind}: ${created} new, ${updated} updated${
      skipped ? `, ${skipped} skipped` : ""
    }.`,
  };
}
