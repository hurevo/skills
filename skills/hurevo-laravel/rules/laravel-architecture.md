---
title: Laravel Architecture
impact: HIGH
tags: [architecture, laravel, services, controllers]
---

# Laravel Architecture

Controllers are the thinnest possible layer. Business logic lives in Service classes, authorisation in Policies, input validation in Form Requests, and deferrable side effects in Jobs.

## Why

- **Testability**: Services and Jobs are testable without HTTP infrastructure.
- **Single responsibility**: Each class has one reason to change.
- **Reuse**: A Service called from a controller can also be called from a Job, console command, or webhook handler without duplicating logic.

## Pattern

```php
// Bad — fat controller does everything
class InvoiceController extends Controller
{
    public function store(Request $request)
    {
        $this->validate($request, [
            'client_id' => 'required|exists:clients,id',
            'amount'    => 'required|integer|min:1',
        ]);

        $invoice = Invoice::create([
            'client_id' => $request->client_id,
            'amount'    => $request->amount,
            'status'    => 'draft',
        ]);

        Mail::to($invoice->client->email)->send(new InvoiceCreated($invoice));

        return response()->json($invoice, 201);
    }
}

// Good — thin controller, concerns separated
class InvoiceController extends Controller
{
    public function store(StoreInvoiceRequest $request, InvoiceService $invoices): InvoiceResource
    {
        $this->authorize('create', Invoice::class);
        $invoice = $invoices->create($request->validated());
        return new InvoiceResource($invoice);
    }
}

// app/Services/InvoiceService.php
class InvoiceService
{
    public function create(array $data): Invoice
    {
        $invoice = Invoice::create($data);
        SendInvoiceCreatedNotification::dispatch($invoice);
        return $invoice;
    }
}

// app/Http/Requests/StoreInvoiceRequest.php
class StoreInvoiceRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'client_id' => 'required|exists:clients,id',
            'amount'    => 'required|integer|min:1',
        ];
    }
}
```

## Rules

1. Controllers handle HTTP only: receive request, call service, return response.
2. Validation lives in Form Requests — never `$request->validate()` inline in a controller.
3. Authorisation lives in Policies — call `$this->authorize()` at the top of each controller action.
4. Business logic lives in Service classes in `app/Services/`.
5. Side effects that can be deferred (emails, webhooks, syncs) go in Jobs dispatched from the Service.
6. No `Model::create($request->all())` — always pass a named subset or the validated data from a Form Request.
