<?php

namespace App\Http\Controllers;

use App\Services\PlanService;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    public function __construct(private readonly PlanService $planService) {}

    /**
     * GET /plans — member's own active plans, or ?member_id= for a coach viewing a client's plan.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->isCoach()) {
            $request->validate(['member_id' => 'required|exists:users,id']);
            $memberId = (int) $request->query('member_id');
        } else {
            $memberId = $user->id;
        }

        return response()->json($this->planService->index($memberId));
    }

    /**
     * POST /plans — coach-authored plan.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isCoach(), 403);

        $data = $request->validate([
            'member_id' => 'required|exists:users,id',
            'type' => 'required|in:nutrition,workout',
            'title' => 'required|string|max:255',
            'week_start_date' => 'required|date',
            'content' => 'required|array',
        ]);

        $createdBy = $user->coach_specialty === 'nutritionist' ? 'nutritionist' : 'trainer';

        return response()->json($this->planService->store($user->id, $createdBy, $data), 201);
    }

    /**
     * POST /plans/generate-ai — AI-generated plan for the authenticated member.
     */
    public function generateAi(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isMember(), 403);

        $data = $request->validate(['type' => 'required|in:nutrition,workout']);

        return response()->json($this->planService->generateAiPlan($user, $data['type']), 201);
    }

    /**
     * PATCH /plans/{id}/complete — toggle a plan_completions row.
     */
    public function complete(Request $request, int $plan)
    {
        $data = $request->validate([
            'day_of_week' => 'required|integer|min:0|max:6',
            'item_index' => 'required|integer|min:0',
        ]);

        return response()->json(
            $this->planService->toggleCompletion($request->user()->id, $plan, $data['day_of_week'], $data['item_index'])
        );
    }
}
