<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoomTransfer extends Model
{
    protected $fillable = [
        'schedule_id', 'teacher_id', 'from_room_id', 'to_room_id',
        'reason', 'status', 'transferred_at', 'date',
    ];

    protected $casts = ['transferred_at' => 'datetime'];

    public function schedule() { return $this->belongsTo(Schedule::class); }
    public function teacher() { return $this->belongsTo(Teacher::class); }
    public function fromRoom() { return $this->belongsTo(Room::class, 'from_room_id'); }
    public function toRoom() { return $this->belongsTo(Room::class, 'to_room_id'); }
}