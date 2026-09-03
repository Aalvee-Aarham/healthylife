<?php

namespace App\Http\Controllers;

use App\Services\WaterLogService;
use Illuminate\Http\Request;

class WaterLogController extends Controller
{
    public function __construct(private readonly WaterLogService $waterLogService) {}

    public function index(Request $request)
    {
        $date = $request->query('date', now()->toDateString());

        return response()->json(
            $this->waterLogService->index($request->user()->id, $date, $request->user()->water_goal_ml)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'amountMl' => 'required|integer|min:1|max:5000',
        ]);

        return response()->json(
            $this->waterLogService->store($request->user()->id, $data['amountMl'], $request->user()->water_goal_ml),
            201
        );
    }

    public function destroy(Request $request, int $waterLog)
    {
        return response()->json(
            $this->waterLogService->destroy($request->user()->id, $waterLog, $request->user()->water_goal_ml)
        );
    }
}
