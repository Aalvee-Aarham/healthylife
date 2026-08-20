<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Seed default demo users if not present
        if (!User::where('email', 'member@healthylife.com')->exists()) {
            User::create([
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

        if (!User::where('email', 'coach@healthylife.com')->exists()) {
            User::create([
                'name' => 'Alex Vance',
                'email' => 'coach@healthylife.com',
                'password' => Hash::make('password123'),
                'role' => 'coach',
                'gender' => 'male',
                'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
                'coach_specialty' => 'trainer',
                'title' => 'Master Strength Coach & Biometrics Specialist',
            ]);
        }

        if (!User::where('email', 'admin@healthylife.com')->exists()) {
            User::create([
                'name' => 'Admin Superuser',
                'email' => 'admin@healthylife.com',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'gender' => 'female',
                'avatar' => 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
            ]);
        }
    }
}
