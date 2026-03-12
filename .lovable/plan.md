

## Email Template Style Tweaks

Two changes across all 6 email templates:

1. **Logo size**: Reduce `width` from `"120"` to `"90"` on the `<Img>` component
2. **Button border radius**: Increase `borderRadius` from `'6px'` to `'10px'` — more rounded but not pill-shaped

**Files to update** (same two changes in each):
- `supabase/functions/_shared/email-templates/signup.tsx`
- `supabase/functions/_shared/email-templates/recovery.tsx`
- `supabase/functions/_shared/email-templates/magic-link.tsx`
- `supabase/functions/_shared/email-templates/email-change.tsx`
- `supabase/functions/_shared/email-templates/invite.tsx`
- `supabase/functions/_shared/email-templates/reauthentication.tsx`

Then redeploy `auth-email-hook`.

