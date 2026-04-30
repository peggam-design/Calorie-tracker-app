"use client";
import { useState, useCallback } from "react";
import type { DaySummary } from "@/types";
import { getDaySummary } from "@/lib/db";
import CalorieSummaryBar from "@/components/stats/CalorieSummaryBar";
import MealList from "@/components/meals/MealList";
import MealEntryChooser from "@/components/meals/MealEntryChooser";
import CaloriesBurnedForm from "@/components/stats/CaloriesBurnedForm";
import { UtensilsCrossed, Flame, History } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Tab = "meals" | "burn";
interface Props { initialSummary: DaySummary; today: string; }

export default function DashboardClient({ initialSummary, today }: Props) {
  const [summary, setSummary] = useState<DaySummary>(initialSummary);
  const [activeTab, setActiveTab] = useState<Tab>("meals");
  const refresh = useCallback(async () => {
    const fresh = await getDaySummary(today);
    setSummary(fresh);
  }, [today]);
  const tabs = [
    { id: "meals" as Tab, label: "Meals", icon: <UtensilsCrossed className="w-5 h-5" /> },
    { id: "burn" as Tab, label: "Burned", icon: <Flame className="w-5 h-5" /> },
  ];
  return (
    <div className="space-y-4 animate-fade-in">
      <CalorieSummaryBar summary={summary} />
      <div className="flex gap-2">
        <div className="card p-1 flex gap-1 flex-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all",
                activeTab === t.id ? "bg-brand-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50")}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
        <Link href="/dashboard/history"
          className="card px-3 flex items-center justify-center text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition">
          <History className="w-5 h-5" />
        </Link>
      </div>
      {activeTab === "meals" && (
        <div className="space-y-3 animate-slide-up">
          <MealEntryChooser today={today} onSaved={refresh} />
          <MealList meals={summary.meals} onChanged={refresh} />
        </div>
      )}
      {activeTab === "burn" && (
        <div className="animate-slide-up">
          <CaloriesBurnedForm today={today} currentBurned={summary.totalBurned} onSaved={refresh} />
        </div>
      )}
    </div>
  );
}
