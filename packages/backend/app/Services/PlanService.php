<?php

namespace App\Services;

use App\Models\User;
use App\Services\AI\AIService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PlanService
{
    public function __construct(
        private readonly AIService $aiService,
        private readonly CycleService $cycleService,
        private readonly MealService $mealService,
        private readonly GymLogService $gymLogService,
    ) {}

    /**
     * GET /plans — member's own active plans, or (for a coach) a client's plans via memberId.
     */
    public function index(int $memberId): array
    {
        $rows = DB::select(
            "SELECT id, member_id, created_by, coach_id, type, title, status, week_start_date, content, updated_at
             FROM plans
             WHERE member_id = ? AND status = 'active'
             ORDER BY type, week_start_date DESC",
            [$memberId]
        );

        return array_map(fn ($p) => $this->format($p), $rows);
    }

    /**
     * POST /plans — coach-authored plan.
     */
    public function store(int $coachId, string $createdBy, array $data): array
    {
        $rows = DB::select(
            "INSERT INTO plans (member_id, created_by, coach_id, type, title, status, week_start_date, content, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'active', ?, ?, NOW(), NOW())
             RETURNING *",
            [
                $data['member_id'],
                $createdBy,
                $coachId,
                $data['type'],
                $data['title'],
                $data['week_start_date'],
                json_encode($data['content']),
            ]
        );

        return $this->format($rows[0]);
    }

    /**
     * POST /plans/generate-ai — gathers member context and calls AIService::generateWeeklyPlan().
     */
    public function generateAiPlan(User $member, string $type): array
    {
        $context = [
            'goal' => $member->goal,
            'activityLevel' => $member->activity_level,
            'bodyType' => $member->body_type,
            'medicalConditions' => $member->medical_conditions,
            'gender' => $member->gender,
            'macroGoals' => [
                'calories' => $member->calories_goal,
                'protein' => $member->protein_goal_g,
                'carbs' => $member->carbs_goal_g,
                'fat' => $member->fats_goal_g,
            ],
        ];

        if ($member->gender === 'female') {
            $context['cyclePhase'] = $this->cycleService->currentPhase($member->id);
        }

        $generated = $this->aiService->generateWeeklyPlan($context, $type);

        $weekStart = now()->startOfWeek()->toDateString();

        $rows = DB::select(
            "INSERT INTO plans (member_id, created_by, coach_id, type, title, status, week_start_date, content, created_at, updated_at)
             VALUES (?, 'ai', NULL, ?, ?, 'active', ?, ?, NOW(), NOW())
             RETURNING *",
            [
                $member->id,
                $type,
                $generated['title'] ?? (ucfirst($type).' Plan'),
                $weekStart,
                json_encode($generated),
            ]
        );

        return $this->format($rows[0]);
    }

    /**
     * PATCH /plans/{id}/complete — toggles a plan_completions row for (day_of_week, item_index).
     *
     * Checking an item also logs it: nutrition items become a meal (Nutrition & Macros),
     * workout items become a gym log. Unchecking deletes the entry that check created.
     */
    public function toggleCompletion(int $userId, int $planId, int $dayOfWeek, int $itemIndex): array
    {
        return DB::transaction(function () use ($userId, $planId, $dayOfWeek, $itemIndex) {
            // Row lock serializes rapid double-clicks so an item can't be logged twice.
            $plan = DB::selectOne(
                'SELECT member_id, type, title, week_start_date, content FROM plans WHERE id = ? FOR UPDATE',
                [$planId]
            );
            abort_unless($plan && (int) $plan->member_id === $userId, 403);

            $content = json_decode($plan->content, true) ?? [];
            $item = $content['days'][(string) $dayOfWeek]['items'][$itemIndex] ?? null;
            abort_unless(is_array($item), 404, 'Plan item not found.');

            $existing = DB::selectOne(
                'SELECT id, completed_at, meal_id, gym_log_id FROM plan_completions WHERE plan_id = ? AND day_of_week = ? AND item_index = ?',
                [$planId, $dayOfWeek, $itemIndex]
            );

            $completed = ! $existing || $existing->completed_at === null;
            $mealId = null;
            $gymLogId = null;

            if ($completed) {
                $loggedAt = $this->planDayTimestamp($plan->week_start_date, $dayOfWeek);

                if ($plan->type === 'nutrition') {
                    $mealId = (int) $this->mealService->store($userId, [
                        'name' => (string) ($item['name'] ?? 'Planned meal'),
                        'calories' => max(0, (int) ($item['calories'] ?? 0)),
                        'protein' => max(0, (int) ($item['protein'] ?? 0)),
                        'carbs' => max(0, (int) ($item['carbs'] ?? 0)),
                        'fat' => max(0, (int) ($item['fat'] ?? 0)),
                        'category' => in_array($item['category'] ?? null, ['breakfast', 'lunch', 'dinner', 'snack'], true)
                            ? $item['category']
                            : 'snack',
                        'logged_at' => $loggedAt,
                    ])['id'];
                } else {
                    $exercise = (string) ($item['name'] ?? 'Planned exercise');
                    $setCount = min(20, max(1, (int) ($item['sets'] ?? 1)));
                    $reps = max(0, (int) ($item['reps'] ?? 0));

                    $gymLogId = (int) $this->gymLogService->store($userId, [
                        'title' => $exercise,
                        'notes' => trim(($item['notes'] ?? '')."\nLogged from plan: {$plan->title}"),
                        'loggedAt' => $loggedAt,
                        'sets' => array_map(fn ($n) => [
                            'exerciseName' => $exercise,
                            'setNumber' => $n,
                            'reps' => $reps,
                            'weightKg' => 0,
                            'completed' => true,
                        ], range(1, $setCount)),
                    ])['id'];
                }
            } elseif ($existing) {
                // Remove what the earlier check logged (ids are null if the user already deleted it).
                if ($existing->meal_id) {
                    $this->mealService->destroy($userId, (int) $existing->meal_id);
                }
                if ($existing->gym_log_id) {
                    $this->gymLogService->destroy($userId, (int) $existing->gym_log_id);
                }
            }

            if ($existing) {
                DB::statement(
                    'UPDATE plan_completions SET completed_at = ?, meal_id = ?, gym_log_id = ?, updated_at = NOW() WHERE id = ?',
                    [$completed ? now()->toDateTimeString() : null, $mealId, $gymLogId, $existing->id]
                );
            } else {
                DB::statement(
                    'INSERT INTO plan_completions (plan_id, user_id, day_of_week, item_index, completed_at, meal_id, gym_log_id, created_at, updated_at)
                     VALUES (?, ?, ?, ?, NOW(), ?, ?, NOW(), NOW())',
                    [$planId, $userId, $dayOfWeek, $itemIndex, $mealId, $gymLogId]
                );
            }

            return [
                'planId' => (string) $planId,
                'dayOfWeek' => $dayOfWeek,
                'itemIndex' => $itemIndex,
                'completed' => $completed,
                'loggedMealId' => $mealId ? (string) $mealId : null,
                'loggedGymLogId' => $gymLogId ? (string) $gymLogId : null,
            ];
        });
    }

    /**
     * The calendar date of a plan day (0 = Monday), at the current time of day.
     * Future plan days are logged as now — you can't have eaten/trained in the future.
     */
    private function planDayTimestamp(string $weekStartDate, int $dayOfWeek): string
    {
        $date = Carbon::parse($weekStartDate)->startOfDay()->addDays($dayOfWeek)->setTimeFrom(now());

        return ($date->isFuture() ? now() : $date)->toDateTimeString();
    }

    private function format(object $p): array
    {
        $completions = DB::select(
            'SELECT day_of_week, item_index FROM plan_completions WHERE plan_id = ? AND completed_at IS NOT NULL',
            [$p->id]
        );

        return [
            'id' => (string) $p->id,
            'memberId' => (string) $p->member_id,
            'createdBy' => $p->created_by,
            'coachId' => $p->coach_id ? (string) $p->coach_id : null,
            'type' => $p->type,
            'title' => $p->title,
            'status' => $p->status,
            'weekStartDate' => $p->week_start_date,
            'content' => json_decode($p->content, true),
            'completions' => array_map(fn ($c) => [
                'dayOfWeek' => (int) $c->day_of_week,
                'itemIndex' => (int) $c->item_index,
            ], $completions),
            'updatedAt' => $p->updated_at ?? null,
        ];
    }
}
