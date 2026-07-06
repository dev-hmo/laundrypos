# Laundry OMS — Security Audit Report

**Date:** 2026-07-06
**Scope:** Full-stack penetration test (Go/Gin backend, Next.js/React frontend, PostgreSQL, Render + Vercel deployment)
**Auditor:** Automated VAPT scan

---

## Executive Summary

**22 findings** across all severity levels: **4 CRITICAL, 4 HIGH, 3 MEDIUM, 3 LOW**, 8 informational. The most urgent issues are JWT stored in `localStorage` (XSS-exposed), a leaked Vercel OIDC token in the repository, zero authorization checks beyond token validity, and hardcoded default credentials in seed data.

---

## CRITICAL

### C-01: JWT Stored in `localStorage` (No HttpOnly Cookie)

| Attribute | Detail |
|-----------|--------|
| **File** | `frontend/src/lib/auth.tsx:29` |
| **Risk** | Any XSS vulnerability yields full account takeover. Token persists indefinitely with no server-side revocation mechanism. |
| **Code** | `localStorage.getItem('auth_token')` / `localStorage.setItem('auth_token', ...)` |
| **Fix** | Migrate to HttpOnly, Secure, SameSite=Strict cookies. Set cookie in backend login response, read automatically on every request. |

### C-02: Vercel OIDC Token Leaked in Repository

| Attribute | Detail |
|-----------|--------|
| **File** | `frontend/.env.local` (committed to git, line 6) |
| **Risk** | Full OIDC token grants Vercel team-level access. Attacker can deploy, modify environment variables, access logs, and steal secrets. |
| **Token (redacted)** | `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Im1yay00MzAy...` |
| **Fix** | 1. Rotate token immediately in Vercel dashboard. 2. Remove tracked file with `git rm --cached frontend/.env.local`. 3. Add to `.gitignore` (already present but file was tracked before rule existed). |

### C-03: No Authorization Checks — Any Authenticated User Can Access Any Resource

| Attribute | Detail |
|-----------|--------|
| **Files** | All handler files in `backend/internal/handlers/` |
| **Risk** | Customer A can view/modify Customer B's orders, payments, invoices, and profile. No `WHERE user_id = ?` scoping. |
| **Evidence** | `backend/internal/handlers/user.go:85-95`: `SELECT * FROM users` returns all users regardless of requesting user. All order/customer/payment/invoice handlers lack ownership filtering. |
| **Fix** | Add middleware that extracts `user_id` from JWT claims and injects it into `c.Set("user_id", ...)`. All queries must filter by this ID or require admin role for cross-tenant access. |

### C-04: Hardcoded Default Admin Password in Seed SQL

| Attribute | Detail |
|-----------|--------|
| **File** | `backend/internal/database/migrations/001_init.sql` |
| **Risk** | Default credentials (`admin@laundry.com` / `admin123`) are common knowledge. No force-change on first login. |
| **Fix** | Add a `password_reset_required` column; check on login and force password change. Remove (or rotate) the default seed in production. |

---

## HIGH

### H-01: Dynamic Query Numbering Broken for argIdx ≥ 10

| Attribute | Detail |
|-----------|--------|
| **Files** | `backend/internal/handlers/user.go`, `order.go`, `customer.go`, `service.go` |
| **Risk** | `string(rune('0'+argIdx))` produces `$:` when `argIdx >= 10` (rune value shifts to `:`, `;`, `<`, etc.), causing SQL syntax errors and query failures. |
| **Code** | `placeholder := fmt.Sprintf("$%d", argIdx)`, or better, use PostgreSQL `$1, $2, ...` numbering via `lib/pq` directly. |
| **Fix** | Replace `string(rune('0'+argIdx))` with `strconv.Itoa(argIdx)` or `fmt.Sprintf("$%d", argIdx)`. |

### H-02: Hardcoded Placeholder CSP `connect-src`

| Attribute | Detail |
|-----------|--------|
| **File** | `backend/internal/middleware/security.go:22` |
| **Risk** | CSP header references `https://api.laundry.example.com` — a non-existent domain. Actual backend at Render (laundry-api.onrender.com) will be blocked by the browser. |
| **Fix** | Set `connect-src` dynamically from `CORS_ORIGINS` env var, or via a configuration setting. |

