<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CycleSymptomLog extends Model
{
    protected $fillable = ['user_id', 'logged_on', 'symptom_key'];

    protected function casts(): array
    {
        return [
            'logged_on' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
