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

  // --- Pending scheduling (from Gmail labels) ------------------------------
  if (s.schedule.pending > 0) {
    add({
      title: `${plural(s.schedule.pending, "family", "families")} waiting on scheduling`,
      detail:
        "These are sitting in your scheduling labels. Once a family is confirmed, notify the instructor and Tara, then label the thread DONE! to clear it.",
      severity: s.schedule.pending >= 5 ? "urgent" : "attention",
      category: "Schedule",
      actionLabel: "Review scheduling",
      actionHref: "/#todo",
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

  // --- Sessions: notes & attendance ----------------------------------------
  if (s.sessions.notesOverdue > 0) {
    add({
      title: `${plural(s.sessions.notesOverdue, "session")} with notes overdue`,
      detail:
        "These are 3+ days past the session and the tutoring notes still aren't updated. Knock them out before the details fade.",
      severity: "urgent",
      category: "Students",
      actionLabel: "My sessions",
      actionHref: "/#sessions",
      score: 88 + s.sessions.notesOverdue * 4,
    });
  }
  if (s.sessions.notesDue > 0) {
    add({
      title: `Write notes for ${plural(s.sessions.notesDue, "recent session")}`,
      detail:
        "Log your tutoring notes while the session is fresh — they clear automatically once Drive sees your edit.",
      severity: "attention",
      category: "Students",
      actionLabel: "My sessions",
      actionHref: "/#sessions",
      score: 58 + s.sessions.notesDue * 2,
    });
  }
  if (s.sessions.attendanceDue > 0) {
    add({
      title: `Mark attendance for ${plural(
        s.sessions.attendanceDue,
        "session",
      )}`,
      detail:
        "These past sessions are still marked 'Scheduled' in TeachWorks — mark them attended so billing and records stay clean.",
      severity: "attention",
      category: "Students",
      actionLabel: "My sessions",
      actionHref: "/#sessions",
      score: 52 + s.sessions.attendanceDue * 2,
    });
  }

  // --- Waiting on others ---------------------------------------------------
  if (s.waiting.stale > 0) {
    add({
      title: `${plural(s.waiting.stale, "person", "people")} you're waiting on (5+ days)`,
      detail:
        "It's been a while since you flagged these as @waiting — a gentle nudge might move them along.",
      severity: "info",
      category: "Email",
      actionLabel: "Waiting On",
      actionHref: "/#waiting",
      score: 42 + s.waiting.stale * 3,
    });
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
