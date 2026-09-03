<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_completions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained('plans')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->smallInteger('day_of_week');
            $table->smallInteger('item_index');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['plan_id', 'day_of_week', 'item_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_completions');
    }
};
