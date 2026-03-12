-- Add status column to product_reviews
ALTER TABLE public.product_reviews 
ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Drop the old public viewing policy
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.product_reviews;

-- Only approved reviews are publicly visible
CREATE POLICY "Anyone can view approved reviews"
ON public.product_reviews
FOR SELECT
USING (status = 'approved');

-- Users can view their own reviews regardless of status
CREATE POLICY "Users can view their own reviews"
ON public.product_reviews
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
ON public.product_reviews
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update review status
CREATE POLICY "Admins can update reviews"
ON public.product_reviews
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));