### H-03: No CSRF Protection

| Attribute | Detail |
|-----------|--------|
| **File** | `backend/internal/router/router.go` |
| **Risk** | All state-changing endpoints (POST/PUT/PATCH/DELETE) accept requests with only `Authorization: Bearer <token>`. No anti-CSRF token, no SameSite cookie, no origin/referer validation. |
| **Fix** | If using cookie-based auth: implement CSRF token pattern (double-submit or signed cookie). For Bearer-token-in-header (current): ensure `Authorization` header cannot be set cross-origin (requires JavaScript, which is protected by CORS). Consider adding `Origin` / `Referer` header validation as defense-in-depth. |

### H-04: No HSTS When Not TLS (Downgrade Risk)

| Attribute | Detail |
|-----------|--------|
| **File** | `backend/internal/middleware/security.go:29` |
| **Code** | `if c.Request.TLS != nil { c.Header("Strict-Transport-Security", ...) }` |
| **Risk** | First request over HTTP gets no HSTS header; browser will not upgrade subsequent requests. Only Render's proxy terminates TLS — internal health checks or direct HTTP access bypass HSTS. |
| **Fix** | Always set `Strict-Transport-Security: max-age=31536000; includeSubDomains` regardless of TLS. Remove the conditional check. |

---

## MEDIUM

### M-01: No Request Body Size Limit

| Attribute | Detail |
|-----------|--------|
| **File** | `backend/main.go` — Gin default `MaxMultipartMemory = 32 << 20` (32MB) but no body size limit |
| **Risk** | Attacker can send arbitrarily large POST/PUT bodies, exhausting server memory (DoS). |
| **Fix** | Add `r.MaxMultipartMemory = 1 << 20` (1MB) and use `c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 1<<20)` for JSON endpoints. |

### M-02: Low bcrypt Cost (Default 10)

| Attribute | Detail |
|-----------|--------|
| **File** | `backend/internal/handlers/auth.go` — uses `bcrypt.GenerateFromPassword(...)` without cost parameter |
| **Risk** | Default cost 10 (~10ms per hash on modern hardware) allows ~100 hash/sec brute-force. NIST recommends cost 12+ (250ms+). |
| **Fix** | Use `bcrypt.GenerateFromPassword(password, bcrypt.DefaultCost)` — currently default IS 10. Change to `bcrypt.GenerateFromPassword(password, 12)`. For existing hashes, upgrade on next login. |

### M-03: SQL Migration Not Idempotent

| Attribute | Detail |
|-----------|--------|
| **File** | `backend/internal/database/migrate.go` |
| **Risk** | All `.sql` files execute on every startup. Without `IF NOT EXISTS` / `CREATE OR REPLACE`, migrations fail on restart, blocking server startup. |
| **Fix** | Add a migration tracking table (`schema_migrations`). Wrap each migration in a transaction. Use `CREATE TABLE IF NOT EXISTS` in base migration. |

---

## LOW

### L-01: IP Spoofing via `X-Forwarded-For`

| Attribute | Detail |
|-----------|--------|
| **File** | `backend/internal/middleware/ratelimit.go` |
| **Code** | `clientIP := c.ClientIP()` — Gin respects `X-Forwarded-For` and `X-Real-IP` headers |
| **Risk** | Attacker behind proxy can spoof IP to bypass rate limits. |
| **Fix** | Trust only Render's proxy IP range, or use `c.RemoteIP()` with `SetTrustedProxies(nil)` to disable header-based resolution. |

### L-02: Verbose Database Error Leakage

| Attribute | Detail |
|-----------|--------|
| **File** | `backend/internal/handlers/user.go:95` |
| **Code** | `c.JSON(500, gin.H{"error": "Failed to fetch users: " + err.Error()})` |
| **Risk** | Raw `database/sql` driver errors may contain schema info, constraint names, or stack traces. |
| **Fix** | Log the full error server-side; return a generic `"Internal server error"` to the client. |

### L-03: No Account Lockout / Brute-Force Protection

