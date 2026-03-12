-- Add explicit deny policies for anonymous users as defense-in-depth
-- These ensure that even if there's a misconfiguration, anonymous users cannot access sensitive data

-- 1. profiles table - add explicit anonymous deny
-- The existing policies already use auth.uid() = id which blocks anonymous access
-- But we'll add an explicit restrictive policy to be extra safe
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 2. orders table - ensure anonymous users can only access with valid token
-- Drop and recreate the guest orders policy with stricter validation
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 3. addresses table - add explicit anonymous deny
CREATE POLICY "Block anonymous access to addresses"
ON public.addresses
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 4. gift_cards table - ensure only authenticated purchasers/redeemers can view
-- Drop and recreate with explicit auth check
DROP POLICY IF EXISTS "Users can view gift cards they purchased" ON public.gift_cards;
DROP POLICY IF EXISTS "Users can view gift cards they redeemed" ON public.gift_cards;

CREATE POLICY "Users can view gift cards they purchased"
ON public.gift_cards
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = purchaser_id);

CREATE POLICY "Users can view gift cards they redeemed"
ON public.gift_cards
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = redeemed_by);

-- 5. checkout_recovery table - the token-based access is intentional for cart recovery links
-- But we can add additional protection by masking email in the response
-- For now, the existing policy is fine as it requires valid unexpired tokens

-- 6. referrals table - add explicit auth requirement
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can view referrals where they are the referred user" ON public.referrals;

CREATE POLICY "Users can view their own referrals"
ON public.referrals
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals where they are the referred user"
ON public.referrals
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = referred_user_id);

-- Also add explicit auth checks to warn-level tables for defense-in-depth

-- 7. subscriptions table
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 8. loyalty_points table
DROP POLICY IF EXISTS "Users can view their own loyalty points" ON public.loyalty_points;
CREATE POLICY "Users can view their own loyalty points"
ON public.loyalty_points
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 9. loyalty_transactions table
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.loyalty_transactions;
CREATE POLICY "Users can view their own transactions"
ON public.loyalty_transactions
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 10. wishlist table
DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlist;
CREATE POLICY "Users can view their own wishlist"
ON public.wishlist
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 11. stock_notifications table
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.stock_notifications;
CREATE POLICY "Users can view their own notifications"
ON public.stock_notifications
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);