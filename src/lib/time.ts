// Time helpers for the sessions tracker. Session times in TeachWorks are local
// (Wildewood is US Eastern); Drive edit timestamps are UTC. We convert a
// session's wall-clock end time to a real UTC instant so "did she edit the
// notes AFTER the session?" is accurate (and DST-correct).

const LOCAL_TZ = process.env.LOCAL_TZ || "America/New_York";

export function parseHM(s: string | null | undefined): { h: number; m: number } | null {
  if (!s) return null;
  const m = s.trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ap = m[3]?.toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return { h, m: min };
}

/** ms to add to a tz wall-clock time to get the UTC instant, at the given moment. */
function tzOffsetMs(utcMs: number, tz: string): number {
  const d = new Date(utcMs);
  const tzWall = new Date(d.toLocaleString("en-US", { timeZone: tz }));
  const utcWall = new Date(d.toLocaleString("en-US", { timeZone: "UTC" }));
  return utcWall.getTime() - tzWall.getTime();
}

/** Convert a wall-clock time in LOCAL_TZ (y, 0-based month, d, h, m) to a UTC Date. */
export function zonedToUtc(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  tz = LOCAL_TZ,
): Date {
  const guess = Date.UTC(y, mo, d, h, mi);
  const offset = tzOffsetMs(guess, tz);
  return new Date(guess + offset);
}

/**
 * The UTC instant a session ended, from its stored calendar date (UTC midnight)
 * plus its end time (falls back to start time, then end-of-day).
 */
export function sessionEndUtc(
  date: Date,
  endTime: string | null,
  startTime: string | null,
): Date {
  const y = date.getUTCFullYear();
  const mo = date.getUTCMonth();
  const d = date.getUTCDate();
  const hm = parseHM(endTime) ?? parseHM(startTime);
  if (!hm) return zonedToUtc(y, mo, d, 23, 59);
  return zonedToUtc(y, mo, d, hm.h, hm.m);
}
