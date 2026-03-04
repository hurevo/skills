---
title: PCI DSS Access Control
impact: high
tags: [pci-dss, access-control, mfa, unique-ids, privilege]
---

## Why

- Shared logins for production access make it impossible to hold an individual accountable for accessing cardholder data — PCI requires unique user IDs
- Administrative access to CDE systems without MFA allows a compromised password to unlock payment configuration and audit log deletion
- Forgetting to remove access when an engineer leaves or changes roles leaves standing privileges on the most sensitive systems — access removal must be automated

## Pattern

**Bad** — shared accounts, no MFA, stale access not removed:

```
# Production access procedures (bad)
- All payment engineers login with a shared "payment" account
- Admin users login with the "admin" account
- No MFA — username/password sufficient
- When Sarah leaves the team: "we'll remove her access eventually"
```

**Good** — individual IDs, MFA required, automated access removal:

```terraform
# ✅ Each engineer has an individual AWS IAM user
# Sarah's account
resource "aws_iam_user" "sarah" {
  name = "sarah.chen@hurevo.com"
}

resource "aws_iam_group_membership" "payment_engineers" {
  name = "payment-team"
  users = [
    aws_iam_user.sarah.name,
    aws_iam_user.david.name,
  ]
  group = aws_iam_group.payment_engineers.name
}

# ✅ MFA required for CDE access
resource "aws_iam_policy" "mfa_required" {
  name = "require-mfa-for-cde"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Deny"
        Action   = "ec2:*"
        Resource = "*"
        Condition = {
          Bool = { "aws:MultiFactorAuthPresent" = "false" }
        }
      }
    ]
  })
}

# ✅ Automated access removal on role change or departure
# When Sarah moves to a different team:
resource "aws_iam_user_group_membership" "sarah" {
  user = aws_iam_user.sarah.name
  groups = [
    # Removed from payment-engineers group
    aws_iam_group.general_engineers.name,
  ]
}
```

```php
// ✅ Application-level access control for payment operations
class PaymentController
{
    public function authoriseRefund(Request $request): JsonResponse
    {
        // MFA already verified by middleware before request reaches controller
        Gate::authorize('authorise-refund');  // fails if user doesn't have permission

        // Log the action with individual user ID
        PaymentAuditLog::record(
            auth()->user()->email,  // individual account — not "admin"
            'REFUND_AUTHORISED',
            $request->order_id
        );

        return response()->json(['status' => 'authorized']);
    }
}
```

## Rules

1. Assign unique user IDs to every person accessing CDE systems — never use shared or generic accounts for production payment access.
2. Require MFA for all administrative access to payment systems and configuration — prevent compromised passwords from unlocking sensitive operations.
3. Remove access within 24 hours when an employee leaves or changes role — implement this with automated role revocation in identity management systems.
4. Implement least privilege — payment processors use read-only access, developers get testing access, only senior engineers get production refund authority.
5. Log all access to cardholder data and administrative actions — every login, every configuration change, every payment operation must be auditable to a named individual.
