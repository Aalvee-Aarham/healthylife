<?php

namespace App\Http\Controllers;

use App\Models\Meal;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class MealController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->query('date', now()->toDateString());

        $meals = Meal::where('user_id', $request->user()->id)
            ->whereDate('logged_at', $date)
            ->orderBy('logged_at')
            ->get()
            ->map(fn(Meal $m) => $this->format($m));

        return response()->json($meals);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'calories' => 'required|integer',
            'protein' => 'required|integer',
            'carbs' => 'required|integer',
            'fat' => 'required|integer',
            'category' => 'required|string|in:breakfast,lunch,dinner,snack',
            'image' => 'nullable|url',
            'logged_at' => 'nullable|date',
        ]);

        $meal = Meal::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'calories' => $validated['calories'],
            'protein' => $validated['protein'],
            'carbs' => $validated['carbs'],
            'fat' => $validated['fat'],
            'category' => $validated['category'],
            'image' => $validated['image'] ?? null,
            'logged_at' => $validated['logged_at'] ?? now(),
            'completed' => true,
        ]);

        return response()->json($this->format($meal), 201);
    }

    public function update(Request $request, Meal $meal)
    {
        abort_unless($meal->user_id === $request->user()->id, 403);

        $data = $request->validate([
            'name'     => 'sometimes|string|max:255',
            'calories' => 'sometimes|integer|min:0',
            'protein'  => 'sometimes|integer|min:0',
            'carbs'    => 'sometimes|integer|min:0',
            'fat'      => 'sometimes|integer|min:0',
            'category' => 'sometimes|in:breakfast,lunch,dinner,snack',
            'image'    => 'nullable|string',
        ]);

        $meal->update($data);

        return response()->json($this->format($meal->fresh()));
    }

    public function destroy(Request $request, Meal $meal)
    {
        abort_unless($meal->user_id === $request->user()->id, 403);

        $meal->delete();

        return response()->json(['success' => true]);
    }

    public function toggle(Request $request, Meal $meal)
    {
        abort_unless($meal->user_id === $request->user()->id, 403);

        $meal->update(['completed' => !$meal->completed]);

        return response()->json($this->format($meal));
    }

    private function format(Meal $meal): array
    {
        return [
            'id'        => (string) $meal->id,
            'name'      => $meal->name,
            'calories'  => $meal->calories,
            'protein'   => $meal->protein,
            'carbs'     => $meal->carbs,
            'fat'       => $meal->fat,
            'time'      => Carbon::parse($meal->logged_at)->format('g:i A'),
            'category'  => $meal->category,
            'image'     => $meal->image ?? '',
            'completed' => $meal->completed,
            'loggedAt'  => $meal->logged_at->toISOString(),
        ];
    }
}
