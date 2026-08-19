<?php

namespace App\Http\Controllers;

use App\Models\MealPlan;
use Illuminate\Http\Request;

class MealPlanController extends Controller
{
    /**
     * GET /meal-plans
     * Returns the full weekly meal plan for the authenticated user,
     * grouped by day_of_week (0=Sun … 6=Sat) then by meal_time.
     */
    public function index(Request $request)
    {
        $plans = MealPlan::where('user_id', $request->user()->id)
            ->orderBy('day_of_week')
            ->orderBy('meal_time')
            ->get()
            ->map(fn(MealPlan $p) => $this->format($p));

        return response()->json($plans);
    }

    /**
     * POST /meal-plans
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'day_of_week' => 'required|integer|min:0|max:6',
            'meal_time'   => 'required|in:breakfast,lunch,dinner,snack',
            'name'        => 'required|string|max:255',
            'calories'    => 'required|integer|min:0',
            'protein'     => 'required|integer|min:0',
            'carbs'       => 'nullable|integer|min:0',
            'fat'         => 'nullable|integer|min:0',
            'image'       => 'nullable|string',
            'notes'       => 'nullable|string|max:500',
        ]);

        $plan = MealPlan::create([
            'user_id'     => $request->user()->id,
            'day_of_week' => $data['day_of_week'],
            'meal_time'   => $data['meal_time'],
            'name'        => $data['name'],
            'calories'    => $data['calories'],
            'protein'     => $data['protein'],
            'carbs'       => $data['carbs'] ?? round($data['calories'] * 0.45 / 4),
            'fat'         => $data['fat'] ?? round($data['calories'] * 0.30 / 9),
            'image'       => $data['image'] ?? null,
            'notes'       => $data['notes'] ?? null,
        ]);

        return response()->json($this->format($plan), 201);
    }

    /**
     * PATCH /meal-plans/{mealPlan}
     */
    public function update(Request $request, MealPlan $mealPlan)
    {
        abort_unless($mealPlan->user_id === $request->user()->id, 403);

        $data = $request->validate([
            'day_of_week' => 'sometimes|integer|min:0|max:6',
            'meal_time'   => 'sometimes|in:breakfast,lunch,dinner,snack',
            'name'        => 'sometimes|string|max:255',
            'calories'    => 'sometimes|integer|min:0',
            'protein'     => 'sometimes|integer|min:0',
            'carbs'       => 'sometimes|integer|min:0',
            'fat'         => 'sometimes|integer|min:0',
            'image'       => 'nullable|string',
            'notes'       => 'nullable|string|max:500',
        ]);

        $mealPlan->update($data);

        return response()->json($this->format($mealPlan->fresh()));
    }

    /**
     * DELETE /meal-plans/{mealPlan}
     */
    public function destroy(Request $request, MealPlan $mealPlan)
    {
        abort_unless($mealPlan->user_id === $request->user()->id, 403);

        $mealPlan->delete();

        return response()->json(['success' => true]);
    }

    private function format(MealPlan $plan): array
    {
        return [
            'id'          => (string) $plan->id,
            'dayOfWeek'   => $plan->day_of_week,
            'mealTime'    => $plan->meal_time,
            'name'        => $plan->name,
            'calories'    => $plan->calories,
            'protein'     => $plan->protein,
            'carbs'       => $plan->carbs,
            'fat'         => $plan->fat,
            'image'       => $plan->image ?? '',
            'notes'       => $plan->notes ?? '',
        ];
    }
}
