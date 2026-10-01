<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Models\Subject;
use App\Models\Teacher; // <-- TAMBAHAN
use App\Services\AuditLogService; // <-- TAMBAHAN
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index() 
    { 
        return response()->json(Subject::orderBy('name')->get()); 
    }

    // Daftar guru yang mengajar satu mapel (pivot teacher_subject + subject_id lama), tanpa N+1
    public function teachers($id)
    {
        $mapel = Subject::findOrFail($id);

        $guru = Teacher::with('user:id,name,email')
            ->where(function ($q) use ($mapel) {
                $q->where('subject_id', $mapel->id)
                  ->orWhereHas('subjects', fn ($s) => $s->where('subjects.id', $mapel->id));
            })
            ->get()
            ->sortBy(fn ($t) => mb_strtolower($t->user?->name ?? ''))
            ->values()
            ->map(fn ($t) => [
                'id'    => $t->id,
                'name'  => $t->user?->name,
                'email' => $t->user?->email,
                'nip'   => $t->nip,
                'utama' => (int) $t->subject_id === (int) $mapel->id,
            ]);

        return response()->json([
            'id'       => $mapel->id,
            'name'     => $mapel->name,
            'total'    => $guru->count(),
            'teachers' => $guru,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|unique:subjects,name']);
        
        $subject = Subject::create($request->only('name'));
        
        // AUDIT LOG: Created
        AuditLogService::log('created', 'Subject', $subject->id);
        
        return response()->json($subject, 201);
    }

    public function update(Request $request, $id)
    {
        $subject = Subject::findOrFail($id);
        $request->validate(['name' => 'required|string|unique:subjects,name,' . $subject->id]);
        
        // AUDIT LOG: Updated (Simpan state sebelum update)
        $before = $subject->only(['name']);
        
        $subject->update($request->only('name'));
        
        $after = $subject->only(['name']);
        $changes = [];
        foreach ($before as $key => $value) {
            if ((string)$value !== (string)$after[$key]) {
                $changes[$key] = ['old' => $value, 'new' => $after[$key]];
            }
        }

        if (!empty($changes)) {
            AuditLogService::log('updated', 'Subject', $subject->id, $changes);
        }
        
        return response()->json($subject);
    }

    public function destroy($id)
    {
        $subject = Subject::findOrFail($id);
        if (Schedule::where('subject_id', $subject->id)->exists()) {
            return response()->json(['message' => 'Mapel masih dipakai jadwal, tidak bisa dihapus.'], 422);
        }
        
        // AUDIT LOG: Deleted (Simpan state sebelum dihapus)
        AuditLogService::log('deleted', 'Subject', $subject->id, $subject->only(['name']));
        
        $subject->delete();
        return response()->json(['message' => 'Mapel dihapus.']);
    }
}