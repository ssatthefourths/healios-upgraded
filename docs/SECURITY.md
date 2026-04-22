# Healios Security Posture

Status as of Batch H1 (shipped 2026-04-22). This doc is the authoritative
reference for how the Healios stack protects customer data, what's done, what's
next, and the runbook when something goes wrong.

---

## Architecture

- **Frontend**: Cloudflare Pages, served over HTTPS at `www.thehealios.com`.
- **API**: Cloudflare Worker at `healios-api.ss-f01.workers.dev`. All backend
  logic runs here; the frontend holds no secrets.
- **Database**: Cloudflare D1 (SQLite). Accessed only from the Worker via a
  binding — never directly from the browser.
- **Sessions**: Cloudflare KV (`SESSIONS` binding). 7-day TTL per token.
- **Payments**: Stripe. Checkout Sessions created server-side; webhooks are
  HMAC-verified before order state advances. See `worker-api/src/stripe-webhook.ts`.
- **Email**: Resend, keyed off `RESEND_API_KEY` in Worker env.

All secrets live in Cloudflare Worker env (`wrangler secret put`). Nothing
sensitive ships to the browser.

---

## Password storage (Batch H1)

**Algorithm**: PBKDF2-SHA256. It is the only OWASP-recommended hasher natively
available in the Cloudflare Workers WebCrypto API (bcrypt/argon2/scrypt are
not). 100,000 iterations, 16-byte random salt, 32-byte hash.

**Storage format** (self-describing so iteration count can be raised later
without a second migration):
```
pbkdf2$<iterations>$<base64-salt>$<base64-hash>
```

**Legacy format (pre-H1)**: bare 64-char hex SHA-256 digest, unsalted. A small
number of rows may still have this until their owners sign in once. The
`verifyPassword` helper accepts both formats; on successful legacy verification
the row is immediately re-hashed with PBKDF2 ("upgrade-on-next-login"). Users
see nothing.

**Verification**: constant-time byte compare via `constantTimeEqual`. Does not
short-circuit on first mismatch, so timing tells an attacker nothing.

**Iteration count trade-off**: OWASP 2024 recommends 600,000 PBKDF2-SHA256
iterations. We run 100,000. The reason is the Workers **free tier** 10 ms CPU
budget per invocation — 600k iterations measures ~15-20 ms on Workers CPUs,
which would fail under load. 100k fits in ~2-4 ms comfortably and is still
~150,000× the cost of a bare SHA-256 (what we had before). **When the account
moves to paid Workers, raise `ITERATIONS` in `worker-api/src/lib/password.ts`
to 600,000 — the hybrid verifier makes this a one-constant change with no
migration needed.**

**Upgrade-on-login is deferred via `ctx.waitUntil`**: on sign-in with a legacy
hash, the legacy SHA-256 compare is fast (~microseconds); the PBKDF2 rehash +
D1 `UPDATE` happens asynchronously after the response is sent. This keeps the
user-facing request on a single PBKDF2 cost (even during migration) and avoids
blowing the 10 ms CPU ceiling. See `worker-api/src/auth.ts` signin handler.

**Signin-time timing uniformity**: the handler runs `verifyPassword` even when
no user row exists (against a dummy PBKDF2 hash that no plaintext can ever
match). This flattens the latency of "unknown email" / "wrong password" / "ok
but legacy" to within a single PBKDF2 cost, so response time leaks no
enumeration signal.

**Rollback window**: once a legacy user signs in after deploy, their row is
rehashed with PBKDF2. A revert to the pre-H1 worker would lose the ability to
verify those users (old code only understands bare-hex SHA-256). Rollback
path: either roll forward with a fix, or accept that users who've been
rehashed will need `/auth/request-reset` to sign in on the old worker. In
practice, roll-forward is always the right answer here.

**Critical files**:
- `worker-api/src/lib/password.ts` — the hasher, verifier, strength check.
- `worker-api/src/auth.ts` — sign-up, sign-in, password-reset, upgrade-on-login.
- `worker-api/src/admin-users.ts` — admin `set_password` + `invite_user`.

---

## Weak-password check

Enforced **server-side** at: sign-up, password-reset, admin `set_password`,
authenticated profile password change. Client UI can be bypassed; the server
cannot be.

Rules:
- Minimum 10 characters (max 256).
- Rejected if it appears in the built-in blocklist (~50 common passwords).
- Rejected if stripping non-letters collapses it to a blocklist entry (catches
  `password123`, `Healios2026!`, `Admin1234` etc.).
- Rejected if it contains obvious brand/common substrings (`healios`,
  `password`, `welcome`, `admin`, `qwerty`, `letmein`, `thehealios`).
- Rejected if all same character or obvious numeric/alpha sequence.

Blocklist returns the same generic message for every failure so the rules
can't be inferred from error text.

---

## Signup error hygiene

`/auth/signup` now always returns the generic message **"Signup failed"** on
failure. This removes the "User already exists or database error" leak that
let an attacker enumerate which emails are registered.

`/auth/request-reset` already returned success regardless of whether the email
existed; that behaviour is preserved.

`/auth/signin` returns **"Invalid credentials"** for both unknown-user and
wrong-password cases; unchanged.

