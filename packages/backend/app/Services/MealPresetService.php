<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class MealPresetService
{
    public function index(int $userId): array
    {
        $rows = DB::select(
            'SELECT id, name, calories, protein, carbs, fat, category, image
             FROM meal_presets
             WHERE user_id = ?
             ORDER BY name',
            [$userId]
        );

        return array_map(fn ($p) => $this->format($p), $rows);
    }

    public function store(int $userId, array $data): array
    {
        $rows = DB::select(
            'INSERT INTO meal_presets (user_id, name, calories, protein, carbs, fat, category, image, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
             RETURNING *',
            [
                $userId,
                $data['name'],
                $data['calories'],
                $data['protein'],
                $data['carbs'],
                $data['fat'],
                $data['category'],
                $data['image'] ?? null,
            ]
        );

        return $this->format($rows[0]);
    }

    public function destroy(int $userId, int $presetId): void
    {
        $existing = DB::selectOne('SELECT user_id FROM meal_presets WHERE id = ?', [$presetId]);
        abort_unless($existing && (int) $existing->user_id === $userId, 403);

        DB::statement('DELETE FROM meal_presets WHERE id = ?', [$presetId]);
    }

    private function format(object $p): array
    {
        return [
            'id' => (string) $p->id,
            'name' => $p->name,
            'calories' => (int) $p->calories,
            'protein' => (int) $p->protein,
            'carbs' => (int) $p->carbs,
            'fat' => (int) $p->fat,
            'category' => $p->category,
            'image' => $p->image ?? '',
        ];
    }
}
