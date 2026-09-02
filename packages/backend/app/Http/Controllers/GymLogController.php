<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class GymLogController extends Controller
{
    /**
     * GET /gym-logs
     *
     * Uses LEFT JOIN between gym_logs and gym_log_sets so that workouts
     * with no sets still appear. Sets are aggregated with JSON_AGG in a
     * single query — eliminates the N+1 Eloquent eager-load.
     */
    public function index(Request $request)
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
            [$request->user()->id]
        );

        return response()->json(array_map(fn($log) => $this->format($log), $rows));
    }

    /**
     * GET /gym-logs/stats
     *
     * Aggregate statistics via LEFT JOIN + COUNT / SUM / AVG.
     * Also uses INTERSECT to find days the user logged both a workout AND a meal
     * (consistent training days) — all computed in SQL, not JavaScript.
     */
    public function stats(Request $request)
    {
        $userId = $request->user()->id;

        // LEFT JOIN + aggregate functions: total workouts, sets, duration, calories
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

        // INTERSECT: days the user logged BOTH a workout AND a completed meal
        // These are "consistent" training days where nutrition and exercise aligned.
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

        return response()->json([
            'totalWorkouts'        => (int) $row->total_workouts,
            'totalSets'            => (int) $row->total_sets,
            'totalDurationMinutes' => (int) $row->total_duration_minutes,
            'totalCaloriesBurned'  => (int) $row->total_calories_burned,
            'avgSessionMinutes'    => round((float) $row->avg_session_minutes, 1),
            'consistentDays'       => array_map(fn($d) => $d->activity_date, $consistentDays),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'               => 'required|string|max:255',
            'durationMinutes'     => 'nullable|integer|min:1',
            'caloriesBurned'      => 'nullable|integer|min:0',
            'notes'               => 'nullable|string',
            'loggedAt'            => 'nullable|string',
            'sets'                => 'nullable|array',
            'sets.*.exerciseName' => 'required_with:sets|string',
            'sets.*.setNumber'    => 'required_with:sets|integer|min:1',
            'sets.*.reps'         => 'required_with:sets|integer|min:0',
            'sets.*.weightKg'     => 'required_with:sets|numeric|min:0',
            'sets.*.completed'    => 'boolean',
        ]);

        $loggedAt = !empty($data['loggedAt'])
            ? Carbon::parse($data['loggedAt'])->toDateTimeString()
            : now()->toDateTimeString();

        // INSERT gym_log and return new row via RETURNING
        $logRows = DB::select(
            'INSERT INTO gym_logs
                (user_id, title, duration_minutes, calories_burned, notes, logged_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
             RETURNING *',
            [
                $request->user()->id,
                $data['title'],
                $data['durationMinutes'] ?? null,
                $data['caloriesBurned']  ?? null,
                $data['notes']           ?? null,
                $loggedAt,
            ]
        );

        $log = $logRows[0];

        // Insert each set
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

        // Re-fetch with sets via LEFT JOIN + JSON_AGG
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

        return response()->json($this->format($rows[0]), 201);
    }

    public function destroy(Request $request, int $gymLog)
    {
        $existing = DB::selectOne('SELECT user_id FROM gym_logs WHERE id = ?', [$gymLog]);
        abort_unless($existing && (int) $existing->user_id === (int) $request->user()->id, 403);

        // Delete sets first (safe even if cascade is configured at DB level)
        DB::statement('DELETE FROM gym_log_sets WHERE gym_log_id = ?', [$gymLog]);
        DB::statement('DELETE FROM gym_logs WHERE id = ?', [$gymLog]);

        return response()->json(['success' => true]);
    }

    public function toggleSet(Request $request, int $gymLog, int $set)
    {
        $log = DB::selectOne('SELECT user_id FROM gym_logs WHERE id = ?', [$gymLog]);
        abort_unless($log && (int) $log->user_id === (int) $request->user()->id, 403);

        $setRow = DB::selectOne('SELECT gym_log_id FROM gym_log_sets WHERE id = ?', [$set]);
        abort_unless($setRow && (int) $setRow->gym_log_id === $gymLog, 404);

        // SQL NOT operator toggles in-place
        DB::statement('UPDATE gym_log_sets SET completed = NOT completed, updated_at = NOW() WHERE id = ?', [$set]);

        // Return updated log via LEFT JOIN + JSON_AGG
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
            [$gymLog]
        );

        return response()->json($this->format($rows[0]));
    }

    private function format(object $log): array
    {
        $sets = $log->sets_json ? json_decode($log->sets_json, true) : [];

        return [
            'id'              => (string) $log->id,
            'title'           => $log->title,
            'durationMinutes' => $log->duration_minutes ? (int) $log->duration_minutes : null,
            'caloriesBurned'  => $log->calories_burned  ? (int) $log->calories_burned  : null,
            'notes'           => $log->notes,
            'loggedAt'        => Carbon::parse($log->logged_at)->toIso8601String(),
            'date'            => Carbon::parse($log->logged_at)->format('M j, Y'),
            'sets'            => array_map(fn($s) => [
                'id'           => (string) $s['id'],
                'exerciseName' => $s['exerciseName'],
                'setNumber'    => (int) $s['setNumber'],
                'reps'         => (int) $s['reps'],
                'weightKg'     => (float) $s['weightKg'],
                'completed'    => in_array($s['completed'], [true, 't', 1, '1'], true),
            ], $sets),
        ];
    }
}
