<?php

namespace App\Http\Controllers;

use App\Services\MealPresetService;
use Illuminate\Http\Request;

class MealPresetController extends Controller
{
    public function __construct(private readonly MealPresetService $mealPresetService) {}

    public function index(Request $request)
    {
        return response()->json($this->mealPresetService->index($request->user()->id));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'calories' => 'required|integer|min:0',
            'protein' => 'required|integer|min:0',
            'carbs' => 'required|integer|min:0',
            'fat' => 'required|integer|min:0',
            'category' => 'required|string|in:breakfast,lunch,dinner,snack',
            'image' => 'nullable|string',
        ]);

        return response()->json($this->mealPresetService->store($request->user()->id, $data), 201);
    }

    public function destroy(Request $request, int $mealPreset)
    {
        $this->mealPresetService->destroy($request->user()->id, $mealPreset);

        return response()->json(['success' => true]);
    }
}
