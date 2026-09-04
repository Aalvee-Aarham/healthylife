<?php

namespace App\Services\AI;

use Illuminate\Support\Str;

class AIService
{
    public function __construct(private readonly AIProviderInterface $provider) {}

    /**
     * General-purpose chat used by /ai/chat (AI Assistant / Nutrition chat widgets).
     */
    public function answerChat(array $messages, ?string $persona = null): string
    {
        $systemPrompts = [
            'member' => "You are HealthyLife AI, an expert, empathetic, and science-backed holistic health, nutrition, workout, and cycle-syncing wellness advisor. Provide practical, inspiring, and direct answers tailored to the user's goals. Format with clear bullet points and bold key recommendations. Keep answers concise, actionable, and engaging.",
            'coach' => 'You are HealthyLife Pro AI Coach Diagnostic Assistant. You help certified coaches craft personalized client routines, analyze bio-feedback data, identify form mistakes, and optimize macro/micro nutrient targets. Output structured, professional recommendations for client management.',
        ];

        $persona = $persona === 'coach' ? 'coach' : 'member';

        $fullMessages = array_merge(
            [['role' => 'system', 'content' => $systemPrompts[$persona]]],
            $messages
        );

        return $this->provider->chat($fullMessages);
    }

    /**
     * Parse a free-text meal description into structured nutrition data.
     *
     * Returns: ['name','calories','protein','carbs','fat','category','confidence']
     * or ['invalid' => true] only when the text is clearly unrelated to food/drink.
     */
    public function parseMealText(string $text): array
    {
        $prompt = $this->mealParsingPrompt();

        $messages = [
            ['role' => 'system', 'content' => $prompt],
            ['role' => 'user', 'content' => $text],
        ];

        $raw = $this->provider->chat($messages, true);

        return $this->decodeMealJson($raw);
    }

    /**
     * Analyze a food photo and return the same structured shape as parseMealText,
     * plus a categoryGuess.
     */
    public function scanFoodImage(string $base64Image, string $mimeType): array
    {
        $prompt = $this->mealParsingPrompt()."\n\nThe input this time is a PHOTO of a plate of food or a drink, not text. Identify the food(s) visible and estimate the combined nutrition. Respond with the same JSON object shape described above (name, calories, protein, carbs, fat, category, confidence), and additionally include a \"categoryGuess\" field with your best guess of meal category (breakfast, lunch, dinner, or snack) based on how the food looks.";

        $raw = $this->provider->analyzeImage($base64Image, $mimeType, $prompt);

        $parsed = $this->decodeMealJson($raw);

        if (! isset($parsed['invalid'])) {
            $parsed['categoryGuess'] = $parsed['categoryGuess'] ?? $parsed['category'] ?? 'snack';
        }

        return $parsed;
    }

    /**
     * Parse a natural-language gym log sentence into a structured workout draft.
     *
     * Returns: ['title' => string, 'exercises' => [['name' => string, 'sets' => [['reps' => int, 'weight_kg' => float], ...]]]]
     */
    public function parseGymLog(string $text): array
    {
        $prompt = <<<'PROMPT'
You are a fitness logging assistant. The user will describe a workout they just did in casual natural language (e.g. "4x10 bench press at 60kg, then 3x12 squats bodyweight"). Convert it into STRICT JSON only — no prose, no markdown fences.

JSON shape:
{
  "title": "short descriptive title for the session, e.g. 'Push Day' or 'Leg Session'",
  "exercises": [
    {
      "name": "Exercise Name",
      "sets": [
        { "reps": 10, "weight_kg": 60 }
      ]
    }
  ]
}

Rules:
- "NxM" notation means N sets of M reps — expand each into its own set object.
- If weight is not mentioned, use weight_kg: 0 (bodyweight).
- Convert lbs to kg (1 lb = 0.453592 kg) and round to 1 decimal if the user gives pounds.
- Always produce a best-effort structured result for anything that plausibly describes exercise, even if phrasing is casual or incomplete.
- Only if the text is clearly not about a workout at all, respond with {"title": null, "exercises": []}.

Respond with the JSON object only.
PROMPT;

        $messages = [
            ['role' => 'system', 'content' => $prompt],
            ['role' => 'user', 'content' => $text],
        ];

        $raw = $this->provider->chat($messages, true);

        $decoded = $this->safeJsonDecode($raw);

        if (! is_array($decoded)) {
            return ['title' => null, 'exercises' => []];
        }

        return [
            'title' => $decoded['title'] ?? null,
            'exercises' => $decoded['exercises'] ?? [],
        ];
    }

