<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    protected $fillable = ['class_id', 'subject_id', 'teacher_id', 'room_id', 'day', 'start_time', 'end_time'];

    public function class() { return $this->belongsTo(SchoolClass::class, 'class_id'); }
    public function subject() { return $this->belongsTo(Subject::class); }
    public function teacher() { return $this->belongsTo(Teacher::class); }
    public function room() { return $this->belongsTo(Room::class); }
    public function transfers() { return $this->hasMany(RoomTransfer::class); }
}