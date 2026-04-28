"use client";
// ============================================================
// components/photo/PhotoUpload.tsx
// Allows user to upload a food photo → AI analysis (stubbed)
// → pre-fills AddMealForm with the result
// ============================================================
import { useState, useRef } from "react";
import { analyzeFoodImage, type FoodAnalysisResult } from "@/lib/ai";
import AddMealForm from "@/components/meals/AddMealForm";
import { Camera, Upload, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  today: string;
  onMealAdded: () => void;
}

type State = "idle" | "analyzing" | "result" | "adding";

export default function PhotoUpload({ today, onMealAdded }: Props) {
  const [state, setState] = useState<State>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<FoodAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return setError("Please upload an image file.");
    setError(null);

    // Show preview
    const url = URL.createObjectURL(file);
    setPreview(url);
    setState("analyzing");

    try {
      const analysis = await analyzeFoodImage(file);
      setResult(analysis);
      setState("result");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed");
      setState("idle");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function reset() {
    setState("idle");
    setPreview(null);
    setResult(null);
    setError(null);
  }

  const confidenceColor = {
    low: "text-red-500 bg-red-50",
    medium: "text-amber-600 bg-amber-50",
    high: "text-brand-600 bg-brand-50",
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="card p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Camera className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Photo Analysis</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Upload a food photo and AI will estimate the calories. Currently using mock data —
              connect OpenAI Vision in <code className="text-xs bg-gray-100 px-1 rounded">lib/ai.ts</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Upload area */}
      {(state === "idle" || state === "analyzing") && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => state === "idle" && fileRef.current?.click()}
          className={cn(
            "card border-dashed border-2 transition-all",
            state === "idle"
              ? "border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 cursor-pointer"
              : "border-purple-200 bg-purple-50/30"
          )}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />

          {preview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Food preview" className="w-full h-48 object-cover rounded-xl" />
              {state === "analyzing" && (
                <div className="absolute inset-0 bg-black/50 rounded-xl flex flex-col items-center justify-center gap-2 text-white">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <p className="text-sm font-medium">Analyzing your food…</p>
                  <p className="text-xs opacity-70">AI is estimating calories</p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 flex flex-col items-center gap-3 text-gray-400">
              <Upload className="w-8 h-8" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Drop a photo or tap to upload</p>
                <p className="text-xs mt-0.5">JPG, PNG, WEBP · any size</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analysis result */}
      {state === "result" && result && (
        <div className="card p-4 space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-semibold text-gray-900">AI Result</span>
            </div>
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", confidenceColor[result.confidence])}>
              {result.confidence} confidence
            </span>
          </div>

          {/* Preview thumbnail */}
          {preview && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={preview} alt="Food" className="w-full h-32 object-cover rounded-xl" />
          )}

          <p className="text-sm text-gray-700">{result.description}</p>

          {/* Item breakdown */}
          <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
            {result.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-gray-600">{item.name}</span>
                <span className="font-mono font-medium text-gray-900">{item.calories} kcal</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-semibold text-gray-900">Total estimate</span>
              <span className="font-mono font-bold text-purple-700">{result.estimatedCalories} kcal</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try another
            </button>
            <button
              onClick={() => setState("adding")}
              className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Log this meal
            </button>
          </div>
        </div>
      )}

      {/* Pre-filled AddMealForm */}
      {state === "adding" && result && (
        <div className="animate-slide-up">
          <AddMealForm
            today={today}
            prefillName={result.description}
            prefillCalories={result.estimatedCalories}
            onSaved={() => { reset(); onMealAdded(); }}
            onCancel={() => setState("result")}
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
