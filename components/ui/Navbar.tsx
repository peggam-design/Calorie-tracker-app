"use client";
// ============================================================
// components/ui/Navbar.tsx
// ============================================================
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Salad } from "lucide-react";

export default function Navbar({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Salad className="w-5 h-5 text-brand-600" />
          <span className="font-display font-bold text-lg text-gray-900 tracking-tight">Calorify</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 hidden sm:block truncate max-w-[160px]">{userEmail}</span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition py-1.5 px-2 rounded-lg hover:bg-gray-100"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
