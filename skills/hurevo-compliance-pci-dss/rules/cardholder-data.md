---
title: Cardholder Data Handling
impact: high
tags: [pci-dss, cardholder-data, pan, masking, encryption]
---

## Why

- Logging a full card number "temporarily for debugging" creates a permanent record in logs that are rarely cleaned up — PCI auditors will find it
- Displaying a full PAN in the UI, even to authorised staff, is unnecessary and increases breach risk — masking to last 4 digits provides sufficient identification
- CVV must never be stored after authorisation — PCI explicitly prohibits it, and storing it voids the payment processor's liability

## Pattern

**Bad** — full PAN in logs, full PAN displayed, CVV stored:

```php
// ❌ Full card number in application log
Log::info('Processing payment', [
    'amount'      => 100,
    'card_number' => '4242424242424242',  // PAN in logs — permanent record
]);

// ❌ Full PAN displayed in the UI
<p>Charging card: {{ $payment->card_number }}</p>

// ❌ CVV stored in the database
$payment = Payment::create([
    'card_number' => $request->cardnumber,
    'cvv'         => $request->cvv,  // forbidden — violates PCI DSS Req. 3.2.1
]);
```

**Good** — masked display, CVV never stored, no PAN in logs:

```php
// ✅ Log only transaction metadata — no card data
Log::info('Payment processed', [
    'payment_id'    => $payment->id,
    'amount'        => $payment->amount,
    'processor'     => 'stripe',
    'processor_txn' => $payment->processor_transaction_id,
]);

// ✅ Display masked PAN only
<p>Charging card: **** **** **** {{ $payment->card_last_four }}</p>

// ✅ CVV never stored — not even in a column with a comment
// If you need to validate CVV: do it in real-time with the processor and discard immediately
// Do NOT store it in the database
Schema::table('payments', function (Blueprint $table) {
    // No cvv column — ever
    $table->string('card_last_four', 4);
    $table->string('card_brand', 20);
});

// ✅ If storing PAN is unavoidable (requires QSA approval):
// 1. Encrypt with AES-256
// 2. Store encryption key separately — not in the application codebase
// 3. Mask to show only last 4 in all displays
class Payment extends Model
{
    protected $casts = [
        'card_number_encrypted' => EncryptedCast::class,
    ];

    public function getCardDisplayAttribute(): string
    {
        return '**** **** **** ' . substr($this->card_number_encrypted, -4);
    }
}
```

## Rules

1. Never log full or even partial card numbers — log only transaction IDs and processor-provided identifiers.
2. Store only the last 4 digits of the PAN for display purposes — never store or transmit the full PAN in the application.
3. Never store CVV, CVC, or full magnetic stripe data under any circumstance — it is explicitly prohibited by PCI DSS Req. 3.2.1.
4. Mask PANs in all UI displays to show only brand and last 4 digits.
5. If PAN storage is unavoidable (extremely rare, requires QSA written approval), encrypt with AES-256 and store the key separately from the data in a dedicated key management system.
