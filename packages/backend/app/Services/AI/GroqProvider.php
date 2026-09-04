<?php

namespace App\Services\AI;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class GroqProvider implements AIProviderInterface
{
    private const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

    // Primary text model — fast & powerful.
    private const MODEL_PRIMARY = 'llama-3.3-70b-versatile';

    // Fallback text model if the primary is rate-limited or errors.
    private const MODEL_FALLBACK = 'llama3-8b-8192';

    // Current Groq vision-capable model (llama-4-scout multimodal preview family)
    // used for food-photo analysis — swap here if Groq deprecates it.
    private const MODEL_VISION = 'meta-llama/llama-4-scout-17b-16e-instruct';

    public function __construct(private readonly ?string $apiKey) {}

    public function chat(array $messages, bool $jsonMode = false): string
    {
        $payload = [
            'messages' => $messages,
            'temperature' => 0.6,
            // Weekly plan JSON needs more room than 1200 tokens.
            'max_tokens' => 4096,
        ];

        if ($jsonMode) {
            $payload['response_format'] = ['type' => 'json_object'];
        }

        $response = $this->request(self::MODEL_PRIMARY, $payload);

        if (! $response->successful()) {
            Log::warning('GroqProvider: primary model failed, falling back', [
                'status' => $response->status(),
            ]);
            $response = $this->request(self::MODEL_FALLBACK, $payload);
        }

        if (! $response->successful()) {
            throw new RuntimeException('Groq API request failed: '.$response->status());
        }

        return (string) data_get($response->json(), 'choices.0.message.content', '');
    }

    public function analyzeImage(string $base64Image, string $mimeType, string $prompt): string
    {
        $payload = [
            'model' => self::MODEL_VISION,
            'messages' => [
                [
                    'role' => 'user',
                    'content' => [
                        ['type' => 'text', 'text' => $prompt],
                        [
                            'type' => 'image_url',
                            'image_url' => ['url' => "data:{$mimeType};base64,{$base64Image}"],
                        ],
                    ],
                ],
            ],
            'temperature' => 0.4,
            'max_tokens' => 800,
        ];

        $response = $this->http()
            ->timeout(45)
            ->post(self::ENDPOINT, $payload);

        if (! $response->successful()) {
            throw new RuntimeException('Groq vision API request failed: '.$response->status());
        }

        return (string) data_get($response->json(), 'choices.0.message.content', '');
    }

    private function request(string $model, array $payload)
    {
        return $this->http()
            ->timeout(60)
            ->post(self::ENDPOINT, array_merge(['model' => $model], $payload));
    }

    private function http(): PendingRequest
    {
        $request = Http::withToken($this->apiKey);

        // Optional CA bundle for PHP installs without curl.cainfo configured (common on Windows).
        if ($caBundle = config('services.ai.ca_bundle')) {
            $request = $request->withOptions(['verify' => $caBundle]);
        }

        return $request;
    }
}
