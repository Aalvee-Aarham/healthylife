<?php

namespace App\Services\AI;

interface AIProviderInterface
{
    /**
     * Send a chat completion request.
     *
     * @param  array  $messages  Array of ['role' => 'system'|'user'|'assistant', 'content' => string]
     * @param  bool  $jsonMode  When true, instruct the provider to return a raw JSON object/string.
     * @return string Raw text content of the assistant's reply.
     */
    public function chat(array $messages, bool $jsonMode = false): string;

    /**
     * Analyze an image with a text prompt (vision).
     *
     * @param  string  $base64Image  Base64-encoded image bytes (no data: prefix).
     * @param  string  $mimeType  e.g. 'image/jpeg', 'image/png'.
     * @param  string  $prompt  Instruction for what to extract/describe.
     * @return string Raw text content of the model's reply.
     */
    public function analyzeImage(string $base64Image, string $mimeType, string $prompt): string;
}