    /**
     * Generate a 7-day structured plan (nutrition or workout) from member context.
     *
     * Return shape (documented for the frontend that will render it):
     * [
     *   'title' => string,
     *   'days' => [
     *     '0' => [ // 0 = Monday .. 6 = Sunday
     *       'label' => 'Monday',
     *       'items' => [
     *         // nutrition: { name, calories, protein, carbs, fat, category }
     *         // workout:   { name, sets, reps, notes }
     *       ],
     *     ],
     *     ... '1'..'6'
     *   ],
     *   'notes' => string, // any general guidance/caveats from the AI
     * ]
     *
     * @param  array  $context  Member context: goal, activityLevel, bodyType, medicalConditions,
     *                          macro goals, cyclePhase (nullable).
     * @param  string  $type  'nutrition' | 'workout'
     */
    public function generateWeeklyPlan(array $context, string $type): array
    {
        $dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        $contextJson = json_encode($context, JSON_PRETTY_PRINT);

        if ($type === 'workout') {
            $itemShape = '{ "name": "Exercise name", "sets": 3, "reps": 10, "notes": "optional coaching cue" }';
            $focus = 'a balanced weekly workout split appropriate for the member\'s goal, activity level, body type and any medical conditions (avoid contraindicated movements).';
        } else {
            $itemShape = '{ "name": "Meal name", "calories": 500, "protein": 30, "carbs": 55, "fat": 15, "category": "breakfast|lunch|dinner|snack" }';
            $focus = 'a balanced weekly nutrition plan hitting the member\'s macro goals, respecting medical conditions/allergies mentioned, and factoring in their menstrual cycle phase if provided (e.g. more iron-rich foods during menstrual phase, extra carbs around ovulation).';
        }

        $prompt = <<<PROMPT
You are HealthyLife AI's weekly plan generator. Produce {$focus}

Respond with STRICT JSON only, no prose, no markdown fences, in exactly this shape:
{
  "title": "short plan title",
  "days": {
    "0": { "label": "Monday", "items": [ {$itemShape} ] },
    "1": { "label": "Tuesday", "items": [ ... ] },
    "2": { "label": "Wednesday", "items": [ ... ] },
    "3": { "label": "Thursday", "items": [ ... ] },
    "4": { "label": "Friday", "items": [ ... ] },
    "5": { "label": "Saturday", "items": [ ... ] },
    "6": { "label": "Sunday", "items": [ ... ] }
  },
  "notes": "one short paragraph of general guidance or caveats"
}

Member context (JSON):
{$contextJson}
PROMPT;

        $messages = [
            ['role' => 'system', 'content' => $prompt],
            ['role' => 'user', 'content' => "Generate my weekly {$type} plan."],
        ];

        $raw = $this->provider->chat($messages, true);
        $decoded = $this->safeJsonDecode($raw);

        if (! is_array($decoded) || ! isset($decoded['days'])) {
            // Best-effort empty skeleton so the caller never crashes on a malformed AI response.
            $decoded = [
                'title' => ucfirst($type).' Plan',
                'days' => array_combine(
                    array_map('strval', range(0, 6)),
                    array_map(fn ($label) => ['label' => $label, 'items' => []], $dayLabels)
                ),
                'notes' => 'The AI did not return a usable plan — please try regenerating.',
            ];
        }

        return $decoded;
    }

