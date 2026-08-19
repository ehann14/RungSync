<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    /**
     * PUT /api/profile
     * Body: { "name": "Ani Nuraeni, M.Kom" }
     * Akses: admin, guru, siswa
     */
    public function updateName(Request $request)
    {
        $data = $request->validate([
            // pakai regex longgar agar nama dengan gelar (koma, titik) diterima
            'name' => ['required', 'string', 'max:100', 'regex:/^[\pL\s.,\'\-]+$/u'],
        ]);

        $user = $request->user();
        $user->update($data);

        return response()->json([
            'message' => 'Nama berhasil diubah.',
            'data'    => $user->fresh(),
        ]);
    }

    /**
     * PUT /api/profile/password
     * Body: { "current_password": "...", "new_password": "..." }
     * Akses: admin, guru, siswa
     */
    public function updatePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password'     => ['required', 'string', 'min:6'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Kata sandi lama tidak cocok.',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($data['new_password']),
        ]);

        return response()->json([
            'message' => 'Kata sandi berhasil diubah.',
        ]);
    }
}