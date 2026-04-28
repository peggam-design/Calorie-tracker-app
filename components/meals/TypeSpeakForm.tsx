"use client";
import { useState, useRef } from "react";
import { addMeal } from "@/lib/db";
import { estimateCaloriesFromText } from "@/lib/ai";
import { Mic, MicOff, Sparkles, Loader2, Check, X, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
interface Props { today: string; onSaved: () => void; onCancel: () => void; }
declare global { interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; } }
export default function TypeSpeakForm({ today, onSaved, onCancel }: Props) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [notes, setNotes] = useState("");
  const [estimating, setEstimating] = useState(false);
  const [breakdown, setBreakdown] = useState<string|null>(null);
  const [confidence, setConfidence] = useState<"low"|"medium"|"high"|null>(null);
  const [listeningField, setListeningField] = useState<"name"|"notes"|null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const recRef = useRef<any>(null);
  function startListening(field: "name"|"notes") {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("Voice not supported — try Chrome"); return; }
    if (listeningField) { recRef.current?.stop(); setListeningField(null); return; }
    const rec = new SR();
    rec.lang = "en-US"; rec.interimResults = false;
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      if (field === "name") { setName(t); setTimeout(() => handleEstimate(t), 300); }
      else setNotes((p) => p ? p + " " + t : t);
      setListeningField(null);
    };
    rec.onerror = () => setListeningField(null);
    rec.onend = () => setListeningField(null);
    recRef.current = rec; rec.start(); setListeningField(field);
  }
  async function handleEstimate(override?: string) {
    const n = (override ?? name).trim();
    if (!n) return setError("Enter a meal name first");
    setError(null); setEstimating(true);
    try {
      const r = await estimateCaloriesFromText(n);
      setCalories(String(r.calories)); setBreakdown(r.breakdown); setConfidence(r.confidence);
    } catch { setError("Estimation failed — enter calories manually"); }
    finally { setEstimating(false); }
  }
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Meal name required");
    const cal = parseInt(calories);
    if (isNaN(cal) || cal < 0) return setError("Enter valid calories");
    setSaving(true); setError(null);
    try {
      await addMeal({ name: name.trim(), calories: cal, notes: notes.trim() || null, created_at: new Date(`${today}T${new Date().toTimeString().slice(0,5)}`).toISOString() });
      onSaved();
    } catch (e: any) { setError(e.message || "Failed to save"); }
    finally { setSaving(false); }
  }
  const cc = { low: "text-red-500 bg-red-50", medium: "text-amber-600 bg-amber-50", high: "text-brand-600 bg-brand-50" };
  return (
    <div className="card p-4 animate-scale-in">
      <div className="flex items-center gap-2 mb-4">
        <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><ArrowLeft className="w-4 h-4" /></button>
        <h3 className="text-sm font-semibold text-gray-900 flex-1">Type or Speak your meal</h3>
        <button type="button" onClick={onCancel} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
      </div>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">What did you eat? *</label>
          <div className="flex gap-2">
            <input autoFocus type="text" value={name} onChange={(e) => { setName(e.target.value); setBreakdown(null); }} placeholder="e.g. chicken rice bowl" className="input flex-1" />
            <button type="button" onClick={() => startListening("name")} className={cn("flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all", listeningField==="name" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-brand-100 hover:text-brand-600")}>
              {listeningField==="name" ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button type="button" onClick={() => handleEstimate()} disabled={estimating||!name.trim()} className="flex-shrink-0 px-3 h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50">
              {estimating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Estimate
            </button>
          </div>
          {listeningField==="name" && <p className="text-xs text-red-500 mt-1">🔴 Listening… speak your meal name</p>}
        </div>
        {breakdown && confidence && (
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-purple-500" /><span className="text-xs font-semibold text-purple-700">AI Estimate</span></div>
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", cc[confidence])}>{confidence} confidence</span>
            </div>
            <p className="text-xs text-purple-600">{breakdown}</p>
            <p className="text-xs text-gray-400 mt-1">Calories filled below — edit freely</p>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Calories *</label>
          <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="0" min={0} className={cn("input", breakdown ? "border-purple-200" : "")} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes / extras <span className="font-normal text-gray-400">(oils, sauces, sides…)</span></label>
          <div className="flex gap-2">
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. with olive oil and extra cheese" className="input flex-1" />
            <button type="button" onClick={() => startListening("notes")} className={cn("flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all", listeningField==="notes" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-brand-100 hover:text-brand-600")}>
              {listeningField==="notes" ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
          {listeningField==="notes" && <p className="text-xs text-red-500 mt-1">🔴 Listening… describe any extras</p>}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save meal
          </button>
        </div>
      </form>
    </div>
  );
}
