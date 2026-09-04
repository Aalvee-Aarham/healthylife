<?php

namespace App\Http\Controllers;

use App\Services\AI\AIService;
use Illuminate\Http\Request;

class AIController extends Controller
{
    public function __construct(private readonly AIService $aiService) {}

    /**
     * POST /ai/chat — {messages, persona} -> free-form assistant reply.
     * Replaces the frontend's direct Groq chat calls.
     */
    public function chat(Request $request)
    {
        $data = $request->validate([
            'messages' => 'required|array|min:1',
            'messages.*.role' => 'required|string|in:system,user,assistant',
            'messages.*.content' => 'required|string',
            'persona' => 'nullable|string|in:member,coach',
        ]);

        $persona = $data['persona'] ?? ($request->user()->isCoach() ? 'coach' : 'member');

        $reply = $this->aiService->answerChat($data['messages'], $persona);

        return response()->json(['reply' => $reply]);
    }
}
