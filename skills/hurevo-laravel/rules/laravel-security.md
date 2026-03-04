---
title: Laravel Security
impact: HIGH
tags: [security, auth, sanctum, mass-assignment, uploads]
---

# Laravel Security

Sanctum or Passport for API auth. Explicit `$fillable` on every model. File uploads stored outside public/ with random names. Rate limiting on all auth and sensitive endpoints.

## Why

- **Mass assignment protection**: Without `$fillable`, an attacker can pass `is_admin=1` in any create/update request.
- **File upload safety**: Preserving original filenames and storing in public/ creates direct-access and name-collision risks.
- **Rate limiting**: Unthrottled auth endpoints enable credential stuffing and brute-force attacks.

## Pattern

```php
// Bad — mass assignment open, file in public/, no throttle
class User extends Model {} // no $fillable

public function register(Request $request)
{
    $user = User::create($request->all()); // attacker passes is_admin=1
}

Route::post('/login', [AuthController::class, 'login']); // no throttle

$request->file('avatar')->store('public/avatars', $request->file('avatar')->getClientOriginalName());
// original filename preserved, stored in public/

// Good — explicit fillable, private storage, UUID name, throttled
class User extends Model
{
    protected $fillable = ['name', 'email', 'password'];
    protected $hidden   = ['password', 'remember_token'];
}

public function register(StoreUserRequest $request)
{
    $user = User::create($request->only(['name', 'email', 'password']));
    return new UserResource($user);
}

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1'); // 5 per minute

// File upload
$request->validate(['avatar' => 'required|file|mimes:jpg,png,webp|max:5120']);
$path = 'avatars/' . Str::uuid() . '.webp';
Storage::disk('private')->put($path, $processedImage);
```

```php
// Sanctum token issuance
public function login(LoginRequest $request): JsonResponse
{
    if (! Auth::attempt($request->only('email', 'password'))) {
        throw new AuthenticationException();
    }
    $token = $request->user()->createToken('api', ['*'], now()->addDays(30));
    return response()->json(['token' => $token->plainTextToken]);
}

// Protect routes
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('invoices', InvoiceController::class);
});
```

## Rules

1. Every Model must define `$fillable` explicitly — never leave it empty or use `$guarded = []` on models with sensitive fields.
2. Use Laravel Sanctum for SPA and mobile API auth; use Passport only for OAuth2 flows with third-party clients.
3. Apply `throttle:5,1` middleware (or stricter) to every login, register, password-reset, and MFA endpoint.
4. File uploads: validate MIME type server-side, store on `private` disk, use `Str::uuid()` for the filename.
5. Never store uploaded files under `storage/app/public/` without going through a signed URL — use `Storage::temporaryUrl()` for access.
6. Lock down admin and financial routes with an additional Gate or Middleware check — Sanctum alone is not enough for privilege separation.
7. Run `php artisan route:list --columns=method,uri,middleware` and verify every route has the expected auth middleware before deploy.
