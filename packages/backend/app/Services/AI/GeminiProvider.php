<?php

namespace App\Services\AI;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GeminiProvider implements AIProviderInterface
{
    // Fast/cheap multimodal default (gemini-1.5-* models are retired). Override with GEMINI_MODEL.
    private const DEFAULT_MODEL = 'gemini-2.5-flash';

    private const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

    public function __construct(
        private readonly ?string $apiKey,
        private readonly ?string $model = null,
    ) {}

    public function chat(array $messages, bool $jsonMode = false): string
    {
        [$systemInstruction, $contents] = $this->convertMessages($messages);

        $payload = [
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => 0.6,
                // Weekly plans are ~7 days of JSON items — 1200 tokens truncated them mid-object.
                'maxOutputTokens' => 8192,
                // 2.5 models "think" by default and those tokens count against maxOutputTokens.
                'thinkingConfig' => ['thinkingBudget' => 0],
            ],
        ];

        if ($systemInstruction !== null) {
            $payload['systemInstruction'] = ['parts' => [['text' => $systemInstruction]]];
        }

        if ($jsonMode) {
            $payload['generationConfig']['responseMimeType'] = 'application/json';
        }

        return $this->call($payload);
    }

    public function analyzeImage(string $base64Image, string $mimeType, string $prompt): string
    {
        $payload = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => $prompt],
                        [
                            'inline_data' => [
                                'mime_type' => $mimeType,
                                'data' => $base64Image,
                            ],
                        ],
                    ],
                ],
            ],
            'generationConfig' => [
                'temperature' => 0.4,
                'maxOutputTokens' => 2048,
                'thinkingConfig' => ['thinkingBudget' => 0],
            ],
        ];

        return $this->call($payload);
    }

    private function call(array $payload): string
    {
        if (empty($this->apiKey)) {
            throw new RuntimeException('GEMINI_API_KEY is not configured.');
        }

        $url = self::BASE_URL.'/'.($this->model ?: self::DEFAULT_MODEL).':generateContent';

        // Key goes in a header, not the query string, so it never leaks into exception messages.
        $response = $this->http()->post($url, $payload);

        if (! $response->successful()) {
            $message = data_get($response->json(), 'error.message', $response->body());
            throw new RuntimeException('Gemini API request failed: '.$response->status().' '.$message);
        }

        $parts = data_get($response->json(), 'candidates.0.content.parts', []);

        return collect($parts)->pluck('text')->filter()->implode("\n");
    }

    private function http(): PendingRequest
    {
        $request = Http::timeout(60)->withHeaders(['x-goog-api-key' => $this->apiKey]);

        // Optional CA bundle for PHP installs without curl.cainfo configured (common on Windows).
        if ($caBundle = config('services.ai.ca_bundle')) {
            $request = $request->withOptions(['verify' => $caBundle]);
        }

        return $request;
    }

    /**
     * Convert OpenAI-style messages (role: system|user|assistant) into
     * Gemini's format: a single systemInstruction string + a contents array
     * where roles are 'user' and 'model'.
     */
    private function convertMessages(array $messages): array
    {
        $systemParts = [];
        $contents = [];

        foreach ($messages as $message) {
            $role = $message['role'] ?? 'user';
            $content = $message['content'] ?? '';

            if ($role === 'system') {
                $systemParts[] = $content;

                continue;
            }

            $contents[] = [
                'role' => $role === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $content]],
            ];
        }

        $systemInstruction = empty($systemParts) ? null : implode("\n\n", $systemParts);

        return [$systemInstruction, $contents];
    }
}
