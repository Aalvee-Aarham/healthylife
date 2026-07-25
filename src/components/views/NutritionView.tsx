import React, { useState } from 'react';
import { MealItem, DailyMacros } from '../../types';
import { askGroqAI } from '../../services/groqApi';
import { fetchPexelsImage } from '../../services/pexelsApi';
import { 
  Utensils, 
  Sparkles, 
  Plus, 
  Check, 
  Search, 
  Droplet, 
  ShoppingCart, 
  Flame, 
  Info,
  ChevronRight,
  Filter,
  RefreshCw,
  Send,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface NutritionViewProps {
  meals: MealItem[];
  macros: DailyMacros;
  onToggleMeal: (mealId: string) => void;
  onAddMeal: (
    name: string, 
    cal: number, 
    protein: number, 
    customCarbs?: number, 
    customFat?: number, 
    customImage?: string,
    category?: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    aiTag?: string
  ) => void;
  onLogWater: (amountMl: number) => void;
}

export const NutritionView: React.FC<NutritionViewProps> = ({
  meals,
  macros,
  onToggleMeal,
  onAddMeal,
  onLogWater
}) => {
  const [selectedDay, setSelectedDay] = useState<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'>('Wed');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGroceryModal, setShowGroceryModal] = useState(false);

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  const daysList: Array<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'> = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const foodSearchDatabase = [
    { name: 'Greek Yogurt (170g)', calories: 130, protein: 17, carbs: 6, fat: 0 },
    { name: 'Grilled Chicken Breast (150g)', calories: 240, protein: 46, carbs: 0, fat: 5 },
    { name: 'Avocado Toast with Egg', calories: 380, protein: 16, carbs: 32, fat: 20 },
    { name: 'Quinoa & Black Bean Bowl', calories: 420, protein: 18, carbs: 62, fat: 10 },
    { name: 'Whey Protein Shake (1 scoop)', calories: 120, protein: 25, carbs: 3, fat: 1.5 },
    { name: 'Blueberries & Almond Butter', calories: 210, protein: 6, carbs: 22, fat: 12 }
  ];

  const filteredFoods = foodSearchDatabase.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groceryItems = [
    { category: 'Proteins', items: ['Wild Salmon Fillets (400g)', 'Free-Range Eggs (12pk)', 'Organic Chicken Breast (600g)', 'Edamame Beans'] },
    { category: 'Produce & Veggies', items: ['Avocados (4x)', 'Baby Spinach & Microgreens', 'Sweet Potatoes (1kg)', 'Fresh Asparagus'] },
    { category: 'Grains & Pantry', items: ['Organic Quinoa', 'Sourdough Bread', 'Matcha Powder', 'Raw Almonds & Pumpkin Seeds'] }
  ];

  const FOOD_KEYWORDS = [
    'egg', 'eggs', 'chicken', 'salmon', 'beef', 'steak', 'salad', 'smoothie', 'oat', 'oats',
    'oatmeal', 'toast', 'bread', 'rice', 'protein', 'shake', 'apple', 'banana', 'milk', 'coffee',
    'tea', 'pizza', 'burger', 'pasta', 'spaghetti', 'soup', 'meal', 'ate', 'had', 'drink',
    'drinking', 'snack', 'breakfast', 'lunch', 'dinner', 'kcal', 'cal', 'calories', 'gram',
    'grams', 'g', 'food', 'recipe', 'sandwich', 'bowl', 'taco', 'tacos', 'sushi', 'wrap',
    'yogurt', 'avocado', 'cookie', 'cake', 'juice', 'fish', 'tuna', 'turkey', 'pork', 'lamb',
    'tofu', 'quinoa', 'veggie', 'veggies', 'vegetable', 'fruit', 'nuts', 'almonds', 'peanut',
    'butter', 'cheese', 'pie', 'pancake', 'waffle', 'berry', 'blueberries', 'strawberries',
    'watermelon', 'chia', 'flax', 'whey', 'casein', 'water', 'coke', 'soda', 'diet', 'snax'
  ];

  const isFoodRelatedQuery = (query: string): boolean => {
    const q = query.toLowerCase();
    return FOOD_KEYWORDS.some(kw => q.includes(kw)) || /\b(\d+)\s*(kcal|cal|calories|g|grams)\b/i.test(q);
  };

  const estimateLegitNutrition = (query: string) => {
    const q = query.toLowerCase();
    
    const calMatch = q.match(/(\d+)\s*(kcal|cal|calories)/);
    const protMatch = q.match(/(\d+)\s*(g|grams)?\s*protein/);
    const carbMatch = q.match(/(\d+)\s*(g|grams)?\s*(carb|carbs)/);
    const fatMatch = q.match(/(\d+)\s*(g|grams)?\s*fat/);

    let cal = calMatch ? parseInt(calMatch[1], 10) : 0;
    let protein = protMatch ? parseInt(protMatch[1], 10) : 0;
    let carbs = carbMatch ? parseInt(carbMatch[1], 10) : 0;
    let fat = fatMatch ? parseInt(fatMatch[1], 10) : 0;

    if (cal === 0) {
      if (q.includes('steak') || q.includes('beef')) { cal = 550; protein = protein || 48; carbs = carbs || 0; fat = fat || 28; }
      else if (q.includes('salmon') || q.includes('fish')) { cal = 460; protein = protein || 38; carbs = carbs || 5; fat = fat || 22; }
      else if (q.includes('chicken') || q.includes('turkey')) { cal = 380; protein = protein || 42; carbs = carbs || 8; fat = fat || 10; }
      else if (q.includes('egg') || q.includes('eggs')) { cal = 220; protein = protein || 14; carbs = carbs || 2; fat = fat || 15; }
      else if (q.includes('salad')) { cal = 290; protein = protein || 12; carbs = carbs || 22; fat = fat || 14; }
      else if (q.includes('smoothie') || q.includes('shake')) { cal = 310; protein = protein || 28; carbs = carbs || 32; fat = fat || 5; }
      else if (q.includes('pizza') || q.includes('burger')) { cal = 680; protein = protein || 28; carbs = carbs || 70; fat = fat || 30; }
      else if (q.includes('oat') || q.includes('oatmeal')) { cal = 260; protein = protein || 10; carbs = carbs || 42; fat = fat || 5; }
      else { cal = 380; protein = protein || 22; carbs = carbs || 35; fat = fat || 12; }
    }

    if (protein === 0) protein = Math.round((cal * 0.25) / 4);
    if (carbs === 0) carbs = Math.round((cal * 0.45) / 4);
    if (fat === 0) fat = Math.round((cal * 0.3) / 9);

    return { calories: cal, protein, carbs, fat };
  };

  // Helper to add food with Pexels image
  const handleAddFoodWithPexels = async (
    name: string, 
    cal: number, 
    protein: number, 
    carbs?: number, 
    fat?: number,
    category: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'snack',
    aiTag: string = 'AI Logged'
  ) => {
    setIsAiLoading(true);
    try {
      const pexelsImg = await fetchPexelsImage(name);
      onAddMeal(name, cal, protein, carbs, fat, pexelsImg, category, aiTag);
      setAiFeedback(`✨ Added "${name}" (${cal} kcal, ${protein}g P) with custom photo!`);
    } catch (err) {
      onAddMeal(name, cal, protein, carbs, fat, undefined, category, aiTag);
      setAiFeedback(`Added "${name}" (${cal} kcal, ${protein}g P)`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Prompt Processor
  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || isAiLoading) return;

    const trimmed = aiPrompt.trim();

    // Direct client check for non-food query
    if (!isFoodRelatedQuery(trimmed)) {
      setAiFeedback(`⚠️ Non-food prompt detected. Please enter a food item, meal, or recipe to log (e.g., '2 scrambled eggs with toast' or 'Grilled chicken salad').`);
      return;
    }

    setIsAiLoading(true);
    setAiFeedback('AI is calculating nutritional values & searching for high-resolution food photo...');

    try {
      const contextInstructions = `CRITICAL FOOD LOGGING INSTRUCTIONS:
1. Evaluate if the query is genuinely about a food, meal, drink, ingredient, or recipe.
2. If NOT food related, respond ONLY with JSON: {"isFood": false, "message": "Please enter a valid food item or meal to log."}
3. If IS food related: Calculate realistic USDA standard nutrition facts (calories, protein g, carbs g, fat g) for standard portion sizes.
Respond ONLY with JSON: {"isFood": true, "name": "Clean Standardized Meal Title", "calories": 480, "protein": 36, "carbs": 42, "fat": 14, "category": "lunch", "summary": "High protein meal optimal for muscle recovery."}`;
      
      const aiResponse = await askGroqAI(trimmed, 'member', contextInstructions);

      let isFood = true;
      let alertMsg = 'Please enter a valid food item or meal to log.';
      let parsed = {
        name: trimmed.slice(0, 35),
        ...estimateLegitNutrition(trimmed),
        category: 'snack' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        summary: ''
      };

      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonParsed = JSON.parse(jsonMatch[0]);
          if (jsonParsed.isFood === false || jsonParsed.isFood === 'false') {
            isFood = false;
            if (jsonParsed.message) alertMsg = jsonParsed.message;
          } else {
            if (jsonParsed.name) parsed.name = jsonParsed.name;
            if (jsonParsed.calories && Number(jsonParsed.calories) > 0) parsed.calories = Number(jsonParsed.calories);
            if (jsonParsed.protein && Number(jsonParsed.protein) >= 0) parsed.protein = Number(jsonParsed.protein);
            if (jsonParsed.carbs && Number(jsonParsed.carbs) >= 0) parsed.carbs = Number(jsonParsed.carbs);
            if (jsonParsed.fat && Number(jsonParsed.fat) >= 0) parsed.fat = Number(jsonParsed.fat);
            if (jsonParsed.category) parsed.category = jsonParsed.category;
          }
        }
      } catch (e) {
        console.log('JSON parse fallback used');
      }

      if (!isFood) {
        setAiFeedback(`⚠️ ${alertMsg}`);
        setIsAiLoading(false);
        return;
      }

      // Fetch Pexels Image for the parsed food name
      const pexelsPhoto = await fetchPexelsImage(parsed.name);

      // Call onAddMeal
      onAddMeal(
        parsed.name,
        parsed.calories,
        parsed.protein,
        parsed.carbs,
        parsed.fat,
        pexelsPhoto,
        parsed.category || 'snack',
        'HealthyLife AI'
      );

      setAiFeedback(`✨ AI Logged "${parsed.name}" (${parsed.calories} kcal, ${parsed.protein}g Protein, ${parsed.carbs}g Carbs, ${parsed.fat}g Fat)`);
      setAiPrompt('');
    } catch (error) {
      if (!isFoodRelatedQuery(trimmed)) {
        setAiFeedback('⚠️ Non-food prompt detected. Please enter a valid food item or meal to log.');
      } else {
        const legit = estimateLegitNutrition(trimmed);
        const pexelsPhoto = await fetchPexelsImage(trimmed);
        onAddMeal(trimmed, legit.calories, legit.protein, legit.carbs, legit.fat, pexelsPhoto, 'snack', 'AI Estimate');
        setAiFeedback(`✨ AI Logged "${trimmed}" (${legit.calories} kcal, ${legit.protein}g Protein)`);
        setAiPrompt('');
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* AI Nutrition Plan Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-800/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 text-xs font-bold border border-emerald-800">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ovulation Peak Phase Bio-Diet</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              AI Personalized Nutrition & Recipe Blueprint
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Engineered with <span className="text-emerald-400 font-bold">130g Protein Target</span> to support muscle recovery during peak strength output.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearchModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Food Scanner & Search</span>
            </button>
            <button
              onClick={() => setShowGroceryModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Grocery List</span>
            </button>
          </div>
        </div>

        {/* Weekly Day Bar */}
        <div className="pt-4 border-t border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {daysList.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 min-w-[60px] py-2 px-3 rounded-2xl text-xs font-bold transition-all text-center ${
                selectedDay === day
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{day}</span>
              {day === 'Wed' && <span className="block text-[9px] text-slate-950 font-black">Today</span>}
            </button>
          ))}
        </div>
      </div>

      {/* AI Interactive Food & Recipe Logger Card */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/30 dark:bg-slate-900 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                <span>HealthyLife AI Food Assistant</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                  Pexels HD Photos
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Type what you ate or ask AI for a recipe. AI will calculate macros and attach a high-res photo automatically!
              </p>
            </div>
          </div>
        </div>

        {/* AI Input Form */}
        <form onSubmit={handleAiSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Utensils className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., 'Add a grilled salmon bowl with 520 kcal and 42g protein' or 'Suggest a post-workout snack'"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isAiLoading}
            className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg transition-colors disabled:opacity-50"
          >
            {isAiLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Processing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Log with AI</span>
              </>
            )}
          </button>
        </form>

        {/* Feedback message */}
        {aiFeedback && (
          <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200 border ${
            aiFeedback.startsWith('⚠️')
              ? 'bg-amber-950/90 border-amber-700/80 text-amber-200 shadow-md'
              : 'bg-emerald-950/90 border-emerald-700/80 text-emerald-200 shadow-md'
          }`}>
            {aiFeedback.startsWith('⚠️') ? (
              <AlertCircle className="w-4.5 h-4.5 text-amber-400 shrink-0" />
            ) : (
              <Sparkles className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
            )}
            <span>{aiFeedback}</span>
          </div>
        )}

        {/* Quick AI Food Suggestions */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Add AI Presets (Auto-Fetches Pexels Image):</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleAddFoodWithPexels('Wild Salmon Avocado Bowl', 520, 42, 35, 22, 'lunch', 'AI Presets')}
              disabled={isAiLoading}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>🍣 Salmon Avocado Bowl (520 kcal, 42g P)</span>
            </button>
            <button
              onClick={() => handleAddFoodWithPexels('Grilled Ribeye Steak Sweet Potato', 620, 50, 45, 24, 'dinner', 'AI Presets')}
              disabled={isAiLoading}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>🥩 Steak & Sweet Potato (620 kcal, 50g P)</span>
            </button>
            <button
              onClick={() => handleAddFoodWithPexels('Blueberry Whey Protein Smoothie', 280, 30, 25, 4, 'snack', 'AI Presets')}
              disabled={isAiLoading}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>🫐 Berry Protein Smoothie (280 kcal, 30g P)</span>
            </button>
            <button
              onClick={() => handleAddFoodWithPexels('Greek Quinoa Mediterranean Salad', 380, 18, 48, 14, 'lunch', 'AI Presets')}
              disabled={isAiLoading}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>🥗 Quinoa Power Salad (380 kcal, 18g P)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Meals & Hydration Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Meal List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-emerald-400" />
              <span>Today's Meal Schedule</span>
            </h2>
            <span className="text-xs text-slate-400 font-semibold">{meals.filter(m => m.completed).length} / {meals.length} Logged</span>
          </div>

          <div className="space-y-4">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className={`p-5 rounded-3xl border transition-all ${
                  meal.completed
                    ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  
                  <div className="flex items-center gap-4">
                    <img
                      src={meal.image}
                      alt={meal.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-800"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          {meal.category} • {meal.time}
                        </span>
                        {meal.aiTag && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                            {meal.aiTag}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-100">{meal.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-300">
                        <span className="font-bold text-slate-100">{meal.calories} kcal</span>
                        <span>•</span>
                        <span className="text-emerald-400">{meal.protein}g P</span>
                        <span>•</span>
                        <span className="text-cyan-400">{meal.carbs}g C</span>
                        <span>•</span>
                        <span className="text-amber-400">{meal.fat}g F</span>
                      </div>
                    </div>
                  </div>

                  {/* Completion checkmark button */}
                  <button
                    onClick={() => onToggleMeal(meal.id)}
                    className={`p-3 rounded-2xl flex items-center justify-center transition-all ${
                      meal.completed
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-950/50'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                  </button>

                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Hydration Bottle Tracker & Macro Totals */}
        <div className="space-y-6">
          
          {/* Hydration Interactive Widget */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-cyan-400" />
                <span>Hydration Tracker</span>
              </h3>
              <span className="text-xs font-bold text-cyan-400">{macros.waterConsumedMl} / {macros.waterGoalMl} ml</span>
            </div>

            {/* Visual Bottle Fill */}
            <div className="relative w-full h-32 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-end justify-center">
              <div
                className="w-full bg-gradient-to-t from-cyan-600 via-cyan-500 to-teal-400 transition-all duration-700 ease-out opacity-80"
                style={{ height: `${Math.min(100, (macros.waterConsumedMl / macros.waterGoalMl) * 100)}%` }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center font-black text-slate-100 drop-shadow-md">
                <span className="text-2xl">{Math.round((macros.waterConsumedMl / macros.waterGoalMl) * 100)}%</span>
                <span className="text-[10px] text-cyan-100 uppercase tracking-wider font-semibold">Cellular Hydration</span>
              </div>
            </div>

            {/* Quick Add Water Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onLogWater(250)}
                className="py-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-800/60 text-xs font-bold transition-colors text-center"
              >
                +250ml Glass
              </button>
              <button
                onClick={() => onLogWater(500)}
                className="py-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-800/60 text-xs font-bold transition-colors text-center"
              >
                +500ml Bottle
              </button>
            </div>
          </div>

          {/* AI Micronutrient Advice */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Bio-Nutritional Insight</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              During Day 14 (Ovulation Peak), high estrogen accelerates muscle protein synthesis. Ensure at least 35g of protein with every main meal.
            </p>
          </div>

        </div>

      </div>

      {/* FOOD SEARCH / SCANNER MODAL */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold">Food Database & AI Scanner</h3>
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search food item (e.g. Greek Yogurt, Salmon)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredFoods.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-200">{item.name}</p>
                    <p className="text-[10px] text-slate-400">{item.calories} kcal • {item.protein}g Protein</p>
                  </div>
                  <button
                    onClick={() => {
                      onAddMeal(item.name, item.calories, item.protein);
                      setShowSearchModal(false);
                    }}
                    className="px-3 py-1 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-colors"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GROCERY LIST MODAL */}
      {showGroceryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                <span>Weekly Grocery Checklist</span>
              </h3>
              <button
                onClick={() => setShowGroceryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {groceryItems.map((cat, i) => (
                <div key={i} className="space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{cat.category}</h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {cat.items.map((item, j) => (
                      <li key={j} className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowGroceryModal(false)}
              className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
            >
              Export / Print Grocery List
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
