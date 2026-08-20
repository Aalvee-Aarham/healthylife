<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Trainer Coach
        $trainer = User::where('coach_specialty', 'trainer')->first();
        if (!$trainer) {
            $trainer = User::create([
                'name' => 'Alex Rivera, CSCS',
                'email' => 'coach@healthylife.com',
                'password' => Hash::make('password123'),
                'role' => 'coach',
                'gender' => 'male',
                'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
                'coach_specialty' => 'trainer',
                'title' => 'Master Strength Coach & Biometrics Specialist',
            ]);
        }

        // 2. Seed Nutritionist Coach
        $nutritionist = User::where('coach_specialty', 'nutritionist')->first();
        if (!$nutritionist) {
            $nutritionist = User::create([
                'name' => 'Dr. Elena Chen',
                'email' => 'nutritionist@healthylife.com',
                'password' => Hash::make('password123'),
                'role' => 'coach',
                'gender' => 'female',
                'avatar' => 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
                'coach_specialty' => 'nutritionist',
                'title' => 'Clinical Nutritionist & Metabolic Specialist',
            ]);
        }

        // 3. Seed default demo member
        $member = User::where('email', 'member@healthylife.com')->first();
        if (!$member) {
            $member = User::create([
                'name' => 'Maya Lin',
                'email' => 'member@healthylife.com',
                'password' => Hash::make('password123'),
                'role' => 'member',
                'gender' => 'female',
                'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
                'goal' => 'fat_loss',
                'activity_level' => 'moderate',
                'calories_goal' => 2000,
                'protein_goal_g' => 130,
                'carbs_goal_g' => 200,
                'fats_goal_g' => 65,
                'water_goal_ml' => 3000,
                'weight_current_kg' => 62,
                'weight_target_kg' => 58,
                'height_cm' => 168,
                'age' => 28,
            ]);
        }

        // 4. Seed Admin
        if (!User::where('email', 'admin@healthylife.com')->exists()) {
            User::create([
                'name' => 'Admin Superuser',
                'email' => 'admin@healthylife.com',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'gender' => 'female',
                'avatar' => 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
            ]);
        }

        // 5. Ensure all members have default coach conversations
        $members = User::where('role', 'member')->get();
        foreach ($members as $m) {
            if ($trainer) {
                $convTrainer = \App\Models\Conversation::firstOrCreate([
                    'member_id' => $m->id,
                    'coach_id' => $trainer->id,
                ]);

                if ($convTrainer->messages()->count() === 0) {
                    \App\Models\ChatMessage::create([
                        'conversation_id' => $convTrainer->id,
                        'sender_id' => $trainer->id,
                        'body' => "Hi {$m->name}! I'm your Fitness & Training Coach. Let me know your workout goals or any exercise questions!",
                    ]);
                }
            }

            if ($nutritionist) {
                $convNutri = \App\Models\Conversation::firstOrCreate([
                    'member_id' => $m->id,
                    'coach_id' => $nutritionist->id,
                ]);

                if ($convNutri->messages()->count() === 0) {
                    \App\Models\ChatMessage::create([
                        'conversation_id' => $convNutri->id,
                        'sender_id' => $nutritionist->id,
                        'body' => "Welcome {$m->name}! I'm your Nutrition Coach. Feel free to share your meal logs, dietary goals, or macro questions anytime!",
                    ]);
                }
            }
        }
    }
}
