"use client";

import { useState, useTransition } from "react";
import { Link2, Search } from "lucide-react";
import { searchNotesDocs, connectNotesDoc } from "@/app/actions";

interface DocResult {
  id: string;
  name: string;
  link: string;
}

export default function ConnectDocButton({
  studentName,
}: {
  studentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(studentName);
  const [results, setResults] = useState<DocResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, start] = useTransition();

  async function doSearch() {
    setLoading(true);
    const r = (await searchNotesDocs(q)) as DocResult[];
    setResults(r);
    setLoading(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true);
          doSearch();
        }}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-wild-blue hover:underline"
      >
        <Link2 className="h-3 w-3" /> Connect doc
      </button>
    );
  }

  return (
    <div className="mt-1 rounded-lg border border-stone-200 bg-stone-50 p-2">
      <div className="flex gap-1">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              doSearch();
            }
          }}
          placeholder="Search Drive docs…"
          className="w-full rounded border border-stone-200 px-1.5 py-0.5 text-[11px]"
        />
        <button
          onClick={doSearch}
          className="rounded border border-stone-200 bg-white px-1.5"
        >
          <Search className="h-3 w-3" />
        </button>
      </div>
      {loading ? (
        <p className="mt-1 text-[11px] text-stone-400">Searching…</p>
      ) : (
        <ul className="mt-1 max-h-32 overflow-y-auto">
          {results.length === 0 ? (
            <li className="py-1 text-[11px] text-stone-400">No matches.</li>
          ) : (
            results.map((r) => (
              <li key={r.id}>
                <button
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      await connectNotesDoc(studentName, r.id, r.name, r.link);
                      setOpen(false);
                    })
                  }
                  className="block w-full truncate rounded px-1.5 py-1 text-left text-[11px] text-stone-700 hover:bg-white"
                  title={r.name}
                >
                  {r.name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
      <button
        onClick={() => setOpen(false)}
        className="mt-1 text-[10px] text-stone-400 hover:text-stone-600"
      >
        cancel
      </button>
    </div>
  );
}
