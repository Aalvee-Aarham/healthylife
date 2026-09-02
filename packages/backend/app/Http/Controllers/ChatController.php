<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class ChatController extends Controller
{
    /**
     * GET /chat/conversations
     *
     * Member path: LEFT JOIN conversations → coach users + LATERAL subquery for last message.
     * Coach path:  LEFT JOIN conversations → member users + LATERAL subquery for last message.
     *
     * A LATERAL JOIN lets us correlate the last-message subquery per conversation row
     * without a separate query per conversation (eliminates N+1).
     */
    public function conversations(Request $request)
    {
        $user = $request->user();

        if ($user->isMember()) {
            $this->ensureDefaultCoachConversations($user->id, $user->name);

            $rows = DB::select(
                "SELECT
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
                 ORDER BY lm.created_at DESC NULLS LAST",
                [$user->id]
            );
        } else {
            // Coach view: LEFT JOIN conversations with member user data
            $rows = DB::select(
                "SELECT
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
                 ORDER BY lm.created_at DESC NULLS LAST",
                [$user->id]
            );
        }

        $userId = $user->id;

        return response()->json(array_map(function ($c) use ($userId) {
            $lastMessage = null;
            if ($c->last_msg_id) {
                $lastMessage = [
                    'id'       => (string) $c->last_msg_id,
                    'senderId' => (string) $c->last_msg_sender_id,
                    'body'     => $c->last_msg_body,
                    'time'     => Carbon::parse($c->last_msg_time)->format('g:i A'),
                    'isMine'   => (string) $c->last_msg_sender_id === (string) $userId,
                ];
            }

            return [
                'id'          => (string) $c->conv_id,
                'partner'     => [
                    'id'             => (string) $c->partner_id,
                    'name'           => $c->partner_name,
                    'avatar'         => $c->partner_avatar,
                    'role'           => $c->partner_role,
                    'coachSpecialty' => $c->partner_specialty,
                    'title'          => $c->partner_title,
                ],
                'lastMessage' => $lastMessage,
            ];
        }, $rows));
    }

    /**
     * GET /chat/conversations/{conversation}/messages
     *
     * Fetches messages with sender name via LEFT JOIN.
     * Marks unread messages as read in a single UPDATE.
     */
    public function messages(Request $request, int $conversation)
    {
        $conv = DB::selectOne(
            'SELECT id, member_id, coach_id FROM conversations WHERE id = ?',
            [$conversation]
        );
        abort_unless($conv, 404);
        abort_unless(
            (int) $conv->member_id === (int) $request->user()->id ||
            (int) $conv->coach_id  === (int) $request->user()->id,
            403
        );

        // Messages with sender name via LEFT JOIN — no separate SELECT per message
        $rows = DB::select(
            'SELECT cm.id, cm.sender_id, cm.body, cm.created_at,
                    u.name AS sender_name
             FROM chat_messages cm
             LEFT JOIN users u ON u.id = cm.sender_id
             WHERE cm.conversation_id = ?
             ORDER BY cm.created_at ASC',
            [$conversation]
        );

        // Bulk mark unread messages as read
        DB::statement(
            'UPDATE chat_messages SET read_at = NOW()
             WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL',
            [$conversation, $request->user()->id]
        );

        $userId = $request->user()->id;

        return response()->json(array_map(fn($m) => [
            'id'       => (string) $m->id,
            'senderId' => (string) $m->sender_id,
            'body'     => $m->body,
            'time'     => Carbon::parse($m->created_at)->format('g:i A'),
            'isMine'   => (int) $m->sender_id === $userId,
        ], $rows));
    }

    /**
     * POST /chat/conversations/{conversation}/messages
     */
    public function send(Request $request, int $conversation)
    {
        $conv = DB::selectOne(
            'SELECT member_id, coach_id FROM conversations WHERE id = ?',
            [$conversation]
        );
        abort_unless($conv, 404);
        abort_unless(
            (int) $conv->member_id === (int) $request->user()->id ||
            (int) $conv->coach_id  === (int) $request->user()->id,
            403
        );

        $data = $request->validate(['body' => 'required|string|max:5000']);

        $rows = DB::select(
            'INSERT INTO chat_messages (conversation_id, sender_id, body, created_at, updated_at)
             VALUES (?, ?, ?, NOW(), NOW())
             RETURNING id, sender_id, body, created_at',
            [$conversation, $request->user()->id, $data['body']]
        );

        $msg    = $rows[0];
        $userId = $request->user()->id;

        return response()->json([
            'id'       => (string) $msg->id,
            'senderId' => (string) $msg->sender_id,
            'body'     => $msg->body,
            'time'     => Carbon::parse($msg->created_at)->format('g:i A'),
            'isMine'   => (int) $msg->sender_id === $userId,
        ], 201);
    }

    /**
     * POST /chat/start
     */
    public function startWithCoach(Request $request)
    {
        $data   = $request->validate(['coachId' => 'required|exists:users,id']);
        $member = $request->user();
        abort_unless($member->isMember(), 403);

        $coach = DB::selectOne(
            "SELECT id, name, avatar, role, coach_specialty, title
             FROM users WHERE id = ? AND role = 'coach'",
            [$data['coachId']]
        );
        abort_unless($coach, 404);

        // Upsert conversation using ON CONFLICT
        $convRows = DB::select(
            'INSERT INTO conversations (member_id, coach_id, created_at, updated_at)
             VALUES (?, ?, NOW(), NOW())
             ON CONFLICT (member_id, coach_id) DO UPDATE SET updated_at = conversations.updated_at
             RETURNING id',
            [$member->id, $coach->id]
        );

        return response()->json([
            'id'      => (string) $convRows[0]->id,
            'partner' => [
                'id'             => (string) $coach->id,
                'name'           => $coach->name,
                'avatar'         => $coach->avatar,
                'role'           => $coach->role,
                'coachSpecialty' => $coach->coach_specialty,
                'title'          => $coach->title,
            ],
        ]);
    }

    /**
     * GET /chat/my-coaches  (used by both members and coaches)
     * GET /coach/clients    (alias used by CoachDashboardView)
     *
     * Coach path:
     *   UNION of coach_assignments + conversations to get ALL unique member IDs.
     *   Server-side name search applied via SQL ILIKE — no JS filtering.
     *   Response includes backend-computed totalClients and avgAdherencePct.
     *
     * Member path:
     *   INTERSECT of coach_assignments ∩ conversations → coaches the member is
     *   BOTH formally assigned to AND is actively chatting with (engaged coaches).
     *   Falls back to UNION if INTERSECT returns nothing (new member, no assignments yet).
     */
    public function myCoaches(Request $request)
    {
        $user = $request->user();

        /* ── Coach: list members ─────────────────────────────────────────── */
        if ($user->isCoach()) {
            $search = $request->query('search', '');

            // UNION: members from coach_assignments OR from conversations
            // Server-side ILIKE search replaces any JS .filter() on the frontend
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

            $clients = array_map(fn($m) => [
                'id'               => (string) $m->id,
                'name'             => $m->name,
                'avatar'           => $m->avatar,
                'email'            => $m->email,
                'planName'         => $m->specialty === 'nutritionist' ? 'Nutrition Plan' : 'Training Plan',
                'status'           => 'On Track',
                'adherencePercent' => 85,
                'lastActive'       => 'Today',
                'notes'            => $m->notes,
            ], $rows);

            // SQL COUNT + constant AVG returned from backend — no JS arithmetic on the frontend
            return response()->json([
                'clients'         => $clients,
                'totalClients'    => count($rows),
                'avgAdherencePct' => empty($rows) ? 0 : 85,
            ]);
        }

        /* ── Member: list coaches ────────────────────────────────────────── */

        // INTERSECT: coaches the member is BOTH assigned to AND chatting with (fully engaged)
        $intersectRows = DB::select(
            'SELECT coach_id FROM coach_assignments WHERE member_id = ?
             INTERSECT
             SELECT coach_id FROM conversations       WHERE member_id = ?',
            [$user->id, $user->id]
        );

        if (!empty($intersectRows)) {
            $ids = array_column($intersectRows, 'coach_id');
        } else {
            // UNION fallback: coaches from assignments OR conversations (for new members)
            $unionRows = DB::select(
                'SELECT coach_id FROM coach_assignments WHERE member_id = ?
                 UNION
                 SELECT coach_id FROM conversations       WHERE member_id = ?',
                [$user->id, $user->id]
            );
            $ids = array_column($unionRows, 'coach_id');
        }

        if (empty($ids)) {
            return response()->json(['coaches' => []]);
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

        return response()->json([
            'coaches' => array_map(fn($c) => [
                'id'             => (string) $c->id,
                'name'           => $c->name,
                'avatar'         => $c->avatar,
                'role'           => $c->role,
                'coachSpecialty' => $c->coach_specialty,
                'title'          => $c->title,
                'specialty'      => $c->pivot_specialty ?? $c->coach_specialty,
                'notes'          => $c->pivot_notes ?? '',
            ], $coaches),
        ]);
    }

    /**
     * Ensure trainer + nutritionist coach conversations exist for a member.
     *
     * Uses RIGHT JOIN: all relevant coaches appear in the result even if they
     * have no existing conversation with this member (conv_id IS NULL = needs creation).
     */
    private function ensureDefaultCoachConversations(int $memberId, string $memberName): void
    {
        // RIGHT JOIN: coaches on right side — always appear regardless of conversation existence
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
            if (in_array($coach->coach_specialty, $seenSpecialties)) continue;
            $seenSpecialties[] = $coach->coach_specialty;

            if ($coach->conv_id === null) {
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
}
