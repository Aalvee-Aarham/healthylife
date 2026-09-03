<?php

namespace App\Http\Controllers;

use App\Services\ChatService;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function __construct(private readonly ChatService $chatService) {}

    public function conversations(Request $request)
    {
        return response()->json($this->chatService->conversations($request->user()));
    }

    public function messages(Request $request, int $conversation)
    {
        return response()->json($this->chatService->messages($request->user(), $conversation));
    }

    public function send(Request $request, int $conversation)
    {
        $data = $request->validate(['body' => 'required|string|max:5000']);

        return response()->json($this->chatService->send($request->user(), $conversation, $data['body']), 201);
    }

    public function startWithCoach(Request $request)
    {
        $data = $request->validate(['coachId' => 'required|exists:users,id']);

        return response()->json($this->chatService->startWithCoach($request->user(), (int) $data['coachId']));
    }

    public function myCoaches(Request $request)
    {
        return response()->json($this->chatService->myCoaches($request->user(), $request->query('search', '')));
    }
}
