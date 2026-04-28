"use client";
import { useState, useRef } from "react";
import { addMeal } from "@/lib/db";
import { analyzeFoodImage } from "@/lib/ai";
import { Upload, Mic, MicOff, Sparkles, Loader2, Check, X, ArrowLeft, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
interface Props { today: string; onSaved: () => void; onCancel: () => void; }
declare global { interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; } }
type Stage = "upload" | "analyzing" | "review";
export default function PhotoMealForm({ today, onSaved, onCancel }: Props) {
  const [stage, setStage] = useState<Stage>("upload");
  const [preview, setPreview] = useState<string|null>(null);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [extras, setExtras] = useState("");
  const [photoItems, setPhotoItems] = useState<{name:string;calories:number}[]|null>(null);
  const [confidence, setConfidence] = useState<"low"|"medium"|"high"|null>(null);
  const [listening, setListening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<any>(null);
  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return setError("Please upload an image file");
    setError(null); setPreview(URL.createObjectURL(file)); setStage("analyzing");
    try {
      const r = await analyzeFoodImage(file);
      setName(r.description); setCalories(String(r.estimatedCalories));
      setPhotoItems(r.items); setConfidence(r.confidence); setStage("review");
    } catch { setError("Analysis failed — try again"); setStage("upload"); }
  }
  function toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("Voice not supported — try Chrome"); return; }
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.lang = "en-US"; rec.interimResults = false;
    rec.onresult = (e: any) => { const t = e.results[0][0].transcript; setExtras((p) => p ? p+" "+t : t); setListening(false); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec; rec.start(); setListening(true);
  }
  function reset() { setStage("upload"); setPreview(null); setName(""); setCalories(""); setExtras(""); setPhotoItems(null); setConfidence(null); setError(null); }
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Meal name required");
    const cal = parseInt(calories);
    if (isNaN(cal)||cal<0) return setError("Enter valid calories");
    setSaving(true); setError(null);
    try {
      await addMeal({ name: name.trim(), calories: cal, notes: extras.trim()||null, created_at: new Date(`${today}T${new Date().toTimeString().slice(0,5)}`).toISOString() });
      onSaved();
    } catch (e: any) { setError(e.message||"Failed to save"); }
    finally { setSaving(false); }
  }
  const cc = { low: "text-red-500 bg-red-50", medium: "text-amber-600 bg-amber-50", high: "text-brand-600 bg-brand-50" };
  return (
    <div className="card p-4 animate-scale-in">
      <div className="flex items-center gap-2 mb-4">
        <button type="button" onClick={stage==="review" ? reset : onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><ArrowLeft className="w-4 h-4" /></button>
        <h3 className="text-sm font-semibold text-gray-900 flex-1">{stage==="upload" ? "Upload a food photo" : stage==="analyzing" ? "Analyzing..." : "Review your meal"}</h3>
        <button type="button" onClick={onCancel} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
      </div>
      {stage==="upload" && (
        <div onClick={() => fileRef.current?.click()} onDrop={(e) => { e.preventDefault(); const f=e.dataTransfer.files[0]; if(f) handleFile(f); }} onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-200 hover:border-purple-300 rounded-xl cursor-pointer py-12 flex flex-col items-center gap-3 text-gray-400 transition hover:bg-purple-50">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { const f=e.target.files?.[0]; if(f) handleFile(f); }} />
          <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center"><Upload className="w-6 h-6 text-purple-600" /></div>
          <div className="text-center"><p className="text-sm font-semibold text-gray-700">Tap to take or upload a photo</p><p className="text-xs mt-1">AI will identify food and estimate calories</p></div>
        </div>
      )}
      {stage==="analyzing" && preview && (
        <div className="relative">
          <img src={preview} alt="Food" className="w-full h-48 object-cover rounded-xl" />
          <div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center gap-3 text-white">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm font-semibold">Analyzing your photo...</p>
            <p className="text-xs opacity-70">AI is identifying food and estimating calories</p>
          </div>
        </div>
      )}
      {stage==="review" && (
        <form onSubmit={handleSave} className="space-y-4">
          {preview && (
            <div className="relative">
              <img src={preview} alt="Food" className="w-full h-36 object-cover rounded-xl" />
              <button type="button" onClick={reset} className="absolute top-2 right-2 bg-white/90 hover:bg-white p-1.5 rounded-lg shadow transition"><RefreshCw className="w-3.5 h-3.5 text-gray-600" /></button>
              {confidence && <span className={cn("absolute bottom-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full", cc[confidence])}>{confidence} confidence</span>}
            </div>
          )}
          {photoItems && photoItems.length>0 && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl overflow-hidden">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-purple-100"><Sparkles className="w-3.5 h-3.5 text-purple-500" /><span className="text-xs font-semibold text-purple-700">AI detected</span></div>
              <div className="divide-y divide-purple-100">
                {photoItems.map((item,i) => (<div key={i} className="flex justify-between px-3 py-2 text-xs"><span className="text-gray-600">{item.name}</span><span className="font-mono font-medium">{item.calories} kcal</span></div>))}
              </div>
            </div>
          )}
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Meal name *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Calories * <span className="font-normal text-purple-500">(edit freely)</span></label><input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="0" min={0} className="input border-purple-200" /></div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Extras / description <span className="font-normal text-gray-400">(oils, sauces, sides…)</span></label>
            <div className="flex gap-2">
              <input type="text" value={extras} onChange={(e) => setExtras(e.target.value)} placeholder="e.g. cooked in olive oil, side of bread" className="input flex-1" />
              <button type="button" onClick={toggleVoice} className={cn("flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all", listening ? "bg-red-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-brand-100 hover:text-brand-600")}>
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
            {listening && <p className="text-xs text-red-500 mt-1">🔴 Listening… describe any extras</p>}
            <p className="text-xs text-gray-400 mt-1">Tap the mic to speak any extras that affect calories</p>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save meal
            </button>
          </div>
        </form>
      )}
      {error && stage!=="review" && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
