import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchActionEmails, fetchRecentDocs } from "@/lib/google";
import {
  loadIdeas,
  loadReminders,
  loadStudents,
  loadPendingSchedule,
  loadKpis,
  loadDismissedEmailIds,
  buildSnapshot,
} from "@/lib/data";
import { getSuggestions } from "@/lib/ai";

import Header from "@/components/Header";
import SuggestionsPanel from "@/components/widgets/SuggestionsPanel";
import EmailsWidget from "@/components/widgets/EmailsWidget";
import ScheduleWidget from "@/components/widgets/ScheduleWidget";
import StudentsWidget from "@/components/widgets/StudentsWidget";
import IdeasWidget from "@/components/widgets/IdeasWidget";
import RemindersWidget from "@/components/widgets/RemindersWidget";
import KpisWidget from "@/components/widgets/KpisWidget";
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

  // --- Live Google data (degrade gracefully if the API call fails) ---------
  let emails: Awaited<ReturnType<typeof fetchActionEmails>> = [];
  let docs: Awaited<ReturnType<typeof fetchRecentDocs>> = [];
  let emailError: string | null = null;
  let docsError: string | null = null;

  if (!accessToken || authError) {
    emailError = docsError =
      "Google access expired. Sign out and back in to reconnect.";
  } else {
    const dismissed = await loadDismissedEmailIds(userEmail);
    const [emailRes, docRes] = await Promise.allSettled([
      fetchActionEmails(accessToken),
      fetchRecentDocs(accessToken, { max: 8 }),
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
  }

  // --- Database-backed data ------------------------------------------------
  const [ideas, reminders, students, schedule, kpis] = await Promise.all([
    loadIdeas(userEmail),
    loadReminders(userEmail),
    loadStudents(userEmail),
    loadPendingSchedule(userEmail),
    loadKpis(userEmail),
  ]);

  // --- Suggestion engine ---------------------------------------------------
  const snapshot = await buildSnapshot(
    userEmail,
    emails.map((e) => ({ from: e.from, fromName: e.fromName, date: e.date })),
  );
  const { suggestions, engine } = await getSuggestions(snapshot);

  const firstName = (session?.user?.name ?? userEmail).split(" ")[0];

  return (
    <div className="min-h-screen">
      <Header name={firstName} greeting={greetingFor(new Date())} />

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
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
                link: e.link,
              }))}
              error={emailError}
            />
            <ScheduleWidget
              items={schedule.map((s) => ({
                id: s.id,
                studentName: s.studentName,
                instructor: s.instructor,
                subject: s.subject,
                startsAt: s.startsAt ? s.startsAt.toISOString() : null,
                location: s.location,
              }))}
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

          {/* Column 3 — my head: ideas, reminders, metrics */}
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
            <KpisWidget
              kpis={kpis.map((k) => ({
                id: k.id,
                name: k.name,
                value: k.value,
                target: k.target,
                unit: k.unit,
                period: k.period,
                higherIsBetter: k.higherIsBetter,
              }))}
            />
          </div>
        </div>

        <footer className="pt-2 text-center text-xs text-stone-400">
          Wildewood Education · Operations dashboard · data refreshes on load
        </footer>
      </main>
    </div>
  );
}
