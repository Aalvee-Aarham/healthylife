<?php

namespace App\Http\Controllers;

use App\Services\AI\AIService;
use App\Services\MealService;
use Illuminate\Http\Request;

class MealController extends Controller
{
    public function __construct(
        private readonly MealService $mealService,
        private readonly AIService $aiService,
    ) {}

    public function index(Request $request)
    {
        $date = $request->query('date', now()->toDateString());
        $category = $request->query('category');

        return response()->json($this->mealService->index($request->user()->id, $date, $category));
    }

    public function byCategory(Request $request)
    {
        $date = $request->query('date', now()->toDateString());

        return response()->json($this->mealService->byCategory($request->user()->id, $date));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'calories' => 'required|integer',
            'protein' => 'required|integer',
            'carbs' => 'required|integer',
            'fat' => 'required|integer',
            'category' => 'required|string|in:breakfast,lunch,dinner,snack',
            'image' => 'nullable|url',
            'logged_at' => 'nullable|date',
            'source' => 'nullable|string|in:manual,ai_text,ai_scan',
            'ai_confidence' => 'nullable|numeric|between:0,1',
        ]);

        return response()->json($this->mealService->store($request->user()->id, $validated), 201);
    }

    public function update(Request $request, int $meal)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'calories' => 'sometimes|integer|min:0',
            'protein' => 'sometimes|integer|min:0',
            'carbs' => 'sometimes|integer|min:0',
            'fat' => 'sometimes|integer|min:0',
            'category' => 'sometimes|in:breakfast,lunch,dinner,snack',
            'image' => 'nullable|string',
        ]);

        return response()->json($this->mealService->update($request->user()->id, $meal, $data));
    }

    public function destroy(Request $request, int $meal)
    {
        $this->mealService->destroy($request->user()->id, $meal);

        return response()->json(['success' => true]);
    }

    public function toggle(Request $request, int $meal)
    {
        return response()->json($this->mealService->toggle($request->user()->id, $meal));
    }

    /**
     * POST /meals/parse — {text} -> structured draft (not saved).
     */
    public function parse(Request $request)
    {
        $data = $request->validate(['text' => 'required|string|max:1000']);

        return response()->json($this->aiService->parseMealText($data['text']));
    }

    /**
     * POST /meals/scan — multipart image upload -> structured draft (not saved).
     */
    public function scan(Request $request)
    {
        $request->validate(['image' => 'required|image|max:8192']);

        $file = $request->file('image');
        $base64 = base64_encode(file_get_contents($file->getRealPath()));
        $mimeType = $file->getMimeType() ?: 'image/jpeg';

        return response()->json($this->aiService->scanFoodImage($base64, $mimeType));
    }
}
