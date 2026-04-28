"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup";

export default function AuthForm() {
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "http://localhost:3000/dashboard";
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("Account created! Now log in.");
        setMode("login");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-elevated p-8">
      <div className="flex bg-surface-2 rounded-xl p-1 mb-6">
        {(["login", "signup"] as Mode[]).map((m) => (
          <button key={m} type="button"
            onClick={() => { setMode(m); setError(null); setSuccess(null); }}
            className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}>
            {m === "login" ? "Log in" : "Sign up"}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none transition" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type={showPass ? "text" : "password"} value={password}
              onChange={(e) => setPassword(e.target.value)} required minLength={6}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm outline-none transition" />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}
        {success && <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">{success}</div>}
        <button type="submit" disabled={loading}
          className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
