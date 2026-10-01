<?php

namespace App\Http\Controllers;

use App\Models\SchoolClass;
use App\Models\Schedule;
use App\Services\AuditLogService; // <-- TAMBAHAN
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function index() 
    { 
        // students_count = jumlah murid per kelas (tambahan, tidak mengubah field lama)
        return response()->json(SchoolClass::withCount('students')->orderBy('name')->get()); 
    }

    // Daftar murid satu kelas (eager loading, tanpa N+1)
    public function students($id)
    {
        $kelas = SchoolClass::findOrFail($id);

        $murid = $kelas->students()->with('user:id,name,email')->get()
            ->sortBy(fn ($s) => mb_strtolower($s->user?->name ?? ''))
            ->values()
            ->map(fn ($s) => [
                'id'    => $s->id,
                'name'  => $s->user?->name,
                'email' => $s->user?->email,
                'nis'   => $s->nis,
            ]);

        return response()->json([
            'id'       => $kelas->id,
            'name'     => $kelas->name,
            'total'    => $murid->count(),
            'students' => $murid,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|unique:classes,name']);
        
        $class = SchoolClass::create($request->only('name'));
        
        // AUDIT LOG: Created
        AuditLogService::log('created', 'SchoolClass', $class->id);
        
        return response()->json($class, 201);
    }

    public function update(Request $request, $id)
    {
        $class = SchoolClass::findOrFail($id);
        $request->validate(['name' => 'required|string|unique:classes,name,' . $class->id]);
        
        // AUDIT LOG: Updated (Simpan state sebelum update)
        $before = $class->only(['name']);
        
        $class->update($request->only('name'));
        
        $after = $class->only(['name']);
        $changes = [];
        foreach ($before as $key => $value) {
            if ((string)$value !== (string)$after[$key]) {
                $changes[$key] = ['old' => $value, 'new' => $after[$key]];
            }
        }

        if (!empty($changes)) {
            AuditLogService::log('updated', 'SchoolClass', $class->id, $changes);
        }
        
        return response()->json($class);
    }

    public function destroy($id)
    {
        $class = SchoolClass::findOrFail($id);
        if (Schedule::where('class_id', $class->id)->exists()) {
            return response()->json(['message' => 'Kelas masih punya jadwal, tidak bisa dihapus.'], 422);
        }
        
        // AUDIT LOG: Deleted (Simpan state sebelum dihapus)
        AuditLogService::log('deleted', 'SchoolClass', $class->id, $class->only(['name']));
        
        $class->delete();
        return response()->json(['message' => 'Kelas dihapus.']);
    }
}