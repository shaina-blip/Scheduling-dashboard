"use client";

import { useTransition } from "react";
import { Mail, Check, Star, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, Empty } from "@/components/ui";
import { dismissEmail } from "@/app/actions";

export interface EmailView {
  id: string;
  fromName: string;
  subject: string;
  snippet: string;
  date: string;
  starred: boolean;
  important: boolean;
  link: string;
}

export default function EmailsWidget({
  emails,
  error,
}: {
  emails: EmailView[];
  error?: string | null;
}) {
  const [pending, start] = useTransition();

  return (
    <Card
      id="emails"
      title="Emails to reply to"
      icon={<Mail className="h-4 w-4" />}
      count={emails.length}
      accent="blue"
      action={
        <a
          href="https://mail.google.com/mail/u/0/#inbox"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          Open Gmail
        </a>
      }
    >
      {error ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {error}
        </p>
      ) : emails.length === 0 ? (
        <Empty>Inbox zero on the important stuff. Nice.</Empty>
      ) : (
        <ul className="divide-y divide-stone-100">
          {emails.map((e) => (
            <li key={e.id} className="group flex items-start gap-2 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-stone-800">
                    {e.fromName}
                  </span>
                  {e.starred && (
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  )}
                  <span className="ml-auto shrink-0 text-[11px] text-stone-400">
                    {formatDistanceToNow(new Date(e.date), { addSuffix: true })}
                  </span>
                </div>
                <p className="truncate text-sm text-stone-700">{e.subject}</p>
                <p className="truncate text-xs text-stone-400">{e.snippet}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1 opacity-0 transition group-hover:opacity-100">
                <a
                  href={e.link}
                  target="_blank"
                  rel="noreferrer"
                  title="Open thread"
                  className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-blue-600"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  title="Mark handled"
                  disabled={pending}
                  onClick={() => start(() => dismissEmail(e.id))}
                  className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-emerald-600"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
