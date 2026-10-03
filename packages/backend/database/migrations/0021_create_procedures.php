<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::unprepared('DROP PROCEDURE IF EXISTS sp_log_workout;');
            DB::unprepared("
                CREATE PROCEDURE sp_log_workout(
                    IN p_user_id   BIGINT,
                    IN p_title     VARCHAR(255),
                    IN p_duration  INT,
                    IN p_calories  INT,
                    IN p_notes     TEXT,
                    IN p_logged_at DATETIME,
                    IN p_sets      JSON,
                    OUT p_log_id   BIGINT
                )
                BEGIN
                    INSERT INTO gym_logs (user_id, title, duration_minutes, calories_burned, notes, logged_at, created_at, updated_at)
                    VALUES (p_user_id, p_title, p_duration, p_calories, p_notes, p_logged_at, NOW(), NOW());

                    SET p_log_id = LAST_INSERT_ID();

                    IF p_sets IS NOT NULL AND JSON_VALID(p_sets) AND JSON_LENGTH(p_sets) > 0 THEN
                        INSERT INTO gym_log_sets (gym_log_id, exercise_name, set_number, reps, weight_kg, completed, created_at, updated_at)
                        SELECT
                            p_log_id,
                            jt.exercise_name,
                            jt.set_number,
                            jt.reps,
                            jt.weight_kg,
                            IF(jt.completed = true OR jt.completed = 1, 1, 0),
                            NOW(),
                            NOW()
                        FROM JSON_TABLE(
                            p_sets,
                            '$[*]' COLUMNS (
                                exercise_name VARCHAR(255) PATH '$.exerciseName',
                                set_number INT PATH '$.setNumber',
                                reps INT PATH '$.reps',
                                weight_kg DECIMAL(8,2) PATH '$.weightKg',
                                completed JSON PATH '$.completed'
                            )
                        ) AS jt;
                    END IF;
                END
            ");

            DB::unprepared('DROP PROCEDURE IF EXISTS sp_assign_coach;');
            DB::unprepared("
                CREATE PROCEDURE sp_assign_coach(
                    IN p_member_id      BIGINT,
                    IN p_coach_id       BIGINT,
                    IN p_specialty      VARCHAR(255),
                    OUT p_assignment_id BIGINT
                )
                BEGIN
                    DELETE FROM coach_assignments WHERE member_id = p_member_id AND specialty = p_specialty;

                    INSERT INTO coach_assignments (member_id, coach_id, specialty, created_at, updated_at)
                    VALUES (p_member_id, p_coach_id, p_specialty, NOW(), NOW());

                    SET p_assignment_id = LAST_INSERT_ID();
                END
            ");

            DB::unprepared('DROP PROCEDURE IF EXISTS sp_toggle_symptom;');
            DB::unprepared("
                CREATE PROCEDURE sp_toggle_symptom(
                    IN p_user_id     BIGINT,
                    IN p_symptom_key VARCHAR(255),
                    IN p_date        DATE,
                    OUT p_active     BOOLEAN
                )
                BEGIN
                    DELETE FROM cycle_symptom_logs
                    WHERE user_id = p_user_id AND logged_on = p_date AND symptom_key = p_symptom_key;

                    IF ROW_COUNT() = 0 THEN
                        INSERT INTO cycle_symptom_logs (user_id, logged_on, symptom_key, created_at, updated_at)
                        VALUES (p_user_id, p_date, p_symptom_key, NOW(), NOW());
                        SET p_active = TRUE;
                    ELSE
                        SET p_active = FALSE;
                    END IF;
                END
            ");

            DB::unprepared('DROP PROCEDURE IF EXISTS sp_log_period;');
            DB::unprepared("
                CREATE PROCEDURE sp_log_period(
                    IN p_user_id    BIGINT,
                    IN p_started_on DATE,
                    IN p_flow       VARCHAR(255),
                    OUT p_period_id BIGINT
                )
                BEGIN
                    UPDATE cycle_periods
                    SET ended_on = LEAST(DATE_ADD(started_on, INTERVAL 4 DAY), DATE_SUB(p_started_on, INTERVAL 1 DAY)), updated_at = NOW()
                    WHERE user_id = p_user_id AND ended_on IS NULL AND started_on < p_started_on;

                    INSERT INTO cycle_periods (user_id, started_on, flow, created_at, updated_at)
                    VALUES (p_user_id, p_started_on, p_flow, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE flow = VALUES(flow), updated_at = NOW();

                    SELECT id INTO p_period_id FROM cycle_periods WHERE user_id = p_user_id AND started_on = p_started_on LIMIT 1;
                END
            ");

            return;
        }

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

        // Toggle a symptom on/off for a day; returns the new state. Used by CycleService::toggleSymptom().
        DB::unprepared("
            CREATE OR REPLACE PROCEDURE sp_toggle_symptom(
                p_user_id     BIGINT,
                p_symptom_key VARCHAR,
                p_date        DATE,
                INOUT p_active BOOLEAN
            )
            LANGUAGE plpgsql AS \$\$
            BEGIN
                DELETE FROM cycle_symptom_logs
                WHERE user_id = p_user_id AND logged_on = p_date AND symptom_key = p_symptom_key;

                p_active := NOT FOUND;

                IF p_active THEN
                    INSERT INTO cycle_symptom_logs (user_id, logged_on, symptom_key, created_at, updated_at)
                    VALUES (p_user_id, p_date, p_symptom_key, NOW(), NOW());
                END IF;
            END \$\$
        ");

        // Insert a period, or update its flow if one already starts that day. Used by CycleService::logPeriod().
        DB::unprepared("
            CREATE OR REPLACE PROCEDURE sp_log_period(
                p_user_id    BIGINT,
                p_started_on DATE,
                p_flow       VARCHAR,
                INOUT p_period_id BIGINT
            )
            LANGUAGE plpgsql AS \$\$
            BEGIN
                INSERT INTO cycle_periods (user_id, started_on, flow, created_at, updated_at)
                VALUES (p_user_id, p_started_on, p_flow, NOW(), NOW())
                ON CONFLICT (user_id, started_on) DO UPDATE SET flow = EXCLUDED.flow, updated_at = NOW()
                RETURNING id INTO p_period_id;
            END \$\$
        ");
    }

    public function down(): void
    {
        DB::unprepared('
            DROP PROCEDURE IF EXISTS sp_log_period;
            DROP PROCEDURE IF EXISTS sp_toggle_symptom;
            DROP PROCEDURE IF EXISTS sp_assign_coach;
            DROP PROCEDURE IF EXISTS sp_log_workout;
        ');
    }
};
