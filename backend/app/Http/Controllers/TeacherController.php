<?php

namespace App\Http\Controllers;

use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TeacherController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Teacher::with(['user', 'subject', 'subjects'])->latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'email'       => 'required|email|unique:users,email',
            'password'    => 'nullable|string|min:8',
            'nip'         => 'nullable|string|max:50',
            'subject_id'  => 'nullable|exists:subjects,id',
            'subject_ids' => 'nullable|array|max:3',          // ← maksimal 3 mapel
            'subject_ids.*' => 'exists:subjects,id',
        ]);

        $ids = $validated['subject_ids'] ?? null;
        $primary = $ids ? $ids[0] : ($validated['subject_id'] ?? null);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password'] ?? 'guru12345'),
            'role'     => 'guru',
        ]);

        $teacher = Teacher::create([
            'user_id'    => $user->id,
            'nip'        => $validated['nip'] ?? null,
            'subject_id' => $primary,
        ]);

        // simpan keahlian (max 3 sudah dijaga validasi)
        $teacher->subjects()->sync($ids ?: ($primary ? [$primary] : []));

        return response()->json(['data' => $teacher->load(['user', 'subject', 'subjects'])], 201);
    }

    public function update(Request $request, Teacher $teacher)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'email'       => 'required|email|unique:users,email,' . $teacher->user_id,
            'nip'         => 'nullable|string|max:50',
            'subject_id'  => 'nullable|exists:subjects,id',
            'subject_ids' => 'nullable|array|max:3',
            'subject_ids.*' => 'exists:subjects,id',
        ]);

        $ids = $validated['subject_ids'] ?? null;
        $primary = $ids ? $ids[0] : ($validated['subject_id'] ?? null);

        $teacher->user()->update([
            'name'  => $validated['name'],
            'email' => $validated['email'],
        ]);

        $teacher->update([
            'nip'        => $validated['nip'] ?? null,
            'subject_id' => $primary,
        ]);

        if ($ids !== null || array_key_exists('subject_id', $validated)) {
            $teacher->subjects()->sync($ids ?: ($primary ? [$primary] : []));
        }

        return response()->json(['data' => $teacher->load(['user', 'subject', 'subjects'])]);
    }

    public function destroy(Teacher $teacher)
    {
        $teacher->user()?->delete();
        $teacher->delete();

        return response()->json(['message' => 'Guru berhasil dihapus.']);
    }

    public function resetPassword(Teacher $teacher)
    {
        $newPassword = Str::random(8);

        $teacher->user->update([
            'password' => Hash::make($newPassword),
        ]);

        return response()->json([
            'message'  => 'Password berhasil direset.',
            'name'     => $teacher->user->name,
            'password' => $newPassword,
        ]);
    }
}