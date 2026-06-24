import type { DashboardSnapshot, Suggestion } from "./types";

// ---------------------------------------------------------------------------
// Local suggestion engine.
//
// This is a deterministic, rules-based reasoner over the dashboard snapshot. It
// encodes the judgment a COO applies each morning: what is overdue, what is
// blocking other people, what patterns are worth noticing. It needs no API key
// and runs instantly. When you're ready to upgrade, `src/lib/ai/index.ts` can
// route to a Claude-powered engine instead — the input (snapshot) and output
// (Suggestion[]) contract stays identical.
// ---------------------------------------------------------------------------

function plural(n: number, one: string, many = one + "s") {
  return `${n} ${n === 1 ? one : many}`;
}

export function generateLocalSuggestions(s: DashboardSnapshot): Suggestion[] {
  const out: Suggestion[] = [];
  const add = (sg: Omit<Suggestion, "id">) =>
    out.push({ ...sg, id: `${sg.category}-${out.length}` });

  // --- Email follow-ups ----------------------------------------------------
  if (s.emails.total > 0) {
    const aging = s.emails.oldestDays ?? 0;
    const severity = aging >= 3 ? "urgent" : aging >= 1 ? "attention" : "info";
    const senders =
      s.emails.topSenders.length > 0
        ? ` Top of the pile: ${s.emails.topSenders.slice(0, 3).join(", ")}.`
        : "";
    add({
      title: `${plural(s.emails.total, "email")} waiting on a reply`,
      detail:
        (aging > 0
          ? `The oldest has been sitting ${plural(aging, "day")}.`
          : "These came in recently.") + senders,
      severity,
      category: "Email",
      actionLabel: "Open Gmail",
      actionHref: "https://mail.google.com/mail/u/0/#inbox",
      score: 80 + aging * 8 + Math.min(s.emails.total, 10),
    });
  }

  // --- New students blocking instructor hand-off ---------------------------
  if (s.students.needsInstructorEmail > 0) {
    add({
      title: `Email instructors about ${plural(
        s.students.needsInstructorEmail,
        "new student",
      )}`,
      detail:
        "These students are enrolled but their instructors haven't been looped in yet. This is usually the fastest unblock of someone else's work.",
      severity: s.students.needsInstructorEmail >= 3 ? "urgent" : "attention",
      category: "Students",
      actionLabel: "Review students",
      actionHref: "/#students",
      score: 90 + s.students.needsInstructorEmail * 5,
    });
  }

  if (s.students.needsNotes > 0) {
    add({
      title: `Fill out notes for ${plural(s.students.needsNotes, "student")}`,
      detail:
        "Student notes docs are still incomplete. Knock these out while context is fresh from intake.",
      severity: "attention",
      category: "Students",
      actionLabel: "Review students",
      actionHref: "/#students",
      score: 55 + s.students.needsNotes * 3,
    });
  }

  // --- College Launch updates ---------------------------------------------
  if (s.collegeLaunch.updatesOwed > 0) {
    add({
      title: `${plural(
        s.collegeLaunch.updatesOwed,
        "College Launch update",
      )} owed`,
      detail:
        s.collegeLaunch.names.length > 0
          ? `Families waiting to hear from you: ${s.collegeLaunch.names
              .slice(0, 4)
              .join(", ")}.`
          : "Families are expecting a progress update.",
      severity: "attention",
      category: "College Launch",
      actionLabel: "Review students",
      actionHref: "/#students",
      score: 70 + s.collegeLaunch.updatesOwed * 4,
    });
  }

  // --- Pending schedules ---------------------------------------------------
  if (s.schedule.pending > 0) {
    add({
      title: `${plural(s.schedule.pending, "session")} pending confirmation`,
      detail:
        "Unconfirmed sessions are the most common source of last-minute scrambling. Confirm or clear them before they become today's problem.",
      severity: s.schedule.pending >= 5 ? "urgent" : "attention",
      category: "Schedule",
      actionLabel: "Review schedule",
      actionHref: "/#schedule",
      score: 75 + Math.min(s.schedule.pending, 12) * 4,
    });
  }

  // --- Reminders -----------------------------------------------------------
  for (const r of s.reminders.overdue) {
    add({
      title: `Overdue: ${r.title}`,
      detail: `This was due ${plural(r.days, "day")} ago.`,
      severity: r.days >= 3 ? "urgent" : "attention",
      category: "Reminders",
      actionLabel: "Reminders",
      actionHref: "/#reminders",
      score: 85 + r.days * 6,
    });
  }
  for (const r of s.reminders.dueSoon) {
    add({
      title: `Due soon: ${r.title}`,
      detail:
        r.days === 0
          ? "This is due today."
          : `Due in ${plural(r.days, "day")}.`,
      severity: "info",
      category: "Reminders",
      actionLabel: "Reminders",
      actionHref: "/#reminders",
      score: 45 - r.days,
    });
  }
  if (s.reminders.inventoryDue) {
    add({
      title: "Time for an inventory check",
      detail:
        "It's been a while since the last inventory pass. Running it now avoids surprise stock-outs.",
      severity: "info",
      category: "Reminders",
      actionLabel: "Reminders",
      actionHref: "/#reminders",
      score: 40,
    });
  }

  // --- KPIs off target -----------------------------------------------------
  for (const k of s.kpis.offTarget) {
    const gap = k.target ? Math.round((1 - k.value / k.target) * 100) : 0;
    add({
      title: `${k.name} is below target`,
      detail: `Currently ${k.value}${k.unit ?? ""} vs target ${k.target}${
        k.unit ?? ""
      }${gap > 0 ? ` (${gap}% under)` : ""}.`,
      severity: gap >= 25 ? "attention" : "info",
      category: "KPIs",
      actionLabel: "View KPIs",
      actionHref: "/#kpis",
      score: 50 + gap,
    });
  }

  // --- Pattern observations (the "smart" reads) ----------------------------
  if (s.schedule.sessionsLast30 > 0) {
    const cancelRate =
      s.schedule.cancellationsLast30 / s.schedule.sessionsLast30;
    if (cancelRate >= 0.15) {
      add({
        title: `Cancellation rate is running high (${Math.round(
          cancelRate * 100,
        )}%)`,
        detail: `${s.schedule.cancellationsLast30} of ${s.schedule.sessionsLast30} sessions in the last 30 days were cancelled or no-shows. Worth checking whether it's concentrated on a specific day, instructor, or family.`,
        severity: "attention",
        category: "Pattern",
        score: 60 + Math.round(cancelRate * 50),
      });
    }
  }

  const overloaded = s.students.instructorLoad
    .filter((i) => i.count >= 1)
    .sort((a, b) => b.count - a.count);
  if (overloaded.length >= 2) {
    const top = overloaded[0];
    const avg =
      overloaded.reduce((sum, i) => sum + i.count, 0) / overloaded.length;
    if (top.count >= avg * 1.6 && top.count - avg >= 2) {
      add({
        title: `${top.instructor} is carrying a heavy load`,
        detail: `${top.instructor} has ${plural(
          top.count,
          "active student",
        )} — well above the ${avg.toFixed(
          1,
        )} average across instructors. Consider rebalancing before assigning new students.`,
        severity: "info",
        category: "Pattern",
        score: 48,
      });
    }
  }

  // --- Projects / parking lot ----------------------------------------------
  for (const p of s.projects.staleActive) {
    add({
      title: `"${p.title}" hasn't moved in ${plural(p.days, "day")}`,
      detail:
        "This project is marked active but has gone quiet. Either take the next step or park it so it stops feeling like an open loop.",
      severity: "info",
      category: "Projects",
      actionLabel: "Ideas & Projects",
      actionHref: "/#ideas",
      score: 30 + Math.min(p.days, 30),
    });
  }

  return out.sort((a, b) => b.score - a.score);
}
