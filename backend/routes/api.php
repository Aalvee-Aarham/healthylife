<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\CycleController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GymLogController;
use App\Http\Controllers\MealController;
use App\Http\Controllers\MealPlanController;
use App\Http\Controllers\WaterLogController;
use Illuminate\Support\Facades\Route;

// ── Public routes ─────────────────────────────────────────────────────────────
Route::post('/auth/login',    [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

// ── Protected routes (Sanctum token) ─────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::get('/auth/me',     [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'summary']);

    // Meals
    Route::get('/meals',              [MealController::class, 'index']);
    Route::post('/meals',             [MealController::class, 'store']);
    Route::patch('/meals/{meal}',     [MealController::class, 'update']);
    Route::delete('/meals/{meal}',    [MealController::class, 'destroy']);
    Route::post('/meals/{meal}/toggle', [MealController::class, 'toggle']);

    // Meal Plans
    Route::get('/meal-plans',                    [MealPlanController::class, 'index']);
    Route::post('/meal-plans',                   [MealPlanController::class, 'store']);
    Route::patch('/meal-plans/{mealPlan}',       [MealPlanController::class, 'update']);
    Route::delete('/meal-plans/{mealPlan}',      [MealPlanController::class, 'destroy']);

    // Water Logs
    Route::get('/water-logs',              [WaterLogController::class, 'index']);
    Route::post('/water-logs',             [WaterLogController::class, 'store']);
    Route::delete('/water-logs/{waterLog}', [WaterLogController::class, 'destroy']);

    // Gym Logs
    Route::get('/gym-logs',                              [GymLogController::class, 'index']);
    Route::post('/gym-logs',                             [GymLogController::class, 'store']);
    Route::delete('/gym-logs/{gymLog}',                  [GymLogController::class, 'destroy']);
    Route::post('/gym-logs/{gymLog}/sets/{set}/toggle',  [GymLogController::class, 'toggleSet']);

    // Cycle Tracker
    Route::get('/cycle/status',                [CycleController::class, 'status']);
    Route::get('/cycle/periods',               [CycleController::class, 'periods']);
    Route::post('/cycle/periods',              [CycleController::class, 'logPeriod']);
    Route::patch('/cycle/periods/{period}',    [CycleController::class, 'updatePeriod']);
    Route::delete('/cycle/periods/{period}',   [CycleController::class, 'deletePeriod']);
    Route::get('/cycle/symptoms',              [CycleController::class, 'symptoms']);
    Route::post('/cycle/symptoms/toggle',      [CycleController::class, 'toggleSymptom']);

    // Chat
    Route::get('/chat/conversations',                                  [ChatController::class, 'conversations']);
    Route::get('/chat/conversations/{conversation}/messages',          [ChatController::class, 'messages']);
    Route::post('/chat/conversations/{conversation}/messages',         [ChatController::class, 'send']);
    Route::post('/chat/start',                                         [ChatController::class, 'startWithCoach']);
    Route::get('/chat/my-coaches',                                     [ChatController::class, 'myCoaches']);

    // Coach
    Route::get('/coach/clients', [ChatController::class, 'myCoaches']);
});
