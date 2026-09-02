<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        // Raw SQL: look up user by email
        $row = DB::selectOne(
            'SELECT id, password FROM users WHERE email = ?',
            [strtolower(trim($request->email))]
        );

        if (!$row || !Hash::check($request->password, $row->password)) {
            throw ValidationException::withMessages(['email' => ['Invalid credentials.']]);
        }

        // User model hydrated ONLY for Sanctum token creation — not for ORM queries
        $user  = User::find($row->id);
        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user'  => $this->formatUser($row->id),
            'token' => $token,
        ]);
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'              => 'required|string|max:255',
            'email'             => 'required|string|email|max:255|unique:users',
            'password'          => 'required|string|min:6',
            'gender'            => 'nullable|string|in:female,male,other',
            'weight_current_kg' => 'nullable|numeric',
            'weight_target_kg'  => 'nullable|numeric',
            'height_cm'         => 'nullable|integer',
            'age'               => 'nullable|integer',
            'goal'              => 'nullable|string',
            'activity_level'    => 'nullable|string',
            'calories_goal'     => 'nullable|integer',
            'protein_goal_g'    => 'nullable|integer',
            'carbs_goal_g'      => 'nullable|integer',
            'fats_goal_g'       => 'nullable|integer',
            'water_goal_ml'     => 'nullable|integer',
        ]);

        $gender        = $validated['gender'] ?? 'female';
        $defaultAvatar = $gender === 'male'
            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';

        // Raw SQL INSERT with RETURNING to get the new user ID immediately
        $rows = DB::select(
            "INSERT INTO users
                (name, email, password, role, gender, avatar,
                 weight_current_kg, weight_target_kg, height_cm, age,
                 goal, activity_level,
                 calories_goal, protein_goal_g, carbs_goal_g, fats_goal_g, water_goal_ml,
                 created_at, updated_at)
             VALUES (?, ?, ?, 'member', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
             RETURNING id",
            [
                $validated['name'],
                strtolower(trim($validated['email'])),
                Hash::make($validated['password']),
                $gender,
                $defaultAvatar,
                $validated['weight_current_kg'] ?? null,
                $validated['weight_target_kg']  ?? null,
                $validated['height_cm']         ?? null,
                $validated['age']               ?? null,
                $validated['goal']              ?? 'wellness',
                $validated['activity_level']    ?? 'moderate',
                $validated['calories_goal']     ?? ($gender === 'male' ? 2400 : 2000),
                $validated['protein_goal_g']    ?? ($gender === 'male' ? 160  : 130),
                $validated['carbs_goal_g']      ?? ($gender === 'male' ? 260  : 200),
                $validated['fats_goal_g']       ?? ($gender === 'male' ? 75   : 65),
                $validated['water_goal_ml']     ?? ($gender === 'male' ? 3500 : 3000),
            ]
        );

        $userId = $rows[0]->id;
        $user   = User::find($userId); // needed only for Sanctum
        $token  = $user->createToken('api')->plainTextToken;

        // Auto-assign default coach conversations using raw SQL with RIGHT JOIN
        $this->assignDefaultCoachConversations($userId, $validated['name']);

        return response()->json([
            'user'  => $this->formatUser($userId),
            'token' => $token,
        ], 201);
    }

    public function firebaseAuth(Request $request)
    {
        $validated = $request->validate([
            'email'             => 'required|email',
            'name'              => 'nullable|string|max:255',
            'avatar'            => 'nullable|string',
            'role'              => 'nullable|string|in:member,coach',
            'gender'            => 'nullable|string|in:female,male,other',
            'weight_current_kg' => 'nullable|numeric',
            'weight_target_kg'  => 'nullable|numeric',
            'height_cm'         => 'nullable|integer',
            'age'               => 'nullable|integer',
            'goal'              => 'nullable|string',
            'activity_level'    => 'nullable|string',
            'calories_goal'     => 'nullable|integer',
            'protein_goal_g'    => 'nullable|integer',
            'carbs_goal_g'      => 'nullable|integer',
            'fats_goal_g'       => 'nullable|integer',
            'water_goal_ml'     => 'nullable|integer',
        ]);

        $email  = strtolower(trim($validated['email']));
        $gender = $validated['gender'] ?? 'female';

        $defaultAvatar = $gender === 'male'
            ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';

        // Raw SQL lookup
        $existing = DB::selectOne('SELECT id FROM users WHERE email = ?', [$email]);

        if (!$existing) {
            // New user — raw SQL INSERT RETURNING
            $rows = DB::select(
                "INSERT INTO users
                    (name, email, password, role, gender, avatar,
                     weight_current_kg, weight_target_kg, height_cm, age,
                     goal, activity_level,
                     calories_goal, protein_goal_g, carbs_goal_g, fats_goal_g, water_goal_ml,
                     created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                 RETURNING id",
                [
                    $validated['name'] ?? explode('@', $email)[0],
                    $email,
                    Hash::make(Str::random(24)),
                    $validated['role'] ?? 'member',
                    $gender,
                    $validated['avatar'] ?? $defaultAvatar,
                    $validated['weight_current_kg'] ?? null,
                    $validated['weight_target_kg']  ?? null,
                    $validated['height_cm']         ?? null,
                    $validated['age']               ?? null,
                    $validated['goal']              ?? 'wellness',
                    $validated['activity_level']    ?? 'moderate',
                    $validated['calories_goal']     ?? ($gender === 'male' ? 2400 : 2000),
                    $validated['protein_goal_g']    ?? ($gender === 'male' ? 160  : 130),
                    $validated['carbs_goal_g']      ?? ($gender === 'male' ? 260  : 200),
                    $validated['fats_goal_g']       ?? ($gender === 'male' ? 75   : 65),
                    $validated['water_goal_ml']     ?? ($gender === 'male' ? 3500 : 3000),
                ]
            );

            $userId = $rows[0]->id;
            $this->assignDefaultCoachConversations(
                $userId,
                $validated['name'] ?? explode('@', $email)[0]
            );
        } else {
            $userId = $existing->id;

            // Build UPDATE dynamically for only the provided fields
            $updates  = [];
            $bindings = [];

            if (!empty($validated['name']))               { $updates[] = 'name = ?';               $bindings[] = $validated['name']; }
            if (!empty($validated['avatar']))              { $updates[] = "avatar = COALESCE(NULLIF(avatar,''), ?)"; $bindings[] = $validated['avatar']; }
            if (isset($validated['weight_current_kg']))    { $updates[] = 'weight_current_kg = ?';  $bindings[] = $validated['weight_current_kg']; }
            if (isset($validated['weight_target_kg']))     { $updates[] = 'weight_target_kg = ?';   $bindings[] = $validated['weight_target_kg']; }
            if (isset($validated['height_cm']))            { $updates[] = 'height_cm = ?';          $bindings[] = $validated['height_cm']; }
            if (isset($validated['age']))                  { $updates[] = 'age = ?';                $bindings[] = $validated['age']; }
            if (isset($validated['goal']))                 { $updates[] = 'goal = ?';               $bindings[] = $validated['goal']; }
            if (isset($validated['activity_level']))       { $updates[] = 'activity_level = ?';     $bindings[] = $validated['activity_level']; }
            if (isset($validated['calories_goal']))        { $updates[] = 'calories_goal = ?';      $bindings[] = $validated['calories_goal']; }
            if (isset($validated['protein_goal_g']))       { $updates[] = 'protein_goal_g = ?';     $bindings[] = $validated['protein_goal_g']; }
            if (isset($validated['carbs_goal_g']))         { $updates[] = 'carbs_goal_g = ?';       $bindings[] = $validated['carbs_goal_g']; }
            if (isset($validated['fats_goal_g']))          { $updates[] = 'fats_goal_g = ?';        $bindings[] = $validated['fats_goal_g']; }
            if (isset($validated['water_goal_ml']))        { $updates[] = 'water_goal_ml = ?';      $bindings[] = $validated['water_goal_ml']; }

            if (!empty($updates)) {
                $updates[]  = 'updated_at = NOW()';
                $bindings[] = $userId;
                DB::statement('UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = ?', $bindings);
            }
        }

        $user  = User::find($userId); // needed only for Sanctum
        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user'  => $this->formatUser($userId),
            'token' => $token,
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($this->formatUser($request->user()->id));
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    /**
     * Assign default trainer + nutritionist coach conversations for a new member.
     *
     * Uses RIGHT JOIN so all matching coaches appear even if they have no existing
     * conversation with this member yet (conv_id IS NULL = needs a new conversation).
     */
    private function assignDefaultCoachConversations(int $memberId, string $memberName): void
    {
        // RIGHT JOIN: all trainer/nutritionist coaches + their conversation with this member (if any)
        // Coaches with conv_id = NULL don't yet have a conversation — we create one.
        $coaches = DB::select(
            "SELECT u.id, u.name, u.coach_specialty, conv.id AS conv_id
             FROM conversations conv
             RIGHT JOIN users u ON u.id = conv.coach_id AND conv.member_id = ?
             WHERE u.role = 'coach' AND u.coach_specialty IN ('trainer', 'nutritionist')
             ORDER BY u.coach_specialty ASC",
            [$memberId]
        );

        $seenSpecialties = [];

        foreach ($coaches as $coach) {
            if (in_array($coach->coach_specialty, $seenSpecialties)) {
                continue; // one coach per specialty
            }
            $seenSpecialties[] = $coach->coach_specialty;

            if ($coach->conv_id === null) {
                // Create conversation — ON CONFLICT handles any race conditions
                $convRows = DB::select(
                    'INSERT INTO conversations (member_id, coach_id, created_at, updated_at)
                     VALUES (?, ?, NOW(), NOW())
                     ON CONFLICT (member_id, coach_id) DO UPDATE SET updated_at = conversations.updated_at
                     RETURNING id',
                    [$memberId, $coach->id]
                );
                $convId = $convRows[0]->id;
            } else {
                $convId = $coach->conv_id;
            }

            // Add welcome message only if conversation is empty
            $msgCount = DB::selectOne(
                'SELECT COUNT(*) AS cnt FROM chat_messages WHERE conversation_id = ?',
                [$convId]
            );

            if ((int) $msgCount->cnt === 0) {
                $body = $coach->coach_specialty === 'trainer'
                    ? "Hi {$memberName}! I'm your Fitness & Training Coach. Let me know your workout goals or any exercise questions!"
                    : "Welcome {$memberName}! I'm your Nutrition Coach. Feel free to share your meal logs, dietary goals, or macro questions anytime!";

                DB::statement(
                    'INSERT INTO chat_messages (conversation_id, sender_id, body, created_at, updated_at)
                     VALUES (?, ?, ?, NOW(), NOW())',
                    [$convId, $coach->id, $body]
                );
            }
        }
    }

    /**
     * Format user data from the database using a raw SQL SELECT.
     */
    private function formatUser(int $userId): array
    {
        $user = DB::selectOne('SELECT * FROM users WHERE id = ?', [$userId]);

        return [
            'id'              => (string) $user->id,
            'name'            => $user->name,
            'email'           => $user->email,
            'avatar'          => $user->avatar,
            'role'            => $user->role,
            'gender'          => $user->gender ?? 'female',
            'goal'            => $user->goal,
            'activityLevel'   => $user->activity_level,
            'coachSpecialty'  => $user->coach_specialty,
            'title'           => $user->title,
            'weightCurrentKg' => $user->weight_current_kg ? (float) $user->weight_current_kg : null,
            'weightTargetKg'  => $user->weight_target_kg  ? (float) $user->weight_target_kg  : null,
            'heightCm'        => $user->height_cm          ? (int)   $user->height_cm          : null,
            'age'             => $user->age                ? (int)   $user->age                : null,
            'caloriesGoal'    => (int) $user->calories_goal,
            'proteinGoalG'    => (int) $user->protein_goal_g,
            'carbsGoalG'      => (int) $user->carbs_goal_g,
            'fatsGoalG'       => (int) $user->fats_goal_g,
            'waterGoalMl'     => (int) $user->water_goal_ml,
        ];
    }
}
