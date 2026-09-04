<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicPeriod extends Model
{
    protected $fillable = ['name', 'year_start', 'year_end', 'semester', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
        'year_start' => 'integer',
        'year_end' => 'integer',
    ];

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }

    public static function active(): ?self
    {
        return static::where('is_active', true)->first();
    }
}