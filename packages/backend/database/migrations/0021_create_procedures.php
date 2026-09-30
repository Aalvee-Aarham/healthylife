<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // Postgres runs procedures with CALL (the equivalent of SQL Server's EXEC).
    // The INOUT parameter comes back as the CALL's result row.
    public function up(): void
    {
        // Gym log + all its sets in one call. Used by GymLogService::store().
        DB::unprepared("
            CREATE OR REPLACE PROCEDURE sp_log_workout(
                p_user_id   BIGINT,
                p_title     VARCHAR,
                p_duration  INT,
                p_calories  INT,
                p_notes     TEXT,
                p_logged_at TIMESTAMP,
                p_sets      JSON,
                INOUT p_log_id BIGINT
            )
            LANGUAGE plpgsql AS \$\$
            BEGIN
                INSERT INTO gym_logs (user_id, title, duration_minutes, calories_burned, notes, logged_at, created_at, updated_at)
                VALUES (p_user_id, p_title, p_duration, p_calories, p_notes, p_logged_at, NOW(), NOW())
                RETURNING id INTO p_log_id;

                INSERT INTO gym_log_sets (gym_log_id, exercise_name, set_number, reps, weight_kg, completed, created_at, updated_at)
                SELECT p_log_id,
                       s->>'exerciseName',
                       (s->>'setNumber')::INT,
                       (s->>'reps')::INT,
                       (s->>'weightKg')::NUMERIC,
                       COALESCE((s->>'completed')::BOOLEAN, false),
                       NOW(), NOW()
                FROM json_array_elements(COALESCE(p_sets, '[]'::JSON)) AS s;
            END \$\$
        ");

        // Replace the member's coach for a specialty. Used by CoachService::assignCoach().
        DB::unprepared("
            CREATE OR REPLACE PROCEDURE sp_assign_coach(
                p_member_id BIGINT,
                p_coach_id  BIGINT,
                p_specialty VARCHAR,
                INOUT p_assignment_id BIGINT
            )
            LANGUAGE plpgsql AS \$\$
            BEGIN
                DELETE FROM coach_assignments WHERE member_id = p_member_id AND specialty = p_specialty;

                INSERT INTO coach_assignments (member_id, coach_id, specialty, created_at, updated_at)
                VALUES (p_member_id, p_coach_id, p_specialty, NOW(), NOW())
                RETURNING id INTO p_assignment_id;
            END \$\$
        ");
    }

    public function down(): void
    {
        DB::unprepared('
            DROP PROCEDURE IF EXISTS sp_assign_coach;
            DROP PROCEDURE IF EXISTS sp_log_workout;
        ');
    }
};
