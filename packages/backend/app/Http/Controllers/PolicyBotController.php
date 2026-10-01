<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PolicyBotController extends Controller
{
    /**
     * POST /policy/ask — {question} -> {answer}.
     * Public (landing page); proxies to the Python RAG API started by rag-demo/rag_demo.ipynb (section C).
     */
    public function ask(Request $request)
    {
        $data = $request->validate([
            'question' => 'required|string|max:500',
        ]);

        try {
            $response = Http::timeout(60)->post(rtrim(config('services.rag.url'), '/').'/ask', $data);
        } catch (ConnectionException $e) {
            Log::warning('PolicyBot: RAG service unreachable', ['error' => $e->getMessage()]);
            $response = null;
        }

        if (! $response?->successful()) {
            return response()->json(['message' => 'The policy assistant is unavailable right now.'], 503);
        }

        return response()->json(['answer' => (string) $response->json('answer', '')]);
    }
}
