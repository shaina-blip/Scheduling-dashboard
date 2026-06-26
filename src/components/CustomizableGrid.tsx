"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import {
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  EyeOff,
  Plus,
  Check,
} from "lucide-react";
import { saveWidgetPrefs } from "@/app/actions";

export interface GridItem {
  key: string;
  title: string;
  node: ReactNode;
}

export default function CustomizableGrid({
  items,
  savedOrder,
  savedHidden,
}: {
  items: GridItem[];
  savedOrder: string[];
  savedHidden: string[];
}) {
  const knownKeys = useMemo(() => items.map((i) => i.key), [items]);
  const byKey = useMemo(
    () => Object.fromEntries(items.map((i) => [i.key, i])),
    [items],
  );

  // Reconcile saved prefs with the widgets that actually exist.
  const initialHidden = savedHidden.filter((k) => knownKeys.includes(k));
  const initialVisible = (() => {
    const base = (savedOrder.length ? savedOrder : knownKeys).filter(
      (k) => knownKeys.includes(k) && !initialHidden.includes(k),
    );
    // Append any new widgets that weren't in saved order.
    for (const k of knownKeys) {
      if (!base.includes(k) && !initialHidden.includes(k)) base.push(k);
    }
    return base;
  })();

  const [visible, setVisible] = useState<string[]>(initialVisible);
  const [hidden, setHidden] = useState<string[]>(initialHidden);
  const [editing, setEditing] = useState(false);
  const [, start] = useTransition();

  function persist(nextVisible: string[], nextHidden: string[]) {
    start(() => saveWidgetPrefs(nextVisible, nextHidden));
  }

  function move(key: string, dir: -1 | 1) {
    const i = visible.indexOf(key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= visible.length) return;
    const next = [...visible];
    [next[i], next[j]] = [next[j], next[i]];
    setVisible(next);
    persist(next, hidden);
  }

  function hide(key: string) {
    const nextVisible = visible.filter((k) => k !== key);
    const nextHidden = [...hidden, key];
    setVisible(nextVisible);
    setHidden(nextHidden);
    persist(nextVisible, nextHidden);
  }

  function show(key: string) {
    const nextHidden = hidden.filter((k) => k !== key);
    const nextVisible = [...visible, key];
    setHidden(nextHidden);
    setVisible(nextVisible);
    persist(nextVisible, nextHidden);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-end">
        <button
          onClick={() => setEditing((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
            editing
              ? "border-brand-300 bg-brand-50 text-brand-700"
              : "border-stone-200 text-stone-600 hover:bg-stone-50"
          }`}
        >
          {editing ? (
            <Check className="h-4 w-4" />
          ) : (
            <SlidersHorizontal className="h-4 w-4" />
          )}
          {editing ? "Done" : "Customize layout"}
        </button>
      </div>

      {editing && hidden.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white/70 px-3 py-2">
          <span className="text-xs text-stone-400">Hidden:</span>
          {hidden.map((k) => (
            <button
              key={k}
              onClick={() => show(k)}
              className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-brand-50 hover:text-brand-700"
            >
              <Plus className="h-3 w-3" />
              {byKey[k]?.title ?? k}
            </button>
          ))}
        </div>
      )}

      <div className="gap-5 lg:columns-3 [&>*]:mb-5 [&>*]:break-inside-avoid">
        {visible.map((key) => {
          const item = byKey[key];
          if (!item) return null;
          return (
            <div key={key} className="relative">
              {editing && (
                <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-lg border border-stone-200 bg-white/95 p-0.5 shadow-sm">
                  <button
                    title="Move up"
                    onClick={() => move(key, -1)}
                    className="rounded p-1 text-stone-500 hover:bg-stone-100"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    title="Move down"
                    onClick={() => move(key, 1)}
                    className="rounded p-1 text-stone-500 hover:bg-stone-100"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    title="Hide"
                    onClick={() => hide(key)}
                    className="rounded p-1 text-stone-500 hover:bg-red-50 hover:text-red-500"
                  >
                    <EyeOff className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className={editing ? "pointer-events-none" : ""}>
                {item.node}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
