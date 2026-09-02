<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * GET /dashboard?date=YYYY-MM-DD
     *
     * All macro totals and counts are computed via SQL aggregate functions (SUM, COUNT).
     * No PHP-side arithmetic — the database does the work.
     */
    public function summary(Request $request)
    {
        $user = $request->user();
        $date = $request->query('date', now()->toDateString());

        // Single raw SQL query with SUM and COUNT aggregates for all macros
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

        // Separate SUM aggregate for water logs
        $waterRow = DB::selectOne(
            'SELECT COALESCE(SUM(amount_ml), 0) AS total_ml
             FROM water_logs
             WHERE user_id = ? AND DATE(logged_at) = ?',
            [$user->id, $date]
        );

        return response()->json([
            'macros' => [
                'caloriesConsumed'  => (int) $macroRow->calories_consumed,
                'caloriesGoal'      => $user->calories_goal,
                'proteinConsumedG'  => (int) $macroRow->protein_consumed,
                'proteinGoalG'      => $user->protein_goal_g,
                'carbsConsumedG'    => (int) $macroRow->carbs_consumed,
                'carbsGoalG'        => $user->carbs_goal_g,
                'fatsConsumedG'     => (int) $macroRow->fat_consumed,
                'fatsGoalG'         => $user->fats_goal_g,
                'waterConsumedMl'   => (int) $waterRow->total_ml,
                'waterGoalMl'       => $user->water_goal_ml,
            ],
            'mealCount' => (int) $macroRow->meal_count,
        ]);
    }
}
