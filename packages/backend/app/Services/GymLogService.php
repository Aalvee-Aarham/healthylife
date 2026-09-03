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
        $rows = DB::select(
            "SELECT
                gl.id,
                gl.title,
                gl.duration_minutes,
                gl.calories_burned,
                gl.notes,
                gl.logged_at,
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id',           gls.id,
                        'exerciseName', gls.exercise_name,
                        'setNumber',    gls.set_number,
                        'reps',         gls.reps,
                        'weightKg',     gls.weight_kg,
                        'completed',    gls.completed
                    ) ORDER BY gls.set_number
                ) FILTER (WHERE gls.id IS NOT NULL) AS sets_json
             FROM gym_logs gl
             LEFT JOIN gym_log_sets gls ON gls.gym_log_id = gl.id
             WHERE gl.user_id = ?
             GROUP BY gl.id
             ORDER BY gl.logged_at DESC
             LIMIT 30",
            [$userId]
        );

        return array_map(fn ($log) => $this->format($log), $rows);
    }

    public function stats(int $userId): array
    {
        $row = DB::selectOne(
            'SELECT
                COUNT(DISTINCT gl.id)                 AS total_workouts,
                COUNT(gls.id)                         AS total_sets,
                COALESCE(SUM(gl.duration_minutes), 0) AS total_duration_minutes,
                COALESCE(SUM(gl.calories_burned), 0)  AS total_calories_burned,
                COALESCE(AVG(gl.duration_minutes), 0) AS avg_session_minutes
             FROM gym_logs gl
             LEFT JOIN gym_log_sets gls ON gls.gym_log_id = gl.id
             WHERE gl.user_id = ?',
            [$userId]
        );

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
            'totalWorkouts' => (int) $row->total_workouts,
            'totalSets' => (int) $row->total_sets,
            'totalDurationMinutes' => (int) $row->total_duration_minutes,
            'totalCaloriesBurned' => (int) $row->total_calories_burned,
            'avgSessionMinutes' => round((float) $row->avg_session_minutes, 1),
            'consistentDays' => array_map(fn ($d) => $d->activity_date, $consistentDays),
        ];
    }

    public function store(int $userId, array $data): array
    {
        $loggedAt = ! empty($data['loggedAt'])
            ? Carbon::parse($data['loggedAt'])->toDateTimeString()
            : now()->toDateTimeString();

        $logRows = DB::select(
            'INSERT INTO gym_logs
                (user_id, title, duration_minutes, calories_burned, notes, logged_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
             RETURNING *',
            [
                $userId,
                $data['title'],
                $data['durationMinutes'] ?? null,
                $data['caloriesBurned'] ?? null,
                $data['notes'] ?? null,
                $loggedAt,
            ]
        );

        $log = $logRows[0];

        foreach ($data['sets'] ?? [] as $set) {
            DB::statement(
                'INSERT INTO gym_log_sets
                    (gym_log_id, exercise_name, set_number, reps, weight_kg, completed, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
                [
                    $log->id,
                    $set['exerciseName'],
                    $set['setNumber'],
                    $set['reps'],
                    $set['weightKg'],
                    isset($set['completed']) && $set['completed'] ? true : false,
                ]
            );
        }

        $rows = DB::select(
            "SELECT
                gl.id, gl.title, gl.duration_minutes, gl.calories_burned, gl.notes, gl.logged_at,
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id',           gls.id,
                        'exerciseName', gls.exercise_name,
                        'setNumber',    gls.set_number,
                        'reps',         gls.reps,
                        'weightKg',     gls.weight_kg,
                        'completed',    gls.completed
                    ) ORDER BY gls.set_number
                ) FILTER (WHERE gls.id IS NOT NULL) AS sets_json
             FROM gym_logs gl
             LEFT JOIN gym_log_sets gls ON gls.gym_log_id = gl.id
             WHERE gl.id = ?
             GROUP BY gl.id",
            [$log->id]
        );

        return $this->format($rows[0]);
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

        $rows = DB::select(
            "SELECT
                gl.id, gl.title, gl.duration_minutes, gl.calories_burned, gl.notes, gl.logged_at,
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id',           gls.id,
                        'exerciseName', gls.exercise_name,
                        'setNumber',    gls.set_number,
                        'reps',         gls.reps,
                        'weightKg',     gls.weight_kg,
                        'completed',    gls.completed
                    ) ORDER BY gls.set_number
                ) FILTER (WHERE gls.id IS NOT NULL) AS sets_json
             FROM gym_logs gl
             LEFT JOIN gym_log_sets gls ON gls.gym_log_id = gl.id
             WHERE gl.id = ?
             GROUP BY gl.id",
            [$gymLogId]
        );

        return $this->format($rows[0]);
    }

    /**
     * POST /gym-logs/parse — natural language -> structured draft (not saved).
     */
    public function parse(string $text): array
    {
        return $this->aiService->parseGymLog($text);
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
