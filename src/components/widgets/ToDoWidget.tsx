"use client";

import { useTransition } from "react";
import {
  ListChecks,
  Check,
  Ban,
  ExternalLink,
  Star,
  Mail,
} from "lucide-react";
import { Card, Empty, Pill } from "@/components/ui";
import { setScheduleTodoState } from "@/app/actions";

export interface TodoView {
  key: string;
  title: string;
  student: string | null;
  subtitle: string;
  sources: ("pipeline" | "gmail")[];
  starred: boolean;
  stageName: string | null;
  emailLink: string | null;
  pipelineLink: string | null;
}

function snoozeDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export default function ToDoWidget({
  items,
  error,
}: {
  items: TodoView[];
  error?: string | null;
}) {
  const [pending, start] = useTransition();

  return (
    <Card
      id="todo"
      title="To-Do · Pending Scheduling"
      icon={<ListChecks className="h-4 w-4" />}
      count={items.length}
      accent="plum"
    >
      {error ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {error}
        </p>
      ) : items.length === 0 ? (
        <Empty>No families waiting on scheduling. All caught up. 🌸</Empty>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it) => (
            <li
              key={it.key}
              className="group rounded-xl border border-stone-200 px-3 py-2"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-stone-800">
                      {it.title}
                    </span>
                    {it.starred && (
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    )}
                    {it.sources.includes("pipeline") && it.stageName && (
                      <Pill tone="plum">{it.stageName}</Pill>
                    )}
                    {it.sources.includes("gmail") && (
                      <Mail className="h-3 w-3 text-stone-400" />
                    )}
                  </div>
                  {it.student && (
                    <p className="truncate text-xs font-medium text-wild-plum">
                      👤 {it.student}
                    </p>
                  )}
                  {it.subtitle && (
                    <p className="truncate text-xs text-stone-500">
                      {it.subtitle}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    {it.pipelineLink && (
                      <a
                        href={it.pipelineLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-[11px] font-medium text-wild-plum hover:underline"
                      >
                        Pipeline <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                    {it.emailLink && (
                      <a
                        href={it.emailLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-[11px] font-medium text-wild-blue hover:underline"
                      >
                        Email <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    title="Done"
                    disabled={pending}
                    onClick={() =>
                      start(() => setScheduleTodoState(it.key, "done"))
                    }
                    className="rounded p-1 text-stone-400 hover:bg-emerald-50 hover:text-emerald-600"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <select
                    title="Snooze"
                    disabled={pending}
                    defaultValue=""
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) return;
                      const days = Number(v);
                      start(() =>
                        setScheduleTodoState(
                          it.key,
                          "snoozed",
                          snoozeDate(days),
                        ),
                      );
                    }}
                    className="rounded border border-stone-200 bg-white px-1 py-0.5 text-[11px] text-stone-500"
                  >
                    <option value="">😴</option>
                    <option value="1">Tomorrow</option>
                    <option value="3">In 3 days</option>
                    <option value="7">Next week</option>
                  </select>
                  <button
                    title="Ignore"
                    disabled={pending}
                    onClick={() =>
                      start(() => setScheduleTodoState(it.key, "ignored"))
                    }
                    className="rounded p-1 text-stone-300 hover:bg-red-50 hover:text-red-500"
                  >
                    <Ban className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 rounded-xl bg-brand-50/60 px-3 py-2 text-[11px] leading-relaxed text-stone-500">
        ✨ Merged from your pipeline + Gmail scheduling labels (deduped). Once a
        family&apos;s schedule is confirmed, notify the instructor{" "}
        <strong>and Tara</strong>, then check it off.
      </p>
    </Card>
  );
}
