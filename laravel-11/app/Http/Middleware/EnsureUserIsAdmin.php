<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user() || ! $request->user()->is_admin) {
            // Kembalikan 404 agar halaman admin tidak mudah ditebak oleh user biasa
            abort(404);
        }

        return $next($request);
    }
}
