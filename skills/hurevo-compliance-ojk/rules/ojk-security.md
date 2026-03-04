---
title: OJK Security Controls
impact: high
tags: [ojk, security, encryption, tls, penetration-testing]
---

## Why

- OJK-regulated systems that use TLS 1.0 or 1.1 are non-compliant — these protocols have known vulnerabilities and are explicitly prohibited
- Critical vulnerabilities discovered during a penetration test must be disclosed to the client's CISO within 24 hours — waiting for a formal report violates OJK incident reporting obligations
- mTLS for OJK system integrations is mandated by specific POJK regulations — one-way TLS is not sufficient for inter-system communication with regulated counterparties

## Pattern

**Bad** — TLS 1.0 allowed, no pen test budget, one-way TLS for integrations:

```nginx
# ❌ Allows TLS 1.0 and 1.1 — prohibited under OJK
ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
ssl_ciphers HIGH:!aNULL:!MD5;
```

```
# ❌ No penetration test in project timeline or budget
# "We'll do pen testing when the client asks for it"
```

**Good** — TLS 1.2+ only, mTLS for OJK integrations, annual pen test planned:

```nginx
# ✅ TLS 1.2 minimum, TLS 1.3 preferred
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:10m;
```

```php
// ✅ mTLS for OJK inter-system API calls
$client = new GuzzleHttp\Client([
    'base_uri' => 'https://api.bi.go.id',
    'cert'     => ['/etc/ssl/certs/client.crt', ''],  // client certificate
    'ssl_key'  => '/etc/ssl/private/client.key',       // client private key
    'verify'   => '/etc/ssl/certs/ojk-ca.crt',         // OJK CA certificate
]);
```

```
# ✅ Penetration test scheduled in project plan
# Timeline entry: "Annual OJK penetration test — Q4 2026"
# Budget allocated in project agreement
# Scope: application + infrastructure + network
# Critical findings: disclosed to client CISO within 24 hours of discovery
#                    not at report delivery
```

## Rules

1. All TLS configurations must specify TLS 1.2 as the minimum — disable TLS 1.0, TLS 1.1, and all RC4, DES, and MD5 cipher suites.
2. Use AES-256 for financial data at rest — document the encryption implementation in the system security design.
3. Configure mTLS (mutual TLS) for all API integrations with OJK-regulated counterparties where required by the counterparty's technical specification.
4. Budget and schedule annual penetration testing at project start — it is an OJK requirement, not an optional enhancement.
5. Disclose any critical vulnerability finding to the client's CISO within 24 hours of discovery — do not wait for the formal pen test report to be written.
