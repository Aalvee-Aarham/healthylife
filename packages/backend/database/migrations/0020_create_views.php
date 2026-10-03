<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
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
                    SELECT user_id, DATE(logged_at) AS day, id AS meal_id, calories, protein, carbs, fat, 0 AS water_ml
                    FROM meals
                    WHERE completed = 1
                    UNION ALL
                    SELECT user_id, DATE(logged_at) AS day, NULL AS meal_id, 0 AS calories, 0 AS protein, 0 AS carbs, 0 AS fat, amount_ml AS water_ml
                    FROM water_logs
                ) intake
                GROUP BY user_id, day;
            ");

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
                    CASE WHEN COUNT(gls.id) = 0 THEN JSON_ARRAY()
                    ELSE JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id',           gls.id,
                            'exerciseName', gls.exercise_name,
                            'setNumber',    gls.set_number,
                            'reps',         gls.reps,
                            'weightKg',     gls.weight_kg,
                            'completed',    IF(gls.completed = 1, true, false)
                        )
                    ) END AS sets_json
                FROM gym_logs gl
                LEFT JOIN gym_log_sets gls ON gls.gym_log_id = gl.id
                GROUP BY gl.id, gl.user_id, gl.title, gl.duration_minutes, gl.calories_burned, gl.notes, gl.logged_at;
            ");

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
                GROUP BY gl.user_id;
            ");

            DB::unprepared("
                CREATE OR REPLACE VIEW v_client_adherence AS
                SELECT
                    u.id                                   AS member_id,
                    COUNT(p.id)                            AS active_plans,
                    COALESCE(SUM(COALESCE(JSON_LENGTH(JSON_EXTRACT(p.content, '$.days')), 0)), 0) AS planned_items,
                    COUNT(pc.id)                           AS completed_items,
                    CASE WHEN COUNT(pc.id) > 0 THEN 100 ELSE 0 END AS adherence_pct,
                    GREATEST(
                        COALESCE((SELECT MAX(logged_at) FROM meals      WHERE user_id = u.id), '1970-01-01 00:00:00'),
                        COALESCE((SELECT MAX(logged_at) FROM gym_logs   WHERE user_id = u.id), '1970-01-01 00:00:00'),
                        COALESCE((SELECT MAX(logged_at) FROM water_logs WHERE user_id = u.id), '1970-01-01 00:00:00')
                    ) AS last_active_at
                FROM users u
                LEFT JOIN plans p ON p.member_id = u.id AND p.status = 'active'
                LEFT JOIN plan_completions pc ON pc.plan_id = p.id AND pc.completed_at IS NOT NULL
                WHERE u.role = 'member'
                GROUP BY u.id;
            ");

            return;
        }

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

        // Plan adherence + last activity per member (users JOIN plans JOIN plan_completions).
        // planned_items counts every item across the 7 days of each active plan's JSON.
        // Used by ChatService::myCoaches() for the coach's client list.
        DB::unprepared("
            CREATE OR REPLACE VIEW v_client_adherence AS
            WITH plan_progress AS (
                SELECT
                    p.member_id,
                    (
                        SELECT COALESCE(SUM(json_array_length(day->'items')), 0)
                        FROM (
                            -- PHP's json_encode stores days keyed 0..6 as an array, other keys as an object.
                            SELECT value AS day FROM json_array_elements(CASE WHEN json_typeof(p.content->'days') = 'array' THEN p.content->'days' END)
                            UNION ALL
                            SELECT value FROM json_each(CASE WHEN json_typeof(p.content->'days') = 'object' THEN p.content->'days' END)
                        ) days
                        WHERE json_typeof(day->'items') = 'array'
                    ) AS planned_items,
                    COUNT(pc.id) FILTER (WHERE pc.completed_at IS NOT NULL) AS completed_items
                FROM plans p
                LEFT JOIN plan_completions pc ON pc.plan_id = p.id
                WHERE p.status = 'active'
                GROUP BY p.id
            )
            SELECT
                u.id                                   AS member_id,
                COUNT(pp.member_id)                    AS active_plans,
                COALESCE(SUM(pp.planned_items), 0)     AS planned_items,
                COALESCE(SUM(pp.completed_items), 0)   AS completed_items,
                LEAST(100, COALESCE(ROUND(100.0 * SUM(pp.completed_items) / NULLIF(SUM(pp.planned_items), 0)), 0)) AS adherence_pct,
                GREATEST(
                    (SELECT MAX(logged_at) FROM meals      WHERE user_id = u.id),
                    (SELECT MAX(logged_at) FROM gym_logs   WHERE user_id = u.id),
                    (SELECT MAX(logged_at) FROM water_logs WHERE user_id = u.id)
                ) AS last_active_at
            FROM users u
            LEFT JOIN plan_progress pp ON pp.member_id = u.id
            WHERE u.role = 'member'
            GROUP BY u.id
        ");
    }

    public function down(): void
    {
        DB::unprepared('
            DROP VIEW IF EXISTS v_client_adherence;
            DROP VIEW IF EXISTS v_workout_stats;
            DROP VIEW IF EXISTS v_gym_logs_with_sets;
            DROP VIEW IF EXISTS v_daily_intake;
        ');
    }
};
