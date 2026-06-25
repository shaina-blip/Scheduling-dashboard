"use client";

import { useState, useTransition } from "react";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import { importTeachworksCsv, type ImportResult } from "@/app/actions";

export default function ImportForm() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function onSubmit(form: FormData) {
    setResult(null);
    start(async () => {
      const res = await importTeachworksCsv(form);
      setResult(res);
    });
  }

  return (
    <form action={onSubmit} className="mt-6 space-y-4">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 bg-white px-6 py-10 text-center transition hover:border-brand-400 hover:bg-brand-50/40">
        <UploadCloud className="h-8 w-8 text-stone-400" />
        <span className="text-sm font-medium text-stone-700">
          {fileName ?? "Choose a TeachWorks CSV export"}
        </span>
        <span className="text-xs text-stone-400">
          .csv files only · auto-detects students vs. schedule
        </span>
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-stone-600">
          Type:{" "}
          <select
            name="kind"
            defaultValue=""
            className="rounded-lg border border-stone-200 px-2 py-1 text-sm"
          >
            <option value="">Auto-detect</option>
            <option value="lessons">My sessions (Lesson Summary)</option>
            <option value="students">Students</option>
            <option value="schedule">Schedule / lessons</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="ml-auto rounded-xl bg-brand-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Importing…" : "Import"}
        </button>
      </div>

      {result && (
        <div
          className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
            result.ok
              ? "bg-emerald-50 text-emerald-800"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          {result.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{result.message}</span>
        </div>
      )}
    </form>
  );
}
