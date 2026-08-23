<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ChatController extends Controller
{
    public function conversations(Request $request)
    {
        $user = $request->user();

        if ($user->isMember()) {
            $this->ensureDefaultCoachConversations($user);

            $conversations = Conversation::where('member_id', $user->id)
                ->with(['coach', 'messages' => fn ($q) => $q->latest()->limit(1)])
                ->get();
        } else {
            $conversations = Conversation::where('coach_id', $user->id)
                ->with(['member', 'messages' => fn ($q) => $q->latest()->limit(1)])
                ->get();
        }

        return response()->json($conversations->map(fn (Conversation $c) => [
            'id' => (string) $c->id,
            'partner' => $user->isMember()
                ? $this->formatPartner($c->coach)
                : $this->formatPartner($c->member),
            'lastMessage' => $c->messages->first()
                ? $this->formatMessage($c->messages->first(), $user)
                : null,
        ]));
    }

    private function ensureDefaultCoachConversations(User $member): void
    {
        // 1. Trainer Coach
        $trainer = User::where('coach_specialty', 'trainer')->first();
        if (!$trainer) {
            $trainer = User::where('role', 'coach')->first();
        }
        if ($trainer) {
            $convTrainer = Conversation::firstOrCreate([
                'member_id' => $member->id,
                'coach_id' => $trainer->id,
            ]);

            if ($convTrainer->messages()->count() === 0) {
                ChatMessage::create([
                    'conversation_id' => $convTrainer->id,
                    'sender_id' => $trainer->id,
                    'body' => "Hi {$member->name}! I'm your Fitness & Training Coach. Let me know your workout goals or any exercise questions!",
                ]);
            }
        }

        // 2. Nutritionist Coach
        $nutritionist = User::where('coach_specialty', 'nutritionist')->first();
        if ($nutritionist && (!$trainer || $nutritionist->id !== $trainer->id)) {
            $convNutri = Conversation::firstOrCreate([
                'member_id' => $member->id,
                'coach_id' => $nutritionist->id,
            ]);

            if ($convNutri->messages()->count() === 0) {
                ChatMessage::create([
                    'conversation_id' => $convNutri->id,
                    'sender_id' => $nutritionist->id,
                    'body' => "Welcome {$member->name}! I'm your Nutrition Coach. Feel free to share your meal logs, dietary goals, or macro questions anytime!",
                ]);
            }
        }
    }

    public function messages(Request $request, Conversation $conversation)
    {
        $this->authorizeConversation($request->user(), $conversation);

        $messages = $conversation->messages()
            ->with('sender')
            ->orderBy('created_at')
            ->get()
            ->map(fn (ChatMessage $m) => $this->formatMessage($m, $request->user()));

        ChatMessage::where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json($messages);
    }

    public function send(Request $request, Conversation $conversation)
    {
        $this->authorizeConversation($request->user(), $conversation);

        $data = $request->validate(['body' => 'required|string|max:5000']);

        $message = ChatMessage::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $request->user()->id,
            'body' => $data['body'],
        ]);

        $message->load('sender');

        return response()->json($this->formatMessage($message, $request->user()), 201);
    }

    public function startWithCoach(Request $request)
    {
        $data = $request->validate(['coachId' => 'required|exists:users,id']);

        $member = $request->user();
        abort_unless($member->isMember(), 403);

        $coach = User::where('id', $data['coachId'])->where('role', 'coach')->firstOrFail();

        $conversation = Conversation::firstOrCreate([
            'member_id' => $member->id,
            'coach_id' => $coach->id,
        ]);

        return response()->json([
            'id' => (string) $conversation->id,
            'partner' => $this->formatPartner($coach),
        ]);
    }

    public function myCoaches(Request $request)
    {
        $user = $request->user();

        if ($user->isCoach()) {
            // Get members from coach_assignments or from conversations
            $memberIds = $user->members()->pluck('users.id')
                ->merge(Conversation::where('coach_id', $user->id)->pluck('member_id'))
                ->unique();

            $members = User::whereIn('id', $memberIds)->get();

            return response()->json(
                $members->map(fn (User $m) => $this->formatClient($m, $user))
            );
        }

        return response()->json(
            $user->coaches()->get()->map(fn (User $c) => [
                ...$this->formatPartner($c),
                'specialty' => $c->pivot->specialty ?? $c->coach_specialty,
                'notes' => $c->pivot->notes ?? '',
            ])
        );
    }

    private function authorizeConversation(User $user, Conversation $conversation): void
    {
        abort_unless(
            $conversation->member_id === $user->id || $conversation->coach_id === $user->id,
            403
        );
    }

    private function formatPartner(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'avatar' => $user->avatar,
            'role' => $user->role,
            'coachSpecialty' => $user->coach_specialty,
            'title' => $user->title,
        ];
    }

    private function formatClient(User $user, ?User $coach = null): array
    {
        $specialty = $user->pivot->specialty ?? $coach?->coach_specialty ?? 'trainer';
        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'avatar' => $user->avatar,
            'email' => $user->email,
            'planName' => $specialty === 'nutritionist' ? 'Nutrition Plan' : 'Training Plan',
            'status' => 'On Track',
            'adherencePercent' => 85,
            'lastActive' => 'Today',
            'notes' => $user->pivot->notes ?? '',
        ];
    }

    private function formatMessage(ChatMessage $message, User $currentUser): array
    {
        return [
            'id' => (string) $message->id,
            'senderId' => (string) $message->sender_id,
            'body' => $message->body,
            'time' => Carbon::parse($message->created_at)->format('g:i A'),
            'isMine' => (string) $message->sender_id === (string) $currentUser->id,
        ];
    }
}
