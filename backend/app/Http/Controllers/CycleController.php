<?php

namespace App\Http\Controllers;

use App\Models\CyclePeriod;
use App\Models\CycleSymptomLog;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CycleController extends Controller
{
    // ─── Constants ────────────────────────────────────────────────────────────
    private const DEFAULT_CYCLE_LENGTH = 28;
    private const DEFAULT_PERIOD_LENGTH = 5;
    private const LUTEAL_LENGTH        = 14; // fairly constant across women
    private const MAX_CYCLES_FOR_AVG   = 6;  // rolling average window

    // ─── GET /cycle/status ────────────────────────────────────────────────────
    /**
     * Returns today's computed cycle state. All dates are YYYY-MM-DD strings.
     */
    public function status(Request $request): JsonResponse
    {
        $user    = $request->user();
        $today   = Carbon::today();

        /** @var \Illuminate\Database\Eloquent\Collection $periods */
        $periods = CyclePeriod::where('user_id', $user->id)
            ->orderBy('started_on', 'desc')
            ->limit(self::MAX_CYCLES_FOR_AVG + 1) // +1 so we can compute intervals
            ->get();

        if ($periods->isEmpty()) {
            return response()->json([
                'hasData'          => false,
                'cycleDay'         => null,
                'avgCycleLength'   => self::DEFAULT_CYCLE_LENGTH,
                'phase'            => 'unknown',
                'phaseDay'         => null,
                'periodStartedOn'  => null,
                'periodEndedOn'    => null,
                'isOnPeriod'       => false,
                'nextPeriodOn'     => null,
                'ovulationOn'      => null,
                'fertileDays'      => [],
                'todaysSymptoms'   => $this->todaySymptoms($user->id, $today),
            ]);
        }

        // ── Rolling average cycle length ──────────────────────────────────────
        $avgCycleLength = $this->computeAvgCycleLength($periods);

        // ── Latest period ─────────────────────────────────────────────────────
        $lastPeriod    = $periods->first();
        $periodStart   = Carbon::parse($lastPeriod->started_on);
        $periodEnd     = $lastPeriod->ended_on ? Carbon::parse($lastPeriod->ended_on) : null;

        // ── Cycle day (1-indexed) ─────────────────────────────────────────────
        $cycleDay = (int) $periodStart->diffInDays($today) + 1;

        // ── Predicted dates ───────────────────────────────────────────────────
        $nextPeriodOn  = $periodStart->copy()->addDays($avgCycleLength);
        $ovulationDay  = $avgCycleLength - self::LUTEAL_LENGTH; // e.g. day 14 for 28-cycle
        $ovulationOn   = $periodStart->copy()->addDays($ovulationDay - 1); // -1 because day 1 = start

        // Fertile window: ovulation ± 2 days
        $fertileDays = [];
        for ($offset = -2; $offset <= 2; $offset++) {
            $fertileDays[] = $ovulationOn->copy()->addDays($offset)->toDateString();
        }

        // ── Period length estimate (from last period, or default) ─────────────
        $periodLength = $periodEnd
            ? (int) $periodStart->diffInDays($periodEnd) + 1
            : self::DEFAULT_PERIOD_LENGTH;

        // ── Determine phase ───────────────────────────────────────────────────
        $isOnPeriod = $cycleDay <= $periodLength;

        if ($isOnPeriod) {
            $phase    = 'menstrual';
            $phaseDay = $cycleDay;
        } elseif ($cycleDay < $ovulationDay - 2) {
            $phase    = 'follicular';
            $phaseDay = $cycleDay - $periodLength;
        } elseif ($cycleDay <= $ovulationDay + 2) {
            $phase    = 'ovulation';
            $phaseDay = $cycleDay - ($ovulationDay - 3) + 1;
        } else {
            $phase    = 'luteal';
            $phaseDay = $cycleDay - ($ovulationDay + 2);
        }

        // ── Today's symptoms ─────────────────────────────────────────────────
        $todaysSymptoms = $this->todaySymptoms($user->id, $today);

        return response()->json([
            'hasData'          => true,
            'cycleDay'         => $cycleDay,
            'avgCycleLength'   => $avgCycleLength,
            'phase'            => $phase,
            'phaseDay'         => $phaseDay,
            'periodStartedOn'  => $lastPeriod->started_on->toDateString(),
            'periodEndedOn'    => $lastPeriod->ended_on?->toDateString(),
            'isOnPeriod'       => $isOnPeriod,
            'nextPeriodOn'     => $nextPeriodOn->toDateString(),
            'ovulationOn'      => $ovulationOn->toDateString(),
            'fertileDays'      => $fertileDays,
            'todaysSymptoms'   => $todaysSymptoms,
        ]);
    }

    // ─── GET /cycle/periods ────────────────────────────────────────────────────
    public function periods(Request $request): JsonResponse
    {
        $periods = CyclePeriod::where('user_id', $request->user()->id)
            ->orderBy('started_on', 'desc')
            ->get();

        return response()->json($periods->map(fn ($p) => [
            'id'         => $p->id,
            'started_on' => $p->started_on->toDateString(),
            'ended_on'   => $p->ended_on?->toDateString(),
            'flow'       => $p->flow,
        ]));
    }

    // ─── POST /cycle/periods ───────────────────────────────────────────────────
    public function logPeriod(Request $request): JsonResponse
    {
        $data = $request->validate([
            'started_on' => 'required|date',
            'flow'       => 'sometimes|in:spotting,light,medium,heavy',
        ]);

        $period = CyclePeriod::updateOrCreate(
            ['user_id' => $request->user()->id, 'started_on' => $data['started_on']],
            ['flow' => $data['flow'] ?? 'medium']
        );

        return response()->json([
            'id'         => $period->id,
            'started_on' => $period->started_on->toDateString(),
            'ended_on'   => $period->ended_on?->toDateString(),
            'flow'       => $period->flow,
        ], 201);
    }

    // ─── PATCH /cycle/periods/{period} ────────────────────────────────────────
    public function updatePeriod(Request $request, CyclePeriod $period): JsonResponse
    {
        if ($period->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'started_on' => 'sometimes|date',
            'ended_on'   => 'sometimes|nullable|date|after_or_equal:' . ($request->input('started_on') ?? $period->started_on->toDateString()),
            'flow'       => 'sometimes|in:spotting,light,medium,heavy',
        ]);

        // Support resetting ended_on
        if (array_key_exists('ended_on', $data) && $data['ended_on'] === '') {
            $data['ended_on'] = null;
        }

        $period->update($data);

        return response()->json([
            'id'         => $period->id,
            'started_on' => $period->started_on->toDateString(),
            'ended_on'   => $period->ended_on?->toDateString(),
            'flow'       => $period->flow,
        ]);
    }

    // ─── DELETE /cycle/periods/{period} ─────────────────────────────────────
    public function deletePeriod(Request $request, CyclePeriod $period): JsonResponse
    {
        if ($period->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $period->delete();

        return response()->json(['success' => true]);
    }

    // ─── GET /cycle/symptoms ──────────────────────────────────────────────────
    public function symptoms(Request $request): JsonResponse
    {
        $request->validate([
            'from' => 'sometimes|date',
            'to'   => 'sometimes|date',
        ]);

        $from = $request->input('from', Carbon::today()->subDays(60)->toDateString());
        $to   = $request->input('to',   Carbon::today()->toDateString());

        $logs = CycleSymptomLog::where('user_id', $request->user()->id)
            ->whereBetween('logged_on', [$from, $to])
            ->orderBy('logged_on')
            ->get();

        // Group by date for easy front-end consumption
        $grouped = $logs->groupBy(fn ($l) => $l->logged_on->toDateString())
            ->map(fn ($items) => $items->pluck('symptom_key')->values());

        return response()->json($grouped);
    }

    // ─── POST /cycle/symptoms/toggle ──────────────────────────────────────────
    public function toggleSymptom(Request $request): JsonResponse
    {
        $data = $request->validate([
            'symptom_key' => 'required|string|max:64',
            'date'        => 'sometimes|date',
        ]);

        $date   = $data['date'] ?? Carbon::today()->toDateString();
        $userId = $request->user()->id;

        $existing = CycleSymptomLog::where([
            'user_id'     => $userId,
            'logged_on'   => $date,
            'symptom_key' => $data['symptom_key'],
        ])->first();

        if ($existing) {
            $existing->delete();
            $active = false;
        } else {
            CycleSymptomLog::create([
                'user_id'     => $userId,
                'logged_on'   => $date,
                'symptom_key' => $data['symptom_key'],
            ]);
            $active = true;
        }

        return response()->json([
            'symptom_key' => $data['symptom_key'],
            'date'        => $date,
            'active'      => $active,
            'todaysSymptoms' => $this->todaySymptoms($userId, Carbon::today()),
        ]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Compute rolling average cycle length from a collection of periods
     * ordered desc by started_on. Needs at least 2 periods to compute.
     */
    private function computeAvgCycleLength(\Illuminate\Database\Eloquent\Collection $periods): int
    {
        if ($periods->count() < 2) {
            return self::DEFAULT_CYCLE_LENGTH;
        }

        $lengths = [];
        $arr     = $periods->values();
        $limit   = min(self::MAX_CYCLES_FOR_AVG, $arr->count() - 1);

        for ($i = 0; $i < $limit; $i++) {
            $newer = Carbon::parse($arr[$i]->started_on);
            $older = Carbon::parse($arr[$i + 1]->started_on);
            $diff  = (int) $older->diffInDays($newer);
            // Sanity check — ignore obviously wrong intervals
            if ($diff >= 14 && $diff <= 60) {
                $lengths[] = $diff;
            }
        }

        if (empty($lengths)) {
            return self::DEFAULT_CYCLE_LENGTH;
        }

        return (int) round(array_sum($lengths) / count($lengths));
    }

    /** Returns symptom keys logged for today */
    private function todaySymptoms(int $userId, Carbon $today): array
    {
        return CycleSymptomLog::where('user_id', $userId)
            ->where('logged_on', $today->toDateString())
            ->pluck('symptom_key')
            ->values()
            ->all();
    }
}
