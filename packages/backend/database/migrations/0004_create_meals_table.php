<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->unsignedInteger('calories');
            $table->unsignedInteger('protein');
            $table->unsignedInteger('carbs');
            $table->unsignedInteger('fat');
            $table->enum('category', ['breakfast', 'lunch', 'dinner', 'snack']);
            $table->string('image')->nullable();
            $table->boolean('completed')->default(true);
            $table->timestamp('logged_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meals');
    }
};
