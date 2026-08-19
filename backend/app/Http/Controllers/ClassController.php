<?php
namespace App\Http\Controllers;

use App\Models\SchoolClass;
use App\Models\Schedule;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function index() { return SchoolClass::orderBy('name')->get(); }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|unique:classes,name']);
        return response()->json(SchoolClass::create($request->only('name')), 201);
    }

    public function update(Request $request, $id)
    {
        $class = SchoolClass::findOrFail($id);
        $request->validate(['name' => 'required|string|unique:classes,name,' . $class->id]);
        $class->update($request->only('name'));
        return response()->json($class);
    }

    public function destroy($id)
    {
        $class = SchoolClass::findOrFail($id);
        if (Schedule::where('class_id', $class->id)->exists()) {
            return response()->json(['message' => 'Kelas masih punya jadwal, tidak bisa dihapus.'], 422);
        }
        $class->delete();
        return response()->json(['message' => 'Kelas dihapus.']);
    }
}