<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Menjaga route agar hanya bisa diakses role tertentu.
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (! $request->user() || $request->user()->role !== $role) {
            return response()->json(['message' => 'Akses ditolak untuk role ini.'], 403);
        }

        return $next($request);
    }
}