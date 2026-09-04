<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Models\Subject;
use App\Services\AuditLogService; // <-- TAMBAHAN
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index() 
    { 
        return response()->json(Subject::orderBy('name')->get()); 
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