| Attribute | Detail |
|-----------|--------|
| **File** | `backend/internal/handlers/auth.go` |
| **Risk** | Unlimited login attempts. Attacker can brute-force passwords via `/api/v1/auth/login`. |
| **Fix** | Implement account lockout after N failed attempts (e.g., 5 attempts → 15-minute lockout). Or use progressive delay. |

---

## INFO / OBSERVATIONS

### I-01: `VERSION` Header Leaks Server Identity

| File | Detail |
|------|--------|
| `backend/internal/middleware/security.go` | Custom `VERSION: 1.0.0` header reveals software version. Remove or make configurable. |

### I-02: No Audit Logging

No structured audit trail for sensitive operations (login, password change, data deletion). Implement structured logging with correlation IDs.

### I-03: Missing Security Headers

- `X-Content-Type-Options: nosniff` — not set (prevents MIME sniffing)
- `X-Frame-Options: DENY` — not set (prevents clickjacking)
- `Referrer-Policy: strict-origin-when-cross-origin` — not set

### I-04: Password Complexity Not Enforced

No minimum length, character class, or strength requirements on password creation/reset.

### I-05: No Input Validation Library Usage

Go playground/validator is imported (`v10.20.0`) but not consistently used on request bodies. Manual validation in handlers is inconsistent and may miss edge cases.

### I-06: GitHub Actions Secrets May Be Missing

`VERCEL_ORG_ID` referenced in system context but not verified present in GitHub Secrets.

### I-07: No Health Check Rate Limit Exemption

Health check endpoint (`/api/v1/health`) is rate-limited. Monitoring tools may be throttled.

### I-08: Render Blueprint Auto-Deploy Not Working

Container at `laundry-api.onrender.com` serves Render's Express proxy response, not the Go app. Deploy must be manually triggered from Render dashboard or via webhook.

---

## Dependency Vulnerabilities

| Package | Version | Severity | CVE / Advisory | Notes |
|---------|---------|----------|----------------|-------|
| postcss (via next) | <8.5.10 | Moderate | GHSA-qx2v-qp2m-jg93 | XSS via unescaped `</style>` in CSS stringify |
| gin-gonic/gin | v1.10.0 | — | None known | Latest stable |
| golang-jwt/jwt/v5 | v5.3.1 | — | None known | Latest stable |
| lib/pq | v1.10.9 | — | None known | Latest stable |
| golang.org/x/crypto | v0.53.0 | — | None known | Needs manual bump to v0.59.0+ for ed25519 fix |

**Outdated frontend packages:** next (16.2.9 → 16.2.10), react (19.2.4 → 19.2.7), eslint (9.39.4 → 10.6.0), tailwindcss (4.3.1 → 4.3.2), typescript (5.9.3 → 6.0.3).

---

## Remediation Priority

| Priority | Issues | Effort |
|----------|--------|--------|
| **P0 — Immediate** | C-01, C-02, C-03, C-04 | 2-3 days |
| **P1 — This sprint** | H-01, H-02, H-03, H-04 | 1 day |
| **P2 — Next sprint** | M-01, M-02, M-03 | 1 day |
| **P3 — Backlog** | L-01, L-02, L-03, I-01 through I-08 | ½ day |

---

## Appendix: Key Files Examined

```
backend/
├── main.go
├── internal/
│   ├── router/router.go
│   ├── handlers/
│   │   ├── auth.go
│   │   ├── health.go
│   │   ├── user.go
│   │   ├── customer.go
│   │   ├── order.go
│   │   ├── payment.go
│   │   ├── invoice.go
│   │   ├── service.go
│   │   └── report.go
│   ├── middleware/
│   │   ├── auth.go
│   │   ├── security.go
│   │   └── ratelimit.go
│   ├── config/config.go
│   └── database/
│       ├── postgres.go
│       ├── migrate.go
│       └── migrations/001_init.sql
├── Dockerfile
├── go.mod
└── render.yaml

frontend/
├── src/
│   ├── lib/
│   │   ├── auth.tsx
│   │   └── api.ts
│   └── app/
├── .env.local
├── .env.production
├── vercel.json
└── .gitignore
```
