<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cycle_symptom_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('logged_on');
            $table->string('symptom_key', 64); // e.g. 'cramps', 'bloating', 'mood_happy'
            $table->timestamps();

            $table->unique(['user_id', 'logged_on', 'symptom_key']);
            $table->index(['user_id', 'logged_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cycle_symptom_logs');
    }
};
