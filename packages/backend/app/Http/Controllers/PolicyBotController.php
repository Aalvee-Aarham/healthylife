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
     * Proxies to Python RAG API, falls back to AI Provider (Groq/Gemini), and finally to embedded policy search.
     */
    public function ask(Request $request)
    {
        $question = (string) ($request->input('question') ?? '');
        if (trim($question) === '') {
            return response()->json(['message' => 'The question field is required.'], 422);
        }

        // 1. Try the RAG service if reachable
        try {
            $ragUrl = config('services.rag.url');
            if ($ragUrl && $ragUrl !== 'http://localhost:8001') {
                $response = Http::timeout(4)->post(rtrim($ragUrl, '/') . '/ask', ['question' => $question]);
                if ($response->successful() && !empty($response->json('answer'))) {
                    return response()->json(['answer' => (string) $response->json('answer')]);
                }
            }
        } catch (\Throwable $e) {
            // RAG down/unreachable, silently proceed to fallback
        }

        // 2. Try the AI Provider (Groq / Gemini)
        $policyText = $this->getPolicyText();
        try {
            $ai = app(\App\Services\AI\AIProviderInterface::class);
            $prompt = [
                [
                    'role'    => 'system',
                    'content' => "You are a helpful policy assistant for HealthyLife, a holistic health and coaching platform.\n" .
                        "Answer questions accurately and concisely (2-4 sentences) based on this official policy handbook:\n\n" .
                        $policyText,
                ],
                ['role' => 'user', 'content' => $question],
            ];

            $answer = $ai->chat($prompt, false);
            if (!empty(trim($answer))) {
                return response()->json(['answer' => trim($answer)]);
            }
        } catch (\Throwable $e) {
            Log::warning('PolicyBot: AI provider failed, using handbook rule lookup', ['error' => $e->getMessage()]);
        }

        // 3. Fallback: intelligent direct handbook lookup
        $fallbackAnswer = $this->lookupPolicy($question);
        return response()->json(['answer' => $fallbackAnswer]);
    }

    /**
     * GET /policy/pdf — Serves the HealthyLife Policy Handbook PDF.
     */
    public function pdf()
    {
        $candidates = [
            storage_path('app/policy/healthylife_policy_handbook.pdf'),
            public_path('healthylife_policy_handbook.pdf'),
            base_path('healthylife_policy_handbook.pdf'),
        ];

        foreach ($candidates as $path) {
            try {
                if (@file_exists($path) && is_file($path)) {
                    return response()->file($path, [
                        'Content-Type'        => 'application/pdf',
                        'Content-Disposition' => 'inline; filename="healthylife_policy_handbook.pdf"',
                    ]);
                }
            } catch (\Throwable $e) {
                // Ignore open_basedir or permission restrictions
            }
        }

        abort(404, 'Policy PDF not found on server.');
    }

    /**
     * Smart fallback policy lookup when external AI is unavailable.
     */
    private function lookupPolicy(string $question): string
    {
        $q = strtolower($question);

        if (str_contains($q, 'refund') || str_contains($q, 'money back')) {
            return "According to Section 2 (Refund Policy):\n" .
                "• Monthly plans: No refunds after billing date. Cancellation stops future charges.\n" .
                "• Annual plans: Full refund within 14 days of purchase if no coaching sessions were used. After 14 days, a pro-rated refund minus 10% fee applies.\n" .
                "• Coaching packages are non-refundable once any session is used.\n" .
                "Refund requests can be submitted via Settings > Billing > Request Refund.";
        }

        if (str_contains($q, 'cancel') || str_contains($q, 'renew') || str_contains($q, 'subscription') || str_contains($q, 'plan') || str_contains($q, 'price') || str_contains($q, 'cost')) {
            return "According to Section 1 & 3 of our Policy Handbook:\n" .
                "• Plans: Basic (free), Pro ($19.99/mo), and Elite ($39.99/mo). Annual plans receive a 20% discount.\n" .
                "• Auto-renewal: Plans auto-renew unless cancelled at least 24 hours prior to renewal date.\n" .
                "• Coaching cancellations: Sessions must be cancelled with at least 12 hours notice to reschedule without fee.";
        }

        if (str_contains($q, 'coach') || str_contains($q, 'session') || str_contains($q, 'book') || str_contains($q, 'certif')) {
            return "According to Section 3 (Coaching Sessions):\n" .
                "• Elite members get 2 coaching sessions per month; Pro members get 1.\n" .
                "• Sessions must be booked at least 24 hours in advance in-app.\n" .
                "• Cancellations with <12 hours notice forfeit the session. All coaches hold accredited certifications (NASM, ACE, CSCS, RD).";
        }

        if (str_contains($q, 'privacy') || str_contains($q, 'data') || str_contains($q, 'security') || str_contains($q, 'delete')) {
            return "According to Section 4 (Data & Privacy):\n" .
                "• Your health data is encrypted (AES-256 at rest, TLS 1.3 in transit) and is never sold to third parties.\n" .
                "• You can export or delete your data anytime under Settings > Privacy > Manage Data (processed within 30 days).";
        }

        if (str_contains($q, 'ai') || str_contains($q, 'bot') || str_contains($q, 'advisor') || str_contains($q, 'medical')) {
            return "According to Section 5 (AI Assistant Policy):\n" .
                "• The AI Health Advisor offers general wellness suggestions and is not a substitute for professional medical advice.\n" .
                "• Always consult a healthcare professional before making major health changes.";
        }

        if (str_contains($q, 'support') || str_contains($q, 'contact') || str_contains($q, 'help') || str_contains($q, 'email')) {
            return "HealthyLife support is available via in-app chat Mon–Fri, 9 AM–6 PM GMT+6, or by email: billing@healthylife.app for billing disputes and privacy@healthylife.app for privacy requests.";
        }

        return "HealthyLife Policy Summary:\n" .
            "We offer Basic (free), Pro ($19.99/mo), and Elite ($39.99/mo) plans. Coaching sessions require 24h advance booking and 12h cancellation notice. All user data is encrypted and never sold. For specific questions regarding billing, coaching, privacy, or refunds, please ask about that topic or view our full PDF handbook.";
    }

    /**
     * Returns the embedded HealthyLife Policy Handbook text.
     * This is a condensed version of rag-demo/data/healthylife_policy_handbook.pdf.
     */
    private function getPolicyText(): string
    {
        return <<<'POLICY'
HealthyLife Policy Handbook

1. MEMBERSHIP & PLANS
- HealthyLife offers three plans: Basic (free), Pro ($19.99/month), and Elite ($39.99/month).
- Annual plans receive a 20% discount compared to monthly billing.
- Plans auto-renew unless cancelled at least 24 hours before the renewal date.
- Members can upgrade or downgrade plans at any time; changes take effect at the next billing cycle.

2. REFUND POLICY
- Monthly plans: No refunds after the billing date. Cancellation stops future charges.
- Annual plans: Full refund within 14 days of purchase if no coaching sessions have been used.
- After 14 days, annual plans receive a pro-rated refund minus a 10% processing fee.
- Coaching session packages (5-session or 10-session bundles) are non-refundable once any session is used.
- Refund requests must be submitted through Settings > Billing > Request Refund.

3. COACHING SESSIONS
- Elite plan members receive 2 coaching sessions per month; Pro members receive 1 per month.
- Sessions must be booked at least 24 hours in advance through the app.
- Cancellations with less than 12 hours notice forfeit the session; sessions cancelled with more than 12 hours notice are rescheduled at no charge.
- If a coach cancels, the session is automatically rescheduled or a credit is issued.
- Coach certifications: All HealthyLife coaches hold at least one accredited certification (e.g., NASM, ACE, CSCS, RD, or equivalent). Credentials are verified before onboarding.

4. DATA & PRIVACY
- HealthyLife collects health data (meals, workouts, cycle tracking) solely to provide personalised features.
- Data is stored encrypted at rest (AES-256) and in transit (TLS 1.3).
- Health data is never sold to third parties.
- AI features use anonymised, aggregated data for model improvement; individual data is not used without explicit opt-in consent.
- Members can export or delete all their data from Settings > Privacy > Manage Data.
- Data deletion requests are processed within 30 days.

5. AI ASSISTANT POLICY
- The AI Health Advisor provides general wellness guidance only and is not a substitute for medical advice.
- AI-generated meal and workout plans are suggestions; consult a healthcare professional before making significant health changes.
- AI responses are generated by third-party language models (Groq/Gemini). HealthyLife is not liable for inaccurate AI outputs.

6. CODE OF CONDUCT
- Members must treat coaches and other users respectfully in the chat feature.
- Harassment, hate speech, or sharing of another user's personal information will result in immediate account termination without refund.
- Coaches must maintain professional boundaries and adhere to their certification body's code of ethics.

7. ACCOUNT TERMINATION
- HealthyLife reserves the right to terminate accounts for violation of the Code of Conduct, fraudulent activity, or chargebacks.
- Terminated accounts are not eligible for refunds.
- Members may voluntarily close their account from Settings > Account > Close Account.

8. CONTACT & SUPPORT
- Support is available via in-app chat (Mon–Fri, 9 AM–6 PM GMT+6).
- For billing disputes, email billing@healthylife.app within 60 days of the charge.
- For data privacy requests, email privacy@healthylife.app.
POLICY;
    }
}
