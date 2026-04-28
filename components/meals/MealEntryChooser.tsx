"use client";
import { useState } from "react";
import TypeSpeakForm from "@/components/meals/TypeSpeakForm";
import PhotoMealForm from "@/components/meals/PhotoMealForm";
import { Mic, Camera, Keyboard } from "lucide-react";
type Mode = null | "type" | "photo";
interface Props { today: string; onSaved: () => void; }
export default function MealEntryChooser({ today, onSaved }: Props) {
  const [mode, setMode] = useState<Mode>(null);
  function handleSaved() { setMode(null); onSaved(); }
  if (mode === "type") return <TypeSpeakForm today={today} onSaved={handleSaved} onCancel={() => setMode(null)} />;
  if (mode === "photo") return <PhotoMealForm today={today} onSaved={handleSaved} onCancel={() => setMode(null)} />;
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest px-1">Add a meal</p>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setMode("type")} className="card p-5 flex flex-col items-center gap-3 hover:border-brand-300 hover:bg-brand-50 transition-all">
          <Keyboard className="w-8 h-8 text-brand-600" />
          <div className="text-center"><p className="text-sm font-semibold">Type or Speak</p><p className="text-xs text-gray-400 mt-0.5">Enter meal details by typing or voice</p></div>
          <div className="flex items-center gap-1 text-xs text-brand-600"><Mic className="w-3 h-3" /> Voice supported</div>
        </button>
        <button onClick={() => setMode("photo")} className="card p-5 flex flex-col items-center gap-3 hover:border-purple-300 hover:bg-purple-50 transition-all">
          <Camera className="w-8 h-8 text-purple-600" />
          <div className="text-center"><p className="text-sm font-semibold">Photo</p><p className="text-xs text-gray-400 mt-0.5">Upload a photo of your meal</p></div>
          <div className="flex items-center gap-1 text-xs text-purple-600"><Mic className="w-3 h-3" /> Add extras by voice</div>
        </button>
      </div>
    </div>
  );
}
