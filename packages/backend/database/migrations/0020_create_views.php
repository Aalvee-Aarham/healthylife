<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Per-user, per-day intake: meals (completed only) + water, via UNION ALL then SUM/COUNT.
        // Used by DashboardService::summary().
        DB::unprepared("
            CREATE OR REPLACE VIEW v_daily_intake AS
            SELECT
                user_id,
                day,
                SUM(calories)    AS calories,
                SUM(protein)     AS protein,
                SUM(carbs)       AS carbs,
                SUM(fat)         AS fat,
                COUNT(meal_id)   AS meal_count,
                SUM(water_ml)    AS water_ml
            FROM (
                SELECT user_id, logged_at::date AS day, id AS meal_id, calories, protein, carbs, fat, 0 AS water_ml
                FROM meals
                WHERE completed = true
                UNION ALL
                SELECT user_id, logged_at::date, NULL, 0, 0, 0, 0, amount_ml
                FROM water_logs
            ) intake
            GROUP BY user_id, day
        ");

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
            DROP VIEW IF EXISTS v_daily_intake;
        ');
    }
};
