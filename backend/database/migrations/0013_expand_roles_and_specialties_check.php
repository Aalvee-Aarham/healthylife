<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop old check constraint and allow 'admin' role, 'strength_conditioning' coach specialty
        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('member', 'coach', 'admin'))");

        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_coach_specialty_check');
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_coach_specialty_check CHECK (coach_specialty IS NULL OR coach_specialty IN ('nutritionist', 'trainer', 'strength_conditioning', 'wellness', 'physiotherapist'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('member', 'coach'))");
    }
};
