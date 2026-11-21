<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => $user ? $user->toFrontendArray() : null,
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $cleanName = trim((string) $request->input('name', ''));
        $cleanEmail = strtolower(trim((string) $request->input('email', '')));
        $cleanPassword = (string) $request->input('password', '');
        $cleanPhone = trim((string) $request->input('phone', ''));

        if (mb_strlen($cleanName) < 2) {
            return response()->json(['message' => 'Nama lengkap minimal 2 karakter.'], 422);
        }
        if (! filter_var($cleanEmail, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['message' => 'Format email tidak valid.'], 422);
        }
        if (mb_strlen($cleanPassword) < 6) {
            return response()->json(['message' => 'Kata sandi minimal 6 karakter.'], 422);
        }

        if (User::query()->whereRaw('LOWER(email) = ?', [$cleanEmail])->exists()) {
            return response()->json(['message' => 'Email sudah terdaftar. Silakan masuk.'], 422);
        }

        $user = User::create([
            'name' => $cleanName,
            'email' => $cleanEmail,
            'role' => 'customer',
            'phone' => $cleanPhone !== '' ? $cleanPhone : null,
            'password' => Hash::make($cleanPassword),
        ]);

        Auth::login($user, true);
        $request->session()->regenerate();

        return response()->json(['user' => $user->toFrontendArray()], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $loginInput = strtolower(trim((string) $request->input('email', $request->input('username', ''))));
        $cleanPassword = (string) $request->input('password', '');

        if ($loginInput === '' || $cleanPassword === '') {
            return response()->json(['message' => 'Email/Username dan kata sandi wajib diisi.'], 422);
        }

        $user = User::query()
            ->where(function ($q) use ($loginInput) {
                $q->whereRaw('LOWER(email) = ?', [$loginInput])
                    ->orWhereRaw('LOWER(name) = ?', [$loginInput]);
                if ($loginInput === 'admin') {
                    $q->orWhere('role', 'admin');
                }
            })
            ->first();

        if (! $user || ! $user->password || ! Hash::check($cleanPassword, $user->password)) {
            return response()->json(['message' => 'Email/Username atau kata sandi salah.'], 401);
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        return response()->json(['user' => $user->toFrontendArray()]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['ok' => true]);
    }
}
