<?php

namespace App\Http\Controllers;

use App\Services\CycleService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CycleController extends Controller
{
    public function __construct(private readonly CycleService $cycleService) {}

    public function status(Request $request): JsonResponse
    {
        return response()->json($this->cycleService->status($request->user()->id));
    }

    public function periods(Request $request): JsonResponse
    {
        return response()->json($this->cycleService->periods($request->user()->id));
    }

    public function logPeriod(Request $request): JsonResponse
    {
        $data = $request->validate([
            'started_on' => 'required|date',
            'flow' => 'sometimes|in:spotting,light,medium,heavy',
        ]);

        return response()->json(
            $this->cycleService->logPeriod($request->user()->id, $data['started_on'], $data['flow'] ?? 'medium'),
            201
        );
    }

    public function updatePeriod(Request $request, int $period): JsonResponse
    {
        $data = $request->validate([
            'started_on' => 'sometimes|date',
            'ended_on' => 'sometimes|nullable|date',
            'flow' => 'sometimes|in:spotting,light,medium,heavy',
        ]);

        $result = $this->cycleService->updatePeriod($request->user()->id, $period, $data);

        if ($result === null) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($result);
    }

    public function deletePeriod(Request $request, int $period): JsonResponse
    {
        if (! $this->cycleService->deletePeriod($request->user()->id, $period)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json(['success' => true]);
    }

    public function symptoms(Request $request): JsonResponse
    {
        $request->validate([
            'from' => 'sometimes|date',
            'to' => 'sometimes|date',
        ]);

        $from = $request->input('from', Carbon::today()->subDays(60)->toDateString());
        $to = $request->input('to', Carbon::today()->toDateString());

        return response()->json((object) $this->cycleService->symptoms($request->user()->id, $from, $to));
    }

    public function toggleSymptom(Request $request): JsonResponse
    {
        $data = $request->validate([
            'symptom_key' => 'required|string|max:64',
            'date' => 'sometimes|date',
        ]);

        $date = $data['date'] ?? Carbon::today()->toDateString();

        return response()->json($this->cycleService->toggleSymptom($request->user()->id, $data['symptom_key'], $date));
    }

    public function analytics(Request $request): JsonResponse
    {
        return response()->json($this->cycleService->analytics($request->user()->id));
    }

    public function timeline(Request $request): JsonResponse
    {
        return response()->json($this->cycleService->timeline($request->user()->id));
    }
}
