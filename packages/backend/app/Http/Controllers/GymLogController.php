<?php

namespace App\Http\Controllers;

use App\Models\GymLog;
use App\Models\GymLogSet;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class GymLogController extends Controller
{
    public function index(Request $request)
    {
        $logs = GymLog::where('user_id', $request->user()->id)
            ->with('sets')
            ->orderByDesc('logged_at')
            ->limit(30)
            ->get()
            ->map(fn (GymLog $log) => $this->format($log));

        return response()->json($logs);
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

        $loggedAt = !empty($data['loggedAt']) ? Carbon::parse($data['loggedAt']) : now();

        $log = GymLog::create([
            'user_id' => $request->user()->id,
            'title' => $data['title'],
            'duration_minutes' => $data['durationMinutes'] ?? null,
            'calories_burned' => $data['caloriesBurned'] ?? null,
            'notes' => $data['notes'] ?? null,
            'logged_at' => $loggedAt,
        ]);

        foreach ($data['sets'] ?? [] as $set) {
            GymLogSet::create([
                'gym_log_id' => $log->id,
                'exercise_name' => $set['exerciseName'],
                'set_number' => $set['setNumber'],
                'reps' => $set['reps'],
                'weight_kg' => $set['weightKg'],
                'completed' => $set['completed'] ?? true,
            ]);
        }

        return response()->json($this->format($log->load('sets')), 201);
    }

    public function destroy(Request $request, GymLog $gymLog)
    {
        abort_unless($gymLog->user_id === $request->user()->id, 403);
        $gymLog->delete();

        return response()->json(['success' => true]);
    }

    public function toggleSet(Request $request, GymLog $gymLog, GymLogSet $set)
    {
        abort_unless($gymLog->user_id === $request->user()->id, 403);
        abort_unless($set->gym_log_id === $gymLog->id, 404);

        $set->update(['completed' => !$set->completed]);

        return response()->json($this->format($gymLog->fresh('sets')));
    }

    private function format(GymLog $log): array
    {
        return [
            'id' => (string) $log->id,
            'title' => $log->title,
            'durationMinutes' => $log->duration_minutes,
            'caloriesBurned' => $log->calories_burned,
            'notes' => $log->notes,
            'loggedAt' => $log->logged_at->toIso8601String(),
            'date' => Carbon::parse($log->logged_at)->format('M j, Y'),
            'sets' => $log->sets->map(fn (GymLogSet $s) => [
                'id' => (string) $s->id,
                'exerciseName' => $s->exercise_name,
                'setNumber' => $s->set_number,
                'reps' => $s->reps,
                'weightKg' => (float) $s->weight_kg,
                'completed' => $s->completed,
            ]),
        ];
    }
}
