<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardService $dashboardService) {}

    public function summary(Request $request)
    {
        $date = $request->query('date', now()->toDateString());

        return response()->json($this->dashboardService->summary($request->user(), $date));
    }
}
