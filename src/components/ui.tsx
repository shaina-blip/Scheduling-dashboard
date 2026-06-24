import { clsx } from "@/lib/clsx";

export function Card({
  title,
  icon,
  count,
  accent = "stone",
  action,
  children,
  id,
}: {
  title: string;
  icon?: React.ReactNode;
  count?: number;
  accent?: "stone" | "brand" | "amber" | "red" | "blue" | "violet";
  action?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  const accents: Record<string, string> = {
    stone: "text-stone-500",
    brand: "text-brand-600",
    amber: "text-amber-600",
    red: "text-red-600",
    blue: "text-blue-600",
    violet: "text-violet-600",
  };
  return (
    <section
      id={id}
      className="flex flex-col rounded-2xl border border-stone-200 bg-white shadow-sm scroll-mt-24"
    >
      <header className="flex items-center justify-between gap-2 border-b border-stone-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={accents[accent]}>{icon}</span>
          <h2 className="text-sm font-semibold text-stone-800">{title}</h2>
          {typeof count === "number" && (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
              {count}
            </span>
          )}
        </div>
        {action}
      </header>
      <div className="scroll-thin flex-1 overflow-y-auto p-4">{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-6 text-center text-sm text-stone-400">{children}</p>
  );
}

export function Pill({
  children,
  tone = "stone",
}: {
  children: React.ReactNode;
  tone?: "stone" | "green" | "amber" | "red" | "blue" | "violet";
}) {
  const tones: Record<string, string> = {
    stone: "bg-stone-100 text-stone-600",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
