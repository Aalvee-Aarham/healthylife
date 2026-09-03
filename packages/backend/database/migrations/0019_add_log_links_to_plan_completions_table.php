<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Checking a plan item auto-logs a meal / gym log; these link back so unchecking removes it.
        Schema::table('plan_completions', function (Blueprint $table) {
            $table->foreignId('meal_id')->nullable()->constrained('meals')->nullOnDelete();
            $table->foreignId('gym_log_id')->nullable()->constrained('gym_logs')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('plan_completions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('meal_id');
            $table->dropConstrainedForeignId('gym_log_id');
        });
    }
};
