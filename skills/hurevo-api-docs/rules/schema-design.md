---
title: Schema Design
impact: HIGH
tags: [openapi, schemas, components, enums, pagination]
---

# Schema Design

Named components under `#/components/schemas` — never inline. Document all nullable fields with an explanation. Use string enums, never undocumented integer codes. Paginated list responses document `meta` and `links`.

## Why

- **Reuse**: Inline schemas are duplicated across dozens of endpoints. Named components are defined once and referenced everywhere — change in one place propagates everywhere.
- **Self-documenting enums**: `status: 2` means nothing to a new developer. `status: "paid"` is self-explanatory and makes client-side switch statements readable.
- **Pagination contracts**: Without documenting `meta` and `links`, consumers don't know how to paginate — they request all records at once or implement pagination wrong.

## Pattern

```yaml
# Bad — inline schema, integer enum, no nullable explanation, no pagination meta
paths:
  /api/v1/invoices:
    get:
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      type: object
                      properties:
                        id: { type: integer }
                        status: { type: integer }   # what does 2 mean?
                        paid_at: { type: string }   # nullable? format?

# Good — named components, string enums, nullable with description, pagination documented
components:
  schemas:
    InvoiceResource:
      type: object
      required: [id, status, amount_idr, created_at]
      properties:
        id:
          type: integer
          example: 42
        status:
          type: string
          enum: [draft, sent, paid, overdue, cancelled]
          example: paid
        amount_idr:
          type: integer
          description: Invoice total in Indonesian Rupiah (IDR), stored as integer cents
          example: 5000000
        paid_at:
          type: string
          format: date-time
          nullable: true
          description: "ISO 8601 timestamp of payment confirmation. Null until payment is received."
          example: "2024-03-15T10:30:00+07:00"
        client:
          $ref: '#/components/schemas/ClientResource'
        created_at:
          type: string
          format: date-time

    PaginatedInvoiceList:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/InvoiceResource'
        meta:
          $ref: '#/components/schemas/PaginationMeta'
        links:
          $ref: '#/components/schemas/PaginationLinks'

    PaginationMeta:
      type: object
      properties:
        current_page: { type: integer, example: 1 }
        from:         { type: integer, example: 1 }
        last_page:    { type: integer, example: 5 }
        per_page:     { type: integer, example: 20 }
        to:           { type: integer, example: 20 }
        total:        { type: integer, example: 97 }
```

## Rules

1. Every schema is a named component under `#/components/schemas/` — never define schemas inline in endpoint annotations.
2. Use string enums for all status and type fields — document every possible value.
3. Mark every nullable field as `nullable: true` and add a `description` explaining when it's null and when it's populated.
4. All currency values are integers in the smallest unit (IDR: full rupiah; USD: cents) — document the unit in the field description.
5. Paginated list endpoints always return a `PaginationMeta` and `PaginationLinks` component in the response.
6. Timestamps use ISO 8601 format (`date-time`) with timezone offset — include an `example` value with the `+07:00` WIB timezone.
7. Request schemas for create and update are separate components (`CreateInvoiceRequest`, `UpdateInvoiceRequest`) — they often differ in required fields.
