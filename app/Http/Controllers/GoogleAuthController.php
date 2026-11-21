<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class GoogleAuthController extends Controller
{
    private function getGoogleConfig(Request $request): array
    {
        $clientId = trim((string) config('services.google.client_id', ''));
        $clientSecret = trim((string) config('services.google.client_secret', ''));
        $isConfigured = $clientId !== ''
            && $clientSecret !== ''
            && $clientId !== 'YOUR_GOOGLE_CLIENT_ID'
            && $clientSecret !== 'YOUR_GOOGLE_CLIENT_SECRET';

        $redirectUri = trim((string) config('services.google.redirect', ''))
            ?: 'http://localhost:3000/api/auth/google/callback';

        return [
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'redirect_uri' => $redirectUri,
            'configured' => $isConfigured,
        ];
    }

    public function status(Request $request): JsonResponse
    {
        $cfg = $this->getGoogleConfig($request);

        return response()->json([
            'configured' => $cfg['configured'],
            'redirectUri' => $cfg['redirect_uri'],
        ]);
    }

    public function redirect(Request $request): RedirectResponse
    {
        $cfg = $this->getGoogleConfig($request);
        if (! $cfg['configured']) {
            return redirect('/?auth_error=google_not_configured');
        }

        $state = Str::random(40);
        $request->session()->put('google_oauth_state', $state);
        $request->session()->put('google_oauth_checkout', $request->query('checkout') === '1');

        $query = http_build_query([
            'client_id' => $cfg['client_id'],
            'redirect_uri' => $cfg['redirect_uri'],
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'prompt' => 'select_account',
            'access_type' => 'online',
        ]);

        return redirect()->away('https://accounts.google.com/o/oauth2/v2/auth?'.$query);
    }

    public function callback(Request $request): RedirectResponse
    {
        $cfg = $this->getGoogleConfig($request);
        $savedState = (string) $request->session()->pull('google_oauth_state', '');
        $shouldOpenCheckout = (bool) $request->session()->pull('google_oauth_checkout', false);

        if (! $cfg['configured']) {
            return redirect('/?auth_error=google_not_configured');
        }
        if ($request->query('error')) {
            return redirect('/?auth_error=google_cancelled');
        }

        $code = (string) $request->query('code', '');
        $returnedState = (string) $request->query('state', '');
        if ($code === '' || $returnedState === '' || $savedState === '' || ! hash_equals($savedState, $returnedState)) {
            return redirect('/?auth_error=google_state_invalid');
        }

        try {
            $tokenRes = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'code' => $code,
                'client_id' => $cfg['client_id'],
                'client_secret' => $cfg['client_secret'],
                'redirect_uri' => $cfg['redirect_uri'],
                'grant_type' => 'authorization_code',
            ]);

            if (! $tokenRes->ok() || ! $tokenRes->json('access_token')) {
                return redirect('/?auth_error=google_token_failed');
            }

            $profileRes = Http::withToken((string) $tokenRes->json('access_token'))
                ->get('https://www.googleapis.com/oauth2/v3/userinfo');

            if (! $profileRes->ok()) {
                return redirect('/?auth_error=google_profile_failed');
            }

            $email = strtolower(trim((string) $profileRes->json('email', '')));
            $googleId = trim((string) $profileRes->json('sub', ''));
            $name = trim((string) $profileRes->json('name', '')) ?: explode('@', $email)[0] ?: 'Pengguna Google';
            $avatar = trim((string) $profileRes->json('picture', '')) ?: null;

            if ($email === '' || $googleId === '') {
                return redirect('/?auth_error=google_profile_failed');
            }

            $user = User::query()
                ->where('google_id', $googleId)
                ->orWhereRaw('LOWER(email) = ?', [$email])
                ->first();

            if (! $user) {
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'role' => 'customer',
                    'google_id' => $googleId,
                    'avatar' => $avatar,
                    'password' => null,
                    'email_verified_at' => now(),
                ]);
            } else {
                $user->update([
                    'google_id' => $googleId,
                    'avatar' => $avatar ?? $user->avatar,
                    'name' => $user->name ?: $name,
                ]);
            }

            Auth::login($user, true);
            $request->session()->regenerate();

            $nextUrl = $shouldOpenCheckout
                ? '/?auth=google_success&checkout=1'
                : '/?auth=google_success';

            return redirect($nextUrl);
        } catch (\Throwable $e) {
            return redirect('/?auth_error=google_server_error');
        }
    }
}
