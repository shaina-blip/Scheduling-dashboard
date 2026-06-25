import type { FamilyItem } from "./pipeline";
import type { EmailItem } from "./google";

// Unified scheduling to-do item, merged from the pipeline + Gmail with dedupe.
export interface ScheduleTodo {
  key: string; // stable id for persistence: "fam:<id>" or "thread:<threadId>"
  title: string; // family / parent name (the person emailed)
  student: string | null; // who it's about
  subtitle: string; // program · stage  OR  email subject
  sources: ("pipeline" | "gmail")[];
  date: string | null; // most recent email date, if any
  starred: boolean;
  stageName: string | null;
  emailLink: string | null;
  pipelineLink: string | null;
}

const PIPELINE_URL =
  "https://shaina-blip.github.io/wildewood-new-family-pipeline/";

// Pipeline stages that count as "needs scheduling": survey complete through
// schedule confirmed. Closed/dropped families are excluded.
const PENDING_STAGES = new Set([3, 4, 5]);
const CLOSED = new Set(["Not moving forward", "Gone Rogue"]);

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

/** Best-guess the student an email is about, using the family list as a name
 * dictionary: match the sender's email first, else scan subject + preview for a
 * known full student name. */
function studentFromEmail(
  e: EmailItem,
  families: FamilyItem[],
): string | null {
  // 1) Most reliable: the sender's email matches a family.
  const from = emailAddr(e.from);
  if (from) {
    const byEmail = families.find((f) => emailAddr(f.email) === from);
    if (byEmail?.studentName) return byEmail.studentName;
  }

  const text = `${e.subject} ${e.snippet} ${e.body ?? ""}`;
  const hay = norm(text);

  // 2) A known student's full name appears anywhere in the email.
  for (const f of families) {
    const n = norm(f.studentName);
    if (n.length >= 4 && n.includes(" ") && hay.includes(n))
      return f.studentName;
  }

  // 3) Heuristic phrasing, e.g. "my son Jovan", "for my daughter Mia",
  //    "regarding Jovan Montijo", "Jovan's sessions".
  const patterns = [
    /\b(?:my|our)\s+(?:son|daughter|child|kid|student)\s+(?:is\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
    /\b(?:for|regarding|about|re:)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/,
    /\b([A-Z][a-z]+\s+[A-Z][a-z]+)(?:'s|’s)\b/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

/**
 * Merge pipeline families (scheduling stages) and Gmail scheduling threads into
 * one deduped to-do list. A family present in both sources becomes a single item
 * tagged ["pipeline","gmail"]; unmatched Gmail threads stand alone (labeled with
 * the student name when we can find it). `families` is the FULL family list.
 */
export function mergeScheduling(
  families: FamilyItem[],
  emails: EmailItem[],
): ScheduleTodo[] {
  const scheduling = families.filter(
    (f) =>
      PENDING_STAGES.has(f.stage) && !CLOSED.has(f.decisionStatus ?? ""),
  );

  const todos: ScheduleTodo[] = [];
  const usedThreads = new Set<string>();

  for (const fam of scheduling) {
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
      student: fam.studentName || null,
      subtitle: [fam.program, fam.stageName].filter(Boolean).join(" · "),
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
      student: studentFromEmail(e, families),
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
