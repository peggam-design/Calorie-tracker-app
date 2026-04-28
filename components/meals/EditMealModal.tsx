"use client";
// ============================================================
// components/meals/EditMealModal.tsx
// Modal to edit an existing meal
// ============================================================
import { useState, useEffect } from "react";
import { updateMeal } from "@/lib/db";
import type { Meal } from "@/types";
import { Loader2, X, Check } from "lucide-react";

interface Props {
  meal: Meal;
  onSaved: () => void;
  onClose: () => void;
}

export default function EditMealModal({ meal, onSaved, onClose }: Props) {
  const [name, setName] = useState(meal.name);
  const [calories, setCalories] = useState(String(meal.calories));
  const [notes, setNotes] = useState(meal.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const cal = parseInt(calories);
    if (!name.trim()) return setError("Name is required");
    if (isNaN(cal) || cal < 0) return setError("Enter a valid calorie amount");

    setLoading(true);
    setError(null);
    try {
      await updateMeal(meal.id, { name: name.trim(), calories: cal, notes: notes.trim() || null });
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card-elevated w-full max-w-sm p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-gray-900">Edit Meal</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Meal name</label>
            <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Calories</label>
            <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} min={0} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className="input" />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
