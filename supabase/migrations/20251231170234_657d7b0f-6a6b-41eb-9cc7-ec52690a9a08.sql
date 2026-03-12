-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  referred_email TEXT,
  referred_user_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  order_id UUID,
  referrer_reward_points INTEGER DEFAULT 500,
  referred_reward_points INTEGER DEFAULT 250,
  referrer_rewarded_at TIMESTAMP WITH TIME ZONE,
  referred_rewarded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'signed_up', 'converted', 'rewarded'))
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view their own referrals"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals where they are the referred user"
ON public.referrals
FOR SELECT
USING (auth.uid() = referred_user_id);

CREATE POLICY "Users can create referrals"
ON public.referrals
FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Admins can manage all referrals"
ON public.referrals
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add index for referral code lookups
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
  user_name TEXT;
BEGIN
  -- Get first name from profile
  SELECT UPPER(COALESCE(SUBSTRING(first_name FROM 1 FOR 4), 'USER')) INTO user_name
  FROM public.profiles WHERE id = user_id;
  
  LOOP
    -- Generate code like JANE5A3B
    new_code := user_name || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    
    SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referral_code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Function to get or create user's referral code
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_code TEXT;
  new_code TEXT;
BEGIN
  -- Check for existing referral record for this user as referrer
  SELECT referral_code INTO existing_code
  FROM public.referrals
  WHERE referrer_id = p_user_id
  LIMIT 1;
  
  IF existing_code IS NOT NULL THEN
    RETURN existing_code;
  END IF;
  
  -- Generate new code
  new_code := generate_referral_code(p_user_id);
  
  -- Create initial referral record (pending, no referred user yet)
  INSERT INTO public.referrals (referrer_id, referral_code, status)
  VALUES (p_user_id, new_code, 'pending');
  
  RETURN new_code;
END;
$$;

-- Function to validate and apply referral code
CREATE OR REPLACE FUNCTION public.apply_referral_code(
  p_code TEXT,
  p_referred_email TEXT,
  p_referred_user_id UUID DEFAULT NULL
)
RETURNS TABLE(valid BOOLEAN, message TEXT, referrer_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral RECORD;
  v_referrer_name TEXT;
BEGIN
  -- Find the referral by code
  SELECT r.*, p.first_name INTO v_referral
  FROM public.referrals r
  JOIN public.profiles p ON p.id = r.referrer_id
  WHERE r.referral_code = UPPER(TRIM(p_code))
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid referral code'::TEXT, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Can't refer yourself
  IF v_referral.referrer_id = p_referred_user_id THEN
    RETURN QUERY SELECT false, 'You cannot use your own referral code'::TEXT, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Check if this email was already referred
  IF EXISTS (
    SELECT 1 FROM public.referrals 
    WHERE referred_email = p_referred_email 
    AND status != 'pending'
  ) THEN
    RETURN QUERY SELECT false, 'This email has already been referred'::TEXT, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Create a new referral record for this specific referral
  INSERT INTO public.referrals (
    referrer_id,
    referral_code,
    referred_email,
    referred_user_id,
    status
  ) VALUES (
    v_referral.referrer_id,
    v_referral.referral_code,
    p_referred_email,
    p_referred_user_id,
    CASE WHEN p_referred_user_id IS NOT NULL THEN 'signed_up' ELSE 'pending' END
  )
  ON CONFLICT (referral_code) DO NOTHING;
  
  v_referrer_name := COALESCE(v_referral.first_name, 'A friend');
  
  RETURN QUERY SELECT true, ('Referred by ' || v_referrer_name)::TEXT, v_referrer_name;
END;
$$;

-- Function to complete referral and award points
CREATE OR REPLACE FUNCTION public.complete_referral(
  p_referred_user_id UUID,
  p_order_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral RECORD;
BEGIN
  -- Find unconverted referral for this user
  SELECT * INTO v_referral
  FROM public.referrals
  WHERE referred_user_id = p_referred_user_id
  AND status IN ('signed_up', 'pending')
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update referral status
  UPDATE public.referrals
  SET 
    status = 'converted',
    order_id = p_order_id,
    converted_at = now()
  WHERE id = v_referral.id;
  
  -- Award points to referrer
  PERFORM add_loyalty_points(
    v_referral.referrer_id, 
    v_referral.referrer_reward_points, 
    p_order_id, 
    'Referral bonus - friend made their first purchase'
  );
  
  -- Award points to referred user
  PERFORM add_loyalty_points(
    p_referred_user_id, 
    v_referral.referred_reward_points, 
    p_order_id, 
    'Welcome bonus - referred by a friend'
  );
  
  -- Mark as rewarded
  UPDATE public.referrals
  SET 
    status = 'rewarded',
    referrer_rewarded_at = now(),
    referred_rewarded_at = now()
  WHERE id = v_referral.id;
  
  RETURN TRUE;
END;
$$;