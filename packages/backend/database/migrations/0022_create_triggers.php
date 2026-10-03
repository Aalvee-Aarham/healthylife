<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::unprepared('DROP TRIGGER IF EXISTS trg_meals_uncheck_plan_item;');
            DB::unprepared("
                CREATE TRIGGER trg_meals_uncheck_plan_item
                BEFORE DELETE ON meals
                FOR EACH ROW
                BEGIN
                    UPDATE plan_completions SET completed_at = NULL, meal_id = NULL, updated_at = NOW()
                    WHERE meal_id = OLD.id;
                END;
            ");

            DB::unprepared('DROP TRIGGER IF EXISTS trg_gym_logs_uncheck_plan_item;');
            DB::unprepared("
                CREATE TRIGGER trg_gym_logs_uncheck_plan_item
                BEFORE DELETE ON gym_logs
                FOR EACH ROW
                BEGIN
                    UPDATE plan_completions SET completed_at = NULL, gym_log_id = NULL, updated_at = NOW()
                    WHERE gym_log_id = OLD.id;
                END;
            ");

            return;
        }

        // A new active plan archives the member's previous active plan of the same type,
        // so there's only ever one active nutrition + one active workout plan.
        DB::unprepared("
            CREATE OR REPLACE FUNCTION fn_archive_previous_plans() RETURNS TRIGGER
            LANGUAGE plpgsql AS \$\$
            BEGIN
                IF NEW.status = 'active' THEN
                    UPDATE plans SET status = 'archived', updated_at = NOW()
                    WHERE member_id = NEW.member_id AND type = NEW.type AND status = 'active';
                END IF;
                RETURN NEW;
            END \$\$;

            CREATE TRIGGER trg_plans_archive_previous
            BEFORE INSERT ON plans
            FOR EACH ROW EXECUTE FUNCTION fn_archive_previous_plans();
        ");

        // Deleting a meal / gym log that was auto-logged from a plan item un-checks that item.
        // BEFORE DELETE: the FK's ON DELETE SET NULL would otherwise clear the link first.
        DB::unprepared("
            CREATE OR REPLACE FUNCTION fn_uncheck_plan_item() RETURNS TRIGGER
            LANGUAGE plpgsql AS \$\$
            BEGIN
                IF TG_TABLE_NAME = 'meals' THEN
                    UPDATE plan_completions SET completed_at = NULL, meal_id = NULL, updated_at = NOW()
                    WHERE meal_id = OLD.id;
                ELSE
                    UPDATE plan_completions SET completed_at = NULL, gym_log_id = NULL, updated_at = NOW()
                    WHERE gym_log_id = OLD.id;
                END IF;
                RETURN OLD;
            END \$\$;

            CREATE TRIGGER trg_meals_uncheck_plan_item
            BEFORE DELETE ON meals
            FOR EACH ROW EXECUTE FUNCTION fn_uncheck_plan_item();

            CREATE TRIGGER trg_gym_logs_uncheck_plan_item
            BEFORE DELETE ON gym_logs
            FOR EACH ROW EXECUTE FUNCTION fn_uncheck_plan_item();
        ");

        // Logging a new period closes any earlier period that was left open,
        // using the default 5-day length (never past the day before the new one).
        DB::unprepared("
            CREATE OR REPLACE FUNCTION fn_close_previous_period() RETURNS TRIGGER
            LANGUAGE plpgsql AS \$\$
            BEGIN
                UPDATE cycle_periods
                SET ended_on = LEAST(started_on + 4, NEW.started_on - 1), updated_at = NOW()
                WHERE user_id = NEW.user_id AND ended_on IS NULL AND started_on < NEW.started_on;
                RETURN NEW;
            END \$\$;

            CREATE TRIGGER trg_cycle_periods_close_previous
            BEFORE INSERT ON cycle_periods
            FOR EACH ROW EXECUTE FUNCTION fn_close_previous_period();
        ");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::unprepared('
                DROP TRIGGER IF EXISTS trg_gym_logs_uncheck_plan_item;
                DROP TRIGGER IF EXISTS trg_meals_uncheck_plan_item;
            ');
            return;
        }

        DB::unprepared('
            DROP TRIGGER IF EXISTS trg_cycle_periods_close_previous ON cycle_periods;
            DROP TRIGGER IF EXISTS trg_gym_logs_uncheck_plan_item ON gym_logs;
            DROP TRIGGER IF EXISTS trg_meals_uncheck_plan_item ON meals;
            DROP TRIGGER IF EXISTS trg_plans_archive_previous ON plans;
            DROP FUNCTION IF EXISTS fn_close_previous_period;
            DROP FUNCTION IF EXISTS fn_uncheck_plan_item;
            DROP FUNCTION IF EXISTS fn_archive_previous_plans;
        ');
    }
};
