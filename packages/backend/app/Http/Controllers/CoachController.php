<?php

namespace App\Http\Controllers;

use App\Services\CoachService;
use Illuminate\Http\Request;

class CoachController extends Controller
{
    public function __construct(private readonly CoachService $coachService) {}

    public function index(Request $request)
    {
        return response()->json($this->coachService->listCoaches($request->query('specialty')));
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
