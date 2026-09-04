<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function summary(User $user, string $date): array
    {
        $macroRow = DB::selectOne(
            'SELECT
                COALESCE(SUM(calories), 0) AS calories_consumed,
                COALESCE(SUM(protein), 0)  AS protein_consumed,
                COALESCE(SUM(carbs), 0)    AS carbs_consumed,
                COALESCE(SUM(fat), 0)      AS fat_consumed,
                COUNT(*)                   AS meal_count
             FROM meals
             WHERE user_id = ? AND DATE(logged_at) = ? AND completed = true',
            [$user->id, $date]
        );

        $waterRow = DB::selectOne(
            'SELECT COALESCE(SUM(amount_ml), 0) AS total_ml
             FROM water_logs
             WHERE user_id = ? AND DATE(logged_at) = ?',
            [$user->id, $date]
        );

        return [
            'macros' => [
                'caloriesConsumed' => (int) $macroRow->calories_consumed,
                'caloriesGoal' => $user->calories_goal,
                'proteinConsumedG' => (int) $macroRow->protein_consumed,
                'proteinGoalG' => $user->protein_goal_g,
                'carbsConsumedG' => (int) $macroRow->carbs_consumed,
                'carbsGoalG' => $user->carbs_goal_g,
                'fatsConsumedG' => (int) $macroRow->fat_consumed,
                'fatsGoalG' => $user->fats_goal_g,
                'waterConsumedMl' => (int) $waterRow->total_ml,
                'waterGoalMl' => $user->water_goal_ml,
            ],
            'mealCount' => (int) $macroRow->meal_count,
        ];
    }
}
