<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->enum('role', ['member', 'coach']);
            $table->enum('coach_specialty', ['nutritionist', 'trainer'])->nullable();
            $table->string('avatar')->nullable();
            $table->string('title')->nullable();
            $table->decimal('weight_current_kg', 5, 1)->nullable();
            $table->decimal('weight_target_kg', 5, 1)->nullable();
            $table->unsignedSmallInteger('height_cm')->nullable();
            $table->unsignedTinyInteger('age')->nullable();
            $table->unsignedInteger('calories_goal')->default(2000);
            $table->unsignedInteger('protein_goal_g')->default(130);
            $table->unsignedInteger('carbs_goal_g')->default(200);
            $table->unsignedInteger('fats_goal_g')->default(65);
            $table->unsignedInteger('water_goal_ml')->default(3000);
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('users');
    }
};
