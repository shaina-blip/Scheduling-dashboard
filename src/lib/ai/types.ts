// Shared types for the suggestion engine. The dashboard collects a "snapshot"
// of operational state and the engine turns it into ranked, actionable
// suggestions. Keeping this provider-agnostic lets us swap the local rule
// engine for a Claude-powered one without touching the UI.

export type SuggestionSeverity = "urgent" | "attention" | "info";

export interface Suggestion {
  id: string;
  title: string;
  detail: string;
  severity: SuggestionSeverity;
  category:
    | "Email"
    | "Schedule"
    | "Students"
    | "College Launch"
    | "Reminders"
    | "KPIs"
    | "Projects"
    | "Pattern";
  // Optional deep link into the dashboard / external tool.
  actionLabel?: string;
  actionHref?: string;
  score: number; // higher = more important; used for ordering
}

export interface DashboardSnapshot {
  now: string; // ISO timestamp (passed in so the engine is deterministic)
  emails: {
    total: number;
    oldestDays: number | null;
    topSenders: string[];
  };
  schedule: {
    pending: number;
    nextStart: string | null;
    cancellationsLast30: number;
    sessionsLast30: number;
  };
  students: {
    newCount: number;
    needsInstructorEmail: number;
    needsNotes: number;
    instructorLoad: { instructor: string; count: number }[];
  };
  collegeLaunch: {
    updatesOwed: number;
    names: string[];
  };
  reminders: {
    overdue: { title: string; days: number }[];
    dueSoon: { title: string; days: number }[];
    inventoryDue: boolean;
  };
  kpis: {
    offTarget: { name: string; value: number; target: number; unit: string | null }[];
  };
  projects: {
    staleActive: { title: string; days: number }[];
    parkedCount: number;
  };
}
