"use client";

import { useTransition } from "react";
import { CalendarClock, Check, X } from "lucide-react";
import { format } from "date-fns";
import { Card, Empty, Pill } from "@/components/ui";
import { updateScheduleStatus } from "@/app/actions";

export interface ScheduleView {
  id: string;
  studentName: string;
  instructor: string | null;
  subject: string | null;
  startsAt: string | null;
  location: string | null;
}

export default function ScheduleWidget({ items }: { items: ScheduleView[] }) {
  const [pending, start] = useTransition();

  return (
    <Card
      id="schedule"
      title="Pending schedules"
      icon={<CalendarClock className="h-4 w-4" />}
      count={items.length}
      accent="plum"
    >
      {items.length === 0 ? (
        <Empty>No sessions awaiting confirmation.</Empty>
      ) : (
        <ul className="divide-y divide-stone-100">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-2 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-800">
                  {it.studentName}
                  {it.subject && (
                    <span className="font-normal text-stone-500">
                      {" "}
                      · {it.subject}
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-stone-500">
                  {it.startsAt
                    ? format(new Date(it.startsAt), "EEE MMM d, h:mma")
                    : "No time set"}
                  {it.instructor && ` · ${it.instructor}`}
                  {it.location && ` · ${it.location}`}
                </p>
              </div>
              <Pill tone="gold">Pending</Pill>
              <div className="flex shrink-0 gap-1">
                <button
                  title="Confirm"
                  disabled={pending}
                  onClick={() =>
                    start(() => updateScheduleStatus(it.id, "CONFIRMED"))
                  }
                  className="rounded p-1 text-stone-400 hover:bg-emerald-50 hover:text-emerald-600"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  title="Cancel"
                  disabled={pending}
                  onClick={() =>
                    start(() => updateScheduleStatus(it.id, "CANCELLED"))
                  }
                  className="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
