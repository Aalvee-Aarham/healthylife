<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gym_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->unsignedSmallInteger('duration_minutes')->nullable();
            $table->unsignedInteger('calories_burned')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('logged_at');
            $table->timestamps();
        });

        Schema::create('gym_log_sets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gym_log_id')->constrained('gym_logs')->cascadeOnDelete();
            $table->string('exercise_name');
            $table->unsignedTinyInteger('set_number');
            $table->unsignedSmallInteger('reps');
            $table->decimal('weight_kg', 6, 1);
            $table->boolean('completed')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gym_log_sets');
        Schema::dropIfExists('gym_logs');
    }
};
