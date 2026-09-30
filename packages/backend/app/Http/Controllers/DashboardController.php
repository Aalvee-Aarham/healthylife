<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardService $dashboardService) {}

    public function summary(Request $request)
    {
        $date = $request->query('date', now()->toDateString());

        return response()->json($this->dashboardService->summary($request->user(), $date));
    }

    /** Public landing-page counters. */
    public function publicStats()
    {
        return response()->json([
            'members'  => User::where('role', 'member')->count(),
            'ai_plans' => DB::table('plans')->where('created_by', 'ai')->count(),
            'cycles'   => DB::table('cycle_periods')->count(),
            'coaches'  => User::where('role', 'coach')->count(),
        ]);
    }
}
