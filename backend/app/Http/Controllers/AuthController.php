<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate(['email' => 'required|email', 'password' => 'required']);

        if (! Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages(['email' => 'Email atau password salah.']);
        }

        $user  = Auth::user();
        $token = $user->createToken('rungsync-api')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $this->loadUser($user)]);
    }

    public function me(Request $request)
    {
        return response()->json($this->loadUser($request->user()));
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();
        return response()->json(['message' => 'Logout berhasil.']);
    }

    private function loadUser($user)
    {
        return $user->load('teacher:id,user_id,nip', 'student:id,user_id,class_id,nis', 'student.class:id,name');
    }
}