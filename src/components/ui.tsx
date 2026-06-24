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
  accent?: "stone" | "brand" | "green" | "gold" | "blue" | "plum" | "teal";
  action?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  // Cute "sticker" icon chips — a confident pop of color per section
  const chip: Record<string, string> = {
    stone: "bg-stone-100 text-stone-500",
    brand: "bg-brand-100 text-brand-600",
    green: "bg-emerald-100 text-wild-greenDk",
    gold: "bg-amber-100 text-[#b8860b]",
    blue: "bg-sky-100 text-wild-blue",
    plum: "bg-fuchsia-100 text-wild-plum",
    teal: "bg-teal-100 text-wild-teal",
  };
  return (
    <section
      id={id}
      className="flex flex-col rounded-3xl border border-stone-100 bg-white/85 shadow-soft backdrop-blur-sm transition-shadow hover:shadow-[0_8px_30px_rgba(110,56,72,0.10)] scroll-mt-24"
    >
      <header className="flex items-center justify-between gap-2 border-b border-stone-100 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span
            className={clsx(
              "flex h-7 w-7 items-center justify-center rounded-xl",
              chip[accent],
            )}
          >
            {icon}
          </span>
          <h2 className="font-display text-[15px] tracking-wide text-stone-900">
            {title}
          </h2>
          {typeof count === "number" && (
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
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
  return <p className="py-6 text-center text-sm text-stone-400">{children}</p>;
}

export function Pill({
  children,
  tone = "stone",
}: {
  children: React.ReactNode;
  tone?: "stone" | "green" | "gold" | "rose" | "blue" | "plum" | "red";
}) {
  const tones: Record<string, string> = {
    stone: "bg-stone-100 text-stone-600",
    green: "bg-emerald-50 text-wild-greenDk",
    gold: "bg-amber-50 text-[#b8860b]",
    rose: "bg-brand-50 text-brand-600",
    blue: "bg-sky-50 text-wild-blue",
    plum: "bg-fuchsia-50 text-wild-plum",
    red: "bg-rose-50 text-rose-600",
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
