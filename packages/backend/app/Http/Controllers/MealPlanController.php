<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MealPlanController extends Controller
{
    /**
     * GET /meal-plans
     *
     * Raw SQL SELECT ordered by day_of_week and meal_time via CASE expression.
     */
    public function index(Request $request)
    {
        $rows = DB::select(
            "SELECT id, day_of_week, meal_time, name, calories, protein, carbs, fat, image, notes
             FROM meal_plans
             WHERE user_id = ?
             ORDER BY day_of_week ASC,
                CASE meal_time
                    WHEN 'breakfast' THEN 1
                    WHEN 'lunch'     THEN 2
                    WHEN 'dinner'    THEN 3
                    WHEN 'snack'     THEN 4
                    ELSE 5
                END",
            [$request->user()->id]
        );

        return response()->json(array_map(fn($p) => $this->format($p), $rows));
    }

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

        $carbs = $data['carbs'] ?? (int) round($data['calories'] * 0.45 / 4);
        $fat   = $data['fat']   ?? (int) round($data['calories'] * 0.30 / 9);

        // PostgreSQL INSERT … RETURNING * — insert and get row back in one query
        $rows = DB::select(
            'INSERT INTO meal_plans
                (user_id, day_of_week, meal_time, name, calories, protein, carbs, fat, image, notes, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
             RETURNING *',
            [
                $request->user()->id,
                $data['day_of_week'],
                $data['meal_time'],
                $data['name'],
                $data['calories'],
                $data['protein'],
                $carbs,
                $fat,
                $data['image'] ?? null,
                $data['notes'] ?? null,
            ]
        );

        return response()->json($this->format($rows[0]), 201);
    }

    public function update(Request $request, int $mealPlan)
    {
        // Raw SQL ownership check
        $existing = DB::selectOne('SELECT user_id FROM meal_plans WHERE id = ?', [$mealPlan]);
        abort_unless($existing && (int) $existing->user_id === (int) $request->user()->id, 403);

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

        if (!empty($data)) {
            $data['updated_at'] = now()->toDateTimeString();
            $setClauses  = implode(', ', array_map(fn($k) => "$k = ?", array_keys($data)));
            $bindings    = array_values($data);
            $bindings[]  = $mealPlan;
            DB::statement("UPDATE meal_plans SET $setClauses WHERE id = ?", $bindings);
        }

        $updated = DB::selectOne('SELECT * FROM meal_plans WHERE id = ?', [$mealPlan]);
        return response()->json($this->format($updated));
    }

    public function destroy(Request $request, int $mealPlan)
    {
        $existing = DB::selectOne('SELECT user_id FROM meal_plans WHERE id = ?', [$mealPlan]);
        abort_unless($existing && (int) $existing->user_id === (int) $request->user()->id, 403);

        DB::statement('DELETE FROM meal_plans WHERE id = ?', [$mealPlan]);
        return response()->json(['success' => true]);
    }

    private function format(object $plan): array
    {
        return [
            'id'        => (string) $plan->id,
            'dayOfWeek' => (int) $plan->day_of_week,
            'mealTime'  => $plan->meal_time,
            'name'      => $plan->name,
            'calories'  => (int) $plan->calories,
            'protein'   => (int) $plan->protein,
            'carbs'     => (int) $plan->carbs,
            'fat'       => (int) $plan->fat,
            'image'     => $plan->image ?? '',
            'notes'     => $plan->notes ?? '',
        ];
    }
}
