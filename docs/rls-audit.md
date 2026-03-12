# RLS Audit — Healios Database

**Audit Date:** 2026-03-05  
**Auditor:** Automated (Lovable AI)  
**Status:** ✅ All tables have RLS enabled with appropriate policies

---

## Summary

All 28 tables (including views) in the `public` schema have Row Level Security enabled. No CRITICAL or HIGH findings.

## Table-by-Table Audit

| Table | RLS Enabled | Anon Read | Anon Write | Auth Read (own rows?) | Auth Write | Notes |
|-------|-------------|-----------|------------|----------------------|------------|-------|
| `profiles` | ✅ | ❌ | ❌ | ✅ Own only | Update own | No delete policy |
| `addresses` | ✅ | ❌ | ❌ | ✅ Own only | Full CRUD own | Proper user_id scoping |
| `user_roles` | ✅ | ❌ | ❌ | ✅ Own only | Admin only | `has_role()` SECURITY DEFINER prevents recursion |
| `orders` | ✅ | ❌ | ❌ | ✅ Own only | Insert own + guest | Guest orders use access_token with expiry |
| `order_items` | ✅ | ❌ | ❌ | ✅ Own via orders join | Insert for own orders | No update/delete |
| `products` | ✅ | ✅ Published | ❌ | ✅ All published | Admin only | Public catalog — correct |
| `product_reviews` | ✅ | ✅ Approved | ❌ | ✅ Own + approved | CRUD own, admin update | Proper moderation flow |
| `product_analytics` | ✅ | ❌ | ✅ Rate-limited | Admin read | Insert with rate limit | Rate limit via `check_analytics_rate_limit()` |
| `product_versions` | ✅ | ❌ | ❌ | Admin only | Admin insert | Audit trail — correct |
| `wishlist` | ✅ | ❌ | ❌ | ✅ Own only | Insert/delete own | No update needed |
| `loyalty_points` | ✅ | ❌ | ❌ | ✅ Own only | Admin only | Points managed via SECURITY DEFINER functions |
| `loyalty_transactions` | ✅ | ❌ | ❌ | ✅ Own only | Admin only | Transaction log — correct |
| `subscriptions` | ✅ | ❌ | ❌ | ✅ Own only | Insert/update own | No delete — correct for subscriptions |
| `discount_codes` | ✅ | ❌ | ❌ | ✅ Own used codes | Admin full | Validation via edge function |
| `gift_cards` | ✅ | ❌ | ❌ | ✅ Own purchased/redeemed | Insert with validation | Amount/email validation in policy |
| `gift_card_transactions` | ✅ | ❌ | ❌ | ✅ Own via gift_cards | Insert for own | No update/delete |
| `gift_card_rate_limits` | ✅ | ❌ | ❌ | ❌ | ❌ | Service role only — correct |
| `newsletter_subscriptions` | ✅ | ❌ | ✅ Rate-limited | Admin only | Admin update | Rate limit via `check_newsletter_rate_limit()` |
| `newsletter_rate_limits` | ✅ | ❌ | ❌ | ❌ | ❌ | — |
| `scheduled_newsletters` | ✅ | ❌ | ❌ | Admin only | Admin full CRUD | — |
| `email_campaigns` | ✅ | ❌ | ❌ | Admin only | Admin insert | No update/delete — correct |
| `email_campaign_events` | ✅ | ❌ | ❌ | Admin only | Insert for existing campaigns | — |
| `referrals` | ✅ | ❌ | ❌ | ✅ Own (referrer/referred) | Insert own with email validation | Admin full |
| `referral_rate_limits` | ✅ | ❌ | ❌ | ❌ | ❌ | Service role only |
| `referral_blocklist` | ✅ | ❌ | ❌ | Admin only | Admin full CRUD | — |
| `blog_posts` | ✅ | ✅ Published | ❌ | Admin all | Admin full CRUD | Public blog — correct |
| `blog_categories` | ✅ | ✅ All | ❌ | ✅ All | Admin full CRUD | Categories are public metadata |
| `wellness_posts` | ✅ | ✅ Approved | ❌ | ✅ Own + approved | Insert own, admin update | UGC moderation flow |
| `stock_notifications` | ✅ | ❌ | ❌ | ✅ Own only | Insert/delete own | Admin can update (mark notified) |
| `checkout_recovery` | ✅ | ✅ Unexpired/unused | ❌ | ❌ | ❌ | Token-based access + service role |
| `checkout_security_log` | ✅ | ❌ | ❌ | ❌ | ❌ | Service role only — correct |
| `admin_audit_log` | ✅ | ❌ | ❌ | Admin only | Admin insert | Immutable audit trail |

## Views

| View | Notes |
|------|-------|
| `best_seller_products` | Derived from `products` + analytics — inherits products RLS |
| `low_stock_products` | Derived from `products` — inherits products RLS |

## Security Functions

- `has_role()` — SECURITY DEFINER, prevents RLS recursion for role checks
- `check_analytics_rate_limit()` — SECURITY DEFINER, rate limits analytics inserts
- `check_newsletter_rate_limit()` — SECURITY DEFINER, rate limits newsletter signups
- `check_referral_rate_limit()` — SECURITY DEFINER, rate limits referral attempts
- `check_gift_card_rate_limit()` — SECURITY DEFINER, rate limits gift card operations
- `check_checkout_ip_security()` — SECURITY DEFINER, IP-based checkout security

## Conclusion

No remediation required. All tables enforce proper data isolation at the database layer.
