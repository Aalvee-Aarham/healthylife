<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('meals', function (Blueprint $table) {
            $table->enum('source', ['manual', 'ai_text', 'ai_scan'])->default('manual');
            $table->float('ai_confidence')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('meals', function (Blueprint $table) {
            $table->dropColumn(['source', 'ai_confidence']);
        });
    }
};
