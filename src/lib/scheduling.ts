import type { FamilyItem } from "./pipeline";
import type { EmailItem } from "./google";

// Unified scheduling to-do item, merged from the pipeline + Gmail with dedupe.
export interface ScheduleTodo {
  key: string; // stable id for persistence: "fam:<id>" or "thread:<threadId>"
  title: string; // family / parent name
  subtitle: string; // student · program · stage  OR  email subject
  sources: ("pipeline" | "gmail")[];
  date: string | null; // most recent email date, if any
  starred: boolean;
  stageName: string | null;
  emailLink: string | null;
  pipelineLink: string | null;
}

const PIPELINE_URL =
  "https://shaina-blip.github.io/wildewood-new-family-pipeline/";

function norm(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function emailAddr(s: string | null | undefined): string {
  const m = (s ?? "").match(/[^\s<>]+@[^\s<>]+/);
  return (m ? m[0] : s ?? "").toLowerCase().trim();
}

/**
 * Does this Gmail thread look like it's about this family? Match on the family's
 * email address, or on a full name (student or parent) appearing in the
 * sender/subject.
 */
function emailMatchesFamily(e: EmailItem, fam: FamilyItem): boolean {
  const famEmail = emailAddr(fam.email);
  if (famEmail && emailAddr(e.from) === famEmail) return true;

  const hay = norm(`${e.fromName} ${e.subject} ${e.from}`);
  const names = [norm(fam.studentName), norm(fam.parentName)].filter(
    (n) => n.length >= 4 && n.includes(" "), // require a full "first last"
  );
  return names.some((n) => hay.includes(n));
}

/**
 * Merge pipeline families and Gmail scheduling threads into one deduped to-do
 * list. A family present in both sources becomes a single item tagged
 * ["pipeline","gmail"]; unmatched Gmail threads stand alone.
 */
export function mergeScheduling(
  families: FamilyItem[],
  emails: EmailItem[],
): ScheduleTodo[] {
  const todos: ScheduleTodo[] = [];
  const usedThreads = new Set<string>();

  for (const fam of families) {
    const matches = emails.filter(
      (e) => !usedThreads.has(e.threadId) && emailMatchesFamily(e, fam),
    );
    matches.forEach((m) => usedThreads.add(m.threadId));
    const best = matches.sort(
      (a, b) =>
        Number(b.starred) - Number(a.starred) ||
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    )[0];

    todos.push({
      key: `fam:${fam.id}`,
      title: fam.parentName || fam.studentName,
      subtitle: [fam.studentName, fam.program, fam.stageName]
        .filter(Boolean)
        .join(" · "),
      sources: matches.length ? ["pipeline", "gmail"] : ["pipeline"],
      date: best?.date ?? null,
      starred: best?.starred ?? false,
      stageName: fam.stageName,
      emailLink: best?.link ?? null,
      pipelineLink: PIPELINE_URL,
    });
  }

  for (const e of emails) {
    if (usedThreads.has(e.threadId)) continue;
    todos.push({
      key: `thread:${e.threadId}`,
      title: e.fromName,
      subtitle: e.subject,
      sources: ["gmail"],
      date: e.date,
      starred: e.starred,
      stageName: null,
      emailLink: e.link,
      pipelineLink: null,
    });
  }

  // Starred first, then most recent activity, then alphabetical.
  return todos.sort(
    (a, b) =>
      Number(b.starred) - Number(a.starred) ||
      new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime() ||
      a.title.localeCompare(b.title),
  );
}
