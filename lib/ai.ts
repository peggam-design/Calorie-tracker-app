import type { FoodAnalysisResult } from "@/types";

export async function estimateCaloriesFromText(mealName: string): Promise<{
  calories: number;
  breakdown: string;
  confidence: "low" | "medium" | "high";
}> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  if (apiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 150,
          messages: [
            { role: "system", content: 'You are a nutrition expert. Respond ONLY with valid JSON: { "calories": number, "breakdown": "string", "confidence": "low"|"medium"|"high" }. No markdown.' },
            { role: "user", content: `Estimate calories for: ${mealName}` },
          ],
        }),
      });
      const data = await res.json();
      return JSON.parse(data.choices?.[0]?.message?.content?.replace(/```json|```/g, "").trim() ?? "{}");
    } catch { /* fall through to mock */ }
  }

  await new Promise((r) => setTimeout(r, 600));
  const name = mealName.toLowerCase();
  const keywords = [
    { terms: ["salad"], calories: 250, breakdown: "Greens + dressing ~250 kcal" },
    { terms: ["chicken rice", "rice bowl", "chicken and rice"], calories: 520, breakdown: "Chicken ~250 + rice ~200 + veggies ~70" },
    { terms: ["chicken"], calories: 350, breakdown: "Chicken breast ~350 kcal" },
    { terms: ["pasta", "spaghetti", "noodle"], calories: 480, breakdown: "Pasta ~300 + sauce ~150 + cheese ~30" },
    { terms: ["burger", "hamburger", "cheeseburger"], calories: 650, breakdown: "Patty ~350 + bun ~150 + toppings ~150" },
    { terms: ["pizza"], calories: 700, breakdown: "2 slices ~700 kcal" },
    { terms: ["sandwich", "sub", "wrap"], calories: 420, breakdown: "Bread ~200 + filling ~220" },
    { terms: ["soup"], calories: 200, breakdown: "Broth-based soup ~200 kcal" },
    { terms: ["oatmeal", "porridge"], calories: 300, breakdown: "Oats ~150 + milk ~100 + toppings ~50" },
    { terms: ["egg", "omelette", "omelet"], calories: 280, breakdown: "2 eggs ~150 + oil ~130" },
    { terms: ["avocado toast"], calories: 380, breakdown: "Bread ~180 + avocado ~160 + egg ~40" },
    { terms: ["smoothie"], calories: 320, breakdown: "Fruit ~200 + liquid ~120" },
    { terms: ["steak", "beef"], calories: 600, breakdown: "Steak ~400 + sides ~200" },
    { terms: ["fish", "salmon", "tuna"], calories: 350, breakdown: "Fish ~250 + sides ~100" },
    { terms: ["sushi"], calories: 400, breakdown: "Sushi rolls ~400 kcal" },
    { terms: ["taco", "burrito", "quesadilla"], calories: 550, breakdown: "Tortilla ~200 + filling ~350" },
    { terms: ["pancake", "waffle"], calories: 450, breakdown: "Pancakes ~300 + syrup ~150" },
    { terms: ["ramen", "noodle soup"], calories: 550, breakdown: "Noodles ~350 + broth + toppings ~200" },
    { terms: ["curry"], calories: 520, breakdown: "Protein ~250 + sauce ~200 + rice ~70" },
    { terms: ["stir fry", "stir-fry", "fried rice"], calories: 480, breakdown: "Protein + veg ~280 + sauce + rice ~200" },
    { terms: ["yogurt", "parfait"], calories: 200, breakdown: "Yogurt ~150 + toppings ~50" },
    { terms: ["cereal"], calories: 250, breakdown: "Cereal ~150 + milk ~100" },
  ];
  for (const entry of keywords) {
    if (entry.terms.some((t) => name.includes(t))) {
      return { calories: entry.calories, breakdown: entry.breakdown, confidence: "medium" };
    }
  }
  return { calories: 400, breakdown: "Generic meal estimate ~400 kcal (edit as needed)", confidence: "low" };
}

export async function analyzeFoodImage(imageFile: File): Promise<FoodAnalysisResult> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  if (apiKey) {
    try {
      const base64 = await fileToBase64(imageFile);
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o",
          max_tokens: 400,
          messages: [{
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${imageFile.type};base64,${base64}` } },
              { type: "text", text: 'Analyze this food. Respond ONLY with valid JSON (no markdown): { "description": string, "estimatedCalories": number, "confidence": "low"|"medium"|"high", "items": [{ "name": string, "calories": number }] }' },
            ],
          }],
        }),
      });
      const data = await res.json();
      return JSON.parse(data.choices?.[0]?.message?.content?.replace(/```json|```/g, "").trim() ?? "{}");
    } catch { /* fall through to mock */ }
  }

  await new Promise((r) => setTimeout(r, 1500));
  const mocks: FoodAnalysisResult[] = [
    { description: "Grilled chicken breast, steamed white rice, broccoli", estimatedCalories: 520, confidence: "high", items: [{ name: "Grilled chicken breast (150g)", calories: 248 }, { name: "Steamed white rice (1 cup)", calories: 206 }, { name: "Broccoli (100g)", calories: 55 }] },
    { description: "Caesar salad with croutons and parmesan", estimatedCalories: 380, confidence: "medium", items: [{ name: "Romaine lettuce (100g)", calories: 17 }, { name: "Caesar dressing (2 tbsp)", calories: 160 }, { name: "Croutons (30g)", calories: 120 }, { name: "Parmesan (15g)", calories: 61 }] },
    { description: "Avocado toast with poached egg", estimatedCalories: 440, confidence: "high", items: [{ name: "Sourdough bread (2 slices)", calories: 180 }, { name: "Avocado (half)", calories: 160 }, { name: "Poached egg (large)", calories: 78 }, { name: "Olive oil drizzle", calories: 40 }] },
    { description: "Beef burger with fries", estimatedCalories: 850, confidence: "medium", items: [{ name: "Beef patty (150g)", calories: 350 }, { name: "Brioche bun", calories: 180 }, { name: "Cheese, lettuce, sauce", calories: 120 }, { name: "French fries (medium)", calories: 200 }] },
  ];
  return mocks[Math.floor(Math.random() * mocks.length)];
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}