import { Hourglass, ExternalLink } from "lucide-react";
import { formatDistanceToNow, differenceInCalendarDays } from "date-fns";
import { Card, Empty, Pill } from "@/components/ui";

export interface WaitingView {
  id: string;
  fromName: string;
  subject: string;
  date: string;
  link: string;
}

export default function WaitingWidget({
  items,
  error,
}: {
  items: WaitingView[];
  error?: string | null;
}) {
  return (
    <Card
      id="waiting"
      title="Waiting On"
      icon={<Hourglass className="h-4 w-4" />}
      count={items.length}
      accent="gold"
    >
      {error ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {error}
        </p>
      ) : items.length === 0 ? (
        <Empty>Nothing you&apos;re waiting on. Ball&apos;s in no one else&apos;s court.</Empty>
      ) : (
        <ul className="divide-y divide-stone-100">
          {items.map((e) => {
            const days = differenceInCalendarDays(new Date(), new Date(e.date));
            const stale = days >= 5;
            return (
              <li key={e.id}>
                <a
                  href={e.link}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start gap-2 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-stone-800">
                        {e.fromName}
                      </span>
                      {stale && <Pill tone="red">nudge?</Pill>}
                      <span className="ml-auto shrink-0 text-[11px] text-stone-400">
                        {formatDistanceToNow(new Date(e.date), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="truncate text-sm text-stone-600">
                      {e.subject}
                    </p>
                  </div>
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-300 group-hover:text-[#c79a16]" />
                </a>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-2 text-center text-[11px] text-stone-400">
        From your @waiting label · flagged to nudge after 5 days
      </p>
    </Card>
  );
}
