import Papa from "papaparse";

/**
 * TeachWorks report exports vary by report and account configuration, so we map
 * columns by fuzzy header matching rather than assuming a fixed schema. The two
 * report types we support:
 *   - Students / enrollments  -> Student records
 *   - Calendar / lessons      -> ScheduleItem records
 *
 * Header matching is case-insensitive and ignores spaces/underscores, so
 * "Student Name", "student_name" and "StudentName" all match.
 */

export type ParsedStudent = {
  externalId: string | null;
  name: string;
  instructor: string | null;
  startDate: string | null; // ISO or null
  status: "NEW" | "ACTIVE" | "INACTIVE";
};

export type ParsedSchedule = {
  externalId: string | null;
  studentName: string;
  instructor: string | null;
  subject: string | null;
  startsAt: string | null;
  endsAt: string | null;
  location: string | null;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
};

function norm(s: string): string {
  return s.toLowerCase().replace(/[\s_\-./]/g, "");
}

/** Find the first row key whose normalized header matches one of the aliases. */
function pick(row: Record<string, string>, aliases: string[]): string | null {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const target = norm(alias);
    const key = keys.find((k) => norm(k) === target);
    if (key && row[key]?.trim()) return row[key].trim();
  }
  // looser "contains" pass
  for (const alias of aliases) {
    const target = norm(alias);
    const key = keys.find((k) => norm(k).includes(target));
    if (key && row[key]?.trim()) return row[key].trim();
  }
  return null;
}

function parseDate(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (!isNaN(d.getTime())) return d.toISOString();
  // Try MM/DD/YYYY HH:mm common in TeachWorks exports
  const m = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    const [, mm, dd, yy] = m;
    const year = yy.length === 2 ? 2000 + Number(yy) : Number(yy);
    const d2 = new Date(year, Number(mm) - 1, Number(dd));
    if (!isNaN(d2.getTime())) return d2.toISOString();
  }
  return null;
}

export type DetectedKind = "students" | "schedule" | "lessons" | "unknown";

export type ParsedLesson = {
  externalKey: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  title: string | null;
  educator: string | null;
  educatorFirst: string | null;
  studentName: string;
  service: string | null;
  location: string | null;
};

/** Heuristically decide what kind of TeachWorks report a CSV is. */
export function detectKind(headers: string[]): DetectedKind {
  const h = headers.map(norm);
  const has = (...names: string[]) =>
    names.some((n) => h.some((x) => x.includes(norm(n))));

  // Lesson Summary export: has Educator + Student name columns.
  const lessonSignals =
    has("educatorfirstname", "educatorlastname") ||
    (has("educator") && has("studentfirstname"));
  if (lessonSignals) return "lessons";

  const scheduleSignals = has(
    "starttime",
    "lessondate",
    "lessonstart",
    "appointment",
    "eventdate",
    "session",
  );
  const studentSignals = has("enrollment", "studentstatus", "joindate", "grade");

  if (scheduleSignals && !studentSignals) return "schedule";
  if (studentSignals && !scheduleSignals) return "students";
  // Both or neither: a "student name" + "instructor" + a date that looks like a
  // start time leans schedule; otherwise students.
  if (scheduleSignals) return "schedule";
  if (has("student", "name")) return "students";
  return "unknown";
}

export function parseCsv(text: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  const rows = (result.data ?? []).filter(
    (r) => Object.values(r).some((v) => v && String(v).trim()),
  );
  const headers = result.meta.fields ?? (rows[0] ? Object.keys(rows[0]) : []);
  return { headers, rows };
}

export function mapStudents(rows: Record<string, string>[]): ParsedStudent[] {
  const out: ParsedStudent[] = [];
  for (const row of rows) {
    const name =
      pick(row, ["Student Name", "Student", "Name", "Full Name"]) ?? "";
    if (!name) continue;
    const rawStatus = (
      pick(row, ["Status", "Student Status", "Enrollment Status"]) ?? ""
    ).toLowerCase();
    let status: ParsedStudent["status"] = "ACTIVE";
    if (rawStatus.includes("new") || rawStatus.includes("prospect"))
      status = "NEW";
    else if (
      rawStatus.includes("inactive") ||
      rawStatus.includes("former") ||
      rawStatus.includes("archiv")
    )
      status = "INACTIVE";

    out.push({
      externalId: pick(row, ["Student ID", "ID", "TeachWorks ID"]),
      name,
      instructor: pick(row, [
        "Instructor",
        "Teacher",
        "Tutor",
        "Assigned Instructor",
      ]),
      startDate: parseDate(
        pick(row, ["Start Date", "Join Date", "Enrolled", "Created"]),
      ),
      status,
    });
  }
  return out;
}

export function mapLessons(rows: Record<string, string>[]): ParsedLesson[] {
  const out: ParsedLesson[] = [];
  for (const row of rows) {
    const ef = pick(row, [
      "Educator First Name",
      "Educator First",
      "Instructor First Name",
    ]);
    const el = pick(row, [
      "Educator Last Name",
      "Educator Last",
      "Instructor Last Name",
    ]);
    const sf = pick(row, ["Student First Name", "Student First"]);
    const sl = pick(row, ["Student Last Name", "Student Last"]);
    const studentName = [sf, sl].filter(Boolean).join(" ").trim();
    if (!studentName) continue;

    const educator = [ef, el].filter(Boolean).join(" ").trim() || null;
    const date = parseDate(pick(row, ["Date", "Lesson Date"]));
    const startTime = pick(row, ["Start Time", "Start"]);
    const endTime = pick(row, ["End Time", "End"]);
    const title = pick(row, ["Title", "Lesson", "Subject"]);
    const service = pick(row, ["Service", "Program", "Course"]);
    const location = pick(row, ["Location", "Site", "Room"]);
    const externalKey = [date ?? "", startTime ?? "", studentName, educator ?? ""].join(
      "|",
    );

    out.push({
      externalKey,
      date,
      startTime,
      endTime,
      title,
      educator,
      educatorFirst: ef,
      studentName,
      service,
      location,
    });
  }
  return out;
}

export function mapSchedule(rows: Record<string, string>[]): ParsedSchedule[] {
  const out: ParsedSchedule[] = [];
  for (const row of rows) {
    const studentName =
      pick(row, ["Student Name", "Student", "Client", "Name"]) ?? "";
    if (!studentName) continue;
    const rawStatus = (
      pick(row, ["Status", "Lesson Status", "Appointment Status"]) ?? ""
    ).toLowerCase();
    let status: ParsedSchedule["status"] = "PENDING";
    if (
      rawStatus.includes("confirm") ||
      rawStatus.includes("complete") ||
      rawStatus.includes("attended")
    )
      status = "CONFIRMED";
    else if (rawStatus.includes("cancel") || rawStatus.includes("no show"))
      status = "CANCELLED";

    out.push({
      externalId: pick(row, ["Lesson ID", "Event ID", "Appointment ID", "ID"]),
      studentName,
      instructor: pick(row, ["Instructor", "Teacher", "Tutor"]),
      subject: pick(row, ["Subject", "Service", "Lesson Type", "Course"]),
      startsAt: parseDate(
        pick(row, ["Start Time", "Start", "Lesson Date", "Date", "When"]),
      ),
      endsAt: parseDate(pick(row, ["End Time", "End", "Finish"])),
      location: pick(row, ["Location", "Room", "Site"]),
      status,
    });
  }
  return out;
}
