// ============================================================
// app/auth/page.tsx – Login / Sign-up page
// ============================================================
import AuthForm from "@/components/auth/AuthForm";

export default function AuthPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: "radial-gradient(ellipse at 60% 0%, #bbf7d0 0%, transparent 60%), radial-gradient(ellipse at 0% 80%, #dcfce7 0%, transparent 50%), #f5f7f5"
      }}>
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-brand-100/60 blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo / title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white text-2xl mb-4 shadow-lg">
            🥗
          </div>
          <h1 className="font-display text-4xl font-bold text-gray-900 tracking-tight">
            Calorify
          </h1>
          <p className="text-gray-500 mt-1">Track what you eat. Feel better every day.</p>
        </div>

        <AuthForm />
      </div>
    </main>
  );
}
