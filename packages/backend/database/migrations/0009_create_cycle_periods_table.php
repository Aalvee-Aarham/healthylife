<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cycle_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('started_on');
            $table->date('ended_on')->nullable();
            $table->enum('flow', ['spotting', 'light', 'medium', 'heavy'])->default('medium');
            $table->timestamps();

            $table->unique(['user_id', 'started_on']);
            $table->index(['user_id', 'started_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cycle_periods');
    }
};
