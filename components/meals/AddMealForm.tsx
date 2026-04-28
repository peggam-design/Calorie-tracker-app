"use client";
import { useState, useRef } from "react";
import { addMeal } from "@/lib/db";
import { estimateCaloriesFromText, analyzeFoodImage } from "@/lib/ai";
import type { MealFormValues } from "@/types";
import { Loader2, X, Check, Sparkles, Camera, RefreshCw, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  today: string;
  onSaved: () => void;
  onCancel: () => void;
  prefillName?: string;
  prefillCalories?: number;
}

type InputMode = "text" | "photo";
type EstimateState = "idle" | "estimating" | "confirmed";

export default function AddMealForm({ today, onSaved, onCancel, prefillName = "", prefillCalories }: Props) {
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [estimateState, setEstimateState] = useState<EstimateState>(prefillCalories ? "confirmed" : "idle");
  const [values, setValues] = useState<MealFormValues>({
    name: prefillName,
    calories: prefillCalories ? String(prefillCalories) : "",
    notes: "",
    created_at: `${today}T${new Date().toTimeString().slice(0, 5)}`,
  });
  const [breakdown, setBreakdown] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<"low" | "medium" | "high" | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [photoItems, setPhotoItems] = useState<{ name: string; calories: number }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function set(field: keyof MealFormValues, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    if (field === "name") {
      setEstimateState("idle");
      setBreakdown(null);
      setConfidence(null);
    }
  }

  async function handleEstimate() {
    if (!values.name.trim()) return setError("Enter a meal name first");
    setError(null);
    setEstimateState("estimating");
    try {
      const result = await estimateCaloriesFromText(values.name.trim());
      setValues((v) => ({ ...v, calories: String(result.calories) }));
      setBreakdown(result.breakdown);
      setConfidence(result.confidence);
      setEstimateState("confirmed");
    } catch {
      setError("Estimation failed — enter calories manually");
      setEstimateState("idle");
    }
  }

  async function handlePhoto(file: File) {
    if (!file.type.startsWith("image/")) return setError("Please upload an image file");
    setError(null);
    setImagePreview(URL.createObjectURL(file));
    setEstimateState("estimating");
    try {
      const result = await analyzeFoodImage(file);
      setValues((v) => ({ ...v, name: result.description, calories: String(result.estimatedCalories) }));
      setConfidence(result.confidence);
      setPhotoItems(result.items);
      setEstimateState("confirmed");
    } catch {
      setError("Photo analysis failed — enter details manually");
      setEstimateState("idle");
    }
  }

  function resetEstimate() {
    setEstimateState("idle");
    setBreakdown(null);
    setConfidence(null);
    setPhotoItems(null);
    setImagePreview(null);
    setValues((v) => ({ ...v, name: "", calories: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) return setError("Name is required");
    const cal = parseInt(values.calories);
    if (isNaN(cal) || cal < 0) return setError("Enter a valid calorie amount");
    setLoading(true);
    setError(null);
    try {
      await addMeal({
        name: values.name.trim(),
        calories: cal,
        notes: values.notes.trim() || null,
        created_at: new Date(values.created_at).toISOString(),
      });
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  const confidenceBadge = {
    low: "bg-red-50 text-red-500",
    medium: "bg-amber-50 text-amber-600",
    high: "bg-brand-50 text-brand-600",
  };

  return (
    <div className="card p-4 animate-scale-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Add Meal</h3>
        <button onClick={onCancel} className="p-1 rounded-lg hover:bg-gray-100 transition text-gray-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 mb-4 gap-1">
        <button type="button" onClick={() => { setInputMode("text"); resetEstimate(); }}
          className={cn("flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all",
            inputMode === "text" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
          <Sparkles className="w-3.5 h-3.5" /> Type meal
        </button>
        <button type="button" onClick={() => { setInputMode("photo"); resetEstimate(); }}
          className={cn("flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all",
            inputMode === "photo" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
          <Camera className="w-3.5 h-3.5" /> Photo
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {inputMode === "text" && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Meal name</label>
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleEstimate(); } }}
                placeholder="e.g. chicken rice bowl"
                className="input flex-1"
              />
              <button
                type="button"
                onClick={handleEstimate}
                disabled={estimateState === "estimating" || !values.name.trim()}
                className="flex-shrink-0 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {estimateState === "estimating"
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Sparkles className="w-3.5 h-3.5" />}
                Estimate
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Type a meal and click Estimate, or enter calories manually</p>
          </div>
        )}

        {inputMode === "photo" && estimateState === "idle" && (
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handlePhoto(f); }}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-200 hover:border-purple-300 rounded-xl cursor-pointer py-8 flex flex-col items-center gap-2 text-gray-400 transition hover:bg-purple-50"
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhoto(f); }}
            />
            <Upload className="w-6 h-6" />
            <p className="text-sm font-medium text-gray-600">Tap to upload a food photo</p>
            <p className="text-xs">JPG, PNG, WEBP</p>
          </div>
        )}

        {inputMode === "photo" && estimateState === "estimating" && imagePreview && (
          <div className="relative w-full">
            <img src={imagePreview} alt="Food" className="w-full h-36 object-cover rounded-xl" />
            <div className="absolute inset-0 bg-black/50 rounded-xl flex flex-col items-center justify-center gap-2 text-white">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm font-medium">Analyzing photo...</p>
            </div>
          </div>
        )}

        {estimateState === "confirmed" && (
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-xs font-semibold text-purple-700">AI Estimate</span>
              </div>
              <div className="flex items-center gap-2">
                {confidence && (
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", confidenceBadge[confidence])}>
                    {confidence} confidence
                  </span>
                )}
                <button type="button" onClick={resetEstimate} className="text-gray-400 hover:text-gray-600">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {imagePreview && (
              <img src={imagePreview} alt="Food" className="w-full h-28 object-cover rounded-lg" />
            )}
            {photoItems && (
              <div className="bg-white rounded-lg divide-y divide-gray-100 text-xs overflow-hidden">
                {photoItems.map((item, i) => (
                  <div key={i} className="flex justify-between px-2.5 py-1.5">
                    <span className="text-gray-600">{item.name}</span>
                    <span className="font-mono font-medium">{item.calories}</span>
                  </div>
                ))}
              </div>
            )}
            {breakdown && <p className="text-xs text-purple-600">{breakdown}</p>}
            <p className="text-xs text-gray-500">Review and edit the fields below before saving</p>
          </div>
        )}

        {inputMode === "photo" && estimateState === "confirmed" && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Meal name</label>
            <input type="text" value={values.name} onChange={(e) => set("name", e.target.value)} className="input" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Calories
              {estimateState === "confirmed" && <span className="ml-1 text-purple-500 font-normal">(edit freely)</span>}
            </label>
            <input
              type="number"
              value={values.calories}
              onChange={(e) => set("calories", e.target.value)}
              placeholder="0"
              min={0}
              className={cn("input", estimateState === "confirmed" && "border-purple-200")}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
            <input
              type="datetime-local"
              value={values.created_at}
              onChange={(e) => set("created_at", e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
          <input
            type="text"
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="e.g. with olive oil dressing"
            className="input"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save meal
          </button>
        </div>
      </form>
    </div>
  );
}