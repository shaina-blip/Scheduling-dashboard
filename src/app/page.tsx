import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { differenceInCalendarDays } from "date-fns";
import { authOptions } from "@/lib/auth";
import {
  fetchActionEmails,
  fetchRecentDocs,
  fetchSchedulingEmails,
  findNotesDoc,
} from "@/lib/google";
import {
  loadIdeas,
  loadReminders,
  loadDismissedEmailIds,
  loadTodoStates,
  loadMyRecentSessions,
  loadMyStudentCount,
  programOf,
  buildSnapshot,
} from "@/lib/data";
import { fetchPipelineFamilies } from "@/lib/pipeline";
import { mergeScheduling } from "@/lib/scheduling";
import { getSuggestions } from "@/lib/ai";

import Header from "@/components/Header";
import AffirmationBlock from "@/components/AffirmationBlock";
import SuggestionsPanel from "@/components/widgets/SuggestionsPanel";
import EmailsWidget from "@/components/widgets/EmailsWidget";
import ToDoWidget from "@/components/widgets/ToDoWidget";
import SessionsWidget from "@/components/widgets/SessionsWidget";
import IdeasWidget from "@/components/widgets/IdeasWidget";
import RemindersWidget from "@/components/widgets/RemindersWidget";
import DocsWidget from "@/components/widgets/DocsWidget";

// Always render fresh — this is a live operations view.
export const dynamic = "force-dynamic";

