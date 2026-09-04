<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use App\Services\AuditLogService; // <-- TAMBAHAN
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class StudentController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Student::with(['user', 'class'])->latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'nullable|string|min:8',
            'nis'      => 'nullable|string|max:50',
            'class_id' => 'nullable|exists:classes,id',
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password'] ?? 'siswa12345'),
            'role'     => 'siswa',
        ]);

        $student = Student::create([
            'user_id'  => $user->id,
            'nis'      => $validated['nis'] ?? null,
            'class_id' => $validated['class_id'] ?? null,
        ]);

        // AUDIT LOG: Created
        AuditLogService::log('created', 'Student', $student->id);

        return response()->json(['data' => $student->load(['user', 'class'])], 201);
    }

    public function update(Request $request, Student $student)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email,' . $student->user_id,
            'nis'      => 'nullable|string|max:50',
            'class_id' => 'nullable|exists:classes,id',
        ]);

        // 1. AUDIT LOG: Simpan state SEBELUM update
        $before = [
            'name' => $student->user->name,
            'email' => $student->user->email,
            'nis' => $student->nis,
            'class_id' => $student->class_id,
        ];

        $student->user()->update([
            'name'  => $validated['name'],
            'email' => $validated['email'],
        ]);

        $student->update([
            'nis'      => $validated['nis'] ?? null,
            'class_id' => $validated['class_id'] ?? null,
        ]);

        // 2. AUDIT LOG: Bandingkan dengan state SETELAH update
        $student->refresh(); // Ambil data terbaru dari database
        $after = [
            'name' => $student->user->name,
            'email' => $student->user->email,
            'nis' => $student->nis,
            'class_id' => $student->class_id,
        ];

        $changes = [];
        foreach ($before as $key => $value) {
            if ((string)$value !== (string)$after[$key]) {
                $changes[$key] = ['old' => $value, 'new' => $after[$key]];
            }
        }

        if (!empty($changes)) {
            AuditLogService::log('updated', 'Student', $student->id, $changes);
        }

        return response()->json(['data' => $student->load(['user', 'class'])]);
    }

    public function destroy(Student $student)
    {
        // AUDIT LOG: Deleted (Simpan state sebelum dihapus)
        $before = [
            'name' => $student->user->name,
            'email' => $student->user->email,
            'nis' => $student->nis,
            'class_id' => $student->class_id,
        ];
        AuditLogService::log('deleted', 'Student', $student->id, $before);

        $student->user()?->delete();
        $student->delete();

        return response()->json(['message' => 'Siswa berhasil dihapus.']);
    }

    public function resetPassword(Student $student)
    {
        $newPassword = Str::random(8);

        $student->user->update([
            'password' => Hash::make($newPassword),
        ]);

        return response()->json([
            'message'  => 'Password berhasil direset.',
            'name'     => $student->user->name,
            'password' => $newPassword,
        ]);
    }
}