<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function login(string $email, string $password): array
    {
        $row = DB::selectOne(
            'SELECT id, password FROM users WHERE email = ?',
            [strtolower(trim($email))]
        );

        if (! $row || ! Hash::check($password, $row->password)) {
            throw ValidationException::withMessages(['email' => ['Invalid credentials.']]);
        }

        $user = User::find($row->id);
        $token = $user->createToken('api')->plainTextToken;

        return [
            'user' => $this->formatUser($row->id),
            'token' => $token,
        ];
    }

    public function register(array $validated): array
    {
        $role = $validated['role'] ?? 'member';

        if ($role === 'coach') {
            return $this->registerCoach($validated);
        }

        return $this->registerMember($validated);
    }

    private function registerMember(array $validated): array
    {
        $gender = $validated['gender'] ?? 'female';
        $defaultAvatar = $gender === 'male'
            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';

        $rows = DB::select(
            "INSERT INTO users
                (name, email, password, role, gender, avatar,
                 weight_current_kg, weight_target_kg, height_cm, age,
                 goal, activity_level,
                 calories_goal, protein_goal_g, carbs_goal_g, fats_goal_g, water_goal_ml,
                 medical_conditions, body_type,
                 created_at, updated_at)
             VALUES (?, ?, ?, 'member', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
             RETURNING id",
            [
                $validated['name'],
                strtolower(trim($validated['email'])),
                Hash::make($validated['password']),
                $gender,
                $defaultAvatar,
                $validated['weight_current_kg'] ?? null,
                $validated['weight_target_kg'] ?? null,
                $validated['height_cm'] ?? null,
                $validated['age'] ?? null,
                $validated['goal'] ?? 'wellness',
                $validated['activity_level'] ?? 'moderate',
                $validated['calories_goal'] ?? ($gender === 'male' ? 2400 : 2000),
                $validated['protein_goal_g'] ?? ($gender === 'male' ? 160 : 130),
                $validated['carbs_goal_g'] ?? ($gender === 'male' ? 260 : 200),
                $validated['fats_goal_g'] ?? ($gender === 'male' ? 75 : 65),
                $validated['water_goal_ml'] ?? ($gender === 'male' ? 3500 : 3000),
                $validated['medical_conditions'] ?? null,
                $validated['body_type'] ?? null,
            ]
        );

        $userId = $rows[0]->id;
        $user = User::find($userId);
        $token = $user->createToken('api')->plainTextToken;

        // NOTE: no auto coach assignment here anymore — members explicitly
        // choose their coach(es) via POST /coach-assignments (CoachService).

        return [
            'user' => $this->formatUser($userId),
            'token' => $token,
        ];
    }

    private function registerCoach(array $validated): array
    {
        $gender = $validated['gender'] ?? 'female';
        $defaultAvatar = $gender === 'male'
            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';

        $rows = DB::select(
            "INSERT INTO users
                (name, email, password, role, gender, avatar, coach_specialty, title,
                 created_at, updated_at)
             VALUES (?, ?, ?, 'coach', ?, ?, ?, ?, NOW(), NOW())
             RETURNING id",
            [
                $validated['name'],
                strtolower(trim($validated['email'])),
                Hash::make($validated['password']),
                $gender,
                $defaultAvatar,
                $validated['coach_specialty'],
                $validated['title'] ?? ucfirst($validated['coach_specialty']),
            ]
        );

        $userId = $rows[0]->id;
        $user = User::find($userId);
        $token = $user->createToken('api')->plainTextToken;

        return [
            'user' => $this->formatUser($userId),
            'token' => $token,
        ];
    }

    public function firebaseAuth(array $validated): array
    {
        $email = strtolower(trim($validated['email']));
        $gender = $validated['gender'] ?? 'female';

        $defaultAvatar = $gender === 'male'
            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';

        $existing = DB::selectOne('SELECT id FROM users WHERE email = ?', [$email]);

        if (! $existing) {
            $rows = DB::select(
                'INSERT INTO users
                    (name, email, password, role, gender, avatar,
                     weight_current_kg, weight_target_kg, height_cm, age,
                     goal, activity_level,
                     calories_goal, protein_goal_g, carbs_goal_g, fats_goal_g, water_goal_ml,
                     created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                 RETURNING id',
                [
                    $validated['name'] ?? explode('@', $email)[0],
                    $email,
                    Hash::make(Str::random(24)),
                    $validated['role'] ?? 'member',
                    $gender,
                    $validated['avatar'] ?? $defaultAvatar,
                    $validated['weight_current_kg'] ?? null,
                    $validated['weight_target_kg'] ?? null,
                    $validated['height_cm'] ?? null,
                    $validated['age'] ?? null,
                    $validated['goal'] ?? 'wellness',
                    $validated['activity_level'] ?? 'moderate',
                    $validated['calories_goal'] ?? ($gender === 'male' ? 2400 : 2000),
                    $validated['protein_goal_g'] ?? ($gender === 'male' ? 160 : 130),
                    $validated['carbs_goal_g'] ?? ($gender === 'male' ? 260 : 200),
                    $validated['fats_goal_g'] ?? ($gender === 'male' ? 75 : 65),
                    $validated['water_goal_ml'] ?? ($gender === 'male' ? 3500 : 3000),
                ]
            );

            $userId = $rows[0]->id;
            // No auto coach assignment — see registerMember() note above.
        } else {
            $userId = $existing->id;

            $updateData = array_filter($validated, fn ($v) => ! is_null($v) && $v !== '');
            unset($updateData['email']);

            if (! empty($updateData)) {
                $updateData['updated_at'] = now();
                DB::table('users')->where('id', $userId)->update($updateData);
            }
        }

        $user = User::find($userId);
        $token = $user->createToken('api')->plainTextToken;

        return [
            'user' => $this->formatUser($userId),
            'token' => $token,
        ];
    }

    public function formatUser(int $userId): array
    {
        $user = DB::selectOne('SELECT * FROM users WHERE id = ?', [$userId]);

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
            'weightCurrentKg' => $user->weight_current_kg ? (float) $user->weight_current_kg : null,
            'weightTargetKg' => $user->weight_target_kg ? (float) $user->weight_target_kg : null,
            'heightCm' => $user->height_cm ? (int) $user->height_cm : null,
            'age' => $user->age ? (int) $user->age : null,
            'caloriesGoal' => $user->calories_goal !== null ? (int) $user->calories_goal : null,
            'proteinGoalG' => $user->protein_goal_g !== null ? (int) $user->protein_goal_g : null,
            'carbsGoalG' => $user->carbs_goal_g !== null ? (int) $user->carbs_goal_g : null,
            'fatsGoalG' => $user->fats_goal_g !== null ? (int) $user->fats_goal_g : null,
            'waterGoalMl' => $user->water_goal_ml !== null ? (int) $user->water_goal_ml : null,
            'medicalConditions' => $user->medical_conditions,
            'bodyType' => $user->body_type,
        ];
    }
}
