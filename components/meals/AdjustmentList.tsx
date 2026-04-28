"use client";
// ============================================================
// components/meals/AdjustmentList.tsx
// Lists calorie adjustments with delete capability
// ============================================================
import type { Adjustment } from "@/types";
import { deleteAdjustment } from "@/lib/db";
import { Trash2 } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { useState } from "react";

interface Props {
  adjustments: Adjustment[];
  onChanged: () => void;
}

export default function AdjustmentList({ adjustments, onChanged }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null);

  if (adjustments.length === 0) {
    return (
      <div className="card py-8 text-center text-gray-400 text-sm">
        <p className="text-xl mb-1">🫙</p>
        No extras logged yet.
      </div>
    );
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deleteAdjustment(id);
      onChanged();
    } finally {
      setDeleting(null);
    }
  }

  const total = adjustments.reduce((s, a) => s + a.calories, 0);

  return (
    <div className="card divide-y divide-gray-50 overflow-hidden">
      {adjustments.map((adj) => (
        <div key={adj.id} className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">
              {adj.note || "Extra calories"}
            </p>
            <p className="text-xs text-gray-400">{formatTime(adj.created_at)}</p>
          </div>
          <span className="font-mono text-sm font-semibold text-amber-600">+{adj.calories}</span>
          <button
            onClick={() => handleDelete(adj.id)}
            disabled={deleting === adj.id}
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {/* Footer total */}
      <div className="flex items-center justify-between px-4 py-2 bg-amber-50">
        <span className="text-xs font-medium text-amber-700">Total extras</span>
        <span className="font-mono text-sm font-bold text-amber-700">+{total.toLocaleString()} kcal</span>
      </div>
    </div>
  );
}
