<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class WaterLogController extends Controller
{
    /**
     * GET /water-logs?date=YYYY-MM-DD
     *
     * Fetches logs and computes total via SQL SUM — no JS arithmetic on the frontend.
     */
    public function index(Request $request)
    {
        $date   = $request->query('date', now()->toDateString());
        $userId = $request->user()->id;

        $rows = DB::select(
            'SELECT id, amount_ml, logged_at
             FROM water_logs
             WHERE user_id = ? AND DATE(logged_at) = ?
             ORDER BY logged_at DESC',
            [$userId, $date]
        );

        // SQL SUM aggregate — total computed in the database, not JavaScript
        $totalRow = DB::selectOne(
            'SELECT COALESCE(SUM(amount_ml), 0) AS total_ml
             FROM water_logs
             WHERE user_id = ? AND DATE(logged_at) = ?',
            [$userId, $date]
        );

        $logs = array_map(fn($log) => [
            'id'       => (string) $log->id,
            'amountMl' => (int) $log->amount_ml,
            'loggedAt' => Carbon::parse($log->logged_at)->toIso8601String(),
            'time'     => Carbon::parse($log->logged_at)->format('g:i A'),
        ], $rows);

        return response()->json([
            'logs'    => $logs,
            'totalMl' => (int) $totalRow->total_ml,
            'goalMl'  => $request->user()->water_goal_ml,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'amountMl' => 'required|integer|min:1|max:5000',
        ]);

        $userId = $request->user()->id;

        // PostgreSQL INSERT … RETURNING to get the inserted row in one query
        $rows = DB::select(
            'INSERT INTO water_logs (user_id, amount_ml, logged_at, created_at, updated_at)
             VALUES (?, ?, NOW(), NOW(), NOW())
             RETURNING *',
            [$userId, $data['amountMl']]
        );

        $log = $rows[0];

        // Re-aggregate total in SQL after insert
        $totalRow = DB::selectOne(
            'SELECT COALESCE(SUM(amount_ml), 0) AS total_ml
             FROM water_logs
             WHERE user_id = ? AND DATE(logged_at) = CURRENT_DATE',
            [$userId]
        );

        return response()->json([
            'log' => [
                'id'       => (string) $log->id,
                'amountMl' => (int) $log->amount_ml,
                'loggedAt' => Carbon::parse($log->logged_at)->toIso8601String(),
                'time'     => Carbon::parse($log->logged_at)->format('g:i A'),
            ],
            'totalMl' => (int) $totalRow->total_ml,
            'goalMl'  => $request->user()->water_goal_ml,
        ], 201);
    }

    public function destroy(Request $request, int $waterLog)
    {
        $existing = DB::selectOne('SELECT user_id FROM water_logs WHERE id = ?', [$waterLog]);
        abort_unless($existing && (int) $existing->user_id === (int) $request->user()->id, 403);

        $userId = $request->user()->id;
        DB::statement('DELETE FROM water_logs WHERE id = ?', [$waterLog]);

        // Re-aggregate total via SQL after deletion
        $totalRow = DB::selectOne(
            'SELECT COALESCE(SUM(amount_ml), 0) AS total_ml
             FROM water_logs
             WHERE user_id = ? AND DATE(logged_at) = CURRENT_DATE',
            [$userId]
        );

        return response()->json([
            'totalMl' => (int) $totalRow->total_ml,
            'goalMl'  => $request->user()->water_goal_ml,
        ]);
    }
}