---

## Rate limiting

**Not done in Worker code.** Cloudflare KV's free tier is 1,000 writes/day, so
any per-request KV counter would blow the quota in hours. Instead we use
**Cloudflare Rate Limiting Rules** configured in the dashboard — zero KV
writes, zero Worker CPU, platform-native.

### Dashboard steps (Cloudflare → `thehealios.com` zone → Security → WAF → Rate limiting rules)

Add these rules to the `healios-api.ss-f01.workers.dev` zone (or fronting
custom hostname if set up):

1. **Sign-in brute force**
   - Field: URI Path · equals · `/auth/signin`
   - Rate: 5 requests per 10 seconds per IP
   - Action: Managed Challenge
2. **Signup abuse**
   - Field: URI Path · equals · `/auth/signup`
   - Rate: 3 requests per 10 seconds per IP
   - Action: Managed Challenge
3. **Password-reset abuse**
   - Field: URI Path · in · `/auth/request-reset` `/auth/reset-password`
   - Rate: 3 requests per 10 seconds per IP
   - Action: Managed Challenge
4. **Search-log spam** (protects `search_events` write quota)
   - Field: URI Path · in · `/search/log` `/search/log-click`
   - Rate: 30 requests per 10 seconds per IP
   - Action: Block (invisible — loggers are fire-and-forget so a block is fine)

Free plan includes one rule. Paid plan allows multiple. If still on free,
apply rule #1 first (highest severity).

---

## Security headers

Applied to **every** Worker response by `withSecurityHeaders()` in
`worker-api/src/index.ts`:

| Header | Value | Purpose |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Force HTTPS for a year, including subdomains. |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME-sniffing attacks. |
| `X-Frame-Options` | `DENY` | Refuse to be framed (clickjacking defence). |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit Referer leakage. |

**CSP** is deliberately deferred to H2 — it needs careful per-page tuning
against Stripe Checkout, Google Fonts, Cloudflare Insights, and our own
assets. Shipping CSP in report-only mode is the first step of H2.

Pages is already served over HTTPS via Cloudflare's edge with HSTS, so the
frontend inherits the same protections from the platform.

---

## Operational runbook

### Rotate the admin password

```bash
# Replace <ADMIN_USER_ID> and <NEW_PASSWORD>
npx wrangler d1 execute healios-db --remote --command \
  "SELECT id, email FROM users WHERE email = 'admin@thehealios.com'"
```
Then sign in as another admin and POST to `/admin/user-management`:
```json
{ "action": "set_password", "target_user_id": "<ADMIN_USER_ID>", "new_password": "<NEW_PASSWORD>" }
```

### Invalidate all sessions (emergency)

KV doesn't support bulk delete from the dashboard. Use wrangler:
```bash
npx wrangler kv:key list --binding=SESSIONS --remote | jq -r '.[].name' | \
  xargs -I {} npx wrangler kv:key delete --binding=SESSIONS --remote "{}"
```
All signed-in users will be logged out on next request.

### Suspected breach

1. Invalidate all sessions (above).
2. Rotate `JWT_SECRET`, `STRIPE_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`
   via `npx wrangler secret put <NAME>`.
3. Inspect `admin_audit_log` table for unexpected actions:
   ```bash
   npx wrangler d1 execute healios-db --remote --command \
     "SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT 100"
   ```
4. Inspect `search_events` for recon patterns (bulk enumeration).
5. Email affected users via Resend from `noreply@thehealios.com` — POPIA
   requires breach notification to the Information Regulator and affected
   individuals within a reasonable time.

---

## H2 roadmap (follow-up, no rush)

Ships only after H1 is stable in production.

- **HttpOnly session cookies** — move `cf_session` out of `localStorage` so an
  XSS can't exfiltrate the token. Worker sets `Set-Cookie: cf_session=...;
  HttpOnly; Secure; SameSite=Lax; Max-Age=604800`; frontend drops the
  `localStorage.getItem('cf_session')` calls and relies on cookie auto-send.
- **Origin-allowlist CORS** — replace wildcard `*` on auth/admin endpoints
  with `www.thehealios.com` + `thehealios.com`. Public endpoints like
  `/products`, `/search/products` can stay wildcard since they return
  non-sensitive data.
- **Content-Security-Policy** — deploy in report-only mode for a week,
  iterate against browser DevTools reports, then enforce. Must allow Stripe
  (`js.stripe.com`, `checkout.stripe.com`), Google Fonts, Cloudflare Insights
  (`static.cloudflareinsights.com`), and our own asset hostnames.
- **Admin re-auth** — admin password-change flow asks the admin to re-enter
  their current password before the change is accepted.
- **DOMPurify on blog HTML** — blog admin is currently trusted (admin-only
  editor), but defence-in-depth against a future compromised admin account.

## H3 roadmap (future)

- **PII encryption at rest** — application-level encryption of shipping
  addresses and phone numbers with rotatable keys. Significant design work;
  not urgent because D1 is managed and backup leaks are improbable.
- **Passkeys / WebAuthn** — passwordless for admins. Reduces phishing risk
  substantially but is high-effort.
