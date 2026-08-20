<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Normalisasi role dari database ke format standar
        $userRole = strtolower($user->role);
        $requiredRole = strtolower($role);

        $map = [
            'guru'    => 'teacher',
            'teacher' => 'teacher',
            'siswa'   => 'student',
            'student' => 'student',
            'admin'   => 'admin',
        ];

        $normalizedUser = $map[$userRole] ?? null;
        $normalizedRequired = $map[$requiredRole] ?? null;

        // Jika role user tidak match dengan role yang diminta
        if ($normalizedUser !== $normalizedRequired) {
            return response()->json([
                'message' => 'Akses ditolak. Anda tidak memiliki izin untuk mengakses halaman ini.'
            ], 403);
        }

        return $next($request);
    }
}