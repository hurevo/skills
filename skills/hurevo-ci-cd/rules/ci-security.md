---
title: CI Security
impact: high
tags: [ci-cd, security, actions, secrets, supply-chain]
---

## Why

- Third-party GitHub Actions tagged with `@v1` can be updated by the upstream owner at any time — a compromised tag runs attacker code with your repository's write token
- `pull_request_target` workflows run with the repository's write token even for PRs from forked repositories — a malicious PR can exfiltrate secrets
- `echo $SECRET` in a workflow step emits the value into the job log, which is visible to all repository collaborators

## Pattern

**Bad** — mutable action refs, secret in logs, overpermissioned token:

```yaml
jobs:
  build:
    permissions: write-all  # ❌ grants all permissions

    steps:
      - uses: actions/checkout@v4          # ❌ tag is mutable
      - uses: some-org/deploy-action@main  # ❌ mutable branch ref

      - name: Debug secrets
        run: echo "DB password is ${{ secrets.DB_PASSWORD }}"  # ❌ leaks to logs

      - name: Upload artifact with secrets
        uses: actions/upload-artifact@v4
        with:
          path: .                  # ❌ uploads entire repo including .env files
```

**Good** — SHA-pinned, minimal permissions, no secret echo, scoped artifacts:

```yaml
jobs:
  build:
    permissions:
      contents: read        # minimal — only what this job needs
      packages: write       # only if publishing a package

    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2

      # Third-party action pinned to SHA
      - uses: docker/build-push-action@4f58ea79220b3119b1e09b05e4b59ae9521c0b71  # v6.9.0
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}

      # ✅ Use secrets in env vars — never echo them
      - name: Deploy
        run: ./deploy.sh
        env:
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}  # available to script, not in logs

      # ✅ Scoped artifact upload — exclude sensitive files
      - uses: actions/upload-artifact@65c4c4a1ddee5b72f698fdd19549f0f6b0a3ff10  # v4.6.0
        with:
          path: |
            dist/
            !dist/**/.env*
```

```yaml
# Container scan in security.yml
- name: Scan image for vulnerabilities
  uses: aquasecurity/trivy-action@18f2510ee396bbf400402947b394f2dd8c87dbb0  # v0.28.0
  with:
    image-ref: ghcr.io/${{ github.repository }}:${{ github.sha }}
    exit-code: '1'
    severity: 'CRITICAL,HIGH'
```

## Rules

1. Pin all GitHub Actions (first-party and third-party) to a full commit SHA — add the version tag as a comment for readability.
2. Set `permissions` explicitly on every job; start with the minimum needed and add only what is required.
3. Never `echo` or `print` secret values in workflow steps — pass secrets as environment variables to scripts.
4. Never upload artifacts that include `.env` files, compiled secrets, or key material.
5. Run `trivy` or `docker scout` container scanning in `security.yml` and fail the workflow on CRITICAL or HIGH CVEs.
