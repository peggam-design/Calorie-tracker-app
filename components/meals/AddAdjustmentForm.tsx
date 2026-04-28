"use client";
// ============================================================
// components/meals/AddAdjustmentForm.tsx
// Add extra calories (oils, sauces, hidden ingredients)
// ============================================================
import { useState } from "react";
import { addAdjustment } from "@/lib/db";
import { Loader2, Plus } from "lucide-react";

interface Props {
  today: string;
  onSaved: () => void;
}

export default function AddAdjustmentForm({ today, onSaved }: Props) {
  const [calories, setCalories] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cal = parseInt(calories);
    if (isNaN(cal) || cal <= 0) return setError("Enter a positive calorie amount");

    setLoading(true);
    setError(null);
    try {
      await addAdjustment({ calories: cal, note: note.trim() || null });
      setCalories("");
      setNote("");
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-1">Extra Calories</h3>
      <p className="text-xs text-gray-400 mb-3">Oils, sauces, condiments, hidden ingredients</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Calories *</label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="e.g. 80"
              min={1}
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. olive oil"
              className="input"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium flex items-center justify-center gap-2 transition disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add extra calories
        </button>
      </form>
    </div>
  );
}
