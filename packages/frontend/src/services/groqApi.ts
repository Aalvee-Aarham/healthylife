// Groq API Service for HealthyLife AI Assistant
const GROQ_API_KEY = (import.meta as any).env?.VITE_GROQ_API_KEY || '';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

export interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function askGroqAI(
  userQuery: string,
  userRole: 'member' | 'coach' = 'member',
  contextData?: string
): Promise<string> {
  const systemPrompts = {
    member: `You are HealthyLife AI, an expert, empathetic, and science-backed holistic health, nutrition, workout, and cycle-syncing wellness advisor. Provide practical, inspiring, and direct answers tailored to the user's goals. Format with clear bullet points and bold key recommendations. Keep answers concise, actionable, and engaging.`,
    coach: `You are HealthyLife Pro AI Coach Diagnostic Assistant. You help certified coaches craft personalized client routines, analyze bio-feedback data, identify form mistakes, and optimize macro/micro nutrient targets. Output structured, professional recommendations for client management.`
  };

  const messages: GroqChatMessage[] = [
    { role: 'system', content: systemPrompts[userRole] },
    ...(contextData ? [{ role: 'system' as const, content: `Context data: ${contextData}` }] : []),
    { role: 'user', content: userQuery }
  ];

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Fast & powerful Groq model
        messages: messages,
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      // Fallback model if 70b hits rate limit
      const fallbackResponse = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: messages,
          temperature: 0.7,
          max_tokens: 600
        })
      });

      if (!fallbackResponse.ok) {
        throw new Error(`Groq API returned status ${response.status}`);
      }

      const fallbackData = await fallbackResponse.json();
      return fallbackData.choices[0]?.message?.content || generateLocalFallback(userQuery, userRole);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || generateLocalFallback(userQuery, userRole);
  } catch (err) {
    console.warn('Groq API request notice:', err);
    return generateLocalFallback(userQuery, userRole);
  }
}

function generateLocalFallback(query: string, role: string): string {
  const q = query.toLowerCase();
  
  if (role === 'coach') {
    return `### 🏋️ Pro Coach AI Analysis
**Client Query Recommendation**:
- **Strength Load**: Maintain 80% 1RM for current mesocycle. Incorporate 3x8 Bulgarian Split Squats.
- **Nutrition Adjustment**: Increase post-workout protein by 15g (targeting 1.8g/kg total body weight).
- **Recovery Note**: Suggest 10-minute soft foam rolling post-session to reduce delayed onset muscle soreness (DOMS).`;
  }


  // Member default responses
  if (q.includes('workout') || q.includes('exercise')) {
    return `### 💪 Custom HealthyLife Workout Plan
- **Warm-Up (5 mins)**: World's greatest stretch + 15 arm circles + cat-cow flow.
- **Main Circuit (3 Rounds)**:
  1. Goblet Squats - 12 reps
  2. Dumbbell Romanian Deadlifts - 10 reps
  3. Push-Ups or Elevated Incline Push-Ups - 10 reps
  4. Plank hold - 45 seconds
- **Cool-down**: Child's pose & deep diaphragmatic breathing for 3 minutes.`;
  }

  if (q.includes('diet') || q.includes('food') || q.includes('meal') || q.includes('recipe')) {
    return `### 🥗 Bio-Balanced Meal Blueprint
- **Breakfast**: Avocado toast on sourdough topped with 2 organic poached eggs and pumpkin seeds.
- **Lunch**: Wild-caught salmon bowl with quinoa, steamed edamame, cucumber, and olive oil ginger dressing.
- **Snack**: Greek yogurt with fresh blueberries and a sprinkle of chia seeds.
- **Dinner**: Grilled lemon herb chicken breast with roasted sweet potatoes and asparagus.`;
  }

  return `### ✨ HealthyLife AI Recommendation
Based on your current vitals and activity score:
- **Hydration Target**: Drink 250ml water now to stay on pace for your 3,000ml goal.
- **Energy Optimization**: Try a 15-minute brisk outdoor walk to boost oxygenation and natural endorphins.
- **Recovery Tip**: Aim for 7.5 to 8 hours of restful sleep tonight to support muscular & hormonal restoration.`;
}
