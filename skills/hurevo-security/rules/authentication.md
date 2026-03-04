---
title: Authentication
impact: HIGH
tags: [authentication, passwords, mfa, sanctum, rate-limiting]
---

# Authentication

Sanctum or Passport for API auth. bcrypt cost ≥ 12 for passwords. MFA required for admin and financial roles. Account lockout after 5 failed attempts. Rate-limit all auth endpoints.

## Why

- **Password security**: bcrypt with cost ≥12 takes ~0.3s to compute — fast enough for UX, slow enough to make offline brute-force impractical. MD5 and SHA1 are instant.
- **MFA**: Even with leaked credentials, MFA prevents account takeover on sensitive roles.
- **Rate limiting**: Without throttling, credential stuffing attacks can test millions of username/password combinations undetected.

## Pattern

```php
// Bad — MD5 password, no MFA, no throttle, custom session token
class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $user = User::where('email', $request->email)
            ->where('password', md5($request->password)) // instantly reversible
            ->first();

        if (! $user) {
            return response()->json(['error' => 'invalid'], 401);
        }

        $token = bin2hex(random_bytes(16)); // custom token, not Sanctum
        session(['token' => $token]);
        return response()->json(['token' => $token]);
    }
}
Route::post('/login', [AuthController::class, 'login']); // no throttle

// Good — bcrypt, Sanctum, throttled, lockout
class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            RateLimiter::hit('login:' . $request->ip(), 60);
            throw ValidationException::withMessages([
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        if (RateLimiter::tooManyAttempts('login:' . $request->ip(), 5)) {
            throw new ThrottleRequestsException('Too many login attempts.');
        }

        RateLimiter::clear('login:' . $request->ip());

        // MFA check for admin/financial roles
        if ($user->hasRole(['admin', 'finance']) && ! $request->has('mfa_code')) {
            return response()->json(['requires_mfa' => true], 202);
        }

        $token = $user->createToken('api', ['*'], now()->addDays(30));
        return response()->json(['token' => $token->plainTextToken]);
    }
}

// routes/api.php
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');
Route::post('/register', [AuthController::class, 'register'])
    ->middleware('throttle:10,1');
Route::post('/password/reset', [PasswordController::class, 'reset'])
    ->middleware('throttle:3,5');
```

## Rules

1. Use Laravel Sanctum for SPA and mobile API authentication — Passport only for OAuth2 third-party flows.
2. Hash passwords with bcrypt at cost ≥12 (`Hash::make()` uses bcrypt cost 12 by default in Laravel).
3. Never store passwords in MD5, SHA1, or plain text — if legacy hashes exist, implement an on-login upgrade path.
4. Apply `throttle:5,1` middleware to all login, register, and password reset routes.
5. Implement RateLimiter-based account lockout after 5 failed attempts per IP — lock for 15 minutes minimum.
6. Require MFA (TOTP or SMS) for users with admin, finance, or any role granting access to PII or payment data.
7. Sanctum tokens must have an expiry — use `now()->addDays(30)` for mobile, `now()->addHours(2)` for session-based SPAs.
