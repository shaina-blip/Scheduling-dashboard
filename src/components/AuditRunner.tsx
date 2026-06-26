"use client";

import { useState, useTransition } from "react";
import {
  Sparkles,
  Mailbox,
  Tag,
  Filter,
  UserRound,
  Lightbulb,
} from "lucide-react";
import { runGmailAuditAction } from "@/app/actions";
import type { GmailAudit } from "@/lib/google";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-stone-100 bg-white px-4 py-3">
      <p className="text-xs text-stone-400">{label}</p>
      <p className="font-display text-xl text-stone-800">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white/80 p-5 shadow-soft">
      <h2 className="mb-3 flex items-center gap-2 font-display text-base text-stone-800">
        <span className="text-brand-500">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function AuditRunner() {
  const [pending, start] = useTransition();
  const [audit, setAudit] = useState<GmailAudit | null>(null);
  const [ran, setRan] = useState(false);

  function run() {
    start(async () => {
      const result = await runGmailAuditAction();
      setAudit(result);
      setRan(true);
    });
  }

  return (
    <div>
      <button
        onClick={run}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
      >
        <Sparkles className="h-4 w-4" />
        {pending ? "Auditing your inbox…" : ran ? "Re-run audit" : "Run Gmail Audit"}
      </button>

      {ran && !audit && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Couldn&apos;t run the audit — your Google access may have expired. Try
          signing out and back in.
        </p>
      )}

      {audit && (
        <div className="mt-6 space-y-5">
          <Section icon={<Mailbox className="h-4 w-4" />} title="Mailbox overview">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Total messages" value={audit.messagesTotal} />
              <Stat label="Total threads" value={audit.threadsTotal} />
              <Stat label="Inbox" value={audit.inboxTotal} />
              <Stat label="Account" value={audit.email} />
            </div>
          </Section>

          <Section icon={<Tag className="h-4 w-4" />} title="Labels">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="System" value={audit.systemLabelCount} />
              <Stat label="Custom" value={audit.customLabels.length} />
              <Stat label="Nested" value={audit.nestedCount} />
              <Stat label="Flat" value={audit.flatCount} />
            </div>
            {audit.customLabels.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {audit.customLabels.map((l) => (
                  <span
                    key={l}
                    className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700"
                  >
                    {l}
                  </span>
                ))}
              </div>
            )}
          </Section>

          <Section icon={<Filter className="h-4 w-4" />} title={`Filters (${audit.filters.length})`}>
            {audit.filters.length === 0 ? (
              <p className="text-sm text-stone-400">No filters set up.</p>
            ) : (
              <ul className="space-y-1.5">
                {audit.filters.map((f, i) => (
                  <li key={i} className="text-sm text-stone-700">
                    <span className="font-medium">{f.rule}</span>{" "}
                    <span className="text-stone-400">→ {f.action}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            icon={<UserRound className="h-4 w-4" />}
            title={`Top senders in inbox (sample of ${audit.sampleSize})`}
          >
            <ul className="space-y-1">
              {audit.topSenders.map((s) => (
                <li
                  key={s.sender}
                  className="flex items-center gap-2 text-sm text-stone-700"
                >
                  <span className="w-8 shrink-0 text-right font-medium text-brand-600">
                    {s.count}×
                  </span>
                  <span className="truncate">{s.sender}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section
            icon={<Lightbulb className="h-4 w-4" />}
            title="Organization suggestions"
          >
            <ol className="list-decimal space-y-2 pl-5 text-sm text-stone-700">
              {audit.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </Section>
        </div>
      )}
    </div>
  );
}
