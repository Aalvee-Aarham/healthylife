<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Each gym log with its sets folded into JSON (LEFT JOIN + JSON_AGG).
        // Used by GymLogService::index/store/toggleSet.
        DB::unprepared("
            CREATE OR REPLACE VIEW v_gym_logs_with_sets AS
            SELECT
                gl.id,
                gl.user_id,
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
            GROUP BY gl.id, gl.user_id
        ");

        // Lifetime workout totals per user (JOIN + COUNT/SUM/AVG).
        // Sets are pre-counted per log so SUM(duration) isn't multiplied by the number of sets.
        // Used by GymLogService::stats().
        DB::unprepared("
            CREATE OR REPLACE VIEW v_workout_stats AS
            SELECT
                gl.user_id,
                COUNT(*)                              AS total_workouts,
                COALESCE(SUM(s.set_count), 0)         AS total_sets,
                COALESCE(SUM(gl.duration_minutes), 0) AS total_duration_minutes,
                COALESCE(SUM(gl.calories_burned), 0)  AS total_calories_burned,
                COALESCE(AVG(gl.duration_minutes), 0) AS avg_session_minutes
            FROM gym_logs gl
            LEFT JOIN (
                SELECT gym_log_id, COUNT(*) AS set_count
                FROM gym_log_sets
                GROUP BY gym_log_id
            ) s ON s.gym_log_id = gl.id
            GROUP BY gl.user_id
        ");
    }

    public function down(): void
    {
        DB::unprepared('
            DROP VIEW IF EXISTS v_workout_stats;
            DROP VIEW IF EXISTS v_gym_logs_with_sets;
        ');
    }
};
