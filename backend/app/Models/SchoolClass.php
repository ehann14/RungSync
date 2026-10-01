<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchoolClass extends Model
{
    protected $table = 'classes';
    protected $fillable = ['name'];

    // Foreign key harus disebut eksplisit: nama model SchoolClass, kolomnya class_id
    public function students() { return $this->hasMany(Student::class, 'class_id'); }
    public function schedules() { return $this->hasMany(Schedule::class, 'class_id'); }
}