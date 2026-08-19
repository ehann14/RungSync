<?php
namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Models\Subject;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index() { return Subject::orderBy('name')->get(); }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|unique:subjects,name']);
        return response()->json(Subject::create($request->only('name')), 201);
    }

    public function update(Request $request, $id)
    {
        $subject = Subject::findOrFail($id);
        $request->validate(['name' => 'required|string|unique:subjects,name,' . $subject->id]);
        $subject->update($request->only('name'));
        return response()->json($subject);
    }

    public function destroy($id)
    {
        $subject = Subject::findOrFail($id);
        if (Schedule::where('subject_id', $subject->id)->exists()) {
            return response()->json(['message' => 'Mapel masih dipakai jadwal, tidak bisa dihapus.'], 422);
        }
        $subject->delete();
        return response()->json(['message' => 'Mapel dihapus.']);
    }
}