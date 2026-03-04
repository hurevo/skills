---
title: OJK Fraud Prevention
impact: high
tags: [ojk, fraud, velocity-controls, mfa, session]
---

## Why

- Financial sessions without inactivity expiry remain valid indefinitely after a user leaves their device — OJK requires maximum 15 minutes for transaction sessions
- Velocity controls that only alert (but don't block) on unusual patterns fail when the fraud team is unavailable outside business hours
- Device binding without alerting on new devices lets an attacker who has stolen credentials transact from any device silently

## Pattern

**Bad** — long sessions, no velocity controls, no device binding:

```php
// ❌ Session that never expires during use
Session::put('auth_token', $token);  // no inactivity timer

// ❌ No transaction velocity check — unlimited transfers
public function transfer(TransferRequest $request): JsonResponse
{
    $this->transferService->execute($request->validated());
    return response()->json(['status' => 'ok']);
}

// ❌ No device binding — login from any device with no alert
public function login(LoginRequest $request): JsonResponse
{
    return response()->json(['token' => $this->auth->attempt($request->only('email', 'password'))]);
}
```

**Good** — 15-min session, velocity limits, device binding with alerts:

```php
// ✅ 15-minute inactivity expiry for financial sessions
// config/session.php
'lifetime'        => 15,
'expire_on_close' => false,
'secure'          => true,
'http_only'       => true,
'same_site'       => 'strict',

// ✅ Velocity control — block after threshold
public function transfer(TransferRequest $request): JsonResponse
{
    $userId = auth()->id();
    $key    = "transfer:velocity:{$userId}:" . now()->format('Y-m-d-H');

    // Block if more than 10 transfers in the last hour
    if (Cache::get($key, 0) >= 10) {
        $this->fraudAlerts->flag($userId, 'velocity_exceeded', $request->all());
        throw new TooManyTransfersException();
    }

    Cache::increment($key, 1);
    Cache::expire($key, 3600);

    return response()->json($this->transferService->execute($request->validated()));
}

// ✅ Device binding — alert on new device
public function login(LoginRequest $request): JsonResponse
{
    $token = $this->auth->attempt($request->only('email', 'password'));
    if (!$token) throw new AuthenticationException();

    $fingerprint = $this->deviceFingerprint->compute($request);
    $known = KnownDevice::where('user_id', auth()->id())->where('fingerprint', $fingerprint)->exists();

    if (!$known) {
        KnownDevice::create(['user_id' => auth()->id(), 'fingerprint' => $fingerprint, 'first_seen' => now()]);
        $this->notifications->sendNewDeviceAlert(auth()->user(), $request->ip());
    }

    return response()->json(compact('token'));
}
```

## Rules

1. Financial transaction sessions must expire after 15 minutes of inactivity — configure session lifetime and enforce server-side, not client-side.
2. Implement velocity controls on all transaction-initiating endpoints — alert AND block when thresholds are exceeded, not just alert.
3. Require MFA for all transaction-initiating actions above the defined transaction threshold (document the threshold in the project agreement).
4. Implement device binding — log device fingerprint on first use and send an alert to the user when a new device is seen.
5. Log all authentication events (success, failure, new device, MFA bypass) to the audit trail regardless of whether a transaction occurred.
