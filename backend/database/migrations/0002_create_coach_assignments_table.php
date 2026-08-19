<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coach_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('coach_id')->constrained('users')->cascadeOnDelete();
            $table->enum('specialty', ['nutritionist', 'trainer']);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['member_id', 'coach_id', 'specialty']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coach_assignments');
    }
};
