<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'role', 'gender', 'coach_specialty', 'avatar', 'title',
        'weight_current_kg', 'weight_target_kg', 'height_cm', 'age', 'goal', 'activity_level',
        'calories_goal', 'protein_goal_g', 'carbs_goal_g', 'fats_goal_g', 'water_goal_ml',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'weight_current_kg' => 'float',
            'weight_target_kg' => 'float',
        ];
    }

    public function meals()
    {
        return $this->hasMany(Meal::class);
    }

    public function waterLogs()
    {
        return $this->hasMany(WaterLog::class);
    }

    public function gymLogs()
    {
        return $this->hasMany(GymLog::class);
    }

    public function cyclePeriods()
    {
        return $this->hasMany(CyclePeriod::class)->orderBy('started_on', 'desc');
    }

    public function cycleSymptomLogs()
    {
        return $this->hasMany(CycleSymptomLog::class);
    }

    public function coaches()
    {
        return $this->belongsToMany(User::class, 'coach_assignments', 'member_id', 'coach_id')
            ->withPivot('specialty', 'notes')
            ->withTimestamps();
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'coach_assignments', 'coach_id', 'member_id')
            ->withPivot('specialty', 'notes')
            ->withTimestamps();
    }

    public function memberConversations()
    {
        return $this->hasMany(Conversation::class, 'member_id');
    }

    public function coachConversations()
    {
        return $this->hasMany(Conversation::class, 'coach_id');
    }

    public function isCoach(): bool
    {
        return $this->role === 'coach';
    }

    public function isMember(): bool
    {
        return $this->role === 'member';
    }
}
