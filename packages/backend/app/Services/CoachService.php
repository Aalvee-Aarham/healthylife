<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class CoachService
{
    /**
     * GET /coaches?specialty=trainer|nutritionist
     */
    public function listCoaches(?string $specialty = null): array
    {
        $sql = "SELECT id, name, avatar, coach_specialty, title
                FROM users
                WHERE role = 'coach'";
        $bindings = [];

        if ($specialty) {
            $sql .= ' AND coach_specialty = ?';
            $bindings[] = $specialty;
        }

        $sql .= ' ORDER BY name';

        $rows = DB::select($sql, $bindings);

        return array_map(fn ($c) => [
            'id' => (string) $c->id,
            'name' => $c->name,
            'avatar' => $c->avatar,
            'coachSpecialty' => $c->coach_specialty,
            'title' => $c->title,
        ], $rows);
    }

    /**
     * POST /coach-assignments
     *
     * Replaces any existing assignment for this (member, specialty) pair
     * (delete-then-insert, respecting the unique(member_id, coach_id, specialty)
     * constraint) and starts/ensures a conversation with the newly chosen coach.
     */
    public function assignCoach(int $memberId, int $coachId, string $specialty): array
    {
        $coach = DB::selectOne(
            "SELECT id, name, avatar, coach_specialty, title FROM users WHERE id = ? AND role = 'coach'",
            [$coachId]
        );
        abort_unless($coach, 404, 'Coach not found');

        // Transaction: the new assignment and its conversation are saved together,
        // so a failure never leaves the member with their old coach deleted and no new one.
        $assignmentId = DB::transaction(function () use ($memberId, $coachId, $specialty, $coach) {
            // Procedure: sp_assign_coach swaps out the old assignment for this specialty.
            $assignmentId = DB::selectOne(
                'CALL sp_assign_coach(?, ?, ?, NULL)',
                [$memberId, $coachId, $specialty]
            )->p_assignment_id;

            $member = DB::selectOne('SELECT name FROM users WHERE id = ?', [$memberId]);

            $this->startConversation($memberId, $coachId, $member->name ?? 'there', $coach->coach_specialty);

            return $assignmentId;
        });

        return [
            'id' => (string) $assignmentId,
            'coach' => [
                'id' => (string) $coach->id,
                'name' => $coach->name,
                'avatar' => $coach->avatar,
                'coachSpecialty' => $coach->coach_specialty,
                'title' => $coach->title,
            ],
            'specialty' => $specialty,
        ];
    }

    /**
     * A member is a coach's client if they're assigned or have a conversation —
     * the same rule the coach's client list (ChatService::myCoaches) uses.
     */
    public function assertCoachOf(int $coachId, int $memberId): void
    {
        $linked = DB::selectOne(
            'SELECT 1 FROM coach_assignments WHERE coach_id = ? AND member_id = ?
             UNION
             SELECT 1 FROM conversations WHERE coach_id = ? AND member_id = ?',
            [$coachId, $memberId, $coachId, $memberId]
        );
        abort_unless($linked, 403, 'This member is not one of your clients.');
    }

    /**
     * GET /coach/clients/{member} — profile, goals, adherence, 7-day intake and notes.
     * Plans and workouts are added by the controller from their own services.
     */
    public function clientDetail(int $coachId, int $memberId): array
    {
        $this->assertCoachOf($coachId, $memberId);

        $u = DB::selectOne(
            'SELECT u.id, u.name, u.email, u.avatar, u.gender, u.age, u.height_cm, u.weight_current_kg, u.weight_target_kg,
                    u.goal, u.activity_level, u.body_type, u.medical_conditions,
                    u.calories_goal, u.protein_goal_g, u.carbs_goal_g, u.fats_goal_g, u.water_goal_ml,
                    a.planned_items, a.completed_items, a.adherence_pct, a.last_active_at
             FROM users u
             JOIN v_client_adherence a ON a.member_id = u.id
             WHERE u.id = ?',
            [$memberId]
        );
        abort_unless($u, 404);

        $assignment = DB::selectOne(
            'SELECT notes FROM coach_assignments WHERE coach_id = ? AND member_id = ?',
            [$coachId, $memberId]
        );

        // View: v_daily_intake, gap-filled so days with nothing logged show as zero.
        $intake = DB::select(
            'SELECT d::date AS day,
                    COALESCE(i.calories, 0) AS calories, COALESCE(i.protein, 0) AS protein,
                    COALESCE(i.carbs, 0) AS carbs, COALESCE(i.fat, 0) AS fat,
                    COALESCE(i.meal_count, 0) AS meal_count, COALESCE(i.water_ml, 0) AS water_ml
             FROM generate_series(CURRENT_DATE - 6, CURRENT_DATE, INTERVAL \'1 day\') d
             LEFT JOIN v_daily_intake i ON i.user_id = ? AND i.day = d::date
             ORDER BY day',
            [$memberId]
        );

        $int = fn ($v) => $v === null ? null : (int) $v;

        return [
            'id' => (string) $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'avatar' => $u->avatar,
            'gender' => $u->gender,
            'age' => $int($u->age),
            'heightCm' => $int($u->height_cm),
            'weightCurrentKg' => $u->weight_current_kg === null ? null : (float) $u->weight_current_kg,
            'weightTargetKg' => $u->weight_target_kg === null ? null : (float) $u->weight_target_kg,
            'goal' => $u->goal,
            'activityLevel' => $u->activity_level,
            'bodyType' => $u->body_type,
            'medicalConditions' => $u->medical_conditions,
            'goals' => [
                'calories' => $int($u->calories_goal),
                'protein' => $int($u->protein_goal_g),
                'carbs' => $int($u->carbs_goal_g),
                'fat' => $int($u->fats_goal_g),
                'waterMl' => $int($u->water_goal_ml),
            ],
            'plannedItems' => (int) $u->planned_items,
            'completedItems' => (int) $u->completed_items,
            'adherencePercent' => (int) $u->adherence_pct,
            'lastActive' => $u->last_active_at ? Carbon::parse($u->last_active_at)->diffForHumans() : 'Never',
            'assigned' => (bool) $assignment,
            'notes' => $assignment->notes ?? '',
            'intake' => array_map(fn ($d) => [
                'date' => $d->day,
                'calories' => (int) $d->calories,
                'protein' => (int) $d->protein,
                'carbs' => (int) $d->carbs,
                'fat' => (int) $d->fat,
                'mealCount' => (int) $d->meal_count,
                'waterMl' => (int) $d->water_ml,
            ], $intake),
        ];
    }

    /**
     * PATCH /coach/clients/{member}/notes — private coach notes live on the assignment row.
     */
    public function updateNotes(int $coachId, int $memberId, string $notes): array
    {
        $updated = DB::update(
            'UPDATE coach_assignments SET notes = ?, updated_at = NOW() WHERE coach_id = ? AND member_id = ?',
            [$notes, $coachId, $memberId]
        );
        abort_unless($updated > 0, 404, 'Notes need an assigned client.');

        return ['notes' => $notes];
    }

    public function removeAssignment(int $memberId, int $assignmentId): void
    {
        $existing = DB::selectOne('SELECT member_id FROM coach_assignments WHERE id = ?', [$assignmentId]);
        abort_unless($existing && (int) $existing->member_id === $memberId, 403);

        DB::statement('DELETE FROM coach_assignments WHERE id = ?', [$assignmentId]);
    }

    /**
     * Create (or reuse) a conversation between a member and coach and drop a
     * canned welcome message if the conversation is empty. This is the single
     * replacement for the old duplicated assignDefaultCoachConversations()/
     * ensureDefaultCoachConversations() methods — now triggered explicitly by
     * self-selection instead of auto-picking "first coach found".
     */
    public function startConversation(int $memberId, int $coachId, string $memberName, ?string $coachSpecialty): int
    {
        // Transaction: the upsert below row-locks the conversation until commit, so two
        // simultaneous calls can't both see 0 messages and post the welcome twice.
        return DB::transaction(function () use ($memberId, $coachId, $memberName, $coachSpecialty) {
            $convRows = DB::select(
                'INSERT INTO conversations (member_id, coach_id, created_at, updated_at)
                 VALUES (?, ?, NOW(), NOW())
                 ON CONFLICT (member_id, coach_id) DO UPDATE SET updated_at = conversations.updated_at
                 RETURNING id',
                [$memberId, $coachId]
            );
            $convId = $convRows[0]->id;

            $msgCount = DB::selectOne(
                'SELECT COUNT(*) AS cnt FROM chat_messages WHERE conversation_id = ?',
                [$convId]
            );

            if ((int) $msgCount->cnt === 0) {
                $body = $coachSpecialty === 'trainer'
                    ? "Hi {$memberName}! I'm your Fitness & Training Coach. Let me know your workout goals or any exercise questions!"
                    : "Welcome {$memberName}! I'm your Nutrition Coach. Feel free to share your meal logs, dietary goals, or macro questions anytime!";

                DB::statement(
                    'INSERT INTO chat_messages (conversation_id, sender_id, body, created_at, updated_at)
                     VALUES (?, ?, ?, NOW(), NOW())',
                    [$convId, $coachId, $body]
                );
            }

            return $convId;
        });
    }
}