    /**
     * The core meal-parsing prompt, shared by parseMealText and scanFoodImage.
     *
     * Deliberately flexible: the model must produce a best-effort nutrition estimate
     * for anything plausibly food/drink related, and should only say "invalid" when
     * the input is clearly NOT about food at all (fixes the "invalid food" false-negative bug).
     */
    private function mealParsingPrompt(): string
    {
        return <<<'PROMPT'
You are HealthyLife's nutrition parsing engine. Your job is to convert a casual, possibly vague or colloquial description of something a user ate or drank into structured nutrition data.

CRITICAL RULES:
1. Respond with STRICT JSON ONLY — no prose, no markdown code fences, no explanations before or after.
2. ALWAYS produce a best-effort nutrition estimate for ANY input that plausibly refers to food or drink, even if it's vague, slang, abbreviated, misspelled, or lacks quantities. Use your general knowledge of typical portion sizes to fill in gaps. Never refuse or return "invalid" just because the description is imprecise, informal, or incomplete — approximate confidently instead.
3. Only return the invalid shape ({"invalid": true, "reason": "..."}) when the input is CLEARLY not about food or drink at all (e.g. "what's the weather today", "how do I do a squat", "hello"). A short or casual food mention is NOT a reason to mark invalid.
4. If quantity/portion isn't specified, assume ONE typical single-serving portion.
5. "category" must be one of: breakfast, lunch, dinner, snack — infer the most likely one from context (time-of-day words, meal type words, or default to "snack" if ambiguous).
6. "confidence" is a float 0-1 representing how confident you are in the estimate (lower for vague inputs, higher for specific ones with quantities) — but confidence being low is NOT a reason to mark invalid.

JSON shape for a valid food/drink input:
{
  "name": "Human-readable meal name",
  "calories": 450,
  "protein": 25,
  "carbs": 40,
  "fat": 18,
  "category": "lunch",
  "confidence": 0.8
}

JSON shape ONLY for clearly non-food input:
{ "invalid": true, "reason": "short explanation" }

FEW-SHOT EXAMPLES:

Input: "had some chicken and rice"
Output: {"name": "Chicken and Rice", "calories": 520, "protein": 38, "carbs": 55, "fat": 12, "category": "lunch", "confidence": 0.55}

Input: "protein shake"
Output: {"name": "Protein Shake", "calories": 160, "protein": 25, "carbs": 8, "fat": 3, "category": "snack", "confidence": 0.6}

Input: "2 slices of pizza"
Output: {"name": "2 Slices of Pizza", "calories": 570, "protein": 24, "carbs": 66, "fat": 22, "category": "dinner", "confidence": 0.65}

Input: "just a black coffee"
Output: {"name": "Black Coffee", "calories": 5, "protein": 0, "carbs": 1, "fat": 0, "category": "breakfast", "confidence": 0.7}

Input: "big mac meal with fries and a coke"
Output: {"name": "Big Mac Meal with Fries and Coke", "calories": 1090, "protein": 30, "carbs": 138, "fat": 45, "category": "lunch", "confidence": 0.75}

Input: "what's the weather like"
Output: {"invalid": true, "reason": "Not related to food or drink"}

Input: "how many sets should I do"
Output: {"invalid": true, "reason": "Not related to food or drink"}

Now parse the user's next message using these rules. Respond with the JSON object only.
PROMPT;
    }

    private function decodeMealJson(string $raw): array
    {
        $decoded = $this->safeJsonDecode($raw);

        if (! is_array($decoded)) {
            return ['invalid' => true, 'reason' => 'AI response could not be parsed'];
        }

        if (! empty($decoded['invalid'])) {
            return ['invalid' => true, 'reason' => $decoded['reason'] ?? 'Not related to food or drink'];
        }

        return [
            'name' => $decoded['name'] ?? 'Logged Meal',
            'calories' => (int) ($decoded['calories'] ?? 0),
            'protein' => (int) ($decoded['protein'] ?? 0),
            'carbs' => (int) ($decoded['carbs'] ?? 0),
            'fat' => (int) ($decoded['fat'] ?? 0),
            'category' => $decoded['category'] ?? 'snack',
            'confidence' => isset($decoded['confidence']) ? (float) $decoded['confidence'] : 0.5,
        ];
    }

    private function safeJsonDecode(string $raw): mixed
    {
        // Strip stray markdown fences some models add despite instructions.
        $clean = trim($raw);
        if (Str::startsWith($clean, '```')) {
            $clean = preg_replace('/^```[a-zA-Z]*\n?/', '', $clean);
            $clean = preg_replace('/```$/', '', trim($clean));
        }

        // Extract the first {...} block in case of any leading/trailing prose.
        if (preg_match('/\{.*\}/s', $clean, $matches)) {
            $clean = $matches[0];
        }

        $decoded = json_decode(trim($clean), true);

        return $decoded;
    }
}
