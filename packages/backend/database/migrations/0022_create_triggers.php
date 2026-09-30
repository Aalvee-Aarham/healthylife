<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
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
    }

    public function down(): void
    {
        DB::unprepared('
            DROP TRIGGER IF EXISTS trg_plans_archive_previous ON plans;
            DROP FUNCTION IF EXISTS fn_archive_previous_plans;
        ');
    }
};
