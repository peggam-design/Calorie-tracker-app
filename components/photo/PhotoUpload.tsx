"use client";
import { useState, useRef } from "react";
import { analyzeFoodImage } from "@/lib/ai";
import AddMealForm from "@/components/meals/AddMealForm";
import { Camera, Upload, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
interface Props { today: string; onMealAdded: () => void; }
export default function PhotoUpload({ today, onMealAdded }: Props) {
  return <div className="hidden" />;
}
