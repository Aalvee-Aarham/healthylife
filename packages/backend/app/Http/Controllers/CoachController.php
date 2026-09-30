<?php

namespace App\Http\Controllers;

use App\Services\CoachService;
use App\Services\GymLogService;
use App\Services\PlanService;
use Illuminate\Http\Request;

class CoachController extends Controller
{
    public function __construct(
        private readonly CoachService $coachService,
        private readonly PlanService $planService,
        private readonly GymLogService $gymLogService,
    ) {}

    public function index(Request $request)
    {
        return response()->json($this->coachService->listCoaches($request->query('specialty')));
    }

    /**
     * GET /coach/clients/{member} — everything a coach needs to monitor one client.
     */
    public function client(Request $request, int $member)
    {
        abort_unless($request->user()->isCoach(), 403);

        $detail = $this->coachService->clientDetail($request->user()->id, $member);
        $detail['plans'] = $this->planService->index($member);
        $detail['planHistory'] = $this->planService->history($member);
        $detail['recentWorkouts'] = array_slice($this->gymLogService->index($member), 0, 5);

        return response()->json($detail);
    }

    public function updateNotes(Request $request, int $member)
    {
        abort_unless($request->user()->isCoach(), 403);

        $data = $request->validate(['notes' => 'nullable|string|max:5000']);

        return response()->json($this->coachService->updateNotes($request->user()->id, $member, $data['notes'] ?? ''));
    }

    public function assign(Request $request)
    {
        $data = $request->validate([
            'coach_id' => 'required|exists:users,id',
            'specialty' => 'required|string|in:nutritionist,trainer,strength_conditioning,wellness,physiotherapist',
        ]);

        abort_unless($request->user()->isMember(), 403);

        return response()->json(
            $this->coachService->assignCoach($request->user()->id, (int) $data['coach_id'], $data['specialty']),
            201
        );
    }

    public function destroy(Request $request, int $assignment)
    {
        $this->coachService->removeAssignment($request->user()->id, $assignment);

        return response()->json(['success' => true]);
    }
}
