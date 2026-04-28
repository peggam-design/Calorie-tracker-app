"use client";
// ============================================================
// components/stats/CaloriesBurnedForm.tsx
// Input to log calories burned for the day
// ============================================================
import { useState } from "react";
import { upsertCaloriesBurned } from "@/lib/db";
import { Loader2, Flame, Check } from "lucide-react";

interface Props {
  today: string;
  currentBurned: number;
  onSaved: () => void;
}

const PRESETS = [
  { label: "Light walk", kcal: 150 },
  { label: "30 min run", kcal: 300 },
  { label: "1hr gym", kcal: 450 },
  { label: "HIIT class", kcal: 600 },
];

export default function CaloriesBurnedForm({ today, currentBurned, onSaved }: Props) {
  const [burned, setBurned] = useState(currentBurned > 0 ? String(currentBurned) : "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const val = parseInt(burned);
    if (isNaN(val) || val < 0) return setError("Enter a valid number");

    setLoading(true);
    setError(null);
    try {
      await upsertCaloriesBurned(today, val);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-orange-500" />
          Calories Burned Today
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Include exercise, steps, and any other activity.
        </p>
      </div>

      {/* Quick presets */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Quick add</p>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setBurned(String((parseInt(burned) || 0) + p.kcal))}
              className="text-left px-3 py-2 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition"
            >
              <p className="text-xs font-medium text-gray-700">{p.label}</p>
              <p className="text-xs text-orange-500 font-mono">+{p.kcal} kcal</p>
            </button>
          ))}
        </div>
      </div>

      {/* Manual input */}
      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Total kcal burned</label>
          <input
            type="number"
            value={burned}
            onChange={(e) => setBurned(e.target.value)}
            placeholder="0"
            min={0}
            className="input"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium flex items-center justify-center gap-2 transition disabled:opacity-60"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : saved
            ? <Check className="w-4 h-4" />
            : <Flame className="w-4 h-4" />
          }
          {saved ? "Saved!" : "Update burned calories"}
        </button>
      </form>
    </div>
  );
}
