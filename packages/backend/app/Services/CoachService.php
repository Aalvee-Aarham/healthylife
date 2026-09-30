<?php

namespace App\Services;

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
    }
}
