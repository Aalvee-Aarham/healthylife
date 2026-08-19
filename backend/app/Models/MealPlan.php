<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MealPlan extends Model
{
    protected $fillable = [
        'user_id', 'day_of_week', 'meal_time',
        'name', 'calories', 'protein', 'carbs', 'fat',
        'image', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'day_of_week' => 'integer',
            'calories'    => 'integer',
            'protein'     => 'integer',
            'carbs'       => 'integer',
            'fat'         => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
