import type { FoodAnalysisResult } from "@/types";
const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
async function askOpenAI(systemPrompt: string, userMessage: string, maxTokens = 500): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ model: "gpt-4o-mini", max_tokens: maxTokens, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }] }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.replace(/```json|```/g, "").trim() ?? "{}";
}
export interface ParsedMeal { name: string; calories: number; notes: string; confidence: "low"|"medium"|"high"; }
export async function parseMealFromText(input: string): Promise<ParsedMeal[]> {
  if (OPENAI_KEY) {
    try {
      const result = await askOpenAI(
        `You are a nutrition expert. Parse meal descriptions and estimate calories based on portion sizes. Understand natural language like "small piece", "huge bowl", "a bit of", "heaping plate". Return ONLY valid JSON array (no markdown): [{ "name": string, "calories": number, "notes": string, "confidence": "low"|"medium"|"high" }]. Account for portion size words (small=70%, normal=100%, large=140%, huge=180%). notes should describe what you inferred about portions.`,
        `Parse this meal description and estimate calories: "${input}"`
      );
      const parsed = JSON.parse(result);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {}
  }
  await new Promise(r => setTimeout(r, 800));
  return mockParseMeals(input);
}
export async function parseBulkMeals(input: string): Promise<ParsedMeal[]> {
  if (OPENAI_KEY) {
    try {
      const result = await askOpenAI(
        `You are a nutrition expert. Parse a full day of meals from a stream-of-consciousness description. Split into individual meals. Return ONLY valid JSON array (no markdown): [{ "name": string, "calories": number, "notes": string, "confidence": "low"|"medium"|"high" }]. Identify meal context (breakfast/lunch/dinner/snack) and include it in the name e.g. "Breakfast - Bowl of cereal". Account for portion descriptions.`,
        `Parse all meals from this description: "${input}"`
      );
      const parsed = JSON.parse(result);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {}
  }
  await new Promise(r => setTimeout(r, 1200));
  return mockParseBulkMeals(input);
}
export async function estimateCaloriesFromText(mealName: string): Promise<{ calories: number; breakdown: string; confidence: "low"|"medium"|"high"; }> {
  if (OPENAI_KEY) {
    try {
      const result = await askOpenAI(
        `You are a nutrition expert. Estimate calories for meals. Understand portion descriptions like "small", "large", "a bit of", "heaping". Return ONLY valid JSON (no markdown): { "calories": number, "breakdown": string, "confidence": "low"|"medium"|"high" }`,
        `Estimate calories for: "${mealName}"`
      );
      return JSON.parse(result);
    } catch {}
  }
  await new Promise(r => setTimeout(r, 600));
  return mockEstimate(mealName);
}
export async function analyzeFoodImage(imageFile: File): Promise<FoodAnalysisResult> {
  if (OPENAI_KEY) {
    try {
      const base64 = await fileToBase64(imageFile);
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({ model: "gpt-4o", max_tokens: 500, messages: [{ role: "user", content: [{ type: "image_url", image_url: { url: `data:${imageFile.type};base64,${base64}` } }, { type: "text", text: 'Analyze this food image. Return ONLY valid JSON (no markdown): { "description": string, "estimatedCalories": number, "confidence": "low"|"medium"|"high", "items": [{ "name": string, "calories": number }] }' }] }] }),
      });
      const data = await res.json();
      return JSON.parse(data.choices?.[0]?.message?.content?.replace(/```json|```/g, "").trim() ?? "{}");
    } catch {}
  }
  await new Promise(r => setTimeout(r, 1500));
  const mocks: FoodAnalysisResult[] = [
    { description: "Grilled chicken breast, steamed white rice, broccoli", estimatedCalories: 520, confidence: "high", items: [{ name: "Grilled chicken breast (150g)", calories: 248 }, { name: "Steamed white rice (1 cup)", calories: 206 }, { name: "Broccoli (100g)", calories: 55 }] },
    { description: "Caesar salad with croutons and parmesan", estimatedCalories: 380, confidence: "medium", items: [{ name: "Romaine lettuce", calories: 17 }, { name: "Caesar dressing", calories: 160 }, { name: "Croutons", calories: 120 }, { name: "Parmesan", calories: 61 }] },
    { description: "Avocado toast with poached egg", estimatedCalories: 440, confidence: "high", items: [{ name: "Sourdough bread (2 slices)", calories: 180 }, { name: "Avocado (half)", calories: 160 }, { name: "Poached egg", calories: 78 }, { name: "Olive oil", calories: 40 }] },
  ];
  return mocks[Math.floor(Math.random() * mocks.length)];
}
function mockEstimate(name: string): { calories: number; breakdown: string; confidence: "low"|"medium"|"high" } {
  const n = name.toLowerCase();
  const mod = n.includes("small")||n.includes("little")||n.includes("bit of") ? 0.7 : n.includes("huge")||n.includes("large")||n.includes("big")||n.includes("heaping") ? 1.5 : 1.0;
  const foods = [
    { terms: ["chicken rice","rice bowl","chicken and rice"], cal: 520, info: "Chicken ~250 + rice ~200 + veg ~70" },
    { terms: ["chicken"], cal: 350, info: "Chicken breast ~350 kcal" },
    { terms: ["salad"], cal: 250, info: "Greens + dressing ~250 kcal" },
    { terms: ["pasta","spaghetti"], cal: 480, info: "Pasta ~300 + sauce ~180" },
    { terms: ["burger"], cal: 650, info: "Patty ~350 + bun ~150 + toppings ~150" },
    { terms: ["pizza"], cal: 700, info: "2 slices ~700 kcal" },
    { terms: ["sandwich","sub","turkey"], cal: 420, info: "Bread ~200 + filling ~220" },
    { terms: ["steak","beef"], cal: 600, info: "Steak ~400 + sides ~200" },
    { terms: ["salmon","fish"], cal: 350, info: "Fish ~250 + sides ~100" },
    { terms: ["egg","omelette"], cal: 280, info: "Eggs ~150 + oil ~130" },
    { terms: ["cereal","oatmeal","porridge"], cal: 280, info: "Cereal ~150 + milk ~100 + toppings ~30" },
    { terms: ["smoothie"], cal: 320, info: "Fruit ~200 + liquid ~120" },
    { terms: ["soup"], cal: 200, info: "Broth-based soup ~200 kcal" },
    { terms: ["taco","burrito"], cal: 550, info: "Tortilla ~200 + filling ~350" },
    { terms: ["sushi"], cal: 400, info: "Sushi rolls ~400 kcal" },
    { terms: ["latte","coffee"], cal: 150, info: "Milk-based coffee ~150 kcal" },
    { terms: ["apple","banana","fruit"], cal: 80, info: "Fresh fruit ~80 kcal" },
    { terms: ["potato","potatoes"], cal: 300, info: "Potatoes ~300 kcal" },
    { terms: ["rice"], cal: 200, info: "Rice (1 cup) ~200 kcal" },
  ];
  for (const f of foods) {
    if (f.terms.some(t => n.includes(t))) return { calories: Math.round(f.cal * mod), breakdown: `${f.info} (portion adjusted)`, confidence: "medium" };
  }
  return { calories: Math.round(400 * mod), breakdown: "Generic estimate ~400 kcal", confidence: "low" };
}
function mockParseMeals(input: string): ParsedMeal[] {
  const est = mockEstimate(input);
  return [{ name: input, calories: est.calories, notes: est.breakdown, confidence: est.confidence }];
}
function mockParseBulkMeals(input: string): ParsedMeal[] {
  const meals: ParsedMeal[] = [];
  const mealWords = ["breakfast","lunch","dinner","snack","brunch"];
  const sentences = input.split(/[,.]/).filter(s => s.trim().length > 3);
  for (const sentence of sentences) {
    const s = sentence.trim().toLowerCase();
    if (s.length < 3) continue;
    const mealType = mealWords.find(w => s.includes(w));
    const cleanName = s.replace(/^(for |at |i had |i ate |had |ate )/gi,"").trim();
    const est = mockEstimate(cleanName);
    meals.push({ name: mealType ? `${mealType.charAt(0).toUpperCase()+mealType.slice(1)} - ${cleanName}` : cleanName, calories: est.calories, notes: est.breakdown, confidence: est.confidence });
  }
  return meals.length > 0 ? meals : mockParseMeals(input);
}
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve((r.result as string).split(",")[1]); r.onerror = reject; r.readAsDataURL(file); });
}
