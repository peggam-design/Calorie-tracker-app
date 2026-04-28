// ============================================================
// types/index.ts – Shared TypeScript types for the whole app
// ============================================================

/** A logged meal belonging to a user */
export interface Meal {
  id: string;
  user_id: string;
  name: string;
  calories: number;
  notes?: string | null;
  created_at: string; // ISO timestamp
}

/** A calorie adjustment (e.g. oils, sauces, hidden extras) */
export interface Adjustment {
  id: string;
  user_id: string;
  calories: number;
  note?: string | null;
  created_at: string;
}

/** Per-day stats row (calories burned) */
export interface DailyStats {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  calories_burned: number;
}

/** Aggregated summary used by the dashboard */
export interface DaySummary {
  date: string;
  meals: Meal[];
  adjustments: Adjustment[];
  totalConsumed: number;
  totalBurned: number;
  net: number;
}

/** Shape returned by the AI stub (and eventually real OpenAI Vision) */
export interface FoodAnalysisResult {
  description: string;   // e.g. "Grilled chicken, steamed rice, broccoli"
  estimatedCalories: number;
  confidence: "low" | "medium" | "high";
  items: { name: string; calories: number }[];
}

/** Form values when adding / editing a meal */
export interface MealFormValues {
  name: string;
  calories: string; // kept as string while in form
  notes: string;
  created_at: string;
}

/** Form values for adding a calorie adjustment */
export interface AdjustmentFormValues {
  calories: string;
  note: string;
}
