<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Trainer Coach
        $trainer = DB::selectOne("SELECT id FROM users WHERE coach_specialty = 'trainer' AND role = 'coach'");
        if (!$trainer) {
            $tRows = DB::select(
                "INSERT INTO users (name, email, password, role, gender, avatar, coach_specialty, title, created_at, updated_at)
                 VALUES (?, ?, ?, 'coach', 'male', ?, 'trainer', ?, NOW(), NOW())
                 RETURNING id",
                [
                    'Alex Rivera, CSCS',
                    'coach@healthylife.com',
                    Hash::make('password123'),
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
                    'Master Strength Coach & Biometrics Specialist'
                ]
            );
            $trainerId = $tRows[0]->id;
        } else {
            $trainerId = $trainer->id;
        }

        // 2. Seed Nutritionist Coach
        $nutritionist = DB::selectOne("SELECT id FROM users WHERE coach_specialty = 'nutritionist' AND role = 'coach'");
        if (!$nutritionist) {
            $nRows = DB::select(
                "INSERT INTO users (name, email, password, role, gender, avatar, coach_specialty, title, created_at, updated_at)
                 VALUES (?, ?, ?, 'coach', 'female', ?, 'nutritionist', ?, NOW(), NOW())
                 RETURNING id",
                [
                    'Dr. Elena Chen',
                    'nutritionist@healthylife.com',
                    Hash::make('password123'),
                    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
                    'Clinical Nutritionist & Metabolic Specialist'
                ]
            );
            $nutritionistId = $nRows[0]->id;
        } else {
            $nutritionistId = $nutritionist->id;
        }

        // 3. Seed default demo member: member@healthylife.com
        $member = DB::selectOne("SELECT id FROM users WHERE email = 'member@healthylife.com'");
        if (!$member) {
            $mRows = DB::select(
                "INSERT INTO users 
                    (name, email, password, role, gender, avatar, goal, activity_level, 
                     calories_goal, protein_goal_g, carbs_goal_g, fats_goal_g, water_goal_ml,
                     weight_current_kg, weight_target_kg, height_cm, age, created_at, updated_at)
                 VALUES (?, ?, ?, 'member', 'female', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                 RETURNING id",
                [
                    'Maya Lin',
                    'member@healthylife.com',
                    Hash::make('password123'),
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
                    'Cycle Alignment & Metabolic Health',
                    'moderate',
                    2000, 130, 200, 65, 3000,
                    62.0, 58.0, 168, 28
                ]
            );
            $memberId = $mRows[0]->id;
        } else {
            $memberId = $member->id;
        }

        // 4. Default Coach Conversations
        foreach ([$trainerId, $nutritionistId] as $coachId) {
            $conv = DB::selectOne(
                "SELECT id FROM conversations WHERE member_id = ? AND coach_id = ?",
                [$memberId, $coachId]
            );
            if (!$conv) {
                $cRows = DB::select(
                    "INSERT INTO conversations (member_id, coach_id, created_at, updated_at)
                     VALUES (?, ?, NOW(), NOW())
                     RETURNING id",
                    [$memberId, $coachId]
                );
                $convId = $cRows[0]->id;

                $body = $coachId === $trainerId
                    ? "Hi Maya! I'm your Fitness & Training Coach. I can help sync your workouts to your follicular and luteal phases!"
                    : "Welcome Maya! I'm your Nutrition Coach. Let me know if you need high-protein meal plans or iron-rich recipe guidance.";

                DB::statement(
                    "INSERT INTO chat_messages (conversation_id, sender_id, body, created_at, updated_at)
                     VALUES (?, ?, ?, NOW(), NOW())",
                    [$convId, $coachId, $body]
                );
            }
        }

        // 5. Seed Realistic Historical Cycle Data for member@healthylife.com
        // Clean existing cycle data for clean seed
        DB::statement("DELETE FROM cycle_periods WHERE user_id = ?", [$memberId]);
        DB::statement("DELETE FROM cycle_symptom_logs WHERE user_id = ?", [$memberId]);

        // Historical Cycle Periods (4 distinct 28-day cycles with 5 days duration)
        // Cycle 1: 3 months ago (May 10 to May 14)
        // Cycle 2: 2 months ago (Jun 7 to Jun 11)
        // Cycle 3: 1 month ago (Jul 5 to Jul 9)
        // Cycle 4: Current / Recent (Aug 2 to Aug 6)
        $periodsToSeed = [
            ['started' => Carbon::today()->subDays(84)->toDateString(), 'ended' => Carbon::today()->subDays(80)->toDateString(), 'flow' => 'heavy'],
            ['started' => Carbon::today()->subDays(56)->toDateString(), 'ended' => Carbon::today()->subDays(52)->toDateString(), 'flow' => 'medium'],
            ['started' => Carbon::today()->subDays(28)->toDateString(), 'ended' => Carbon::today()->subDays(24)->toDateString(), 'flow' => 'medium'],
            ['started' => Carbon::today()->subDays(2)->toDateString(),  'ended' => null,                                          'flow' => 'medium'], // Active period started 2 days ago!
        ];

        foreach ($periodsToSeed as $p) {
            DB::statement(
                "INSERT INTO cycle_periods (user_id, started_on, ended_on, flow, created_at, updated_at)
                 VALUES (?, ?, ?, ?, NOW(), NOW())",
                [$memberId, $p['started'], $p['ended'], $p['flow']]
            );
        }

        // Historical Symptoms Logged Across Different Cycle Days
        // Menstrual symptoms (Cramps, Fatigue, Back pain during active bleeding)
        $symptomsToSeed = [
            // Current Cycle (started 2 days ago)
            ['date' => Carbon::today()->subDays(2)->toDateString(), 'symptom' => 'cramps'],
            ['date' => Carbon::today()->subDays(2)->toDateString(), 'symptom' => 'fatigue'],
            ['date' => Carbon::today()->subDays(1)->toDateString(), 'symptom' => 'cramps'],
            ['date' => Carbon::today()->subDays(1)->toDateString(), 'symptom' => 'back_pain'],
            ['date' => Carbon::today()->toDateString(),             'symptom' => 'fatigue'],
            ['date' => Carbon::today()->toDateString(),             'symptom' => 'mood_low'],

            // Last Cycle Menstrual (28 days ago)
            ['date' => Carbon::today()->subDays(28)->toDateString(), 'symptom' => 'cramps'],
            ['date' => Carbon::today()->subDays(28)->toDateString(), 'symptom' => 'bloating'],
            ['date' => Carbon::today()->subDays(27)->toDateString(), 'symptom' => 'back_pain'],
            ['date' => Carbon::today()->subDays(27)->toDateString(), 'symptom' => 'headache'],

            // Last Cycle Ovulation (14 days ago)
            ['date' => Carbon::today()->subDays(14)->toDateString(), 'symptom' => 'high_energy'],
            ['date' => Carbon::today()->subDays(14)->toDateString(), 'symptom' => 'mood_happy'],
            ['date' => Carbon::today()->subDays(13)->toDateString(), 'symptom' => 'high_energy'],

            // Last Cycle Luteal (7-10 days ago)
            ['date' => Carbon::today()->subDays(8)->toDateString(), 'symptom' => 'acne'],
            ['date' => Carbon::today()->subDays(7)->toDateString(), 'symptom' => 'appetite_up'],
            ['date' => Carbon::today()->subDays(6)->toDateString(), 'symptom' => 'breast_tender'],
            ['date' => Carbon::today()->subDays(5)->toDateString(), 'symptom' => 'insomnia'],
            ['date' => Carbon::today()->subDays(4)->toDateString(), 'symptom' => 'acne'],

            // 2 Cycles ago Menstrual (56 days ago)
            ['date' => Carbon::today()->subDays(56)->toDateString(), 'symptom' => 'cramps'],
            ['date' => Carbon::today()->subDays(55)->toDateString(), 'symptom' => 'fatigue'],
            ['date' => Carbon::today()->subDays(54)->toDateString(), 'symptom' => 'back_pain'],

            // 3 Cycles ago Menstrual (84 days ago)
            ['date' => Carbon::today()->subDays(84)->toDateString(), 'symptom' => 'cramps'],
            ['date' => Carbon::today()->subDays(83)->toDateString(), 'symptom' => 'cramps'],
            ['date' => Carbon::today()->subDays(82)->toDateString(), 'symptom' => 'bloating'],
        ];

        foreach ($symptomsToSeed as $s) {
            DB::statement(
                "INSERT INTO cycle_symptom_logs (user_id, logged_on, symptom_key, created_at, updated_at)
                 VALUES (?, ?, ?, NOW(), NOW())",
                [$memberId, $s['date'], $s['symptom']]
            );
        }

        // 6. Seed today's and recent days' meals for member@healthylife.com
        DB::statement("DELETE FROM meals WHERE user_id = ?", [$memberId]);
        
        $mealsToSeed = [
            // Today's meals
            [
                'name' => 'Avocado & Poached Egg Sourdough with Microgreens',
                'calories' => 420,
                'protein' => 22,
                'carbs' => 38,
                'fat' => 20,
                'category' => 'breakfast',
                'image' => 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
                'completed' => true,
                'logged_at' => Carbon::today()->setTime(8, 30)->toDateTimeString(),
            ],
            [
                'name' => 'Wild Salmon, Quinoa & Steamed Edamame Bowl',
                'calories' => 580,
                'protein' => 44,
                'carbs' => 48,
                'fat' => 22,
                'category' => 'lunch',
                'image' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
                'completed' => true,
                'logged_at' => Carbon::today()->setTime(13, 15)->toDateTimeString(),
            ],
            [
                'name' => 'Matcha Collagen Latte & Roasted Almonds',
                'calories' => 180,
                'protein' => 12,
                'carbs' => 14,
                'fat' => 10,
                'category' => 'snack',
                'image' => 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
                'completed' => true,
                'logged_at' => Carbon::today()->setTime(16, 0)->toDateTimeString(),
            ],
            [
                'name' => 'Grass-Fed Beef Tenderloin with Roasted Sweet Potato & Asparagus',
                'calories' => 620,
                'protein' => 48,
                'carbs' => 42,
                'fat' => 20,
                'category' => 'dinner',
                'image' => 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
                'completed' => false,
                'logged_at' => Carbon::today()->setTime(19, 30)->toDateTimeString(),
            ],

            // Yesterday's meals
            [
                'name' => 'Overnight Oats with Chia, Berries & Almond Butter',
                'calories' => 390,
                'protein' => 18,
                'carbs' => 52,
                'fat' => 14,
                'category' => 'breakfast',
                'image' => 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=600&q=80',
                'completed' => true,
                'logged_at' => Carbon::yesterday()->setTime(8, 15)->toDateTimeString(),
            ],
            [
                'name' => 'Grilled Chicken Salad with Tahini & Walnuts',
                'calories' => 510,
                'protein' => 42,
                'carbs' => 28,
                'fat' => 24,
                'category' => 'lunch',
                'image' => 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
                'completed' => true,
                'logged_at' => Carbon::yesterday()->setTime(12, 45)->toDateTimeString(),
            ],
            [
                'name' => 'Greek Yogurt Parfait with Walnuts & Honey',
                'calories' => 220,
                'protein' => 16,
                'carbs' => 22,
                'fat' => 7,
                'category' => 'snack',
                'image' => 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
                'completed' => true,
                'logged_at' => Carbon::yesterday()->setTime(15, 30)->toDateTimeString(),
            ],
            [
                'name' => 'Baked Cod with Lemon Herb Quinoa & Broccolini',
                'calories' => 480,
                'protein' => 40,
                'carbs' => 38,
                'fat' => 16,
                'category' => 'dinner',
                'image' => 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
                'completed' => true,
                'logged_at' => Carbon::yesterday()->setTime(19, 0)->toDateTimeString(),
            ],
        ];

        foreach ($mealsToSeed as $m) {
            DB::statement(
                "INSERT INTO meals (user_id, name, calories, protein, carbs, fat, category, image, completed, logged_at, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
                [
                    $memberId,
                    $m['name'],
                    $m['calories'],
                    $m['protein'],
                    $m['carbs'],
                    $m['fat'],
                    $m['category'],
                    $m['image'],
                    $m['completed'],
                    $m['logged_at']
                ]
            );
        }

        // 7. Seed Weekly Meal Plans for member@healthylife.com
        DB::statement("DELETE FROM meal_plans WHERE user_id = ?", [$memberId]);

        $mealPlansToSeed = [
            // Sunday (0)
            ['day' => 0, 'meal_time' => 'breakfast', 'name' => 'Spinach, Goat Cheese & Mushroom Omelette', 'calories' => 380, 'protein' => 26, 'carbs' => 12, 'fat' => 24, 'image' => 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80', 'notes' => 'High iron & folate support'],
            ['day' => 0, 'meal_time' => 'lunch',     'name' => 'Mediterranean Tuna & Chickpea Salad Bowl', 'calories' => 520, 'protein' => 40, 'carbs' => 45, 'fat' => 18, 'image' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', 'notes' => 'Omega-3 rich with EVOO dressing'],
            ['day' => 0, 'meal_time' => 'snack',     'name' => 'Cottage Cheese with Flax Seeds & Blueberries', 'calories' => 200, 'protein' => 20, 'carbs' => 15, 'fat' => 6, 'image' => 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80', 'notes' => 'Slow-digesting casein protein'],
            ['day' => 0, 'meal_time' => 'dinner',    'name' => 'Grass-Fed Ribeye with Roasted Cauliflower Mash', 'calories' => 640, 'protein' => 50, 'carbs' => 18, 'fat' => 38, 'image' => 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', 'notes' => 'Iron & Zinc replenishment'],

            // Monday (1)
            ['day' => 1, 'meal_time' => 'breakfast', 'name' => 'Avocado & Poached Egg on Seeded Sourdough', 'calories' => 420, 'protein' => 22, 'carbs' => 38, 'fat' => 20, 'image' => 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80', 'notes' => 'Choline & sustained energy for training'],
            ['day' => 1, 'meal_time' => 'lunch',     'name' => 'Grilled Salmon Quinoa Bowl with Sesame Greens', 'calories' => 580, 'protein' => 44, 'carbs' => 48, 'fat' => 22, 'image' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', 'notes' => 'Anti-inflammatory phase support'],
            ['day' => 1, 'meal_time' => 'snack',     'name' => 'Matcha Protein Shake with Almond Milk', 'calories' => 180, 'protein' => 24, 'carbs' => 10, 'fat' => 4, 'image' => 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80', 'notes' => 'Antioxidant & alertness boost'],
            ['day' => 1, 'meal_time' => 'dinner',    'name' => 'Herb Roasted Chicken Breast with Sweet Potato', 'calories' => 520, 'protein' => 46, 'carbs' => 44, 'fat' => 14, 'image' => 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80', 'notes' => 'Muscle recovery & glycogen restoration'],

            // Tuesday (2)
            ['day' => 2, 'meal_time' => 'breakfast', 'name' => 'Berry Protein Acai Bowl with Chia & Cacao Nibs', 'calories' => 390, 'protein' => 24, 'carbs' => 48, 'fat' => 12, 'image' => 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=600&q=80', 'notes' => 'High antioxidant & gut health'],
            ['day' => 2, 'meal_time' => 'lunch',     'name' => 'Turkey & Avocado Wrap with Mixed Green Salad', 'calories' => 490, 'protein' => 38, 'carbs' => 36, 'fat' => 19, 'image' => 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80', 'notes' => 'Clean lean protein & fiber'],
            ['day' => 2, 'meal_time' => 'snack',     'name' => 'Apple Slices with Natural Peanut Butter', 'calories' => 190, 'protein' => 6, 'carbs' => 24, 'fat' => 9, 'image' => 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&w=600&q=80', 'notes' => 'Steady glucose balance'],
            ['day' => 2, 'meal_time' => 'dinner',    'name' => 'Seared Mahi Mahi with Coconut Rice & Mango Salsa', 'calories' => 560, 'protein' => 42, 'carbs' => 54, 'fat' => 16, 'image' => 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80', 'notes' => 'Light, digestible, nutrient-dense'],

            // Wednesday (3)
            ['day' => 3, 'meal_time' => 'breakfast', 'name' => 'Overnight Chia Oats with Raspberries & Walnuts', 'calories' => 410, 'protein' => 18, 'carbs' => 54, 'fat' => 15, 'image' => 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=600&q=80', 'notes' => 'Slow-release complex carbs'],
            ['day' => 3, 'meal_time' => 'lunch',     'name' => 'Warm Lentil & Roasted Vegetable Harvest Salad', 'calories' => 460, 'protein' => 22, 'carbs' => 62, 'fat' => 14, 'image' => 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', 'notes' => 'Plant-based iron & gut prebiotic fiber'],
            ['day' => 3, 'meal_time' => 'snack',     'name' => 'Greek Yogurt with Hemp Hearts & Honey', 'calories' => 210, 'protein' => 19, 'carbs' => 18, 'fat' => 6, 'image' => 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80', 'notes' => 'Probiotics & magnesium'],
            ['day' => 3, 'meal_time' => 'dinner',    'name' => 'Lean Turkey Bolognese over Zucchini & Lentil Pasta', 'calories' => 540, 'protein' => 48, 'carbs' => 46, 'fat' => 15, 'image' => 'https://images.unsplash.com/photo-1621996346565-e3d5d6281084?auto=format&fit=crop&w=600&q=80', 'notes' => 'High protein comfort meal'],

            // Thursday (4)
            ['day' => 4, 'meal_time' => 'breakfast', 'name' => 'Smoked Salmon, Scrambled Eggs & Avocado', 'calories' => 440, 'protein' => 32, 'carbs' => 8, 'fat' => 30, 'image' => 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80', 'notes' => 'Essential fatty acids & hormonal balance'],
            ['day' => 4, 'meal_time' => 'lunch',     'name' => 'Steak Cobb Salad with Free-Range Egg & Blue Cheese', 'calories' => 590, 'protein' => 46, 'carbs' => 16, 'fat' => 38, 'image' => 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', 'notes' => 'Keto-friendly micronutrient boost'],
            ['day' => 4, 'meal_time' => 'snack',     'name' => 'Dark Chocolate (85%) & Raw Almonds', 'calories' => 170, 'protein' => 5, 'carbs' => 12, 'fat' => 13, 'image' => 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80', 'notes' => 'Magnesium & mood elevator'],
            ['day' => 4, 'meal_time' => 'dinner',    'name' => 'Crispy Skin Salmon with Asparagus & Wild Rice', 'calories' => 570, 'protein' => 42, 'carbs' => 40, 'fat' => 24, 'image' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', 'notes' => 'Anti-inflammatory deep recovery'],

            // Friday (5)
            ['day' => 5, 'meal_time' => 'breakfast', 'name' => 'Protein Pancakes with Pure Maple & Blueberries', 'calories' => 450, 'protein' => 35, 'carbs' => 56, 'fat' => 8, 'image' => 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80', 'notes' => 'Pre-workout carb loading'],
            ['day' => 5, 'meal_time' => 'lunch',     'name' => 'Lemon Herb Chicken with Roasted Butternut Squash', 'calories' => 510, 'protein' => 45, 'carbs' => 38, 'fat' => 16, 'image' => 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80', 'notes' => 'Beta-carotene & lean repair'],
            ['day' => 5, 'meal_time' => 'snack',     'name' => 'Edamame with Sea Salt & Sesame Oil', 'calories' => 160, 'protein' => 14, 'carbs' => 11, 'fat' => 6, 'image' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', 'notes' => 'Plant isoflavones & minerals'],
            ['day' => 5, 'meal_time' => 'dinner',    'name' => 'Sesame Crusted Ahi Tuna with Asian Slaw & Quinoa', 'calories' => 530, 'protein' => 48, 'carbs' => 38, 'fat' => 17, 'image' => 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80', 'notes' => 'Clean protein for end of week'],

            // Saturday (6)
            ['day' => 6, 'meal_time' => 'breakfast', 'name' => 'Classic Shakshuka with Poached Eggs & Whole Grain Pita', 'calories' => 410, 'protein' => 20, 'carbs' => 36, 'fat' => 20, 'image' => 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80', 'notes' => 'Lycopene & weekend comfort'],
            ['day' => 6, 'meal_time' => 'lunch',     'name' => 'Grilled Shrimp & Mango Salad with Lime Dressing', 'calories' => 440, 'protein' => 36, 'carbs' => 32, 'fat' => 14, 'image' => 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', 'notes' => 'Vitamin C & light zinc fuel'],
            ['day' => 6, 'meal_time' => 'snack',     'name' => 'Hummus with Carrot & Cucumber Batons', 'calories' => 150, 'protein' => 6, 'carbs' => 18, 'fat' => 7, 'image' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', 'notes' => 'Hydrating crunchy snack'],
            ['day' => 6, 'meal_time' => 'dinner',    'name' => 'Slow-Braised Lamb Shank with Root Vegetables', 'calories' => 650, 'protein' => 52, 'carbs' => 28, 'fat' => 34, 'image' => 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', 'notes' => 'Deep collagen & mineral restoration'],
        ];

        foreach ($mealPlansToSeed as $mp) {
            DB::statement(
                "INSERT INTO meal_plans (user_id, day_of_week, meal_time, name, calories, protein, carbs, fat, image, notes, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
                [
                    $memberId,
                    $mp['day'],
                    $mp['meal_time'],
                    $mp['name'],
                    $mp['calories'],
                    $mp['protein'],
                    $mp['carbs'],
                    $mp['fat'],
                    $mp['image'],
                    $mp['notes']
                ]
            );
        }

        // 8. Seed water logs
        DB::statement("DELETE FROM water_logs WHERE user_id = ?", [$memberId]);
        DB::statement(
            "INSERT INTO water_logs (user_id, amount_ml, logged_at, created_at, updated_at)
             VALUES 
             (?, 500, NOW() - INTERVAL '6 hours', NOW(), NOW()),
             (?, 750, NOW() - INTERVAL '4 hours', NOW(), NOW()),
             (?, 500, NOW() - INTERVAL '2 hours', NOW(), NOW()),
             (?, 500, NOW() - INTERVAL '30 minutes', NOW(), NOW())",
            [$memberId, $memberId, $memberId, $memberId]
        );

        // 9. Seed gym log
        DB::statement("DELETE FROM gym_logs WHERE user_id = ?", [$memberId]);
        $glRows = DB::select(
            "INSERT INTO gym_logs (user_id, title, duration_minutes, calories_burned, notes, logged_at, created_at, updated_at)
             VALUES (?, 'Restorative Lower Body & Glutes', 45, 320, 'Focused on gentle mobility & glute activation during menstrual phase', NOW(), NOW(), NOW())
             RETURNING id",
            [$memberId]
        );
        $gymLogId = $glRows[0]->id;

        DB::statement(
            "INSERT INTO gym_log_sets (gym_log_id, exercise_name, set_number, reps, weight_kg, completed, created_at, updated_at)
             VALUES 
             (?, 'Goblet Squat', 1, 12, 16.0, true, NOW(), NOW()),
             (?, 'Goblet Squat', 2, 12, 18.0, true, NOW(), NOW()),
             (?, 'Romanian Deadlift', 1, 10, 30.0, true, NOW(), NOW()),
             (?, 'Romanian Deadlift', 2, 10, 35.0, true, NOW(), NOW()),
             (?, 'Glute Bridge', 1, 15, 20.0, true, NOW(), NOW()),
             (?, 'Glute Bridge', 2, 15, 20.0, true, NOW(), NOW())",
            [$gymLogId, $gymLogId, $gymLogId, $gymLogId, $gymLogId, $gymLogId]
        );
    }
}

