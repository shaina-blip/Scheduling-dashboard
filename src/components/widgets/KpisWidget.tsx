"use client";

import { useState, useTransition } from "react";
import { TrendingUp, Plus, Trash2, Check, Pencil } from "lucide-react";
import { Card, Empty } from "@/components/ui";
import { createKpi, updateKpiValue, deleteKpi } from "@/app/actions";
import { clsx } from "@/lib/clsx";

export interface KpiView {
  id: string;
  name: string;
  value: number;
  target: number | null;
  unit: string | null;
  period: string | null;
  higherIsBetter: boolean;
}

function statusOf(k: KpiView): "ok" | "off" | "none" {
  if (k.target == null) return "none";
  const meets = k.higherIsBetter ? k.value >= k.target : k.value <= k.target;
  return meets ? "ok" : "off";
}

function KpiRow({
  k,
  pending,
  start,
}: {
  k: KpiView;
  pending: boolean;
  start: (cb: () => void) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(k.value));
  const status = statusOf(k);
  const pct =
    k.target && k.target !== 0
      ? Math.min(100, Math.round((k.value / k.target) * 100))
      : null;

  return (
    <li className="group rounded-lg border border-stone-200 px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-stone-800">
            {k.name}
            {k.period && (
              <span className="ml-1 text-[11px] font-normal text-stone-400">
                · {k.period}
              </span>
            )}
          </p>
        </div>
        {editing ? (
          <form
            action={() => {
              start(() => updateKpiValue(k.id, Number(val) || 0));
              setEditing(false);
            }}
            className="flex items-center gap-1"
          >
            <input
              autoFocus
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="w-20 rounded border border-stone-200 px-1.5 py-0.5 text-sm"
            />
            <button className="rounded p-1 text-emerald-600 hover:bg-emerald-50">
              <Check className="h-3.5 w-3.5" />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-baseline gap-1 rounded px-1 hover:bg-stone-50"
          >
            <span
              className={clsx(
                "text-base font-semibold",
                status === "off" ? "text-red-600" : "text-stone-900",
              )}
            >
              {k.value}
              {k.unit}
            </span>
            {k.target != null && (
              <span className="text-xs text-stone-400">
                / {k.target}
                {k.unit}
              </span>
            )}
            <Pencil className="ml-0.5 h-3 w-3 text-stone-300" />
          </button>
        )}
        <button
          title="Delete"
          disabled={pending}
          onClick={() => start(() => deleteKpi(k.id))}
          className="rounded p-1 text-stone-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {pct != null && (
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
          <div
            className={clsx(
              "h-full rounded-full",
              status === "off" ? "bg-red-400" : "bg-emerald-400",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </li>
  );
}

export default function KpisWidget({ kpis }: { kpis: KpiView[] }) {
  const [pending, start] = useTransition();
  const [showForm, setShowForm] = useState(false);

  return (
    <Card
      id="kpis"
      title="KPIs"
      icon={<TrendingUp className="h-4 w-4" />}
      count={kpis.length}
      accent="brand"
      action={
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      }
    >
      {showForm && (
        <form
          action={(fd) => {
            start(() => createKpi(fd));
            setShowForm(false);
          }}
          className="mb-3 grid gap-2 rounded-xl bg-stone-50 p-3"
        >
          <input
            name="name"
            required
            placeholder="KPI name (e.g. Active students)"
            className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              name="value"
              type="number"
              step="any"
              placeholder="Now"
              className="w-20 rounded-lg border border-stone-200 px-2 py-1 text-xs"
            />
            <input
              name="target"
              type="number"
              step="any"
              placeholder="Target"
              className="w-20 rounded-lg border border-stone-200 px-2 py-1 text-xs"
            />
            <input
              name="unit"
              placeholder="Unit"
              className="w-16 rounded-lg border border-stone-200 px-2 py-1 text-xs"
            />
            <select
              name="period"
              defaultValue="Monthly"
              className="rounded-lg border border-stone-200 px-2 py-1 text-xs"
            >
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Quarterly</option>
            </select>
            <button className="ml-auto rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">
              Add
            </button>
          </div>
          <label className="flex items-center gap-1.5 text-[11px] text-stone-500">
            <input type="checkbox" name="higherIsBetter" value="false" />
            Lower is better (e.g. cancellation rate)
          </label>
        </form>
      )}

      {kpis.length === 0 ? (
        <Empty>No KPIs tracked yet.</Empty>
      ) : (
        <ul className="space-y-1.5">
          {kpis.map((k) => (
            <KpiRow key={k.id} k={k} pending={pending} start={start} />
          ))}
        </ul>
      )}
    </Card>
  );
}
