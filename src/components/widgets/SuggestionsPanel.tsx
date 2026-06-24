import { Sparkles, AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { Suggestion } from "@/lib/ai/types";

const severityStyle = {
  urgent: {
    icon: <AlertTriangle className="h-4 w-4" />,
    ring: "border-red-200 bg-red-50",
    text: "text-red-700",
  },
  attention: {
    icon: <AlertCircle className="h-4 w-4" />,
    ring: "border-amber-200 bg-amber-50",
    text: "text-amber-700",
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    ring: "border-stone-200 bg-stone-50",
    text: "text-stone-600",
  },
} as const;

export default function SuggestionsPanel({
  suggestions,
  engine,
}: {
  suggestions: Suggestion[];
  engine: "local" | "claude";
}) {
  return (
    <section className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white shadow-soft">
      <header className="flex items-center justify-between border-b border-brand-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-500" />
          <h2 className="font-display text-lg tracking-wide text-stone-700">
            Smart Suggestions
          </h2>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-stone-500 shadow-sm">
          {engine === "claude" ? "Claude" : "Rules engine"} · {suggestions.length}
        </span>
      </header>
      <div className="p-4">
        {suggestions.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-500">
            You&apos;re all caught up — nothing needs your attention right now. 🎉
          </p>
        ) : (
          <ul className="grid gap-2.5 md:grid-cols-2">
            {suggestions.slice(0, 8).map((s) => {
              const st = severityStyle[s.severity];
              return (
                <li
                  key={s.id}
                  className={`flex gap-3 rounded-xl border px-3.5 py-3 ${st.ring}`}
                >
                  <span className={`mt-0.5 shrink-0 ${st.text}`}>{st.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-stone-900">
                        {s.title}
                      </p>
                      <span className="shrink-0 text-[10px] uppercase tracking-wide text-stone-400">
                        {s.category}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-stone-600">
                      {s.detail}
                    </p>
                    {s.actionHref && (
                      <a
                        href={s.actionHref}
                        target={s.actionHref.startsWith("http") ? "_blank" : undefined}
                        rel="noreferrer"
                        className="mt-1.5 inline-block text-xs font-medium text-brand-700 hover:underline"
                      >
                        {s.actionLabel ?? "Open"} →
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
