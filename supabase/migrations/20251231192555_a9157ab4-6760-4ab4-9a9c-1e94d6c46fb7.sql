-- Create function to get personalized product recommendations
-- Based on: browsing history, purchase patterns, category affinity, and pairs_well_with

CREATE OR REPLACE FUNCTION public.get_personalized_recommendations(
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL,
  p_current_product_id text DEFAULT NULL,
  p_limit integer DEFAULT 6
)
RETURNS TABLE(
  id text,
  name text,
  price numeric,
  image text,
  category text,
  slug text,
  stock_quantity integer,
  recommendation_score numeric,
  recommendation_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_has_history boolean := false;
BEGIN
  -- Check if user has any browsing/purchase history
  IF p_user_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM product_analytics WHERE user_id = p_user_id LIMIT 1
    ) INTO v_has_history;
  END IF;
  
  IF NOT v_has_history AND p_session_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM product_analytics WHERE session_id = p_session_id LIMIT 1
    ) INTO v_has_history;
  END IF;

  RETURN QUERY
  WITH user_activity AS (
    -- Get user's product interactions
    SELECT 
      pa.product_id,
      pa.event_type,
      pa.created_at,
      CASE 
        WHEN pa.event_type = 'purchase' THEN 10
        WHEN pa.event_type = 'add_to_cart' THEN 5
        WHEN pa.event_type = 'wishlist_add' THEN 4
        WHEN pa.event_type = 'view' THEN 1
        ELSE 0
      END as interaction_weight
    FROM product_analytics pa
    WHERE (p_user_id IS NOT NULL AND pa.user_id = p_user_id)
       OR (p_session_id IS NOT NULL AND pa.session_id = p_session_id)
  ),
  
  category_affinity AS (
    -- Calculate category preferences based on interactions
    SELECT 
      p.category,
      SUM(ua.interaction_weight) as category_score
    FROM user_activity ua
    JOIN products p ON p.id = ua.product_id
    GROUP BY p.category
  ),
  
  purchased_products AS (
    -- Get products the user has purchased (to exclude and find pairs)
    SELECT DISTINCT product_id
    FROM user_activity
    WHERE event_type = 'purchase'
  ),
  
  viewed_not_purchased AS (
    -- Products viewed but not purchased (high intent)
    SELECT 
      ua.product_id,
      COUNT(*) as view_count,
      MAX(ua.created_at) as last_viewed
    FROM user_activity ua
    WHERE ua.event_type = 'view'
      AND ua.product_id NOT IN (SELECT product_id FROM purchased_products)
    GROUP BY ua.product_id
  ),
  
  pairs_from_purchases AS (
    -- Get "pairs well with" products from purchased items
    SELECT UNNEST(p.pairs_well_with) as paired_product_id
    FROM purchased_products pp
    JOIN products p ON p.id = pp.product_id
    WHERE p.pairs_well_with IS NOT NULL
  ),
  
  scored_products AS (
    SELECT 
      p.id,
      p.name,
      p.price,
      p.image,
      p.category,
      p.slug,
      p.stock_quantity,
      (
        -- Score based on category affinity
        COALESCE((SELECT category_score FROM category_affinity WHERE category = p.category), 0) * 2
        -- Bonus for viewed but not purchased
        + COALESCE((SELECT view_count * 3 FROM viewed_not_purchased WHERE product_id = p.id), 0)
        -- Bonus for being a "pairs well with" item
        + CASE WHEN p.id IN (SELECT paired_product_id FROM pairs_from_purchases) THEN 15 ELSE 0 END
        -- Small random factor to add variety
        + (random() * 2)
      )::numeric(10,2) as recommendation_score,
      CASE
        WHEN p.id IN (SELECT paired_product_id FROM pairs_from_purchases) THEN 'Pairs with your purchases'
        WHEN p.id IN (SELECT product_id FROM viewed_not_purchased) THEN 'Recently viewed'
        WHEN p.category IN (SELECT category FROM category_affinity ORDER BY category_score DESC LIMIT 1) THEN 'Based on your interests'
        ELSE 'Popular pick'
      END as recommendation_reason
    FROM products p
    WHERE p.is_published = true
      AND p.stock_quantity > 0
      -- Exclude already purchased products
      AND p.id NOT IN (SELECT product_id FROM purchased_products)
      -- Exclude current product if specified
      AND (p_current_product_id IS NULL OR p.id != p_current_product_id)
  )
  
  SELECT 
    sp.id,
    sp.name,
    sp.price,
    sp.image,
    sp.category,
    sp.slug,
    sp.stock_quantity,
    sp.recommendation_score,
    sp.recommendation_reason
  FROM scored_products sp
  ORDER BY sp.recommendation_score DESC
  LIMIT p_limit;
END;
$$;