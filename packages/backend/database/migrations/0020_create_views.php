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
    }

    public function down(): void
    {
        DB::unprepared('
            DROP VIEW IF EXISTS v_gym_logs_with_sets;
        ');
    }
};
