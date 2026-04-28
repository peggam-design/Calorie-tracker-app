# 🥗 Calorify — Calorie Tracker

A full-stack calorie tracking web app built with **Next.js 14**, **Supabase**, and **Tailwind CSS**.

---

## ✨ Features

| Feature | Status |
|---|---|
| Email/password auth (Supabase) | ✅ |
| Log meals with name, calories, notes, time | ✅ |
| Edit & delete meals | ✅ |
| Extra calorie adjustments (oils, sauces) | ✅ |
| Calories burned (manual + quick-add presets) | ✅ |
| Dashboard: consumed / burned / net | ✅ |
| Progress ring (vs 2000 kcal goal) | ✅ |
| Photo upload → AI calorie estimation (stubbed) | ✅ stub, ready for OpenAI |
| Row-level security (users see only their data) | ✅ |
| Mobile-first responsive design | ✅ |

---

## 🗂 Project Structure

```
calorie-tracker/
├── app/
│   ├── layout.tsx              # Root layout (fonts, metadata)
│   ├── page.tsx                # Root redirect (→ /dashboard or /auth)
│   ├── globals.css             # Tailwind + global styles
│   ├── auth/
│   │   └── page.tsx            # Login / sign-up page
│   └── dashboard/
│       ├── layout.tsx          # Authenticated shell + Navbar
│       └── page.tsx            # Dashboard (server component)
│
├── components/
│   ├── auth/
│   │   └── AuthForm.tsx        # Login/signup form
│   ├── meals/
│   │   ├── DashboardClient.tsx # Main interactive dashboard
│   │   ├── MealList.tsx        # Today's meals with edit/delete
│   │   ├── AddMealForm.tsx     # Inline add-meal form
│   │   ├── EditMealModal.tsx   # Edit meal modal
│   │   ├── AddAdjustmentForm.tsx
│   │   └── AdjustmentList.tsx
│   ├── stats/
│   │   ├── CalorieSummaryBar.tsx  # Top ring + consumed/burned/net
│   │   └── CaloriesBurnedForm.tsx
│   ├── photo/
│   │   └── PhotoUpload.tsx     # Drag-drop + AI analysis UI
│   └── ui/
│       └── Navbar.tsx
│
├── lib/
│   ├── ai.ts                   # analyzeFoodImage() stub → OpenAI ready
│   ├── db.ts                   # All Supabase queries
│   ├── utils.ts                # Helpers (cn, formatCalories, etc.)
│   └── supabase/
│       ├── client.ts           # Browser client
│       ├── server.ts           # Server component client
│       └── middleware.ts       # Session refresh
│
├── supabase/
│   └── schema.sql              # Run this in Supabase SQL editor
│
├── types/
│   └── index.ts                # Shared TypeScript interfaces
│
├── middleware.ts               # Next.js middleware (auth redirects)
├── .env.example                # Copy to .env.local
└── package.json
```

---

## 🚀 Local Setup — Step by Step

### Prerequisites

- **Node.js 18+** — check with `node -v`
- **npm** (comes with Node) or **pnpm** / **yarn**
- A free **Supabase** account → [supabase.com](https://supabase.com)

---

### Step 1 — Clone / download the project

```bash
# If using git
git clone <your-repo-url>
cd calorie-tracker

# Or just unzip and cd into the folder
cd calorie-tracker
```

---

### Step 2 — Install dependencies

```bash
npm install
```

---

### Step 3 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name (e.g. `calorify`) and set a strong database password
3. Wait ~2 minutes for the project to spin up

---

### Step 4 — Run the database schema

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste it into the editor and click **Run**

You should see: `Success. No rows returned`

This creates three tables (`meals`, `adjustments`, `daily_stats`) with Row-Level Security enabled.

---

### Step 5 — Get your Supabase API keys

1. In Supabase, go to **Project Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon / public key** (a long JWT string)

---

### Step 6 — Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Save the file.

---

### Step 7 — Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You'll be redirected to `/auth` — create an account and start tracking!

---

## 🔑 Auth Notes

- Supabase sends a **confirmation email** after sign-up by default.
- To **disable email confirmation** during development:
  - Supabase Dashboard → **Authentication** → **Providers** → **Email**
  - Toggle off **Confirm email**

---

## 🤖 Connecting OpenAI Vision (future)

The photo analysis is stubbed in `lib/ai.ts`. To connect real AI:

1. Install the OpenAI SDK:
   ```bash
   npm install openai
   ```
2. Add your key to `.env.local`:
   ```env
   OPENAI_API_KEY=sk-...
   ```
3. In `lib/ai.ts`, uncomment the real implementation block and delete the stub.

---

## 🏗 Build for production

```bash
npm run build
npm start
```

Or deploy to **Vercel** in one click — just add your two env vars in the Vercel dashboard.

---

## 🗺 Extending the App

| Feature | Where to add |
|---|---|
| Daily calorie goal (custom) | `daily_stats` table + `CalorieSummaryBar` |
| Weekly history chart | New `app/dashboard/history` route + recharts |
| Macro tracking (protein/carbs/fat) | Add columns to `meals` table |
| Barcode scanning | `lib/ai.ts` → Open Food Facts API |
| Fitness API (Garmin, Fitbit) | `lib/db.ts` → `upsertCaloriesBurned()` |
| Push notifications | Supabase Edge Functions + Web Push |

---

## 📝 Tech Stack

- **Next.js 14** (App Router, Server + Client Components)
- **Supabase** (Postgres + Auth + RLS)
- **Tailwind CSS** — utility-first styling
- **TypeScript** — fully typed
- **Lucide React** — icons
- **date-fns** — date formatting
