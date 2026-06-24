import type { DashboardSnapshot, Suggestion } from "./types";
import { generateLocalSuggestions } from "./localEngine";

export type { DashboardSnapshot, Suggestion } from "./types";

/**
 * Entry point for the suggestion engine.
 *
 * Today this always runs the local rule engine (no API key, instant, private).
 * The seam for Claude is intentionally explicit: when `AI_PROVIDER=claude` and
 * a key is configured, route the same snapshot to a Claude-backed engine that
 * returns the same `Suggestion[]` shape. The UI never has to change.
 *
 * Why we kept it local for v1 (per project decision): build out the full
 * reasoning logic first, prove the data plumbing, then upgrade the "brain"
 * without re-plumbing anything.
 */
export async function getSuggestions(
  snapshot: DashboardSnapshot,
): Promise<{ suggestions: Suggestion[]; engine: "local" | "claude" }> {
  const provider = (process.env.AI_PROVIDER ?? "local").toLowerCase();

  if (provider === "claude" && process.env.ANTHROPIC_API_KEY) {
    // Future: call Claude with the snapshot + an operations-COO system prompt,
    // validate the JSON against the Suggestion schema, and fall back to local
    // on any error. Stubbed to local for now so behavior is stable.
    return { suggestions: generateLocalSuggestions(snapshot), engine: "local" };
  }

  return { suggestions: generateLocalSuggestions(snapshot), engine: "local" };
}
