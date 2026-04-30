"use client";
import { useState, useRef } from "react";
import { addMeal } from "@/lib/db";
import { parseMealFromText, parseBulkMeals, type ParsedMeal } from "@/lib/ai";
import { Mic, MicOff, Sparkles, Loader2, Check, X, ArrowLeft, Trash2, MessageSquare, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { today: string; onSaved: () => void; onCancel: () => void; }
declare global { interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; } }
type InputMode = "single" | "bulk";
type Stage = "input" | "review";

export default function TypeSpeakForm({ today, onSaved, onCancel }: Props) {
  const [inputMode, setInputMode] = useState<InputMode>("single");
  const [stage, setStage] = useState<Stage>("input");
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedMeals, setParsedMeals] = useState<ParsedMeal[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const recRef = useRef<any>(null);

  function toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("Voice not supported — try Chrome"); return; }
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.lang = "en-US"; rec.interimResults = false;
    rec.onresult = (e: any) => { const t = e.results[0][0].transcript; setInput(prev => prev ? prev+" "+t : t); setListening(false); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec; rec.start(); setListening(true);
  }

  async function handleParse() {
    if (!input.trim()) return setError("Please describe what you ate");
    setError(null); setParsing(true);
    try {
      const meals = inputMode === "bulk" ? await parseBulkMeals(input) : await parseMealFromText(input);
      setParsedMeals(meals); setStage("review");
    } catch { setError("Failed to parse — try again"); }
    finally { setParsing(false); }
  }

  function updateMeal(i: number, field: keyof ParsedMeal, value: string|number) {
    setParsedMeals(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  }

  function removeMeal(i: number) {
    setParsedMeals(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (parsedMeals.length === 0) return setError("No meals to save");
    setSaving(true); setError(null);
    try {
      const time = new Date().toTimeString().slice(0,5);
      for (const meal of parsedMeals) {
        await addMeal({ name: meal.name, calories: meal.calories, notes: meal.notes||null, created_at: new Date(`${today}T${time}`).toISOString() });
      }
      onSaved();
    } catch (e: any) { setError(e.message||"Failed to save"); }
    finally { setSaving(false); }
  }

  const cc = { low: "text-red-500", medium: "text-amber-500", high: "text-brand-600" };

  if (stage === "input") {
    return (
      <div className="card p-4 animate-scale-in">
        <div className="flex items-center gap-2 mb-4">
          <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><ArrowLeft className="w-4 h-4" /></button>
          <h3 className="text-sm font-semibold text-gray-900 flex-1">What did you eat?</h3>
          <button type="button" onClick={onCancel} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex bg-gray-100 rounded-xl p-1 mb-4 gap-1">
          <button type="button" onClick={() => setInputMode("single")}
            className={cn("flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all",
              inputMode==="single" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
            <MessageSquare className="w-3.5 h-3.5" /> Single meal
          </button>
          <button type="button" onClick={() => setInputMode("bulk")}
            className={cn("flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all",
              inputMode==="bulk" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
            <List className="w-3.5 h-3.5" /> All my meals
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-2">
          {inputMode==="single"
            ? 'Describe naturally — e.g. "I had a small piece of grilled chicken and a huge rice bowl"'
            : 'List all meals — e.g. "For breakfast cereal, for lunch a turkey sandwich, for dinner steak and potatoes"'}
        </p>

        <textarea autoFocus value={input} onChange={(e) => setInput(e.target.value)} rows={4}
          placeholder={inputMode==="single"
            ? "I had a small piece of chicken with a big side of rice..."
            : "For breakfast I had a bowl of cereal, for lunch a turkey sandwich, for dinner steak and potatoes. I also had a latte and an apple..."}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition resize-none placeholder:text-gray-300"
        />

        <div className="flex items-center gap-2 mt-2">
          <button type="button" onClick={toggleVoice}
            className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all",
              listening ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-brand-100 hover:text-brand-600")}>
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {listening ? "Stop listening" : "Speak instead"}
          </button>
          {listening && <p className="text-xs text-red-500 flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" />Listening...</p>}
        </div>

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button type="button" onClick={handleParse} disabled={parsing||!input.trim()}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition disabled:opacity-50">
            {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {parsing ? "Analyzing..." : "Estimate calories"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4 animate-scale-in">
      <div className="flex items-center gap-2 mb-4">
        <button type="button" onClick={() => setStage("input")} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><ArrowLeft className="w-4 h-4" /></button>
        <h3 className="text-sm font-semibold text-gray-900 flex-1">Review & edit meals</h3>
        <button type="button" onClick={onCancel} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
      </div>

      <p className="text-xs text-gray-400 mb-3">AI estimated these — edit anything before saving</p>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {parsedMeals.map((meal, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <input type="text" value={meal.name} onChange={(e) => updateMeal(i,"name",e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-400" />
                <div className="flex items-center gap-2">
                  <input type="number" value={meal.calories} onChange={(e) => updateMeal(i,"calories",parseInt(e.target.value)||0)}
                    className="w-24 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-mono outline-none focus:border-brand-400" />
                  <span className="text-xs text-gray-400">kcal</span>
                  <span className={cn("text-xs ml-auto", cc[meal.confidence])}>{meal.confidence} confidence</span>
                </div>
                {meal.notes && <p className="text-xs text-gray-400 italic">{meal.notes}</p>}
              </div>
              <button type="button" onClick={() => removeMeal(i)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <span className="text-sm font-medium text-gray-600">Total</span>
        <span className="font-mono font-bold text-gray-900">{parsedMeals.reduce((s,m) => s+m.calories,0).toLocaleString()} kcal</span>
      </div>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

      <div className="flex gap-2 mt-4">
        <button type="button" onClick={() => setStage("input")} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">Edit input</button>
        <button type="button" onClick={handleSave} disabled={saving||parsedMeals.length===0}
          className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save {parsedMeals.length} meal{parsedMeals.length!==1?"s":""}
        </button>
      </div>
    </div>
  );
}
