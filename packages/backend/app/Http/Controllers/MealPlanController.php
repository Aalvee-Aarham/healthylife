<?php

namespace App\Http\Controllers;

use App\Services\MealPlanService;
use Illuminate\Http\Request;

class MealPlanController extends Controller
{
    public function __construct(private readonly MealPlanService $mealPlanService) {}

    public function index(Request $request)
    {
        return response()->json($this->mealPlanService->index($request->user()->id));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'day_of_week' => 'required|integer|min:0|max:6',
            'meal_time' => 'required|in:breakfast,lunch,dinner,snack',
            'name' => 'required|string|max:255',
            'calories' => 'required|integer|min:0',
            'protein' => 'required|integer|min:0',
            'carbs' => 'nullable|integer|min:0',
            'fat' => 'nullable|integer|min:0',
            'image' => 'nullable|string',
            'notes' => 'nullable|string|max:500',
        ]);

        return response()->json($this->mealPlanService->store($request->user()->id, $data), 201);
    }

    public function update(Request $request, int $mealPlan)
    {
        $data = $request->validate([
            'day_of_week' => 'sometimes|integer|min:0|max:6',
            'meal_time' => 'sometimes|in:breakfast,lunch,dinner,snack',
            'name' => 'sometimes|string|max:255',
            'calories' => 'sometimes|integer|min:0',
            'protein' => 'sometimes|integer|min:0',
            'carbs' => 'sometimes|integer|min:0',
            'fat' => 'sometimes|integer|min:0',
            'image' => 'nullable|string',
            'notes' => 'nullable|string|max:500',
        ]);

        return response()->json($this->mealPlanService->update($request->user()->id, $mealPlan, $data));
    }

    public function destroy(Request $request, int $mealPlan)
    {
        $this->mealPlanService->destroy($request->user()->id, $mealPlan);

        return response()->json(['success' => true]);
    }
}
