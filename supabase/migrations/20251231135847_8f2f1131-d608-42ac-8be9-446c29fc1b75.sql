-- Create gift_cards table
CREATE TABLE public.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  original_amount NUMERIC NOT NULL CHECK (original_amount > 0),
  remaining_balance NUMERIC NOT NULL CHECK (remaining_balance >= 0),
  purchaser_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  purchaser_email TEXT NOT NULL,
  recipient_email TEXT,
  recipient_name TEXT,
  personal_message TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gift_card_transactions table for tracking usage
CREATE TABLE public.gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'redemption', 'refund')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;

-- Gift cards policies
CREATE POLICY "Admins can manage gift cards"
ON public.gift_cards FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view gift cards they purchased"
ON public.gift_cards FOR SELECT
USING (auth.uid() = purchaser_id);

CREATE POLICY "Users can view gift cards they redeemed"
ON public.gift_cards FOR SELECT
USING (auth.uid() = redeemed_by);

CREATE POLICY "Anyone can create gift cards"
ON public.gift_cards FOR INSERT
WITH CHECK (true);

-- Gift card transactions policies
CREATE POLICY "Admins can view all transactions"
ON public.gift_card_transactions FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their gift card transactions"
ON public.gift_card_transactions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.gift_cards gc
  WHERE gc.id = gift_card_id
  AND (gc.purchaser_id = auth.uid() OR gc.redeemed_by = auth.uid())
));

CREATE POLICY "Anyone can insert transactions"
ON public.gift_card_transactions FOR INSERT
WITH CHECK (true);

-- Create function to generate unique gift card code
CREATE OR REPLACE FUNCTION public.generate_gift_card_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 16-character alphanumeric code in format XXXX-XXXX-XXXX-XXXX
    new_code := UPPER(
      SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
      SUBSTRING(MD5(RANDOM()::TEXT) FROM 5 FOR 4) || '-' ||
      SUBSTRING(MD5(RANDOM()::TEXT) FROM 9 FOR 4) || '-' ||
      SUBSTRING(MD5(RANDOM()::TEXT) FROM 13 FOR 4)
    );
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.gift_cards WHERE code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Create function to redeem gift card
CREATE OR REPLACE FUNCTION public.redeem_gift_card(
  p_code TEXT,
  p_amount NUMERIC,
  p_order_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT, amount_applied NUMERIC, new_balance NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gift_card RECORD;
  v_amount_to_apply NUMERIC;
BEGIN
  -- Find and lock the gift card
  SELECT * INTO v_gift_card
  FROM public.gift_cards
  WHERE code = UPPER(TRIM(p_code))
  FOR UPDATE;
  
  -- Check if gift card exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Gift card not found'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Check if active
  IF NOT v_gift_card.is_active THEN
    RETURN QUERY SELECT false, 'Gift card is no longer active'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Check expiration
  IF v_gift_card.expires_at IS NOT NULL AND v_gift_card.expires_at < NOW() THEN
    RETURN QUERY SELECT false, 'Gift card has expired'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Check balance
  IF v_gift_card.remaining_balance <= 0 THEN
    RETURN QUERY SELECT false, 'Gift card has no remaining balance'::TEXT, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;
  
  -- Calculate amount to apply
  v_amount_to_apply := LEAST(p_amount, v_gift_card.remaining_balance);
  
  -- Update gift card
  UPDATE public.gift_cards
  SET 
    remaining_balance = remaining_balance - v_amount_to_apply,
    redeemed_by = COALESCE(redeemed_by, p_user_id),
    first_redeemed_at = COALESCE(first_redeemed_at, NOW()),
    updated_at = NOW()
  WHERE id = v_gift_card.id;
  
  -- Record transaction
  INSERT INTO public.gift_card_transactions (gift_card_id, order_id, amount, transaction_type)
  VALUES (v_gift_card.id, p_order_id, v_amount_to_apply, 'redemption');
  
  RETURN QUERY SELECT 
    true, 
    'Gift card applied successfully'::TEXT, 
    v_amount_to_apply,
    (v_gift_card.remaining_balance - v_amount_to_apply);
END;
$$;

-- Create function to validate gift card (check without redeeming)
CREATE OR REPLACE FUNCTION public.validate_gift_card(p_code TEXT)
RETURNS TABLE(valid BOOLEAN, message TEXT, balance NUMERIC, expires_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gift_card RECORD;
BEGIN
  SELECT * INTO v_gift_card
  FROM public.gift_cards
  WHERE code = UPPER(TRIM(p_code));
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Gift card not found'::TEXT, 0::NUMERIC, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  IF NOT v_gift_card.is_active THEN
    RETURN QUERY SELECT false, 'Gift card is no longer active'::TEXT, 0::NUMERIC, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;
  
  IF v_gift_card.expires_at IS NOT NULL AND v_gift_card.expires_at < NOW() THEN
    RETURN QUERY SELECT false, 'Gift card has expired'::TEXT, 0::NUMERIC, v_gift_card.expires_at;
    RETURN;
  END IF;
  
  IF v_gift_card.remaining_balance <= 0 THEN
    RETURN QUERY SELECT false, 'Gift card has no remaining balance'::TEXT, 0::NUMERIC, v_gift_card.expires_at;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'Gift card is valid'::TEXT, v_gift_card.remaining_balance, v_gift_card.expires_at;
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_gift_cards_updated_at
BEFORE UPDATE ON public.gift_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();