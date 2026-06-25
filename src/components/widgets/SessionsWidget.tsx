import { ClipboardCheck, FileText, UserCheck, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Card, Empty, Pill } from "@/components/ui";

export interface SessionActionView {
  id: string;
  student: string;
  date: string; // ISO
  program: "Bridge" | "Roots" | "Launch" | null;
  isClass: boolean;
  needsNotes: boolean;
  notesOverdue: boolean;
  notesDocLink: string | null;
  needsAttendance: boolean;
}

export default function SessionsWidget({
  items,
  studentCount,
  error,
}: {
  items: SessionActionView[];
  studentCount: number;
  error?: string | null;
}) {
  return (
    <Card
      id="sessions"
      title="My Sessions · Notes & Attendance"
      icon={<ClipboardCheck className="h-4 w-4" />}
      count={items.length}
      accent="green"
    >
      {error ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {error}
        </p>
      ) : items.length === 0 ? (
        <Empty>
          You&apos;re caught up on attendance &amp; notes. 🌿 Import a fresh
          TeachWorks Lesson Summary to refresh.
        </Empty>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-start gap-2 rounded-xl border border-stone-200 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-stone-800">
                    {it.student}
                  </span>
                  {it.isClass && <Pill tone="gold">Class</Pill>}
                  {it.program && !it.isClass && (
                    <Pill tone="green">{it.program}</Pill>
                  )}
                </div>
                <p className="text-xs text-stone-500">
                  {format(new Date(it.date), "EEE MMM d")}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {it.needsAttendance && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
                      <UserCheck className="h-3 w-3" /> Mark attended
                    </span>
                  )}
                  {it.needsNotes &&
                    (it.notesDocLink ? (
                      <a
                        href={it.notesDocLink}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                          it.notesOverdue
                            ? "bg-red-50 text-red-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        <FileText className="h-3 w-3" />
                        {it.notesOverdue ? "Notes overdue" : "Update notes"}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                          it.notesOverdue
                            ? "bg-red-50 text-red-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                        title="Couldn't find this student's notes doc in Drive"
                      >
                        <FileText className="h-3 w-3" />
                        {it.notesOverdue ? "Notes overdue" : "Update notes"} (doc?)
                      </span>
                    ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-center text-[11px] text-stone-400">
        {studentCount} student{studentCount === 1 ? "" : "s"} you tutor regularly
        · notes clear automatically once Drive sees your edit
      </p>
    </Card>
  );
}
