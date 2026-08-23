<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Meal extends Model
{
    protected $fillable = [
        'user_id', 'name', 'calories', 'protein', 'carbs', 'fat',
        'category', 'image', 'completed', 'logged_at',
    ];

    protected function casts(): array
    {
        return [
            'completed' => 'boolean',
            'logged_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
