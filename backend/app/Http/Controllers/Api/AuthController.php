<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil',
            'token'   => $token,
            'user'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
        ]);
    }

        public function me(Request $request)
    {
        $user = $request->user();

        $relations = [];
        if (method_exists($user, 'student')) $relations[] = 'student.class';
        if (method_exists($user, 'teacher')) $relations[] = 'teacher.subject';

        if ($relations) {
            try {
                $user->load($relations);
            } catch (\Exception $e) {
                // relasi bermasalah → kembalikan user dasar
            }
        }

        // Kembalikan user dalam 3 bentuk sekaligus agar kompatibel
        // dengan cara frontend membaca: res.data / res.data.user / res.data.data
        return response()->json(array_merge(
            $user->toArray(),
            ['user' => $user, 'data' => $user]
        ));
    }
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logout berhasil']);
    }
}