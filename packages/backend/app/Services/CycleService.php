<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CycleService
{
    private const DEFAULT_CYCLE_LENGTH = 28;

    private const DEFAULT_PERIOD_LENGTH = 5;

    private const LUTEAL_LENGTH = 14;

    private const MAX_CYCLES_FOR_AVG = 6;

    public function status(int $userId): array
    {
        $today = Carbon::today();

        $periods = DB::select(
            'SELECT id, started_on, ended_on, flow
             FROM cycle_periods
             WHERE user_id = ?
             ORDER BY started_on DESC
             LIMIT ?',
            [$userId, self::MAX_CYCLES_FOR_AVG + 1]
        );

        if (empty($periods)) {
            return [
                'hasData' => false,
                'cycleDay' => null,
                'avgCycleLength' => self::DEFAULT_CYCLE_LENGTH,
                'phase' => 'unknown',
                'phaseDay' => null,
                'periodStartedOn' => null,
                'periodEndedOn' => null,
                'isOnPeriod' => false,
                'nextPeriodOn' => null,
                'ovulationOn' => null,
                'fertileDays' => [],
                'todaysSymptoms' => $this->todaySymptoms($userId, $today),
            ];
        }

        $avgCycleLength = $this->computeAvgCycleLength($periods);
        $lastPeriod = $periods[0];
        $periodStart = Carbon::parse($lastPeriod->started_on);
        $periodEnd = $lastPeriod->ended_on ? Carbon::parse($lastPeriod->ended_on) : null;

        $cycleDay = (int) $periodStart->diffInDays($today) + 1;
        $nextPeriodOn = $periodStart->copy()->addDays($avgCycleLength);
        $ovulationDay = $avgCycleLength - self::LUTEAL_LENGTH;
        $ovulationOn = $periodStart->copy()->addDays($ovulationDay - 1);

        $fertileDays = [];
        for ($offset = -2; $offset <= 2; $offset++) {
            $fertileDays[] = $ovulationOn->copy()->addDays($offset)->toDateString();
        }

        $periodLength = $periodEnd
            ? (int) $periodStart->diffInDays($periodEnd) + 1
            : self::DEFAULT_PERIOD_LENGTH;

        $isOnPeriod = $cycleDay <= $periodLength;

        if ($isOnPeriod) {
            $phase = 'menstrual';
            $phaseDay = $cycleDay;
        } elseif ($cycleDay < $ovulationDay - 2) {
            $phase = 'follicular';
            $phaseDay = $cycleDay - $periodLength;
        } elseif ($cycleDay <= $ovulationDay + 2) {
            $phase = 'ovulation';
            $phaseDay = $cycleDay - ($ovulationDay - 3) + 1;
        } else {
            $phase = 'luteal';
            $phaseDay = $cycleDay - ($ovulationDay + 2);
        }

        return [
            'hasData' => true,
            'cycleDay' => $cycleDay,
            'avgCycleLength' => $avgCycleLength,
            'phase' => $phase,
            'phaseDay' => $phaseDay,
            'periodStartedOn' => Carbon::parse($lastPeriod->started_on)->toDateString(),
            'periodEndedOn' => $lastPeriod->ended_on ? Carbon::parse($lastPeriod->ended_on)->toDateString() : null,
            'isOnPeriod' => $isOnPeriod,
            'nextPeriodOn' => $nextPeriodOn->toDateString(),
            'ovulationOn' => $ovulationOn->toDateString(),
            'fertileDays' => $fertileDays,
            'todaysSymptoms' => $this->todaySymptoms($userId, $today),
        ];
    }

    /**
     * Lightweight current-phase lookup used by PlanService for AI plan context.
     */
    public function currentPhase(int $userId): ?string
    {
        $status = $this->status($userId);

        return $status['hasData'] ? $status['phase'] : null;
    }

    public function periods(int $userId): array
    {
        $rows = DB::select(
            'SELECT id, started_on, ended_on, flow
             FROM cycle_periods
             WHERE user_id = ?
             ORDER BY started_on DESC',
            [$userId]
        );

        return array_map(fn ($p) => [
            'id' => $p->id,
            'started_on' => Carbon::parse($p->started_on)->toDateString(),
            'ended_on' => $p->ended_on ? Carbon::parse($p->ended_on)->toDateString() : null,
            'flow' => $p->flow,
        ], $rows);
    }

    public function logPeriod(int $userId, string $startedOn, string $flow): array
    {
        $existing = DB::selectOne(
            'SELECT id FROM cycle_periods WHERE user_id = ? AND started_on = ?',
            [$userId, $startedOn]
        );

        if ($existing) {
            DB::statement('UPDATE cycle_periods SET flow = ?, updated_at = NOW() WHERE id = ?', [$flow, $existing->id]);
            $period = DB::selectOne('SELECT * FROM cycle_periods WHERE id = ?', [$existing->id]);
        } else {
            $rows = DB::select(
                'INSERT INTO cycle_periods (user_id, started_on, flow, created_at, updated_at)
                 VALUES (?, ?, ?, NOW(), NOW())
                 RETURNING *',
                [$userId, $startedOn, $flow]
            );
            $period = $rows[0];
        }

        return [
            'id' => $period->id,
            'started_on' => Carbon::parse($period->started_on)->toDateString(),
            'ended_on' => $period->ended_on ? Carbon::parse($period->ended_on)->toDateString() : null,
            'flow' => $period->flow,
        ];
    }

    public function updatePeriod(int $userId, int $periodId, array $data): ?array
    {
        $existing = DB::selectOne('SELECT id, user_id FROM cycle_periods WHERE id = ?', [$periodId]);

        if (! $existing || (int) $existing->user_id !== $userId) {
            return null;
        }

        if (array_key_exists('ended_on', $data) && $data['ended_on'] === '') {
            $data['ended_on'] = null;
        }

        if (! empty($data)) {
            $data['updated_at'] = now()->toDateTimeString();
            $setClauses = implode(', ', array_map(fn ($k) => "$k = ?", array_keys($data)));
            $bindings = array_values($data);
            $bindings[] = $periodId;
            DB::statement("UPDATE cycle_periods SET $setClauses WHERE id = ?", $bindings);
        }

        $updated = DB::selectOne('SELECT * FROM cycle_periods WHERE id = ?', [$periodId]);

        return [
            'id' => $updated->id,
            'started_on' => Carbon::parse($updated->started_on)->toDateString(),
            'ended_on' => $updated->ended_on ? Carbon::parse($updated->ended_on)->toDateString() : null,
            'flow' => $updated->flow,
        ];
    }

    public function deletePeriod(int $userId, int $periodId): bool
    {
        $existing = DB::selectOne('SELECT user_id FROM cycle_periods WHERE id = ?', [$periodId]);

        if (! $existing || (int) $existing->user_id !== $userId) {
            return false;
        }

        DB::statement('DELETE FROM cycle_periods WHERE id = ?', [$periodId]);

        return true;
    }

    public function symptoms(int $userId, string $from, string $to): array
    {
        $rows = DB::select(
            'SELECT logged_on, ARRAY_AGG(symptom_key ORDER BY symptom_key) AS symptom_keys
             FROM cycle_symptom_logs
             WHERE user_id = ? AND logged_on BETWEEN ? AND ?
             GROUP BY logged_on
             ORDER BY logged_on ASC',
            [$userId, $from, $to]
        );

        $grouped = [];
        foreach ($rows as $row) {
            $date = Carbon::parse($row->logged_on)->toDateString();
            $grouped[$date] = $this->parsePostgresArray($row->symptom_keys);
        }

        return $grouped;
    }

    public function toggleSymptom(int $userId, string $symptomKey, string $date): array
    {
        $existing = DB::selectOne(
            'SELECT id FROM cycle_symptom_logs WHERE user_id = ? AND logged_on = ? AND symptom_key = ?',
            [$userId, $date, $symptomKey]
        );

        if ($existing) {
            DB::statement('DELETE FROM cycle_symptom_logs WHERE id = ?', [$existing->id]);
            $active = false;
        } else {
            DB::statement(
                'INSERT INTO cycle_symptom_logs (user_id, logged_on, symptom_key, created_at, updated_at)
                 VALUES (?, ?, ?, NOW(), NOW())',
                [$userId, $date, $symptomKey]
            );
            $active = true;
        }

        return [
            'symptom_key' => $symptomKey,
            'date' => $date,
            'active' => $active,
            'todaysSymptoms' => $this->todaySymptoms($userId, Carbon::today()),
        ];
    }

    public function analytics(int $userId): array
    {
        $periodStats = DB::selectOne(
            "SELECT
                COUNT(DISTINCT cp.id) AS total_periods_logged,
                COALESCE(AVG(
                    CASE
                        WHEN cp.ended_on IS NOT NULL THEN (cp.ended_on - cp.started_on + 1)
                        ELSE 5
                    END
                ), 0) AS avg_period_duration_days,
                MIN(cp.started_on) AS first_period_date,
                MAX(cp.started_on) AS latest_period_date,
                COUNT(csl.id) AS total_symptoms_during_menstruation
             FROM cycle_periods cp
             LEFT JOIN cycle_symptom_logs csl
                 ON csl.user_id = cp.user_id
                AND csl.logged_on >= cp.started_on
                AND csl.logged_on <= COALESCE(cp.ended_on, cp.started_on + INTERVAL '5 days')
             WHERE cp.user_id = ?",
            [$userId]
        );

        $topSymptoms = DB::select(
            'SELECT
                symptom_key,
                COUNT(*) AS occurrences,
                MAX(logged_on) AS last_logged_on
             FROM cycle_symptom_logs
             WHERE user_id = ?
             GROUP BY symptom_key
             ORDER BY occurrences DESC
             LIMIT 5',
            [$userId]
        );

        $flowDistribution = DB::select(
            'SELECT
                flow,
                COUNT(*) AS count
             FROM cycle_periods
             WHERE user_id = ?
             GROUP BY flow
             ORDER BY count DESC',
            [$userId]
        );

        return [
            'totalPeriodsLogged' => (int) ($periodStats->total_periods_logged ?? 0),
            'avgPeriodDurationDays' => round((float) ($periodStats->avg_period_duration_days ?? 0), 1),
            'firstPeriodDate' => $periodStats->first_period_date,
            'latestPeriodDate' => $periodStats->latest_period_date,
            'totalSymptomsDuringMenstruation' => (int) ($periodStats->total_symptoms_during_menstruation ?? 0),
            'topSymptoms' => array_map(fn ($s) => [
                'symptomKey' => $s->symptom_key,
                'occurrences' => (int) $s->occurrences,
                'lastLoggedOn' => Carbon::parse($s->last_logged_on)->toDateString(),
            ], $topSymptoms),
            'flowDistribution' => array_map(fn ($f) => [
                'flow' => $f->flow,
                'count' => (int) $f->count,
            ], $flowDistribution),
        ];
    }

    public function timeline(int $userId): array
    {
        $events = DB::select(
            "SELECT
                started_on::text AS event_date,
                'period_start' AS event_type,
                CONCAT('Period started (', flow, ' flow)') AS title,
                'menstrual' AS phase_tag,
                id AS ref_id
             FROM cycle_periods
             WHERE user_id = ?

             UNION ALL

             SELECT
                ended_on::text AS event_date,
                'period_end' AS event_type,
                'Period ended' AS title,
                'follicular' AS phase_tag,
                id AS ref_id
             FROM cycle_periods
             WHERE user_id = ? AND ended_on IS NOT NULL

             UNION ALL

             SELECT
                logged_on::text AS event_date,
                'symptom_log' AS event_type,
                CONCAT(COUNT(*), ' symptom(s): ', STRING_AGG(symptom_key, ', ' ORDER BY symptom_key)) AS title,
                'symptoms' AS phase_tag,
                NULL AS ref_id
             FROM cycle_symptom_logs
             WHERE user_id = ?
             GROUP BY logged_on

             ORDER BY event_date DESC
             LIMIT 30",
            [$userId, $userId, $userId]
        );

        return array_map(fn ($e) => [
            'eventDate' => $e->event_date,
            'eventType' => $e->event_type,
            'title' => $e->title,
            'phaseTag' => $e->phase_tag,
            'refId' => $e->ref_id ? (string) $e->ref_id : null,
        ], $events);
    }

    private function computeAvgCycleLength(array $periods): int
    {
        if (count($periods) < 2) {
            return self::DEFAULT_CYCLE_LENGTH;
        }

        $lengths = [];
        $limit = min(self::MAX_CYCLES_FOR_AVG, count($periods) - 1);

        for ($i = 0; $i < $limit; $i++) {
            $newer = Carbon::parse($periods[$i]->started_on);
            $older = Carbon::parse($periods[$i + 1]->started_on);
            $diff = (int) $older->diffInDays($newer);
            if ($diff >= 14 && $diff <= 60) {
                $lengths[] = $diff;
            }
        }

        return empty($lengths) ? self::DEFAULT_CYCLE_LENGTH : (int) round(array_sum($lengths) / count($lengths));
    }

    private function todaySymptoms(int $userId, Carbon $today): array
    {
        $rows = DB::select(
            'SELECT symptom_key FROM cycle_symptom_logs WHERE user_id = ? AND logged_on = ?',
            [$userId, $today->toDateString()]
        );

        return array_column($rows, 'symptom_key');
    }

    private function parsePostgresArray(?string $arr): array
    {
        if (! $arr) {
            return [];
        }
        $arr = trim($arr, '{}');
        if ($arr === '') {
            return [];
        }

        return array_map('trim', explode(',', $arr));
    }
}
