<?php

namespace App\Providers;

use App\Services\AI\AIProviderInterface;
use App\Services\AI\AIService;
use App\Services\AI\GeminiProvider;
use App\Services\AI\GroqProvider;
use Illuminate\Support\ServiceProvider;

class AIServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(AIProviderInterface::class, function () {
            $provider = config('services.ai.provider', 'groq');

            return match ($provider) {
                'gemini' => new GeminiProvider(config('services.gemini.key'), config('services.gemini.model')),
                default => new GroqProvider(config('services.groq.key')),
            };
        });

        $this->app->singleton(AIService::class, function ($app) {
            return new AIService($app->make(AIProviderInterface::class));
        });
    }
}
