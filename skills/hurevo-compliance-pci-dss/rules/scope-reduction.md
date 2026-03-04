---
title: PCI DSS Scope Reduction
impact: high
tags: [pci-dss, scope, cardholder-data, tokenisation]
---

## Why

- The primary engineering goal is to reduce PCI scope — every system that touches raw card data is in scope for full PCI DSS assessment, including annual pen tests
- Tokenisation shifts card data handling to a certified processor — your application only stores a merchant token, not the PAN
- Redirecting users to a hosted payment form means the browser never sends card data to your servers — out of scope by definition

## Pattern

**Bad** — application collects raw card data, stores PAN, in-scope for full assessment:

```html
<!-- ❌ Collecting card data directly — application is in PCI scope -->
<form id="payment-form">
  <input type="text" name="cardnumber" placeholder="Card Number" required />
  <input type="text" name="expiry" placeholder="MM/YY" required />
  <input type="text" name="cvv" placeholder="CVV" required />
  <button type="submit">Pay</button>
</form>
```

```php
// ❌ Storing PAN in the database
$payment = Payment::create([
    'card_number' => $request->cardnumber,  // raw PAN — application is in scope
    'amount'      => $request->amount,
]);
```

**Good** — hosted/iframe form or tokenised flow, no raw PAN ever in application:

```html
<!-- ✅ Option 1: Stripe Hosted Payment Form — no card data on your servers -->
<form id="payment-form">
  <input type="hidden" name="session_id" value="{{ $session->id }}" />
  <button type="submit">Pay with Stripe</button>
</form>

<!-- ✅ Option 2: Stripe Elements — iframe for card capture, tokenised in browser -->
<div id="card-element"></div>
<button type="button" id="submit-btn">Pay</button>

<script>
  stripe.elements().create('card').mount('#card-element');
  document.getElementById('submit-btn').addEventListener('click', async () => {
    const { token } = await stripe.createToken(cardElement);
    // Token sent to server — not the PAN
  });
</script>
```

```php
// ✅ Application only stores the processor's token and last 4 digits
$payment = Payment::create([
    'stripe_payment_method_id' => $request->pm_id,  // not a PAN — a tokenised reference
    'card_last_four'           => $request->last_four,
    'card_brand'               => $request->brand,  // Visa, Mastercard, Amex
    'amount'                   => $request->amount,
]);

// CVV never stored — not even temporarily
// And if your application receives raw card data for any reason — it's in scope
// for full PCI DSS assessment. Confirm with the client's QSA before proceeding.
```

## Rules

1. The primary goal is to minimise PCI scope by avoiding raw card data — use a PCI-certified processor (Stripe, Midtrans, Xendit) with a hosted or tokenised flow.
2. If the application must receive raw card data (rare, requires QSA approval), document the Cardholder Data Environment (CDE) boundary explicitly — every system that connects to it is in scope.
3. Store only the processor's payment token and masked PAN (last 4 digits + brand) — never store CVV, full magnetic stripe data, or PIN.
4. Never store CVV under any circumstances, including temporarily during processing — it is explicitly prohibited in PCI DSS.
5. Redirect users to the processor's hosted form or use the processor's iframe SDK — your servers should never receive raw card details.
