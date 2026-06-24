"use client";

import { useState, useTransition } from "react";
import {
  Users,
  Plus,
  Mail,
  FileText,
  GraduationCap,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Card, Empty, Pill } from "@/components/ui";
import {
  createStudent,
  toggleStudentFlag,
  updateStudentStatus,
  deleteStudent,
} from "@/app/actions";
import { clsx } from "@/lib/clsx";

export interface StudentView {
  id: string;
  name: string;
  instructor: string | null;
  status: "NEW" | "ACTIVE" | "INACTIVE";
  instructorNotified: boolean;
  notesComplete: boolean;
  collegeLaunch: boolean;
  collegeLaunchUpdate: boolean;
  notesDocUrl: string | null;
}

function FlagBtn({
  on,
  onClick,
  icon,
  label,
  disabled,
}: {
  on: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled: boolean;
}) {
  return (
    <button
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium transition",
        on
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-stone-200 bg-white text-stone-400 hover:text-stone-600",
      )}
    >
      {icon}
    </button>
  );
}

export default function StudentsWidget({
  students,
}: {
  students: StudentView[];
}) {
  const [pending, start] = useTransition();
  const [showForm, setShowForm] = useState(false);

  return (
    <Card
      id="students"
      title="Students"
      icon={<Users className="h-4 w-4" />}
      count={students.length}
      accent="brand"
      action={
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      }
    >
      {showForm && (
        <form
          action={(fd) => {
            start(() => createStudent(fd));
            setShowForm(false);
          }}
          className="mb-3 grid gap-2 rounded-xl bg-stone-50 p-3"
        >
          <input
            name="name"
            required
            placeholder="Student name"
            className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm"
          />
          <input
            name="instructor"
            placeholder="Instructor (optional)"
            className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm"
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-stone-600">
              <input type="checkbox" name="collegeLaunch" /> College Launch
            </label>
            <select
              name="status"
              defaultValue="NEW"
              className="ml-auto rounded-lg border border-stone-200 px-2 py-1 text-xs"
            >
              <option value="NEW">New</option>
              <option value="ACTIVE">Active</option>
            </select>
            <button className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">
              Save
            </button>
          </div>
        </form>
      )}

      {students.length === 0 ? (
        <Empty>No students yet. Add one or import a TeachWorks export.</Empty>
      ) : (
        <ul className="divide-y divide-stone-100">
          {students.map((s) => (
            <li key={s.id} className="group py-2.5">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-stone-800">
                      {s.name}
                    </span>
                    {s.status === "NEW" && <Pill tone="blue">New</Pill>}
                    {s.collegeLaunch && (
                      <Pill tone="violet">College Launch</Pill>
                    )}
                  </div>
                  {s.instructor && (
                    <p className="truncate text-xs text-stone-500">
                      {s.instructor}
                    </p>
                  )}
                </div>
                {s.notesDocUrl && (
                  <a
                    href={s.notesDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Open notes doc"
                    className="rounded p-1 text-stone-400 hover:text-brand-600"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  title="Remove"
                  disabled={pending}
                  onClick={() => start(() => deleteStudent(s.id))}
                  className="rounded p-1 text-stone-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <FlagBtn
                  on={s.instructorNotified}
                  disabled={pending}
                  onClick={() =>
                    start(() => toggleStudentFlag(s.id, "instructorNotified"))
                  }
                  icon={
                    <>
                      <Mail className="h-3 w-3" /> Instructor emailed
                    </>
                  }
                  label="Instructor notified"
                />
                <FlagBtn
                  on={s.notesComplete}
                  disabled={pending}
                  onClick={() =>
                    start(() => toggleStudentFlag(s.id, "notesComplete"))
                  }
                  icon={
                    <>
                      <FileText className="h-3 w-3" /> Notes done
                    </>
                  }
                  label="Notes complete"
                />
                {s.collegeLaunch && (
                  <FlagBtn
                    on={s.collegeLaunchUpdate}
                    disabled={pending}
                    onClick={() =>
                      start(() =>
                        toggleStudentFlag(s.id, "collegeLaunchUpdate"),
                      )
                    }
                    icon={
                      <>
                        <GraduationCap className="h-3 w-3" /> Update owed
                      </>
                    }
                    label="College Launch update owed"
                  />
                )}
                {s.status === "NEW" && (
                  <button
                    disabled={pending}
                    onClick={() =>
                      start(() => updateStudentStatus(s.id, "ACTIVE"))
                    }
                    className="ml-auto text-[11px] font-medium text-stone-400 hover:text-brand-600"
                  >
                    Mark active
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
