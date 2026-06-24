"use client";

import { useState, useTransition } from "react";
import { Lightbulb, Plus, Star, Trash2 } from "lucide-react";
import { Card, Empty, Pill } from "@/components/ui";
import {
  createIdea,
  updateIdeaStatus,
  toggleIdeaPriority,
  deleteIdea,
} from "@/app/actions";
import { clsx } from "@/lib/clsx";

export interface IdeaView {
  id: string;
  title: string;
  details: string | null;
  kind: "IDEA" | "PROJECT";
  status: "PARKED" | "ACTIVE" | "DONE";
  priority: number;
}

const statusOrder = ["PARKED", "ACTIVE", "DONE"] as const;
const nextStatus: Record<string, string> = {
  PARKED: "ACTIVE",
  ACTIVE: "DONE",
  DONE: "PARKED",
};

export default function IdeasWidget({ ideas }: { ideas: IdeaView[] }) {
  const [pending, start] = useTransition();
  const [showForm, setShowForm] = useState(false);

  return (
    <Card
      id="ideas"
      title="Ideas & Projects"
      icon={<Lightbulb className="h-4 w-4" />}
      count={ideas.filter((i) => i.status !== "DONE").length}
      accent="gold"
      action={
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:underline"
        >
          <Plus className="h-3.5 w-3.5" /> Park one
        </button>
      }
    >
      {showForm && (
        <form
          action={(fd) => {
            start(() => createIdea(fd));
            setShowForm(false);
          }}
          className="mb-3 grid gap-2 rounded-xl bg-stone-50 p-3"
        >
          <input
            name="title"
            required
            placeholder="Idea or project title"
            className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm"
          />
          <textarea
            name="details"
            placeholder="Notes (optional)"
            rows={2}
            className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm"
          />
          <div className="flex items-center gap-2">
            <select
              name="kind"
              defaultValue="IDEA"
              className="rounded-lg border border-stone-200 px-2 py-1 text-xs"
            >
              <option value="IDEA">Idea</option>
              <option value="PROJECT">Project</option>
            </select>
            <button className="ml-auto rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600">
              Park it
            </button>
          </div>
        </form>
      )}

      {ideas.length === 0 ? (
        <Empty>Your parking lot is empty. Capture that idea before it floats off.</Empty>
      ) : (
        <ul className="space-y-1.5">
          {ideas.map((i) => (
            <li
              key={i.id}
              className={clsx(
                "group flex items-start gap-2 rounded-lg border px-2.5 py-2",
                i.status === "DONE"
                  ? "border-stone-100 bg-stone-50 opacity-60"
                  : "border-stone-200 bg-white",
              )}
            >
              <button
                title="Toggle priority"
                disabled={pending}
                onClick={() => start(() => toggleIdeaPriority(i.id))}
                className="mt-0.5"
              >
                <Star
                  className={clsx(
                    "h-4 w-4",
                    i.priority === 1
                      ? "fill-amber-400 text-amber-400"
                      : "text-stone-300 hover:text-amber-400",
                  )}
                />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={clsx(
                      "text-sm font-medium text-stone-800",
                      i.status === "DONE" && "line-through",
                    )}
                  >
                    {i.title}
                  </span>
                  <Pill tone={i.kind === "PROJECT" ? "blue" : "stone"}>
                    {i.kind === "PROJECT" ? "Project" : "Idea"}
                  </Pill>
                </div>
                {i.details && (
                  <p className="text-xs text-stone-500">{i.details}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  disabled={pending}
                  onClick={() =>
                    start(() => updateIdeaStatus(i.id, nextStatus[i.status]))
                  }
                  className="rounded px-1.5 py-0.5 text-[11px] font-medium text-stone-500 hover:bg-stone-100"
                >
                  {i.status === "PARKED"
                    ? "Start"
                    : i.status === "ACTIVE"
                      ? "Done"
                      : "Reopen"}
                </button>
                <button
                  title="Delete"
                  disabled={pending}
                  onClick={() => start(() => deleteIdea(i.id))}
                  className="rounded p-1 text-stone-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
