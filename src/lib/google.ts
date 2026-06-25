import { google } from "googleapis";

function clientFor(accessToken: string) {
  const oauth2 = new google.auth.OAuth2();
  oauth2.setCredentials({ access_token: accessToken });
  return oauth2;
}

export interface EmailItem {
  id: string;
  threadId: string;
  from: string;
  fromName: string;
  subject: string;
  snippet: string;
  date: string; // ISO
  unread: boolean;
  starred: boolean;
  important: boolean;
  threadCount: number; // how many messages of this thread are in the result set
  body?: string; // plain-text body (only fetched when withBody is requested)
  link: string;
}

function decodeB64Url(data: string): string {
  try {
    return Buffer.from(
      data.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
  } catch {
    return "";
  }
}

/** Recursively pull plain-text (or stripped HTML) from a Gmail message payload. */
function extractBody(payload: any): string {
  if (!payload) return "";
  const mime = payload.mimeType ?? "";
  if (mime.startsWith("text/plain") && payload.body?.data)
    return decodeB64Url(payload.body.data);
  if (payload.parts) {
    for (const p of payload.parts) {
      const t = extractBody(p);
      if (t) return t;
    }
  }
  if (mime.startsWith("text/html") && payload.body?.data)
    return decodeB64Url(payload.body.data).replace(/<[^>]+>/g, " ");
  return "";
}

function header(headers: any[] | undefined, name: string): string {
  const h = headers?.find(
    (x) => x.name?.toLowerCase() === name.toLowerCase(),
  );
  return h?.value ?? "";
}

function parseFrom(raw: string): { fromName: string; from: string } {
  // "Jane Doe <jane@x.com>" or "jane@x.com"
  const match = raw.match(/^(.*?)<(.+?)>$/);
  if (match) {
    return {
      fromName: match[1].replace(/"/g, "").trim() || match[2].trim(),
      from: match[2].trim(),
    };
  }
  return { fromName: raw.trim(), from: raw.trim() };
}

// Marketing / automated senders that are never a real family — filtered out of
// the "needs a reply" list. Matched loosely against the From field (name or
// domain), so "asana" catches anything @asana.com. Add more terms here anytime.
export const IGNORED_SENDER_TERMS = ["asana", "verve"];

// Shaina's Gmail label names (her source of truth). Edit here if she renames one.
export const LABELS = {
  done: "DONE!",
  // Both of these count as "pending scheduling" from the new-family pipeline.
  schedulingPending: ["SCHEDULING - PENDING", "Summer Scheduling"],
  collegeLaunch: "College Launch",
};

/** Run a Gmail search and return mapped results, starred-first then newest.
 * Pass withBody to fetch full message bodies (used to find the student name). */
async function listEmails(
  gmail: any,
  q: string,
  max: number,
  withBody = false,
): Promise<EmailItem[]> {
  const list = await gmail.users.messages.list({
    userId: "me",
    q,
    maxResults: max,
  });

  const ids: string[] =
    list.data.messages?.map((m: any) => m.id!).filter(Boolean) ?? [];
  if (ids.length === 0) return [];

  const messages = await Promise.all(
    ids.map((id) =>
      gmail.users.messages.get({
        userId: "me",
        id,
        format: withBody ? "full" : "metadata",
        ...(withBody
          ? {}
          : { metadataHeaders: ["From", "Subject", "Date"] }),
      }),
    ),
  );

  const items: EmailItem[] = messages.map((res: any) => {
    const m = res.data;
    const headers = m.payload?.headers ?? [];
    const { fromName, from } = parseFrom(header(headers, "From"));
    const labelIds = m.labelIds ?? [];
    const internalDate = m.internalDate
      ? new Date(Number(m.internalDate)).toISOString()
      : new Date(header(headers, "Date") || Date.now()).toISOString();

    return {
      id: m.id!,
      threadId: m.threadId!,
      from,
      fromName,
      subject: header(headers, "Subject") || "(no subject)",
      snippet: m.snippet ?? "",
      date: internalDate,
      unread: labelIds.includes("UNREAD"),
      starred: labelIds.includes("STARRED"),
      important: labelIds.includes("IMPORTANT"),
      threadCount: 1,
      body: withBody ? extractBody(m.payload).slice(0, 4000) : undefined,
      link: `https://mail.google.com/mail/u/0/#inbox/${m.threadId}`,
    };
  });

  // Collapse to one entry per thread so a back-and-forth conversation shows as
  // a single item (and families aren't double-counted). Keep the most recent
  // message as the representative; carry starred/unread if any message has it.
  const byThread = new Map<string, EmailItem>();
  for (const it of items) {
    const ex = byThread.get(it.threadId);
    if (!ex) {
      byThread.set(it.threadId, it);
      continue;
    }
    ex.threadCount += 1;
    ex.starred = ex.starred || it.starred;
    ex.unread = ex.unread || it.unread;
    if (new Date(it.date) > new Date(ex.date)) {
      ex.id = it.id;
      ex.date = it.date;
      ex.subject = it.subject;
      ex.snippet = it.snippet;
      ex.from = it.from;
      ex.fromName = it.fromName;
      ex.body = it.body;
      ex.link = it.link;
    }
  }

  // Starred ("I need to act on this") first, then most recent.
  return [...byThread.values()].sort(
    (a, b) =>
      Number(b.starred) - Number(a.starred) ||
      new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

/**
 * Pending scheduling — pulled from the scheduling labels in Shaina's
 * new-family pipeline, minus anything already marked DONE!.
 */
export async function fetchSchedulingEmails(
  accessToken: string,
  max = 25,
): Promise<EmailItem[]> {
  const gmail = google.gmail({ version: "v1", auth: clientFor(accessToken) });
  const labelClause = LABELS.schedulingPending
    .map((l) => `label:"${l}"`)
    .join(" OR ");
  const q = `(${labelClause}) -label:"${LABELS.done}"`;
  return listEmails(gmail, q, max, true);
}

/**
 * Fetch emails that need a reply: everything in the inbox that ISN'T labeled
 * "Done", excluding Gmail's promotional/social/forum categories and known
 * marketing senders. Starred mail (Shaina's "I need to act on this" signal) is
 * pulled to the top. Falls back gracefully on error.
 */
export async function fetchActionEmails(
  accessToken: string,
  max = 30,
): Promise<EmailItem[]> {
  const gmail = google.gmail({ version: "v1", auth: clientFor(accessToken) });

  const ignore = IGNORED_SENDER_TERMS.map((t) => `-from:${t}`).join(" ");
  const q = [
    "in:inbox",
    `-label:"${LABELS.done}"`, // the COO's "handled" signal
    "-category:promotions",
    "-category:social",
    "-category:forums",
    "newer_than:90d",
    ignore,
  ]
    .filter(Boolean)
    .join(" ");
  return listEmails(gmail, q, max);
}

export interface DocItem {
  id: string;
  name: string;
  link: string;
  modifiedTime: string;
}

/**
 * List recently modified Google Docs — used for the "student notes" /
 * "College Launch updates" widget. Optionally filter by a name query.
 */
export async function fetchRecentDocs(
  accessToken: string,
  opts: { query?: string; max?: number } = {},
): Promise<DocItem[]> {
  const drive = google.drive({ version: "v3", auth: clientFor(accessToken) });
  const max = opts.max ?? 10;

  let q = "mimeType='application/vnd.google-apps.document' and trashed=false";
  if (opts.query) {
    const safe = opts.query.replace(/'/g, "\\'");
    q += ` and name contains '${safe}'`;
  }

  const res = await drive.files.list({
    q,
    orderBy: "modifiedTime desc",
    pageSize: max,
    fields: "files(id,name,modifiedTime,webViewLink)",
  });

  return (res.data.files ?? []).map((f) => ({
    id: f.id!,
    name: f.name ?? "Untitled",
    link: f.webViewLink ?? `https://docs.google.com/document/d/${f.id}/edit`,
    modifiedTime: f.modifiedTime ?? new Date().toISOString(),
  }));
}

export interface NotesDoc {
  link: string;
  modifiedTime: string | null;
  modifiedByMe: boolean;
}

/**
 * Find a student's tutoring-notes doc in the "Students" shared drive. Each
 * student has a folder "Last, First" containing "First Last Tutoring Notes" —
 * we match by that doc name across all drives. Returns last-edited time and
 * whether the signed-in user was the last editor (so we can auto-clear the
 * reminder once she's updated it). Null if not found.
 */
export async function findNotesDoc(
  accessToken: string,
  studentName: string,
): Promise<NotesDoc | null> {
  const drive = google.drive({ version: "v3", auth: clientFor(accessToken) });
  const safe = studentName.replace(/'/g, "\\'");
  const shared = {
    corpora: "allDrives" as const,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    fields:
      "files(id,name,modifiedTime,webViewLink,lastModifyingUser(me,emailAddress))",
    pageSize: 5,
  };

  // Exact name first, then a looser contains match.
  const queries = [
    `name = '${safe} Tutoring Notes' and trashed = false`,
    `name contains '${safe}' and name contains 'Tutoring Notes' and trashed = false`,
  ];

  for (const q of queries) {
    try {
      const res = await drive.files.list({ q, ...shared });
      const f = res.data.files?.[0];
      if (f) {
        return {
          link:
            f.webViewLink ??
            `https://docs.google.com/document/d/${f.id}/edit`,
          modifiedTime: f.modifiedTime ?? null,
          modifiedByMe: f.lastModifyingUser?.me ?? false,
        };
      }
    } catch {
      // try next query
    }
  }
  return null;
}
