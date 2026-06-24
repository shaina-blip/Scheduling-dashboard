"use client";

import { useState, useTransition } from "react";
import { BellRing, Plus, Trash2, RotateCw } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { Card, Empty, Pill } from "@/components/ui";
import {
  createReminder,
  toggleReminderDone,
  deleteReminder,
} from "@/app/actions";
import { clsx } from "@/lib/clsx";

export interface ReminderView {
  id: string;
  title: string;
  category: string | null;
  dueDate: string | null;
  recurrence: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY";
  done: boolean;
}

function dueLabel(due: string | null): { text: string; tone: "stone" | "gold" | "red" | "green" } {
  if (!due) return { text: "No date", tone: "stone" };
  const days = differenceInCalendarDays(new Date(due), new Date());
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, tone: "red" };
  if (days === 0) return { text: "Today", tone: "gold" };
  if (days <= 3) return { text: `In ${days}d`, tone: "gold" };
  return { text: format(new Date(due), "MMM d"), tone: "stone" };
}

export default function RemindersWidget({
  reminders,
}: {
  reminders: ReminderView[];
}) {
  const [pending, start] = useTransition();
  const [showForm, setShowForm] = useState(false);

  return (
    <Card
      id="reminders"
      title="Reminders"
      icon={<BellRing className="h-4 w-4" />}
      count={reminders.filter((r) => !r.done).length}
      accent="brand"
      action={
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      }
    >
      {showForm && (
        <form
          action={(fd) => {
            start(() => createReminder(fd));
            setShowForm(false);
          }}
          className="mb-3 grid gap-2 rounded-xl bg-stone-50 p-3"
        >
          <input
            name="title"
            required
            placeholder="e.g. Run monthly inventory count"
            className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              name="category"
              placeholder="Category"
              list="reminder-cats"
              className="w-28 rounded-lg border border-stone-200 px-2 py-1 text-xs"
            />
            <datalist id="reminder-cats">
              <option value="Inventory" />
              <option value="KPIs" />
              <option value="Compliance" />
              <option value="Staff" />
            </datalist>
            <input
              type="date"
              name="dueDate"
              className="rounded-lg border border-stone-200 px-2 py-1 text-xs"
            />
            <select
              name="recurrence"
              defaultValue="NONE"
              className="rounded-lg border border-stone-200 px-2 py-1 text-xs"
            >
              <option value="NONE">One-time</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
            </select>
            <button className="ml-auto rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600">
              Add
            </button>
          </div>
        </form>
      )}

      {reminders.length === 0 ? (
        <Empty>No reminders set. Add inventory, KPI reviews, etc.</Empty>
      ) : (
        <ul className="space-y-1">
          {reminders.map((r) => {
            const due = dueLabel(r.dueDate);
            return (
              <li key={r.id} className="group flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={r.done}
                  disabled={pending}
                  onChange={() => start(() => toggleReminderDone(r.id))}
                  className="h-4 w-4 rounded border-stone-300 text-brand-600"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={clsx(
                        "truncate text-sm text-stone-800",
                        r.done && "text-stone-400 line-through",
                      )}
                    >
                      {r.title}
                    </span>
                    {r.recurrence !== "NONE" && (
                      <RotateCw className="h-3 w-3 text-stone-400" />
                    )}
                  </div>
                  {r.category && (
                    <span className="text-[11px] text-stone-400">
                      {r.category}
                    </span>
                  )}
                </div>
                {!r.done && <Pill tone={due.tone}>{due.text}</Pill>}
                <button
                  title="Delete"
                  disabled={pending}
                  onClick={() => start(() => deleteReminder(r.id))}
                  className="rounded p-1 text-stone-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
