<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GymLogSet extends Model
{
    protected $fillable = [
        'gym_log_id', 'exercise_name', 'set_number', 'reps', 'weight_kg', 'completed',
    ];

    protected function casts(): array
    {
        return [
            'weight_kg' => 'float',
            'completed' => 'boolean',
        ];
    }

    public function gymLog(): BelongsTo
    {
        return $this->belongsTo(GymLog::class);
    }
}
