CREATE OR REPLACE FUNCTION public.get_personalized_recommendations(
  p_user_id uuid DEFAULT NULL::uuid, 
  p_session_id text DEFAULT NULL::text, 
  p_current_product_id text DEFAULT NULL::text, 
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
AS $function$
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
    SELECT 
      prod.category AS cat_name,
      SUM(ua.interaction_weight) as category_score
    FROM user_activity ua
    JOIN products prod ON prod.id = ua.product_id
    GROUP BY prod.category
  ),
  
  purchased_products AS (
    SELECT DISTINCT ua.product_id
    FROM user_activity ua
    WHERE ua.event_type = 'purchase'
  ),
  
  viewed_not_purchased AS (
    SELECT 
      ua.product_id,
      COUNT(*) as view_count,
      MAX(ua.created_at) as last_viewed
    FROM user_activity ua
    WHERE ua.event_type = 'view'
      AND ua.product_id NOT IN (SELECT pp.product_id FROM purchased_products pp)
    GROUP BY ua.product_id
  ),
  
  pairs_from_purchases AS (
    SELECT UNNEST(prod.pairs_well_with) as paired_product_id
    FROM purchased_products pp
    JOIN products prod ON prod.id = pp.product_id
    WHERE prod.pairs_well_with IS NOT NULL
  ),
  
  scored_products AS (
    SELECT 
      prod.id AS product_id,
      prod.name AS product_name,
      prod.price AS product_price,
      prod.image AS product_image,
      prod.category AS product_category,
      prod.slug AS product_slug,
      prod.stock_quantity AS product_stock,
      (
        COALESCE((SELECT ca.category_score FROM category_affinity ca WHERE ca.cat_name = prod.category), 0) * 2
        + COALESCE((SELECT vnp.view_count * 3 FROM viewed_not_purchased vnp WHERE vnp.product_id = prod.id), 0)
        + CASE WHEN prod.id IN (SELECT pfp.paired_product_id FROM pairs_from_purchases pfp) THEN 15 ELSE 0 END
        + (random() * 2)
      )::numeric(10,2) as calc_score,
      CASE
        WHEN prod.id IN (SELECT pfp.paired_product_id FROM pairs_from_purchases pfp) THEN 'Pairs with your purchases'
        WHEN prod.id IN (SELECT vnp.product_id FROM viewed_not_purchased vnp) THEN 'Recently viewed'
        WHEN prod.category IN (SELECT ca.cat_name FROM category_affinity ca ORDER BY ca.category_score DESC LIMIT 1) THEN 'Based on your interests'
        ELSE 'Popular pick'
      END as calc_reason
    FROM products prod
    WHERE prod.is_published = true
      AND prod.stock_quantity > 0
      AND prod.id NOT IN (SELECT pp.product_id FROM purchased_products pp)
      AND (p_current_product_id IS NULL OR prod.id != p_current_product_id)
  )
  
  SELECT 
    sp.product_id,
    sp.product_name,
    sp.product_price,
    sp.product_image,
    sp.product_category,
    sp.product_slug,
    sp.product_stock,
    sp.calc_score,
    sp.calc_reason
  FROM scored_products sp
  ORDER BY sp.calc_score DESC
  LIMIT p_limit;
END;
$function$;