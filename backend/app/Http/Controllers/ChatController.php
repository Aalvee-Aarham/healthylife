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
            return response()->json(
                $user->members()->get()->map(fn (User $m) => $this->formatClient($m))
            );
        }

        return response()->json(
            $user->coaches()->get()->map(fn (User $c) => [
                ...$this->formatPartner($c),
                'specialty' => $c->pivot->specialty,
                'notes' => $c->pivot->notes,
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

    private function formatClient(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'avatar' => $user->avatar,
            'email' => $user->email,
            'planName' => $user->pivot->specialty === 'nutritionist' ? 'Nutrition Plan' : 'Training Plan',
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
