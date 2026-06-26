import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { differenceInCalendarDays } from "date-fns";
import { authOptions } from "@/lib/auth";
import {
  fetchActionEmails,
  fetchRecentDocs,
  fetchSchedulingEmails,
  fetchWaitingEmails,
  findNotesDoc,
  getNotesDocById,
} from "@/lib/google";
import {
  loadIdeas,
  loadReminders,
  loadDismissedEmailIds,
  loadTodoStates,
  loadMyRecentSessions,
  loadMyStudentCount,
  loadNotesDocLinks,
  loadUserPrefs,
  programOf,
  buildSnapshot,
} from "@/lib/data";
import { sessionEndUtc } from "@/lib/time";
import { fetchPipelineFamilies } from "@/lib/pipeline";
import { mergeScheduling, actionEmailsToTodos } from "@/lib/scheduling";
import { getSuggestions } from "@/lib/ai";

import Header from "@/components/Header";
import AffirmationBlock from "@/components/AffirmationBlock";
import CustomizableGrid from "@/components/CustomizableGrid";
import SuggestionsPanel from "@/components/widgets/SuggestionsPanel";
import EmailsWidget from "@/components/widgets/EmailsWidget";
import WaitingWidget from "@/components/widgets/WaitingWidget";
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
  let waiting: Awaited<ReturnType<typeof fetchWaitingEmails>> = [];
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
    const [emailRes, docRes, schedRes, waitRes] = await Promise.allSettled([
      fetchActionEmails(accessToken),
      fetchRecentDocs(accessToken, { max: 8 }),
      fetchSchedulingEmails(accessToken),
      fetchWaitingEmails(accessToken),
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
    if (waitRes.status === "fulfilled") waiting = waitRes.value;
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
  const [
    ideas,
    reminders,
    todoStates,
    recentSessions,
    studentCount,
    notesLinks,
    prefs,
  ] = await Promise.all([
    loadIdeas(userEmail),
    loadReminders(userEmail),
    loadTodoStates(userEmail),
    loadMyRecentSessions(userEmail),
    loadMyStudentCount(userEmail),
    loadNotesDocLinks(userEmail),
    loadUserPrefs(userEmail),
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
      notesStudents.map(async (name) => {
        // Prefer a manually-connected doc; otherwise auto-find by name.
        const linked = notesLinks.get(name);
        const doc = linked
          ? await getNotesDocById(accessToken, linked.docId, userEmail).catch(
              () => null,
            )
          : await findNotesDoc(accessToken, name, userEmail).catch(() => null);
        return [name, doc] as const;
      }),
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
        // Done only if she edited the doc AFTER the session ended (so opening it
        // beforehand to prep doesn't count).
        const editedSince =
          !!doc?.modifiedByMe &&
          !!doc?.modifiedTime &&
          new Date(doc.modifiedTime) >=
            sessionEndUtc(l.date, l.endTime, l.startTime);
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

  // --- Build the consolidated To-Do: pending scheduling (pipeline + Gmail) +
  // @Action emails. Then apply saved done/ignore/snooze state. -------------
  const now = Date.now();
  const visible = (t: { key: string }) => {
    const st = todoStates.get(t.key);
    if (!st || st.status === "open") return true;
    if (st.status === "done" || st.status === "ignored") return false;
    if (st.status === "snoozed") {
      return st.snoozeUntil ? st.snoozeUntil.getTime() <= now : true;
    }
    return true;
  };

  const schedulingTodos = mergeScheduling(families, scheduling).filter(visible);
  const actionTodos = actionEmailsToTodos(emails).filter(visible);
  const todos = [...schedulingTodos, ...actionTodos].sort(
    (a, b) =>
      Number(b.starred) - Number(a.starred) ||
      new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime(),
  );

  // --- Summaries for the smarter suggestion engine ------------------------
  const sessionsSummary = {
    notesOverdue: sessionActions.filter((a) => a.needsNotes && a.notesOverdue)
      .length,
    notesDue: sessionActions.filter((a) => a.needsNotes && !a.notesOverdue)
      .length,
    attendanceDue: sessionActions.filter((a) => a.needsAttendance).length,
  };
  const waitingSummary = {
    total: waiting.length,
    stale: waiting.filter(
      (e) => differenceInCalendarDays(todayDate, new Date(e.date)) >= 5,
    ).length,
  };

  // --- Suggestion engine (scheduling count only, so the nudge stays accurate)
  const snapshot = await buildSnapshot(
    userEmail,
    emails.map((e) => ({ from: e.from, fromName: e.fromName, date: e.date })),
    schedulingTodos.length,
    { sessions: sessionsSummary, waiting: waitingSummary },
  );
  const { suggestions, engine } = await getSuggestions(snapshot);

  const firstName = (session?.user?.name ?? userEmail).split(" ")[0];

  const widgetItems = [
    {
      key: "todo",
      title: "To-Do",
      node: (
        <ToDoWidget
          items={todos.map((t) => ({
            key: t.key,
            title: t.title,
            student: t.student,
            subtitle: t.subtitle,
            sources: t.sources,
            starred: t.starred,
            stageName: t.stageName,
            badge: t.badge,
            kind: t.kind,
            emailLink: t.emailLink,
            pipelineLink: t.pipelineLink,
          }))}
          error={schedulingError}
        />
      ),
    },
    {
      key: "emails",
      title: "Emails",
      node: (
        <EmailsWidget
          emails={emails.map((e) => ({
            id: e.id,
            fromName: e.fromName,
            subject: e.subject,
            snippet: e.snippet,
            date: e.date,
            starred: e.starred,
            important: e.important,
            action: e.action,
            threadCount: e.threadCount,
            link: e.link,
          }))}
          error={emailError}
        />
      ),
    },
    {
      key: "sessions",
      title: "My Sessions",
      node: (
        <SessionsWidget
          items={sessionActions}
          studentCount={studentCount}
          error={
            !accessToken || authError
              ? "Google access expired. Sign out and back in to reconnect."
              : null
          }
        />
      ),
    },
    {
      key: "waiting",
      title: "Waiting On",
      node: (
        <WaitingWidget
          items={waiting.map((e) => ({
            id: e.id,
            fromName: e.fromName,
            subject: e.subject,
            date: e.date,
            link: e.link,
          }))}
          error={emailError}
        />
      ),
    },
    {
      key: "reminders",
      title: "Reminders",
      node: (
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
      ),
    },
    {
      key: "ideas",
      title: "Ideas & Projects",
      node: (
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
      ),
    },
    {
      key: "docs",
      title: "Google Docs",
      node: <DocsWidget docs={docs} error={docsError} />,
    },
  ];

  return (
    <div className="min-h-screen">
      <Header name={firstName} greeting={greetingFor(new Date())} />

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
        <AffirmationBlock date={new Date()} />
        <SuggestionsPanel suggestions={suggestions} engine={engine} />

        <CustomizableGrid
          items={widgetItems}
          savedOrder={prefs.order}
          savedHidden={prefs.hidden}
        />

        <footer className="pt-2 text-center text-xs text-stone-400">
          Wildewood Education · Operations dashboard · refreshes on load
        </footer>
      </main>
    </div>
  );
}
