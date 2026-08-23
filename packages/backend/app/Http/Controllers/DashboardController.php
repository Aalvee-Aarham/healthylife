<?php

namespace App\Http\Controllers;

use App\Models\Meal;
use App\Models\WaterLog;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request)
    {
        $user = $request->user();
        $date = $request->query('date', now()->toDateString());

        $meals = Meal::where('user_id', $user->id)
            ->whereDate('logged_at', $date)
            ->where('completed', true)
            ->get();

        $waterTotal = WaterLog::where('user_id', $user->id)
            ->whereDate('logged_at', $date)
            ->sum('amount_ml');

        return response()->json([
            'macros' => [
                'caloriesConsumed' => $meals->sum('calories'),
                'caloriesGoal' => $user->calories_goal,
                'proteinConsumedG' => $meals->sum('protein'),
                'proteinGoalG' => $user->protein_goal_g,
                'carbsConsumedG' => $meals->sum('carbs'),
                'carbsGoalG' => $user->carbs_goal_g,
                'fatsConsumedG' => $meals->sum('fat'),
                'fatsGoalG' => $user->fats_goal_g,
                'waterConsumedMl' => (int) $waterTotal,
                'waterGoalMl' => $user->water_goal_ml,
            ],
            'mealCount' => $meals->count(),
        ]);
    }
}
