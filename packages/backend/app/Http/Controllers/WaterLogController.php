<?php

namespace App\Http\Controllers;

use App\Models\WaterLog;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class WaterLogController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->query('date', now()->toDateString());

        $logs = WaterLog::where('user_id', $request->user()->id)
            ->whereDate('logged_at', $date)
            ->orderByDesc('logged_at')
            ->get()
            ->map(fn (WaterLog $log) => [
                'id' => (string) $log->id,
                'amountMl' => $log->amount_ml,
                'loggedAt' => $log->logged_at->toIso8601String(),
                'time' => Carbon::parse($log->logged_at)->format('g:i A'),
            ]);

        $total = WaterLog::where('user_id', $request->user()->id)
            ->whereDate('logged_at', $date)
            ->sum('amount_ml');

        return response()->json([
            'logs' => $logs,
            'totalMl' => (int) $total,
            'goalMl' => $request->user()->water_goal_ml,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'amountMl' => 'required|integer|min:1|max:5000',
        ]);

        $log = WaterLog::create([
            'user_id' => $request->user()->id,
            'amount_ml' => $data['amountMl'],
            'logged_at' => now(),
        ]);

        $date = now()->toDateString();
        $total = WaterLog::where('user_id', $request->user()->id)
            ->whereDate('logged_at', $date)
            ->sum('amount_ml');

        return response()->json([
            'log' => [
                'id' => (string) $log->id,
                'amountMl' => $log->amount_ml,
                'loggedAt' => $log->logged_at->toIso8601String(),
                'time' => Carbon::parse($log->logged_at)->format('g:i A'),
            ],
            'totalMl' => (int) $total,
            'goalMl' => $request->user()->water_goal_ml,
        ], 201);
    }

    public function destroy(Request $request, WaterLog $waterLog)
    {
        abort_unless($waterLog->user_id === $request->user()->id, 403);
        $waterLog->delete();

        $total = WaterLog::where('user_id', $request->user()->id)
            ->whereDate('logged_at', now()->toDateString())
            ->sum('amount_ml');

        return response()->json([
            'totalMl' => (int) $total,
            'goalMl' => $request->user()->water_goal_ml,
        ]);
    }
}
