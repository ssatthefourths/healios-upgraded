# Client-IP handling policy

This document is the source of truth for how the Healios backend handles IP addresses. Required reading before you add any code that touches `CF-Connecting-IP`, `x-forwarded-for`, or any other caller-IP header.

Last updated: 2026-04-24 (introduced by ticket #5 in `healios_tasks_v2.csv`).

## Policy

1. **No raw IPs in persistent storage.** D1, KV (beyond short TTL), R2, log drains — none of them receive the raw IP.
2. **Use `hashClientIp(request, env)`** from `worker-api/src/utils/client-ip.ts` for any code that needs a stable-per-day caller identifier. It returns a 16-hex-char digest derived from SHA-256(`<IP_HASH_SECRET>:<yyyy-mm-dd>:<ip>`).
3. **30-day retention** on any table column storing a hash. The `scheduled()` handler in `worker-api/src/index.ts` runs daily at 03:00 UTC and nulls hashes older than 30 days (`pruneExpiredIpHashes`).
4. **Short-lived KV keys** (rate-limit counters that expire within 24h) are acceptable with hashed IPs. They do not need the cron because KV's built-in TTL handles expiry.
5. **Rotate `IP_HASH_SECRET` yearly.** Rotation invalidates historical hash correlations, which is a feature.

## Why hash?

Under UK GDPR and the Data Protection Act 2018, IP addresses are personal data. We have legitimate interest in using them for rate-limiting and abuse detection, but persisted raw IPs expand the data-breach blast radius unnecessarily. Hashing:

- Eliminates reversibility (64-bit truncated SHA-256 + daily salt + per-tenant secret).
- Makes data-subject-erasure requests cheaper to comply with — there's no user-linked raw IP to find and delete.
- Removes a category of regulator risk (raw IPs in logs are a classic finding).

## Implementation rules

- **Never log the raw `ip` variable.** If you need to log, log the hash:
  ```ts
  const ipHash = await hashClientIp(request, env);
  console.log(`[someroute] call from ${ipHash}`);
  ```
- **Never pass raw IPs across function boundaries.** Hash at the entry point and pass the hash.
- **If `IP_HASH_SECRET` is not configured**, `hashClientIp()` returns the literal string `"unconfigured"` and emits a console warning. Calling code must tolerate this — do not proceed with insecure fallback behaviour.

## Columns that currently store the hash

| Table          | Column   | Populated by                         |
|----------------|----------|--------------------------------------|
| `dsr_requests` | `ip_hash`| `POST /dsr/request` (`worker-api/src/dsr.ts`) |

If you add a new column, append it here. The cron will prune every column listed in `pruneExpiredIpHashes` (src/utils/client-ip.ts) — update the function when you add a column.

## KV keys currently using the hash

| KV prefix                      | Purpose       | Source                   |
|--------------------------------|---------------|--------------------------|
| `ratelimit:chat:<hash>:<hour>` | Wellness chat | `worker-api/src/wellness-chat.ts` |

## Operational runbook

### Setting the secret (one-time, before production traffic)

```bash
# Generate a strong random secret (never commit this):
openssl rand -hex 32

# Then in the worker-api directory:
wrangler secret put IP_HASH_SECRET
# paste the secret when prompted
```

### Rotating the secret (yearly)

```bash
wrangler secret put IP_HASH_SECRET
# paste a new random secret
wrangler deploy
```

Effects: all existing hashes become uncorrelatable with new ones. Rate-limit counters reset naturally within 1 hour (hourly-bucketed KV keys).

### Manually pruning

Cron runs daily. If you need to force a prune:

```bash
wrangler d1 execute healios-db --remote --command \
  "UPDATE dsr_requests SET ip_hash = NULL WHERE ip_hash IS NOT NULL AND submitted_at < unixepoch() - 30 * 86400;"
```

### If a regulator asks "do you store IPs?"

Answer: "We hash caller IPs at the edge using a daily-rotated salt and per-tenant secret, truncate to 16 hex chars, and retain the hash for 30 days for abuse-detection purposes. We do not store raw IPs in any persistent store."

Point them to: `worker-api/src/utils/client-ip.ts`, this document, and the `scheduled()` cron in `worker-api/src/index.ts`.
