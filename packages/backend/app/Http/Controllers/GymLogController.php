<?php

namespace App\Http\Controllers;

use App\Services\GymLogService;
use Illuminate\Http\Request;

class GymLogController extends Controller
{
    public function __construct(private readonly GymLogService $gymLogService) {}

    public function index(Request $request)
    {
        return response()->json($this->gymLogService->index($request->user()->id));
    }

    public function stats(Request $request)
    {
        return response()->json($this->gymLogService->stats($request->user()->id));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'durationMinutes' => 'nullable|integer|min:1',
            'caloriesBurned' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
            'loggedAt' => 'nullable|string',
            'sets' => 'nullable|array',
            'sets.*.exerciseName' => 'required_with:sets|string',
            'sets.*.setNumber' => 'required_with:sets|integer|min:1',
            'sets.*.reps' => 'required_with:sets|integer|min:0',
            'sets.*.weightKg' => 'required_with:sets|numeric|min:0',
            'sets.*.completed' => 'boolean',
        ]);

        return response()->json($this->gymLogService->store($request->user()->id, $data), 201);
    }

    public function destroy(Request $request, int $gymLog)
    {
        $this->gymLogService->destroy($request->user()->id, $gymLog);

        return response()->json(['success' => true]);
    }

    public function toggleSet(Request $request, int $gymLog, int $set)
    {
        return response()->json($this->gymLogService->toggleSet($request->user()->id, $gymLog, $set));
    }

    /**
     * POST /gym-logs/parse — natural language -> structured draft (not saved).
     */
    public function parse(Request $request)
    {
        $data = $request->validate(['text' => 'required|string|max:1000']);

        return response()->json($this->gymLogService->parse($data['text']));
    }
}
