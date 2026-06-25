import { CalendarClock, ExternalLink, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, Empty } from "@/components/ui";

export interface SchedulingView {
  id: string;
  fromName: string;
  subject: string;
  date: string;
  starred: boolean;
  link: string;
}

export default function PendingSchedulingWidget({
  items,
  error,
}: {
  items: SchedulingView[];
  error?: string | null;
}) {
  return (
    <Card
      id="schedule"
      title="Pending scheduling"
      icon={<CalendarClock className="h-4 w-4" />}
      count={items.length}
      accent="plum"
    >
      {error ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {error}
        </p>
      ) : items.length === 0 ? (
        <Empty>Nothing waiting in your scheduling labels. All clear.</Empty>
      ) : (
        <>
          <ul className="divide-y divide-stone-100">
            {items.map((it) => (
              <li key={it.id}>
                <a
                  href={it.link}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start gap-2 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-stone-800">
                        {it.fromName}
                      </span>
                      {it.starred && (
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      )}
                      <span className="ml-auto shrink-0 text-[11px] text-stone-400">
                        {formatDistanceToNow(new Date(it.date), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="truncate text-sm text-stone-600">
                      {it.subject}
                    </p>
                  </div>
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-300 group-hover:text-wild-plum" />
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 rounded-xl bg-brand-50/60 px-3 py-2 text-[11px] leading-relaxed text-stone-500">
            ✨ Once a family&apos;s scheduling is confirmed, loop in the
            instructor <strong>and Tara</strong> (educational concerns go to
            her), then label the thread{" "}
            <span className="font-medium text-brand-600">DONE!</span> to clear
            it.
          </p>
        </>
      )}
    </Card>
  );
}
