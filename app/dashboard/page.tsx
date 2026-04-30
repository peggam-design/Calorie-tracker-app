import DashboardClient from "@/components/meals/DashboardClient";
import { toDateString } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const today = toDateString();
  const emptySummary = {
    date: today,
    meals: [],
    adjustments: [],
    totalConsumed: 0,
    totalBurned: 0,
    net: 0,
  };
  return <DashboardClient initialSummary={emptySummary} today={today} />;
}
