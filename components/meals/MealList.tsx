"use client";
// ============================================================
// components/meals/MealList.tsx
// Renders the list of meals for the day with edit / delete
// ============================================================
import { useState } from "react";
import type { Meal } from "@/types";
import { deleteMeal } from "@/lib/db";
import { formatTime } from "@/lib/utils";
import { Pencil, Trash2, ChevronDown } from "lucide-react";
import EditMealModal from "@/components/meals/EditMealModal";
import { cn } from "@/lib/utils";

interface Props {
  meals: Meal[];
  onChanged: () => void;
}

export default function MealList({ meals, onChanged }: Props) {
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (meals.length === 0) {
    return (
      <div className="card py-10 text-center text-gray-400 text-sm">
        <p className="text-2xl mb-2">🍽️</p>
        No meals logged yet today.
      </div>
    );
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this meal?")) return;
    setDeleting(id);
    try {
      await deleteMeal(id);
      onChanged();
    } catch (e) {
      alert("Failed to delete meal.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <div className="space-y-2">
        {meals.map((meal) => (
          <div
            key={meal.id}
            className={cn(
              "card overflow-hidden transition-all duration-200",
              expanded === meal.id ? "shadow-md" : ""
            )}
          >
            {/* Main row */}
            <div className="flex items-center gap-3 p-3">
              <button
                onClick={() => setExpanded(expanded === meal.id ? null : meal.id)}
                className="flex-1 flex items-center gap-3 text-left min-w-0"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-base flex-shrink-0">
                  🍴
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{meal.name}</p>
                  <p className="text-xs text-gray-400">{formatTime(meal.created_at)}</p>
                </div>
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 text-gray-300 flex-shrink-0 transition-transform",
                    expanded === meal.id ? "rotate-180" : ""
                  )}
                />
              </button>

              {/* Calories badge */}
              <span className="font-mono font-semibold text-sm text-brand-700 bg-brand-50 px-2 py-0.5 rounded-lg flex-shrink-0">
                {meal.calories.toLocaleString()}
              </span>

              {/* Actions */}
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => setEditingMeal(meal)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(meal.id)}
                  disabled={deleting === meal.id}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Expanded notes */}
            {expanded === meal.id && meal.notes && (
              <div className="px-4 pb-3 pt-0 border-t border-gray-50">
                <p className="text-xs text-gray-500 italic">"{meal.notes}"</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editingMeal && (
        <EditMealModal
          meal={editingMeal}
          onSaved={() => { setEditingMeal(null); onChanged(); }}
          onClose={() => setEditingMeal(null)}
        />
      )}
    </>
  );
}
