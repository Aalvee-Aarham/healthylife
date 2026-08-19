<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => $this->formatUser($user),
            'token' => $token,
        ]);
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'gender' => 'nullable|string|in:female,male,other',
            'weight_current_kg' => 'nullable|numeric',
            'weight_target_kg' => 'nullable|numeric',
            'height_cm' => 'nullable|integer',
            'age' => 'nullable|integer',
            'goal' => 'nullable|string',
            'activity_level' => 'nullable|string',
            'calories_goal' => 'nullable|integer',
            'protein_goal_g' => 'nullable|integer',
            'carbs_goal_g' => 'nullable|integer',
            'fats_goal_g' => 'nullable|integer',
            'water_goal_ml' => 'nullable|integer',
        ]);

        $gender = $validated['gender'] ?? 'female';
        $defaultAvatar = $gender === 'male'
            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'member',
            'gender' => $gender,
            'avatar' => $defaultAvatar,
            'weight_current_kg' => $validated['weight_current_kg'] ?? null,
            'weight_target_kg' => $validated['weight_target_kg'] ?? null,
            'height_cm' => $validated['height_cm'] ?? null,
            'age' => $validated['age'] ?? null,
            'goal' => $validated['goal'] ?? 'wellness',
            'activity_level' => $validated['activity_level'] ?? 'moderate',
            'calories_goal' => $validated['calories_goal'] ?? ($gender === 'male' ? 2400 : 2000),
            'protein_goal_g' => $validated['protein_goal_g'] ?? ($gender === 'male' ? 160 : 130),
            'carbs_goal_g' => $validated['carbs_goal_g'] ?? ($gender === 'male' ? 260 : 200),
            'fats_goal_g' => $validated['fats_goal_g'] ?? ($gender === 'male' ? 75 : 65),
            'water_goal_ml' => $validated['water_goal_ml'] ?? ($gender === 'male' ? 3500 : 3000),
        ]);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => $this->formatUser($user),
            'token' => $token,
        ], 201);
    }

    public function me(Request $request)
    {
        return response()->json($this->formatUser($request->user()));
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar,
            'role' => $user->role,
            'gender' => $user->gender ?? 'female',
            'goal' => $user->goal,
            'activityLevel' => $user->activity_level,
            'coachSpecialty' => $user->coach_specialty,
            'title' => $user->title,
            'weightCurrentKg' => $user->weight_current_kg,
            'weightTargetKg' => $user->weight_target_kg,
            'heightCm' => $user->height_cm,
            'age' => $user->age,
            'caloriesGoal' => $user->calories_goal,
            'proteinGoalG' => $user->protein_goal_g,
            'carbsGoalG' => $user->carbs_goal_g,
            'fatsGoalG' => $user->fats_goal_g,
            'waterGoalMl' => $user->water_goal_ml,
        ];
    }
}