function greetingFor(date: Date): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) redirect("/login");

  const accessToken = (session as any)?.accessToken as string | undefined;
  const authError = (session as any)?.error as string | undefined;

  // --- Live Google data (degrade gracefully if a call fails) --------------
  let emails: Awaited<ReturnType<typeof fetchActionEmails>> = [];
  let docs: Awaited<ReturnType<typeof fetchRecentDocs>> = [];
  let scheduling: Awaited<ReturnType<typeof fetchSchedulingEmails>> = [];
  let emailError: string | null = null;
  let docsError: string | null = null;
  let schedulingError: string | null = null;

  if (!accessToken || authError) {
    emailError =
      docsError =
      schedulingError =
        "Google access expired. Sign out and back in to reconnect.";
  } else {
    const dismissed = await loadDismissedEmailIds(userEmail);
    const [emailRes, docRes, schedRes] = await Promise.allSettled([
      fetchActionEmails(accessToken),
      fetchRecentDocs(accessToken, { max: 8 }),
      fetchSchedulingEmails(accessToken),
    ]);
    if (emailRes.status === "fulfilled") {
      emails = emailRes.value.filter((e) => !dismissed.has(e.id));
    } else {
      emailError =
        "Couldn't load Gmail. Make sure the Gmail API is enabled and access was granted.";
    }
    if (docRes.status === "fulfilled") docs = docRes.value;
    else
      docsError =
        "Couldn't load Drive. Make sure the Drive API is enabled and access was granted.";
    if (schedRes.status === "fulfilled") scheduling = schedRes.value;
    else
      schedulingError =
        "Couldn't load your scheduling labels from Gmail.";
  }

  // --- New Family Pipeline (Firestore — independent of Google sign-in) ------
  let families: Awaited<ReturnType<typeof fetchPipelineFamilies>> = [];
  try {
    families = await fetchPipelineFamilies(accessToken);
  } catch (err) {
    console.error("pipeline fetch failed", err);
  }

  // --- Database-backed data ------------------------------------------------
  const [ideas, reminders, todoStates, recentSessions, studentCount] =
    await Promise.all([
      loadIdeas(userEmail),
      loadReminders(userEmail),
      loadTodoStates(userEmail),
      loadMyRecentSessions(userEmail),
      loadMyStudentCount(userEmail),
    ]);

  // --- Sessions tracker: cross-reference each session against the student's
  // tutoring-notes doc in Drive (auto-clears once she's edited it) ----------
  const todayDate = new Date();
  // Compare by calendar day to avoid timezone off-by-one between the imported
  // session date (midnight) and Drive's timestamped edits.
  const happened = (l: { date: Date; status: string | null }) =>
    differenceInCalendarDays(todayDate, l.date) >= 0 &&
    !/cancel|miss/i.test(l.status ?? "");

  // One Drive lookup per unique student that needs notes (Bridge/Launch only;
  // Roots is class-style and handled later). Capped to keep page loads sane.
  const notesStudents = Array.from(
    new Set(
      recentSessions
        .filter((l) => happened(l) && programOf(l.service) !== "Roots")
        .map((l) => l.studentName),
    ),
  ).slice(0, 60);
  const notesDocByStudent = new Map<
    string,
    Awaited<ReturnType<typeof findNotesDoc>>
  >();
  if (accessToken && notesStudents.length) {
    const results = await Promise.all(
      notesStudents.map(
        async (name) =>
          [
            name,
            await findNotesDoc(accessToken, name, userEmail).catch(() => null),
          ] as const,
      ),
    );
    for (const [name, doc] of results) notesDocByStudent.set(name, doc);
  }

  const sessionActions = recentSessions
    .map((l) => {
      const program = programOf(l.service);
      const isClass = program === "Roots";
      const did = happened(l);
      const needsAttendance = did && /scheduled/i.test(l.status ?? "");

      let needsNotes = false;
      let notesOverdue = false;
      let notesDocLink: string | null = null;
      if (did && !isClass) {
        const doc = notesDocByStudent.get(l.studentName) ?? null;
        notesDocLink = doc?.link ?? null;
        const editedSince =
          !!doc?.modifiedByMe &&
          !!doc?.modifiedTime &&
          differenceInCalendarDays(new Date(doc.modifiedTime), l.date) >= 0;
        needsNotes = !editedSince;
        notesOverdue =
          needsNotes && differenceInCalendarDays(todayDate, l.date) > 3;
      }

      return {
        id: l.id,
        student: l.studentName,
        date: l.date.toISOString(),
        program,
        isClass,
        needsNotes,
        notesOverdue,
        notesDocLink,
        needsAttendance,
      };
    })
    .filter((a) => a.needsNotes || a.needsAttendance)
    // overdue notes first, then attendance, then newest
    .sort(
      (a, b) =>
        Number(b.notesOverdue) - Number(a.notesOverdue) ||
        Number(b.needsAttendance) - Number(a.needsAttendance) ||
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

  // --- Merge pipeline + Gmail into one deduped to-do list, then apply the
  // saved done/ignore/snooze state ----------------------------------------
  const now = Date.now();
  const todos = mergeScheduling(families, scheduling).filter((t) => {
    const st = todoStates.get(t.key);
    if (!st || st.status === "open") return true;
    if (st.status === "done" || st.status === "ignored") return false;
    if (st.status === "snoozed") {
      return st.snoozeUntil ? st.snoozeUntil.getTime() <= now : true;
    }
    return true;
  });

  // --- Suggestion engine ---------------------------------------------------
  const snapshot = await buildSnapshot(
    userEmail,
    emails.map((e) => ({ from: e.from, fromName: e.fromName, date: e.date })),
    todos.length,
  );
  const { suggestions, engine } = await getSuggestions(snapshot);

  const firstName = (session?.user?.name ?? userEmail).split(" ")[0];

  return (
    <div className="min-h-screen">
      <Header name={firstName} greeting={greetingFor(new Date())} />

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
        <AffirmationBlock date={new Date()} />
        <SuggestionsPanel suggestions={suggestions} engine={engine} />

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Column 1 — what's coming at me */}
          <div className="space-y-5">
            <EmailsWidget
              emails={emails.map((e) => ({
                id: e.id,
                fromName: e.fromName,
                subject: e.subject,
                snippet: e.snippet,
                date: e.date,
                starred: e.starred,
                important: e.important,
                threadCount: e.threadCount,
                link: e.link,
              }))}
              error={emailError}
            />
            <RemindersWidget
              reminders={reminders.map((r) => ({
                id: r.id,
                title: r.title,
                category: r.category,
                dueDate: r.dueDate ? r.dueDate.toISOString() : null,
                recurrence: r.recurrence,
                done: r.done,
              }))}
            />
          </div>

          {/* Column 2 — people */}
          <div className="space-y-5">
            <SessionsWidget
              items={sessionActions}
              studentCount={studentCount}
              error={
                !accessToken || authError
                  ? "Google access expired. Sign out and back in to reconnect."
                  : null
              }
            />
            <DocsWidget docs={docs} error={docsError} />
          </div>

          {/* Column 3 — my work: to-do + ideas */}
          <div className="space-y-5">
            <ToDoWidget
              items={todos.map((t) => ({
                key: t.key,
                title: t.title,
                student: t.student,
                subtitle: t.subtitle,
                sources: t.sources,
                starred: t.starred,
                stageName: t.stageName,
                emailLink: t.emailLink,
                pipelineLink: t.pipelineLink,
              }))}
              error={schedulingError}
            />
            <IdeasWidget
              ideas={ideas.map((i) => ({
                id: i.id,
                title: i.title,
                details: i.details,
                kind: i.kind,
                status: i.status,
                priority: i.priority,
              }))}
            />
          </div>
        </div>

        <footer className="pt-2 text-center text-xs text-stone-400">
          Wildewood Education · Operations dashboard · refreshes on load
        </footer>
      </main>
    </div>
  );
}
