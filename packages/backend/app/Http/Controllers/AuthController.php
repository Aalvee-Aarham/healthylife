<?php

namespace App\Http\Controllers;

use App\Services\AuthService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService) {}

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        return response()->json($this->authService->login($request->email, $request->password));
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'nullable|string|in:member,coach',
            'coach_specialty' => 'required_if:role,coach|nullable|string|in:nutritionist,trainer,strength_conditioning,wellness,physiotherapist',
            'title' => 'nullable|string|max:255',
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
            'medical_conditions' => 'nullable|string',
            'body_type' => 'nullable|string|max:255',
        ]);

        return response()->json($this->authService->register($validated), 201);
    }

    public function firebaseAuth(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'name' => 'nullable|string|max:255',
            'avatar' => 'nullable|string',
            'role' => 'nullable|string|in:member,coach',
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

        return response()->json($this->authService->firebaseAuth($validated));
    }

    public function me(Request $request)
    {
        return response()->json($this->authService->formatUser($request->user()->id));
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }
}
