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
  link: string;
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

/**
 * Fetch emails that likely need a reply: important OR starred messages in the
 * inbox that are unread, from the last ~30 days. Falls back gracefully on error.
 */
export async function fetchActionEmails(
  accessToken: string,
  max = 12,
): Promise<EmailItem[]> {
  const gmail = google.gmail({ version: "v1", auth: clientFor(accessToken) });

  const list = await gmail.users.messages.list({
    userId: "me",
    // Unread inbox mail that Gmail thinks matters, or that the user starred.
    q: "in:inbox is:unread (is:important OR is:starred OR category:primary) newer_than:30d",
    maxResults: max,
  });

  const ids = list.data.messages?.map((m) => m.id!).filter(Boolean) ?? [];
  if (ids.length === 0) return [];

  const messages = await Promise.all(
    ids.map((id) =>
      gmail.users.messages.get({
        userId: "me",
        id,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      }),
    ),
  );

  return messages.map((res) => {
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
      link: `https://mail.google.com/mail/u/0/#inbox/${m.threadId}`,
    };
  });
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
