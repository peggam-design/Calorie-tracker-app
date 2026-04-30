"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, subDays, parseISO } from "date-fns";
import { ChevronDown, ChevronUp, Trash2, ArrowLeft, Calendar } from "lucide-react";
import { deleteMeal } from "@/lib/db";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DayData {
  date: string;
  meals: { id: string; name: string; calories: number; notes?: string|null; created_at: string }[];
  totalCalories: number;
  caloriesBurned: number;
}

export default function HistoryClient() {
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string|null>(null);
  const [deleting, setDeleting] = useState<string|null>(null);

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
    const [mealsRes, statsRes] = await Promise.all([
      supabase.from("meals").select("*").eq("user_id", user.id).gte("created_at", thirtyDaysAgo).order("created_at", { ascending: false }),
      supabase.from("daily_stats").select("*").eq("user_id", user.id),
    ]);
    const meals = mealsRes.data ?? [];
    const stats = statsRes.data ?? [];
    const byDate: Record<string, DayData> = {};
    for (const meal of meals) {
      const date = meal.created_at.slice(0, 10);
      if (!byDate[date]) {
        const stat = stats.find(s => s.date === date);
        byDate[date] = { date, meals: [], totalCalories: 0, caloriesBurned: stat?.calories_burned ?? 0 };
      }
      byDate[date].meals.push(meal);
      byDate[date].totalCalories += meal.calories;
    }
    setDays(Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date)));
    setLoading(false);
  }

  async function handleDelete(mealId: string, date: string) {
    setDeleting(mealId);
    try {
      await deleteMeal(mealId);
      setDays(prev => prev.map(d => {
        if (d.date !== date) return d;
        const newMeals = d.meals.filter(m => m.id !== mealId);
        return { ...d, meals: newMeals, totalCalories: newMeals.reduce((s, m) => s + m.calories, 0) };
      }).filter(d => d.meals.length > 0));
    } finally { setDeleting(null); }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display font-bold text-xl text-gray-900">History</h1>
          <p className="text-xs text-gray-400">Last 30 days</p>
        </div>
      </div>

      {days.length === 0 && (
        <div className="card py-16 text-center">
          <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No meal history yet</p>
          <p className="text-gray-300 text-xs mt-1">Start logging meals to see your history here</p>
        </div>
      )}

      {days.map(day => {
        const isExpanded = expanded === day.date;
        const net = day.totalCalories - day.caloriesBurned;
        const isToday = day.date === format(new Date(), "yyyy-MM-dd");
        return (
          <div key={day.date} className="card overflow-hidden">
            <button onClick={() => setExpanded(isExpanded ? null : day.date)}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition text-left">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-50 flex flex-col items-center justify-center">
                <span className="text-xs font-medium text-brand-600">{format(parseISO(day.date), "MMM")}</span>
                <span className="text-lg font-bold text-brand-700 leading-none">{format(parseISO(day.date), "d")}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{isToday ? "Today" : format(parseISO(day.date), "EEEE, MMM d")}</p>
                <p className="text-xs text-gray-400">{day.meals.length} meal{day.meals.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold font-mono text-gray-900">{day.totalCalories.toLocaleString()}</p>
                <p className={cn("text-xs font-mono", net <= 0 ? "text-brand-600" : "text-gray-400")}>net {net.toLocaleString()}</p>
              </div>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-300 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-300 flex-shrink-0" />}
            </button>

            {isExpanded && (
              <div className="border-t border-gray-50 divide-y divide-gray-50">
                {day.meals.map(meal => (
                  <div key={meal.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{meal.name}</p>
                      {meal.notes && <p className="text-xs text-gray-400 truncate italic">{meal.notes}</p>}
                    </div>
                    <span className="font-mono text-sm font-semibold text-gray-700 flex-shrink-0">{meal.calories}</span>
                    <button onClick={() => handleDelete(meal.id, day.date)} disabled={deleting === meal.id}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition disabled:opacity-40 flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <p>Consumed: <span className="font-mono font-semibold text-gray-700">{day.totalCalories.toLocaleString()} kcal</span></p>
                    {day.caloriesBurned > 0 && <p>Burned: <span className="font-mono font-semibold text-orange-600">{day.caloriesBurned.toLocaleString()} kcal</span></p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Net</p>
                    <p className={cn("font-mono font-bold text-sm", net <= 0 ? "text-brand-600" : "text-gray-700")}>{net.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
