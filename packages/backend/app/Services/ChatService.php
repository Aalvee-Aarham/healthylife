<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ChatService
{
    public function __construct(private readonly CoachService $coachService) {}

    /**
     * GET /chat/conversations
     */
    public function conversations(User $user): array
    {
        if ($user->isMember()) {
            $rows = DB::select(
                'SELECT
                    c.id                  AS conv_id,
                    coach.id              AS partner_id,
                    coach.name            AS partner_name,
                    coach.avatar          AS partner_avatar,
                    coach.role            AS partner_role,
                    coach.coach_specialty AS partner_specialty,
                    coach.title           AS partner_title,
                    lm.id                 AS last_msg_id,
                    lm.body               AS last_msg_body,
                    lm.sender_id          AS last_msg_sender_id,
                    lm.created_at         AS last_msg_time
                 FROM conversations c
                 LEFT JOIN users coach ON coach.id = c.coach_id
                 LEFT JOIN LATERAL (
                     SELECT id, body, sender_id, created_at
                     FROM chat_messages
                     WHERE conversation_id = c.id
                     ORDER BY created_at DESC
                     LIMIT 1
                 ) lm ON true
                 WHERE c.member_id = ?
                 ORDER BY lm.created_at DESC NULLS LAST',
                [$user->id]
            );
        } else {
            $rows = DB::select(
                'SELECT
                    c.id          AS conv_id,
                    m.id          AS partner_id,
                    m.name        AS partner_name,
                    m.avatar      AS partner_avatar,
                    m.role        AS partner_role,
                    NULL          AS partner_specialty,
                    NULL          AS partner_title,
                    lm.id         AS last_msg_id,
                    lm.body       AS last_msg_body,
                    lm.sender_id  AS last_msg_sender_id,
                    lm.created_at AS last_msg_time
                 FROM conversations c
                 LEFT JOIN users m ON m.id = c.member_id
                 LEFT JOIN LATERAL (
                     SELECT id, body, sender_id, created_at
                     FROM chat_messages
                     WHERE conversation_id = c.id
                     ORDER BY created_at DESC
                     LIMIT 1
                 ) lm ON true
                 WHERE c.coach_id = ?
                 ORDER BY lm.created_at DESC NULLS LAST',
                [$user->id]
            );
        }

        $userId = $user->id;

        return array_map(function ($c) use ($userId) {
            $lastMessage = null;
            if ($c->last_msg_id) {
                $lastMessage = [
                    'id' => (string) $c->last_msg_id,
                    'senderId' => (string) $c->last_msg_sender_id,
                    'body' => $c->last_msg_body,
                    'time' => Carbon::parse($c->last_msg_time)->format('g:i A'),
                    'isMine' => (string) $c->last_msg_sender_id === (string) $userId,
                ];
            }

            return [
                'id' => (string) $c->conv_id,
                'partner' => [
                    'id' => (string) $c->partner_id,
                    'name' => $c->partner_name,
                    'avatar' => $c->partner_avatar,
                    'role' => $c->partner_role,
                    'coachSpecialty' => $c->partner_specialty,
                    'title' => $c->partner_title,
                ],
                'lastMessage' => $lastMessage,
            ];
        }, $rows);
    }

    public function messages(User $user, int $conversationId): array
    {
        $conv = DB::selectOne(
            'SELECT id, member_id, coach_id FROM conversations WHERE id = ?',
            [$conversationId]
        );
        abort_unless($conv, 404);
        abort_unless(
            (int) $conv->member_id === (int) $user->id ||
            (int) $conv->coach_id === (int) $user->id,
            403
        );

        $rows = DB::select(
            'SELECT cm.id, cm.sender_id, cm.body, cm.created_at,
                    u.name AS sender_name
             FROM chat_messages cm
             LEFT JOIN users u ON u.id = cm.sender_id
             WHERE cm.conversation_id = ?
             ORDER BY cm.created_at ASC',
            [$conversationId]
        );

        DB::statement(
            'UPDATE chat_messages SET read_at = NOW()
             WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL',
            [$conversationId, $user->id]
        );

        $userId = $user->id;

        return array_map(fn ($m) => [
            'id' => (string) $m->id,
            'senderId' => (string) $m->sender_id,
            'body' => $m->body,
            'time' => Carbon::parse($m->created_at)->format('g:i A'),
            'isMine' => (int) $m->sender_id === $userId,
        ], $rows);
    }

    public function send(User $user, int $conversationId, string $body): array
    {
        $conv = DB::selectOne(
            'SELECT member_id, coach_id FROM conversations WHERE id = ?',
            [$conversationId]
        );
        abort_unless($conv, 404);
        abort_unless(
            (int) $conv->member_id === (int) $user->id ||
            (int) $conv->coach_id === (int) $user->id,
            403
        );

        $rows = DB::select(
            'INSERT INTO chat_messages (conversation_id, sender_id, body, created_at, updated_at)
             VALUES (?, ?, ?, NOW(), NOW())
             RETURNING id, sender_id, body, created_at',
            [$conversationId, $user->id, $body]
        );

        $msg = $rows[0];
        $userId = $user->id;

        return [
            'id' => (string) $msg->id,
            'senderId' => (string) $msg->sender_id,
            'body' => $msg->body,
            'time' => Carbon::parse($msg->created_at)->format('g:i A'),
            'isMine' => (int) $msg->sender_id === $userId,
        ];
    }

    public function startWithCoach(User $member, int $coachId): array
    {
        abort_unless($member->isMember(), 403);

        $coach = DB::selectOne(
            "SELECT id, name, avatar, role, coach_specialty, title
             FROM users WHERE id = ? AND role = 'coach'",
            [$coachId]
        );
        abort_unless($coach, 404);

        $convId = $this->coachService->startConversation($member->id, $coach->id, $member->name, $coach->coach_specialty);

        return [
            'id' => (string) $convId,
            'partner' => [
                'id' => (string) $coach->id,
                'name' => $coach->name,
                'avatar' => $coach->avatar,
                'role' => $coach->role,
                'coachSpecialty' => $coach->coach_specialty,
                'title' => $coach->title,
            ],
        ];
    }

    /**
     * GET /chat/my-coaches (and /coach/clients).
     *
     * Coach path: UNION of coach_assignments + conversations for member IDs,
     * with real assignment specialty/notes (no more stub adherence/status).
     * Member path: INTERSECT/UNION of coach_assignments + conversations, same as before,
     * now reading real assignment rows written by CoachService::assignCoach().
     */
    public function myCoaches(User $user, string $search = ''): array
    {
        if ($user->isCoach()) {
            $rows = DB::select(
                "SELECT DISTINCT u.id, u.name, u.avatar, u.email,
                        COALESCE(ca.specialty, ?) AS specialty,
                        COALESCE(ca.notes, '')     AS notes
                 FROM users u
                 LEFT JOIN coach_assignments ca ON ca.member_id = u.id AND ca.coach_id = ?
                 WHERE u.id IN (
                     SELECT member_id FROM coach_assignments WHERE coach_id = ?
                     UNION
                     SELECT member_id FROM conversations       WHERE coach_id = ?
                 )
                 AND u.role = 'member'
                 AND (? = '' OR LOWER(u.name) LIKE LOWER(CONCAT('%', ?, '%')))
                 ORDER BY u.name",
                [$user->coach_specialty ?? 'trainer', $user->id, $user->id, $user->id, $search, $search]
            );

            $clients = array_map(fn ($m) => [
                'id' => (string) $m->id,
                'name' => $m->name,
                'avatar' => $m->avatar,
                'email' => $m->email,
                'planName' => $m->specialty === 'nutritionist' ? 'Nutrition Plan' : 'Training Plan',
                // status/adherence remain a lightweight stub for now — real plan-completion
                // aggregates can replace these once plan_completions has enough data.
                'status' => 'On Track',
                'adherencePercent' => 85,
                'lastActive' => 'Today',
                'notes' => $m->notes,
            ], $rows);

            return [
                'clients' => $clients,
                'totalClients' => count($rows),
                'avgAdherencePct' => empty($rows) ? 0 : 85,
            ];
        }

        $intersectRows = DB::select(
            'SELECT coach_id FROM coach_assignments WHERE member_id = ?
             INTERSECT
             SELECT coach_id FROM conversations       WHERE member_id = ?',
            [$user->id, $user->id]
        );

        if (! empty($intersectRows)) {
            $ids = array_column($intersectRows, 'coach_id');
        } else {
            $unionRows = DB::select(
                'SELECT coach_id FROM coach_assignments WHERE member_id = ?
                 UNION
                 SELECT coach_id FROM conversations       WHERE member_id = ?',
                [$user->id, $user->id]
            );
            $ids = array_column($unionRows, 'coach_id');
        }

        if (empty($ids)) {
            return ['coaches' => []];
        }

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $coaches = DB::select(
            "SELECT u.id, u.name, u.avatar, u.role, u.coach_specialty, u.title,
                    ca.specialty AS pivot_specialty, ca.notes AS pivot_notes
             FROM users u
             LEFT JOIN coach_assignments ca ON ca.coach_id = u.id AND ca.member_id = ?
             WHERE u.id IN ($placeholders) AND u.role = 'coach'
             ORDER BY u.name",
            array_merge([$user->id], $ids)
        );

        return [
            'coaches' => array_map(fn ($c) => [
                'id' => (string) $c->id,
                'name' => $c->name,
                'avatar' => $c->avatar,
                'role' => $c->role,
                'coachSpecialty' => $c->coach_specialty,
                'title' => $c->title,
                'specialty' => $c->pivot_specialty ?? $c->coach_specialty,
                'notes' => $c->pivot_notes ?? '',
            ], $coaches),
        ];
    }
}
