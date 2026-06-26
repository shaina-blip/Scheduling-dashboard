import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import AuditRunner from "@/components/AuditRunner";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <h1 className="font-display mt-4 text-2xl tracking-wide text-stone-900">
          Gmail Organization Audit
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          A snapshot of your inbox: mailbox size, labels, filters, who emails you
          most, and concrete suggestions to tidy things up. Runs live on your
          Gmail (read-only) — nothing is changed.
        </p>

        <div className="mt-6">
          <AuditRunner />
        </div>
      </div>
    </div>
  );
}
