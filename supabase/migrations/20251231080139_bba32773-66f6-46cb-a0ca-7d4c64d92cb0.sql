-- Create loyalty points table to track user balances
CREATE TABLE public.loyalty_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points_balance INTEGER NOT NULL DEFAULT 0,
  lifetime_points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create loyalty transactions table to track history
CREATE TABLE public.loyalty_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'expire', 'adjustment')),
  points INTEGER NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for loyalty_points
CREATE POLICY "Users can view their own loyalty points"
ON public.loyalty_points FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all loyalty points"
ON public.loyalty_points FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage loyalty points"
ON public.loyalty_points FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for loyalty_transactions
CREATE POLICY "Users can view their own transactions"
ON public.loyalty_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
ON public.loyalty_transactions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage transactions"
ON public.loyalty_transactions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to add points to a user (called after purchase)
CREATE OR REPLACE FUNCTION public.add_loyalty_points(
  p_user_id UUID,
  p_points INTEGER,
  p_order_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT 'Points earned from purchase'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update loyalty_points
  INSERT INTO public.loyalty_points (user_id, points_balance, lifetime_points_earned)
  VALUES (p_user_id, p_points, p_points)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    points_balance = loyalty_points.points_balance + p_points,
    lifetime_points_earned = loyalty_points.lifetime_points_earned + p_points,
    updated_at = now();

  -- Record transaction
  INSERT INTO public.loyalty_transactions (user_id, transaction_type, points, order_id, description)
  VALUES (p_user_id, 'earn', p_points, p_order_id, p_description);

  RETURN TRUE;
END;
$$;

-- Function to redeem points
CREATE OR REPLACE FUNCTION public.redeem_loyalty_points(
  p_user_id UUID,
  p_points INTEGER,
  p_order_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT 'Points redeemed for discount'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT points_balance INTO v_current_balance
  FROM public.loyalty_points
  WHERE user_id = p_user_id;

  -- Check if enough points
  IF v_current_balance IS NULL OR v_current_balance < p_points THEN
    RETURN FALSE;
  END IF;

  -- Deduct points
  UPDATE public.loyalty_points
  SET points_balance = points_balance - p_points,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Record transaction (negative points for redemption)
  INSERT INTO public.loyalty_transactions (user_id, transaction_type, points, order_id, description)
  VALUES (p_user_id, 'redeem', -p_points, p_order_id, p_description);

  RETURN TRUE;
END;
$$;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_loyalty_points_updated_at
  BEFORE UPDATE ON public.loyalty_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();