import { FileText, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, Empty } from "@/components/ui";

export interface DocView {
  id: string;
  name: string;
  link: string;
  modifiedTime: string;
}

export default function DocsWidget({
  docs,
  error,
}: {
  docs: DocView[];
  error?: string | null;
}) {
  return (
    <Card
      id="docs"
      title="Google Docs"
      icon={<FileText className="h-4 w-4" />}
      count={docs.length}
      accent="blue"
      action={
        <a
          href="https://docs.google.com/document/u/0/"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          New doc
        </a>
      }
    >
      {error ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {error}
        </p>
      ) : docs.length === 0 ? (
        <Empty>No recent docs. Student notes & College Launch docs appear here.</Empty>
      ) : (
        <ul className="divide-y divide-stone-100">
          {docs.map((d) => (
            <li key={d.id}>
              <a
                href={d.link}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-2 py-2"
              >
                <FileText className="h-4 w-4 shrink-0 text-blue-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-stone-800 group-hover:text-blue-600">
                    {d.name}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    edited{" "}
                    {formatDistanceToNow(new Date(d.modifiedTime), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-stone-300 group-hover:text-blue-500" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
