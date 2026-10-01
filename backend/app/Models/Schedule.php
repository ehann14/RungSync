<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Schedule extends Model
{
    protected $fillable = [
        'class_id', 'subject_id', 'teacher_id', 'room_id', 
        'day', 'start_time', 'end_time', 'academic_period_id' // <-- TAMBAHAN
    ];

    public function class() { return $this->belongsTo(SchoolClass::class, 'class_id'); }
    public function subject() { return $this->belongsTo(Subject::class); }
    public function teacher() { return $this->belongsTo(Teacher::class); }
    public function room() { return $this->belongsTo(Room::class); }
    public function transfers() { return $this->hasMany(RoomTransfer::class); }
    
    // <-- TAMBAHAN RELASI BARU
    public function academicPeriod() { return $this->belongsTo(AcademicPeriod::class); }
}