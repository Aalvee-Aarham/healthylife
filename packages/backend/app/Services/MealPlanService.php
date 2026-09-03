<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class MealPlanService
{
    public function index(int $userId): array
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
            [$userId]
        );

        return array_map(fn ($p) => $this->format($p), $rows);
    }

    public function store(int $userId, array $data): array
    {
        $carbs = $data['carbs'] ?? (int) round($data['calories'] * 0.45 / 4);
        $fat = $data['fat'] ?? (int) round($data['calories'] * 0.30 / 9);

        $rows = DB::select(
            'INSERT INTO meal_plans
                (user_id, day_of_week, meal_time, name, calories, protein, carbs, fat, image, notes, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
             RETURNING *',
            [
                $userId,
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

        return $this->format($rows[0]);
    }

    public function update(int $userId, int $mealPlanId, array $data): array
    {
        $existing = DB::selectOne('SELECT user_id FROM meal_plans WHERE id = ?', [$mealPlanId]);
        abort_unless($existing && (int) $existing->user_id === $userId, 403);

        if (! empty($data)) {
            $data['updated_at'] = now()->toDateTimeString();
            $setClauses = implode(', ', array_map(fn ($k) => "$k = ?", array_keys($data)));
            $bindings = array_values($data);
            $bindings[] = $mealPlanId;
            DB::statement("UPDATE meal_plans SET $setClauses WHERE id = ?", $bindings);
        }

        $updated = DB::selectOne('SELECT * FROM meal_plans WHERE id = ?', [$mealPlanId]);

        return $this->format($updated);
    }

    public function destroy(int $userId, int $mealPlanId): void
    {
        $existing = DB::selectOne('SELECT user_id FROM meal_plans WHERE id = ?', [$mealPlanId]);
        abort_unless($existing && (int) $existing->user_id === $userId, 403);

        DB::statement('DELETE FROM meal_plans WHERE id = ?', [$mealPlanId]);
    }

    private function format(object $plan): array
    {
        return [
            'id' => (string) $plan->id,
            'dayOfWeek' => (int) $plan->day_of_week,
            'mealTime' => $plan->meal_time,
            'name' => $plan->name,
            'calories' => (int) $plan->calories,
            'protein' => (int) $plan->protein,
            'carbs' => (int) $plan->carbs,
            'fat' => (int) $plan->fat,
            'image' => $plan->image ?? '',
            'notes' => $plan->notes ?? '',
        ];
    }
}
