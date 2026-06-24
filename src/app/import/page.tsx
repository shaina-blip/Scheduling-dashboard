import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import ImportForm from "@/components/ImportForm";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) redirect("/login");

  const recent = await prisma.importLog.findMany({
    where: { userEmail },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <h1 className="mt-4 text-2xl font-semibold text-stone-900">
          Import from TeachWorks
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Export a report from TeachWorks as CSV and drop it here. The dashboard
          auto-detects whether it&apos;s a <strong>students</strong> list or a{" "}
          <strong>schedule/lessons</strong> export, then matches columns by name
          (so the exact report layout doesn&apos;t have to be perfect). Re-importing
          updates existing records instead of duplicating them.
        </p>

        <ImportForm />

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-stone-700">
            Recent imports
          </h2>
          {recent.length === 0 ? (
            <p className="mt-2 text-sm text-stone-400">No imports yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
              {recent.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between px-4 py-2.5 text-sm"
                >
                  <div>
                    <span className="font-medium text-stone-800">
                      {r.kind.replace("teachworks-", "")}
                    </span>
                    {r.fileName && (
                      <span className="text-stone-400"> · {r.fileName}</span>
                    )}
                  </div>
                  <div className="text-xs text-stone-500">
                    {r.created} new · {r.updated} updated
                    {r.skipped ? ` · ${r.skipped} skipped` : ""} ·{" "}
                    {format(r.createdAt, "MMM d, h:mma")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8 rounded-xl bg-stone-100 p-4 text-xs leading-relaxed text-stone-500">
          <p className="font-medium text-stone-600">How to export from TeachWorks</p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-4">
            <li>Open the report you want (Students, or Calendar/Lessons).</li>
            <li>Apply your date range / filters.</li>
            <li>Use the export / download button and choose CSV.</li>
            <li>Upload the file here.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
