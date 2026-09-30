<?php

namespace App\Services;

use App\Services\AI\AIService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class GymLogService
{
    public function __construct(private readonly AIService $aiService) {}

    public function index(int $userId): array
    {
        // View: v_gym_logs_with_sets
        $rows = DB::select(
            'SELECT * FROM v_gym_logs_with_sets WHERE user_id = ? ORDER BY logged_at DESC LIMIT 30',
            [$userId]
        );

        return array_map(fn ($log) => $this->format($log), $rows);
    }

    public function stats(int $userId): array
    {
        // View: v_workout_stats (no row = no workouts yet)
        $row = DB::selectOne('SELECT * FROM v_workout_stats WHERE user_id = ?', [$userId]);

        $consistentDays = DB::select(
            'SELECT logged_at::date AS activity_date
             FROM gym_logs
             WHERE user_id = ?
             INTERSECT
             SELECT logged_at::date AS activity_date
             FROM meals
             WHERE user_id = ? AND completed = true
             ORDER BY activity_date DESC
             LIMIT 7',
            [$userId, $userId]
        );

        return [
            'totalWorkouts' => (int) ($row->total_workouts ?? 0),
            'totalSets' => (int) ($row->total_sets ?? 0),
            'totalDurationMinutes' => (int) ($row->total_duration_minutes ?? 0),
            'totalCaloriesBurned' => (int) ($row->total_calories_burned ?? 0),
            'avgSessionMinutes' => round((float) ($row->avg_session_minutes ?? 0), 1),
            'consistentDays' => array_map(fn ($d) => $d->activity_date, $consistentDays),
        ];
    }

    public function store(int $userId, array $data): array
    {
        $loggedAt = ! empty($data['loggedAt'])
            ? Carbon::parse($data['loggedAt'])->toDateTimeString()
            : now()->toDateTimeString();

        // Procedure: sp_log_workout inserts the log and all its sets, returning the new id.
        $logId = DB::selectOne(
            'CALL sp_log_workout(?, ?, ?, ?, ?, ?, ?, NULL)',
            [
                $userId,
                $data['title'],
                $data['durationMinutes'] ?? null,
                $data['caloriesBurned'] ?? null,
                $data['notes'] ?? null,
                $loggedAt,
                json_encode($data['sets'] ?? []),
            ]
        )->p_log_id;

        return $this->find($logId);
    }

    public function destroy(int $userId, int $gymLogId): void
    {
        $existing = DB::selectOne('SELECT user_id FROM gym_logs WHERE id = ?', [$gymLogId]);
        abort_unless($existing && (int) $existing->user_id === $userId, 403);

        DB::statement('DELETE FROM gym_log_sets WHERE gym_log_id = ?', [$gymLogId]);
        DB::statement('DELETE FROM gym_logs WHERE id = ?', [$gymLogId]);
    }

    public function toggleSet(int $userId, int $gymLogId, int $setId): array
    {
        $log = DB::selectOne('SELECT user_id FROM gym_logs WHERE id = ?', [$gymLogId]);
        abort_unless($log && (int) $log->user_id === $userId, 403);

        $setRow = DB::selectOne('SELECT gym_log_id FROM gym_log_sets WHERE id = ?', [$setId]);
        abort_unless($setRow && (int) $setRow->gym_log_id === $gymLogId, 404);

        DB::statement('UPDATE gym_log_sets SET completed = NOT completed, updated_at = NOW() WHERE id = ?', [$setId]);

        return $this->find($gymLogId);
    }

    /**
     * POST /gym-logs/parse — natural language -> structured draft (not saved).
     */
    public function parse(string $text): array
    {
        return $this->aiService->parseGymLog($text);
    }

    private function find(int $gymLogId): array
    {
        return $this->format(DB::selectOne('SELECT * FROM v_gym_logs_with_sets WHERE id = ?', [$gymLogId]));
    }

    private function format(object $log): array
    {
        $sets = $log->sets_json ? json_decode($log->sets_json, true) : [];

        return [
            'id' => (string) $log->id,
            'title' => $log->title,
            'durationMinutes' => $log->duration_minutes ? (int) $log->duration_minutes : null,
            'caloriesBurned' => $log->calories_burned ? (int) $log->calories_burned : null,
            'notes' => $log->notes,
            'loggedAt' => Carbon::parse($log->logged_at)->toIso8601String(),
            'date' => Carbon::parse($log->logged_at)->format('M j, Y'),
            'sets' => array_map(fn ($s) => [
                'id' => (string) $s['id'],
                'exerciseName' => $s['exerciseName'],
                'setNumber' => (int) $s['setNumber'],
                'reps' => (int) $s['reps'],
                'weightKg' => (float) $s['weightKg'],
                'completed' => in_array($s['completed'], [true, 't', 1, '1'], true),
            ], $sets),
        ];
    }
}
