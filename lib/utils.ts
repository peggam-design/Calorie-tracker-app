// ============================================================
// lib/utils.ts – Shared utility functions
// ============================================================
import { clsx, type ClassValue } from "clsx";

/** Merge Tailwind class names conditionally */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Format a number as "1,234 kcal" */
export function formatCalories(n: number): string {
  return `${n.toLocaleString()} kcal`;
}

/** Returns a friendly label for the net calorie balance */
export function netLabel(net: number): { label: string; color: string } {
  if (net <= 0) return { label: "In deficit 🎉", color: "text-brand-600" };
  if (net < 500) return { label: "On track", color: "text-amber-600" };
  return { label: "Over budget", color: "text-red-500" };
}

/** Format a Date to "HH:mm" local time */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Format a Date to "Mon, Jan 1" */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}
