<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class WaterLogService
{
    public function index(int $userId, string $date, int $goalMl): array
    {
        $rows = DB::select(
            'SELECT id, amount_ml, logged_at
             FROM water_logs
             WHERE user_id = ? AND DATE(logged_at) = ?
             ORDER BY logged_at DESC',
            [$userId, $date]
        );

        $totalRow = DB::selectOne(
            'SELECT COALESCE(SUM(amount_ml), 0) AS total_ml
             FROM water_logs
             WHERE user_id = ? AND DATE(logged_at) = ?',
            [$userId, $date]
        );

        $logs = array_map(fn ($log) => [
            'id' => (string) $log->id,
            'amountMl' => (int) $log->amount_ml,
            'loggedAt' => Carbon::parse($log->logged_at)->toIso8601String(),
            'time' => Carbon::parse($log->logged_at)->format('g:i A'),
        ], $rows);

        return [
            'logs' => $logs,
            'totalMl' => (int) $totalRow->total_ml,
            'goalMl' => $goalMl,
        ];
    }

    public function store(int $userId, int $amountMl, int $goalMl): array
    {
        $rows = DB::select(
            'INSERT INTO water_logs (user_id, amount_ml, logged_at, created_at, updated_at)
             VALUES (?, ?, NOW(), NOW(), NOW())
             RETURNING *',
            [$userId, $amountMl]
        );

        $log = $rows[0];

        $totalRow = DB::selectOne(
            'SELECT COALESCE(SUM(amount_ml), 0) AS total_ml
             FROM water_logs
             WHERE user_id = ? AND DATE(logged_at) = CURRENT_DATE',
            [$userId]
        );

        return [
            'log' => [
                'id' => (string) $log->id,
                'amountMl' => (int) $log->amount_ml,
                'loggedAt' => Carbon::parse($log->logged_at)->toIso8601String(),
                'time' => Carbon::parse($log->logged_at)->format('g:i A'),
            ],
            'totalMl' => (int) $totalRow->total_ml,
            'goalMl' => $goalMl,
        ];
    }

    public function destroy(int $userId, int $waterLogId, int $goalMl): array
    {
        $existing = DB::selectOne('SELECT user_id FROM water_logs WHERE id = ?', [$waterLogId]);
        abort_unless($existing && (int) $existing->user_id === $userId, 403);

        DB::statement('DELETE FROM water_logs WHERE id = ?', [$waterLogId]);

        $totalRow = DB::selectOne(
            'SELECT COALESCE(SUM(amount_ml), 0) AS total_ml
             FROM water_logs
             WHERE user_id = ? AND DATE(logged_at) = CURRENT_DATE',
            [$userId]
        );

        return [
            'totalMl' => (int) $totalRow->total_ml,
            'goalMl' => $goalMl,
        ];
    }
}
