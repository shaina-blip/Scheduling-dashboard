import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  fetchActionEmails,
  fetchRecentDocs,
  fetchSchedulingEmails,
} from "@/lib/google";
import {
  loadIdeas,
  loadReminders,
  loadStudents,
  loadDismissedEmailIds,
  buildSnapshot,
} from "@/lib/data";
import { getSuggestions } from "@/lib/ai";

import Header from "@/components/Header";
import AffirmationBlock from "@/components/AffirmationBlock";
import SuggestionsPanel from "@/components/widgets/SuggestionsPanel";
import EmailsWidget from "@/components/widgets/EmailsWidget";
import PendingSchedulingWidget from "@/components/widgets/PendingSchedulingWidget";
import StudentsWidget from "@/components/widgets/StudentsWidget";
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

  // --- Database-backed data ------------------------------------------------
  const [ideas, reminders, students] = await Promise.all([
    loadIdeas(userEmail),
    loadReminders(userEmail),
    loadStudents(userEmail),
  ]);

  // --- Suggestion engine ---------------------------------------------------
  const snapshot = await buildSnapshot(
    userEmail,
    emails.map((e) => ({ from: e.from, fromName: e.fromName, date: e.date })),
    scheduling.length,
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
            <PendingSchedulingWidget
              items={scheduling.map((e) => ({
                id: e.id,
                fromName: e.fromName,
                subject: e.subject,
                date: e.date,
                starred: e.starred,
                threadCount: e.threadCount,
                link: e.link,
              }))}
              error={schedulingError}
            />
          </div>

          {/* Column 2 — people */}
          <div className="space-y-5">
            <StudentsWidget
              students={students.map((s) => ({
                id: s.id,
                name: s.name,
                instructor: s.instructor,
                status: s.status,
                instructorNotified: s.instructorNotified,
                notesComplete: s.notesComplete,
                collegeLaunch: s.collegeLaunch,
                collegeLaunchUpdate: s.collegeLaunchUpdate,
                notesDocUrl: s.notesDocUrl,
              }))}
            />
            <DocsWidget docs={docs} error={docsError} />
          </div>

          {/* Column 3 — my head: ideas + reminders */}
          <div className="space-y-5">
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
        </div>

        <footer className="pt-2 text-center text-xs text-stone-400">
          Wildewood Education · Operations dashboard · refreshes on load
        </footer>
      </main>
    </div>
  );
}
