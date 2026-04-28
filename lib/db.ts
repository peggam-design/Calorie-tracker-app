// ============================================================
// lib/db.ts
// All Supabase database interactions in one place.
// Import createClient() from lib/supabase/client.ts (browser)
// or lib/supabase/server.ts (server) depending on context.
// ============================================================

import type { Meal, Adjustment, DailyStats, DaySummary } from "@/types";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";

// ── Helpers ──────────────────────────────────────────────────

/** Returns "YYYY-MM-DD" for a given Date (or today if omitted) */
export function toDateString(date: Date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

/** Returns start & end of a given day as ISO strings */
function dayRange(dateStr: string) {
  return {
    start: `${dateStr}T00:00:00.000Z`,
    end: `${dateStr}T23:59:59.999Z`,
  };
}

// ── Meals ─────────────────────────────────────────────────────

/** Fetch all meals for the current user on a given date */
export async function getMeals(date: string): Promise<Meal[]> {
  const supabase = createClient();
  const { start, end } = dayRange(date);

  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .gte("created_at", start)
    .lte("created_at", end)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Insert a new meal */
export async function addMeal(
  meal: Omit<Meal, "id" | "user_id" | "created_at"> & { created_at?: string }
): Promise<Meal> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("meals")
    .insert({ ...meal, user_id: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Update an existing meal */
export async function updateMeal(
  id: string,
  updates: Partial<Pick<Meal, "name" | "calories" | "notes" | "created_at">>
): Promise<Meal> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("meals")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Delete a meal by ID */
export async function deleteMeal(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("meals").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Adjustments ───────────────────────────────────────────────

/** Fetch calorie adjustments for the current user on a given date */
export async function getAdjustments(date: string): Promise<Adjustment[]> {
  const supabase = createClient();
  const { start, end } = dayRange(date);

  const { data, error } = await supabase
    .from("adjustments")
    .select("*")
    .gte("created_at", start)
    .lte("created_at", end)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Insert a new adjustment */
export async function addAdjustment(
  adj: Omit<Adjustment, "id" | "user_id" | "created_at">
): Promise<Adjustment> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("adjustments")
    .insert({ ...adj, user_id: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Delete an adjustment */
export async function deleteAdjustment(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("adjustments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Daily Stats (calories burned) ────────────────────────────

/** Get the daily stats row for a given date */
export async function getDailyStats(date: string): Promise<DailyStats | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("daily_stats")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Upsert calories burned for a given date.
 * Uses ON CONFLICT (user_id, date) to update if row exists.
 */
export async function upsertCaloriesBurned(
  date: string,
  calories_burned: number
): Promise<DailyStats> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("daily_stats")
    .upsert({ user_id: user.id, date, calories_burned }, { onConflict: "user_id,date" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ── Aggregated Summary ────────────────────────────────────────

/** Build a full DaySummary for the dashboard */
export async function getDaySummary(date: string): Promise<DaySummary> {
  const [meals, adjustments, dailyStats] = await Promise.all([
    getMeals(date),
    getAdjustments(date),
    getDailyStats(date),
  ]);

  const totalConsumed =
    meals.reduce((sum, m) => sum + m.calories, 0) +
    adjustments.reduce((sum, a) => sum + a.calories, 0);

  const totalBurned = dailyStats?.calories_burned ?? 0;

  return {
    date,
    meals,
    adjustments,
    totalConsumed,
    totalBurned,
    net: totalConsumed - totalBurned,
  };
}
