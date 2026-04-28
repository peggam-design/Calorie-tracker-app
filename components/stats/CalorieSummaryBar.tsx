"use client";
// ============================================================
// components/stats/CalorieSummaryBar.tsx
// Top-of-dashboard summary: consumed / burned / net
// ============================================================
import type { DaySummary } from "@/types";
import { formatCalories, netLabel } from "@/lib/utils";
import { formatShortDate } from "@/lib/utils";
import { Flame, TrendingDown, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CalorieSummaryBar({ summary }: { summary: DaySummary }) {
  const { label: netLbl, color: netColor } = netLabel(summary.net);

  // Progress ring: 2000 kcal daily target as denominator
  const TARGET = 2000;
  const pct = Math.min((summary.totalConsumed / TARGET) * 100, 100);
  const circumference = 2 * Math.PI * 38;
  const strokeDash = (pct / 100) * circumference;
  const ringColor = pct >= 100 ? "#ef4444" : pct > 75 ? "#f59e0b" : "#22c55e";

  return (
    <div className="card-elevated p-5 space-y-4">
      {/* Date header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
          {formatShortDate(new Date().toISOString())} · Today
        </p>
        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100", netColor)}>
          {netLbl}
        </span>
      </div>

      {/* Ring + numbers */}
      <div className="flex items-center gap-5">
        {/* SVG ring */}
        <div className="relative flex-shrink-0 w-24 h-24">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="38" fill="none" stroke="#e5e7eb" strokeWidth="7" />
            <circle
              cx="44" cy="44" r="38" fill="none"
              stroke={ringColor} strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display font-bold text-lg leading-tight text-gray-900">
              {summary.totalConsumed.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">kcal</span>
          </div>
        </div>

        {/* Stat pills */}
        <div className="flex-1 grid grid-cols-1 gap-2">
          <StatRow
            icon={<Scale className="w-3.5 h-3.5 text-brand-600" />}
            label="Consumed"
            value={formatCalories(summary.totalConsumed)}
            valueClass="text-gray-900"
          />
          <StatRow
            icon={<Flame className="w-3.5 h-3.5 text-orange-500" />}
            label="Burned"
            value={formatCalories(summary.totalBurned)}
            valueClass="text-orange-600"
          />
          <StatRow
            icon={<TrendingDown className="w-3.5 h-3.5 text-blue-500" />}
            label="Net"
            value={formatCalories(summary.net)}
            valueClass={summary.net <= 0 ? "text-brand-600" : "text-gray-900"}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-[11px] text-gray-400 mb-1">
          <span>{summary.totalConsumed.toLocaleString()} consumed</span>
          <span>{TARGET.toLocaleString()} kcal goal</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: ringColor }}
          />
        </div>
      </div>
    </div>
  );
}

function StatRow({
  icon, label, value, valueClass,
}: {
  icon: React.ReactNode; label: string; value: string; valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-1.5 text-gray-500">
        {icon} {label}
      </span>
      <span className={cn("font-semibold font-mono tabular-nums", valueClass)}>{value}</span>
    </div>
  );
}
