import { GoogleAuth } from "google-auth-library";

// Reads the New Family Pipeline's Firestore `families` collection (the same data
// the pipeline web app writes). Auth is via a Firebase service account JSON
// placed in FIREBASE_SERVICE_ACCOUNT (raw JSON or base64). Returns [] if not
// configured, so the dashboard degrades to Gmail-only scheduling.

export interface FamilyItem {
  id: string;
  parentName: string;
  studentName: string;
  program: string | null;
  location: string | null;
  stage: number;
  stageName: string;
  decisionStatus: string | null;
  email: string | null;
  owner: string | null;
}

const STAGE_NAMES: Record<number, string> = {
  1: "Consult Complete",
  2: "Survey Sent",
  3: "Survey Complete",
  4: "Schedule Built",
  5: "Schedule Confirmed",
  6: "Confirmed & Invoiced",
  7: "Invoice Paid",
  8: "Active",
};

const CLOSED = new Set(["Not moving forward", "Gone Rogue"]);

// Stages that count as "needs scheduling attention": survey complete through
// schedule confirmed. Before that it's not ready; after, scheduling is settled.
const PENDING_STAGES = new Set([3, 4, 5]);

function fv(field: any): any {
  if (!field) return null;
  if ("stringValue" in field) return field.stringValue;
  if ("integerValue" in field) return Number(field.integerValue);
  if ("doubleValue" in field) return field.doubleValue;
  if ("booleanValue" in field) return field.booleanValue;
  if ("timestampValue" in field) return field.timestampValue;
  if ("nullValue" in field) return null;
  if ("arrayValue" in field)
    return (field.arrayValue.values ?? []).map(fv);
  return null;
}

function loadCredentials(): any | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    } catch {
      return null;
    }
  }
}

export async function fetchPipelineFamilies(): Promise<FamilyItem[]> {
  const creds = loadCredentials();
  if (!creds?.project_id) return [];

  const auth = new GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/datastore"],
  });
  const client = await auth.getClient();
  const url = `https://firestore.googleapis.com/v1/projects/${creds.project_id}/databases/(default)/documents/families?pageSize=300`;

  const res: any = await client.request({ url });
  const docs: any[] = res.data?.documents ?? [];

  const families: FamilyItem[] = docs.map((d) => {
    const f = d.fields ?? {};
    const stage = Number(fv(f.stage)) || 0;
    return {
      id: (d.name ?? "").split("/").pop() ?? "",
      parentName: fv(f.parentName) ?? "",
      studentName: fv(f.studentName) ?? "",
      program: fv(f.program),
      location: fv(f.location),
      stage,
      stageName: STAGE_NAMES[stage] ?? "",
      decisionStatus: fv(f.decisionStatus),
      email: fv(f.email),
      owner: fv(f.currentOwner),
    };
  });

  return families.filter(
    (f) =>
      PENDING_STAGES.has(f.stage) &&
      !CLOSED.has(f.decisionStatus ?? "") &&
      (f.studentName || f.parentName),
  );
}
