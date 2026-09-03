<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('users')->cascadeOnDelete();
            $table->enum('created_by', ['ai', 'trainer', 'nutritionist']);
            $table->foreignId('coach_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', ['nutrition', 'workout']);
            $table->string('title');
            $table->enum('status', ['active', 'archived'])->default('active');
            $table->date('week_start_date');
            $table->json('content');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
