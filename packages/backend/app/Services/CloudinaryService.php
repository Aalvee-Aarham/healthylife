<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CloudinaryService
{
    public function uploadFile(string $filePath, string $folder = 'meals'): ?string
    {
        $cloudName = config('services.cloudinary.cloud_name');
        $apiKey = config('services.cloudinary.api_key');
        $apiSecret = config('services.cloudinary.api_secret');

        if (! $cloudName || ! $apiKey || ! $apiSecret || ! file_exists($filePath)) {
            return null;
        }

        try {
            $timestamp = time();
            $paramsToSign = [
                'folder' => $folder,
                'timestamp' => $timestamp,
            ];
            ksort($paramsToSign);

            $signString = '';
            foreach ($paramsToSign as $k => $v) {
                $signString .= "{$k}={$v}&";
            }
            $signString = rtrim($signString, '&') . $apiSecret;
            $signature = sha1($signString);

            $response = Http::attach(
                'file',
                file_get_contents($filePath),
                basename($filePath)
            )->post("https://api.cloudinary.com/v1_1/{$cloudName}/image/upload", [
                'api_key' => $apiKey,
                'timestamp' => $timestamp,
                'signature' => $signature,
                'folder' => $folder,
            ]);

            if ($response->successful()) {
                return $response->json('secure_url') ?? $response->json('url');
            }

            Log::warning('Cloudinary upload failed', ['body' => $response->body()]);
        } catch (\Throwable $e) {
            Log::warning('Cloudinary upload exception', ['error' => $e->getMessage()]);
        }

        return null;
    }
}
