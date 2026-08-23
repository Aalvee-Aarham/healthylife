<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CyclePeriod extends Model
{
    protected $fillable = ['user_id', 'started_on', 'ended_on', 'flow'];

    protected function casts(): array
    {
        return [
            'started_on' => 'date',
            'ended_on'   => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Duration of the period in days.
     * Returns null if period is still ongoing.
     */
    public function getDurationDaysAttribute(): ?int
    {
        if (!$this->ended_on) {
            return null;
        }
        return (int) $this->started_on->diffInDays($this->ended_on) + 1;
    }
}
