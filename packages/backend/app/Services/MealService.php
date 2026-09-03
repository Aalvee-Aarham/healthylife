<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class MealService
{
    public function index(int $userId, string $date, ?string $category): array
    {
        $sql = 'SELECT
                        m.id, m.name, m.calories, m.protein, m.carbs, m.fat, m.category, m.image, m.completed, m.logged_at,
                        u.name AS user_name, u.calories_goal, u.protein_goal_g, u.carbs_goal_g, u.fats_goal_g
                     FROM meals m
                     JOIN users u ON u.id = m.user_id
                     WHERE m.user_id = ? AND DATE(m.logged_at) = ?';
        $bindings = [$userId, $date];

        if ($category) {
            $sql .= ' AND m.category = ?';
            $bindings[] = $category;
        }

        $sql .= ' ORDER BY m.logged_at ASC';

        $rows = DB::select($sql, $bindings);

        return array_map(fn ($m) => $this->format($m), $rows);
    }

    public function byCategory(int $userId, string $date): array
    {
        $rows = DB::select(
            "SELECT
                category,
                COUNT(*)                           AS meal_count,
                COALESCE(SUM(calories), 0)         AS total_calories,
                COALESCE(SUM(protein), 0)          AS total_protein,
                COALESCE(SUM(carbs), 0)            AS total_carbs,
                COALESCE(SUM(fat), 0)              AS total_fat
             FROM meals
             WHERE user_id = ? AND DATE(logged_at) = ? AND completed = true
             GROUP BY category
             ORDER BY
                CASE category
                    WHEN 'breakfast' THEN 1
                    WHEN 'lunch'     THEN 2
                    WHEN 'dinner'    THEN 3
                    WHEN 'snack'     THEN 4
                    ELSE 5
                END",
            [$userId, $date]
        );

        return array_map(fn ($r) => [
            'category' => $r->category,
            'mealCount' => (int) $r->meal_count,
            'totalCalories' => (int) $r->total_calories,
            'totalProtein' => (int) $r->total_protein,
            'totalCarbs' => (int) $r->total_carbs,
            'totalFat' => (int) $r->total_fat,
        ], $rows);
    }

    public function store(int $userId, array $validated): array
    {
        $loggedAt = isset($validated['logged_at'])
            ? Carbon::parse($validated['logged_at'])->toDateTimeString()
            : now()->toDateTimeString();

        $rows = DB::select(
            'INSERT INTO meals
                (user_id, name, calories, protein, carbs, fat, category, image, logged_at, completed, source, ai_confidence, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, ?, ?, NOW(), NOW())
             RETURNING *',
            [
                $userId,
                $validated['name'],
                $validated['calories'],
                $validated['protein'],
                $validated['carbs'],
                $validated['fat'],
                $validated['category'],
                $validated['image'] ?? null,
                $loggedAt,
                $validated['source'] ?? 'manual',
                $validated['ai_confidence'] ?? null,
            ]
        );

        return $this->format($rows[0]);
    }

    public function update(int $userId, int $mealId, array $data): array
    {
        $existing = DB::selectOne('SELECT user_id FROM meals WHERE id = ?', [$mealId]);
        abort_unless($existing && (int) $existing->user_id === $userId, 403);

        if (! empty($data)) {
            $data['updated_at'] = now()->toDateTimeString();
            $setClauses = implode(', ', array_map(fn ($k) => "$k = ?", array_keys($data)));
            $bindings = array_values($data);
            $bindings[] = $mealId;
            DB::statement("UPDATE meals SET $setClauses WHERE id = ?", $bindings);
        }

        $updated = DB::selectOne('SELECT * FROM meals WHERE id = ?', [$mealId]);

        return $this->format($updated);
    }

    public function destroy(int $userId, int $mealId): void
    {
        $existing = DB::selectOne('SELECT user_id FROM meals WHERE id = ?', [$mealId]);
        abort_unless($existing && (int) $existing->user_id === $userId, 403);

        DB::statement('DELETE FROM meals WHERE id = ?', [$mealId]);
    }

    public function toggle(int $userId, int $mealId): array
    {
        $existing = DB::selectOne('SELECT user_id FROM meals WHERE id = ?', [$mealId]);
        abort_unless($existing && (int) $existing->user_id === $userId, 403);

        DB::statement('UPDATE meals SET completed = NOT completed, updated_at = NOW() WHERE id = ?', [$mealId]);

        $updated = DB::selectOne('SELECT * FROM meals WHERE id = ?', [$mealId]);

        return $this->format($updated);
    }

    private function format(object $meal): array
    {
        $completed = in_array($meal->completed, [true, 't', 1, '1'], true);
        $data = [
            'id' => (string) $meal->id,
            'name' => $meal->name,
            'calories' => (int) $meal->calories,
            'protein' => (int) $meal->protein,
            'carbs' => (int) $meal->carbs,
            'fat' => (int) $meal->fat,
            'time' => Carbon::parse($meal->logged_at)->format('g:i A'),
            'category' => $meal->category,
            'image' => $meal->image ?? '',
            'completed' => $completed,
            'loggedAt' => Carbon::parse($meal->logged_at)->toISOString(),
        ];

        if (isset($meal->source)) {
            $data['source'] = $meal->source;
        }
        if (isset($meal->ai_confidence)) {
            $data['aiConfidence'] = $meal->ai_confidence !== null ? (float) $meal->ai_confidence : null;
        }
        if (isset($meal->user_name)) {
            $data['userName'] = $meal->user_name;
        }
        if (isset($meal->calories_goal)) {
            $data['userGoals'] = [
                'calories' => (int) $meal->calories_goal,
                'protein' => (int) $meal->protein_goal_g,
                'carbs' => (int) $meal->carbs_goal_g,
                'fats' => (int) $meal->fats_goal_g,
            ];
        }

        return $data;
    }
}
