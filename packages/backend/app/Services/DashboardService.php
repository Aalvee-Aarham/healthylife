<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function summary(User $user, string $date): array
    {
        // View: v_daily_intake (no row = nothing logged that day).
        $row = DB::selectOne(
            'SELECT calories, protein, carbs, fat, meal_count, water_ml
             FROM v_daily_intake
             WHERE user_id = ? AND day = ?',
            [$user->id, $date]
        );

        return [
            'macros' => [
                'caloriesConsumed' => (int) ($row->calories ?? 0),
                'caloriesGoal' => $user->calories_goal,
                'proteinConsumedG' => (int) ($row->protein ?? 0),
                'proteinGoalG' => $user->protein_goal_g,
                'carbsConsumedG' => (int) ($row->carbs ?? 0),
                'carbsGoalG' => $user->carbs_goal_g,
                'fatsConsumedG' => (int) ($row->fat ?? 0),
                'fatsGoalG' => $user->fats_goal_g,
                'waterConsumedMl' => (int) ($row->water_ml ?? 0),
                'waterGoalMl' => $user->water_goal_ml,
            ],
            'mealCount' => (int) ($row->meal_count ?? 0),
        ];
    }
}
