---
name: hurevo-security
description: Load for any session touching authentication, PII, file uploads, or payments. OWASP-grounded security controls for Hurevo projects.
---

# Hurevo Security

OWASP-grounded security standards for Hurevo projects. Contains 4 rules covering authentication, authorisation, PII handling, and file upload security.

## When to Apply

- Any feature touching login, registration, or session management
- Features handling personal data, health records, or payment information
- File upload functionality
- Reviewing a PR for security-sensitive changes

## Rules Summary

### Authentication (HIGH)

#### authentication - @rules/authentication.md

Sanctum or Passport for API auth. bcrypt cost ≥ 12. MFA for admin/financial roles. Account lockout after 5 failed attempts. Rate-limit all auth endpoints.

```php
// Bad — MD5 password, no rate limiting
$hash = md5($request->password);
Route::post('/login', [AuthController::class, 'login']);

// Good — bcrypt, throttled endpoint
$hash = Hash::make($request->password); // default cost 12
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1'); // 5 attempts per minute
```

### Authorisation (HIGH)

#### authorisation - @rules/authorisation.md

Deny by default. Policies for all resource access. Never use client-supplied IDs to access resources without ownership verification. Log all authorisation denials.

```php
// Bad — no ownership check
public function show(Request $request, int $invoiceId) {
    return Invoice::findOrFail($invoiceId); // any user can access any invoice
}

// Good — policy enforces ownership
public function show(Request $request, Invoice $invoice) {
    $this->authorize('view', $invoice); // checks $invoice->user_id === auth()->id()
    return new InvoiceResource($invoice);
}
```

### PII Handling (HIGH)

#### pii-handling - @rules/pii-handling.md

Encrypt PII columns at rest. Never log PII. Mask in UI by default. Data retention policy defined at project start. Cross-border transfers require documented legal basis under UU PDP.

```php
// Bad — plain text PII, full display, logged
$user->nik = $request->nik; // stored plain
Log::info("User registered: {$user->email}");
echo $user->phone_number; // full display

// Good — encrypted, masked, not logged
protected $casts = ['nik' => 'encrypted', 'phone_number' => 'encrypted'];
Log::info("User registered", ['user_id' => $user->id]);
echo mask_phone($user->phone_number); // "081*****890"
```

### File Uploads (HIGH)

#### file-uploads - @rules/file-uploads.md

Validate MIME type server-side. Store outside webroot with random UUID filename. Re-process images through Intervention Image to strip EXIF. Maximum file size enforced at application layer.

```php
// Bad — stores in public/, preserves original filename, no MIME validation
$request->file('avatar')->store('public/avatars', $originalName);

// Good — private storage, UUID name, MIME validated, image reprocessed
$request->validate(['avatar' => 'required|file|mimes:jpg,png,webp|max:5120']);
$image = Image::read($request->file('avatar'))->encodeByExtension('webp');
$path = 'avatars/' . Str::uuid() . '.webp';
Storage::disk('private')->put($path, $image);
```
