<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Teacher extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'nip', 'subject_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /* keahlian lama (single) — dipertahankan untuk kompatibilitas */
    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    /* BARU: daftar keahlian, maksimal 3 (divalidasi di controller) */
    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'teacher_subject', 'teacher_id', 'subject_id')
                    ->withTimestamps();
    }
}