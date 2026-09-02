<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class MealController extends Controller
{
    /**
     * GET /meals?date=YYYY-MM-DD&category=breakfast
     *
     * Server-side filtering by date AND optional category via raw SQL WHERE clause.
     * No JavaScript filtering on the frontend.
     */
    public function index(Request $request)
    {
        $date     = $request->query('date', now()->toDateString());
        $category = $request->query('category'); // optional SQL-level category filter

        $sql      = 'SELECT id, name, calories, protein, carbs, fat, category, image, completed, logged_at
                     FROM meals
                     WHERE user_id = ? AND DATE(logged_at) = ?';
        $bindings = [$request->user()->id, $date];

        if ($category) {
            $sql     .= ' AND category = ?';
            $bindings[] = $category;
        }

        $sql .= ' ORDER BY logged_at ASC';

        $rows = DB::select($sql, $bindings);

        return response()->json(array_map(fn($m) => $this->format($m), $rows));
    }

    /**
     * GET /meals/by-category?date=YYYY-MM-DD
     *
     * Returns per-category aggregate stats using GROUP BY + SUM/COUNT.
     * All computation done in SQL — frontend just displays the result.
     */
    public function byCategory(Request $request)
    {
        $date = $request->query('date', now()->toDateString());

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
            [$request->user()->id, $date]
        );

        return response()->json(array_map(fn($r) => [
            'category'      => $r->category,
            'mealCount'     => (int) $r->meal_count,
            'totalCalories' => (int) $r->total_calories,
            'totalProtein'  => (int) $r->total_protein,
            'totalCarbs'    => (int) $r->total_carbs,
            'totalFat'      => (int) $r->total_fat,
        ], $rows));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'calories'  => 'required|integer',
            'protein'   => 'required|integer',
            'carbs'     => 'required|integer',
            'fat'       => 'required|integer',
            'category'  => 'required|string|in:breakfast,lunch,dinner,snack',
            'image'     => 'nullable|url',
            'logged_at' => 'nullable|date',
        ]);

        $loggedAt = isset($validated['logged_at'])
            ? Carbon::parse($validated['logged_at'])->toDateTimeString()
            : now()->toDateTimeString();

        // PostgreSQL INSERT … RETURNING * — raw SQL insert with row returned in one query
        $rows = DB::select(
            'INSERT INTO meals
                (user_id, name, calories, protein, carbs, fat, category, image, logged_at, completed, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW())
             RETURNING *',
            [
                $request->user()->id,
                $validated['name'],
                $validated['calories'],
                $validated['protein'],
                $validated['carbs'],
                $validated['fat'],
                $validated['category'],
                $validated['image'] ?? null,
                $loggedAt,
            ]
        );

        return response()->json($this->format($rows[0]), 201);
    }

    public function update(Request $request, int $meal)
    {
        // Ownership check via raw SQL
        $existing = DB::selectOne('SELECT user_id FROM meals WHERE id = ?', [$meal]);
        abort_unless($existing && (int) $existing->user_id === (int) $request->user()->id, 403);

        $data = $request->validate([
            'name'     => 'sometimes|string|max:255',
            'calories' => 'sometimes|integer|min:0',
            'protein'  => 'sometimes|integer|min:0',
            'carbs'    => 'sometimes|integer|min:0',
            'fat'      => 'sometimes|integer|min:0',
            'category' => 'sometimes|in:breakfast,lunch,dinner,snack',
            'image'    => 'nullable|string',
        ]);

        if (!empty($data)) {
            $data['updated_at'] = now()->toDateTimeString();
            $setClauses  = implode(', ', array_map(fn($k) => "$k = ?", array_keys($data)));
            $bindings    = array_values($data);
            $bindings[]  = $meal;
            DB::statement("UPDATE meals SET $setClauses WHERE id = ?", $bindings);
        }

        $updated = DB::selectOne('SELECT * FROM meals WHERE id = ?', [$meal]);
        return response()->json($this->format($updated));
    }

    public function destroy(Request $request, int $meal)
    {
        $existing = DB::selectOne('SELECT user_id FROM meals WHERE id = ?', [$meal]);
        abort_unless($existing && (int) $existing->user_id === (int) $request->user()->id, 403);

        DB::statement('DELETE FROM meals WHERE id = ?', [$meal]);
        return response()->json(['success' => true]);
    }

    public function toggle(Request $request, int $meal)
    {
        $existing = DB::selectOne('SELECT user_id FROM meals WHERE id = ?', [$meal]);
        abort_unless($existing && (int) $existing->user_id === (int) $request->user()->id, 403);

        // SQL NOT operator toggles boolean in-place — no PHP read-modify-write
        DB::statement('UPDATE meals SET completed = NOT completed, updated_at = NOW() WHERE id = ?', [$meal]);

        $updated = DB::selectOne('SELECT * FROM meals WHERE id = ?', [$meal]);
        return response()->json($this->format($updated));
    }

    private function format(object $meal): array
    {
        // PostgreSQL returns booleans as 't'/'f' via PDO
        $completed = in_array($meal->completed, [true, 't', 1, '1'], true);
        return [
            'id'        => (string) $meal->id,
            'name'      => $meal->name,
            'calories'  => (int) $meal->calories,
            'protein'   => (int) $meal->protein,
            'carbs'     => (int) $meal->carbs,
            'fat'       => (int) $meal->fat,
            'time'      => Carbon::parse($meal->logged_at)->format('g:i A'),
            'category'  => $meal->category,
            'image'     => $meal->image ?? '',
            'completed' => $completed,
            'loggedAt'  => Carbon::parse($meal->logged_at)->toISOString(),
        ];
    }
}
