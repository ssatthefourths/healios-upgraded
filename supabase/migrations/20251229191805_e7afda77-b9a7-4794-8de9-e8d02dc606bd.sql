-- Create function to get best seller products
CREATE OR REPLACE FUNCTION public.get_best_seller_products()
RETURNS TABLE (
  id text,
  name text,
  category text,
  price numeric,
  image text,
  is_published boolean,
  stock_quantity integer,
  is_kids_product boolean,
  is_adults_only boolean,
  best_seller_score numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH product_analytics_summary AS (
    SELECT 
      product_id,
      COUNT(*) FILTER (WHERE event_type = 'purchase') AS purchase_count,
      COUNT(*) FILTER (WHERE event_type = 'add_to_cart') AS add_to_cart_count,
      COUNT(*) FILTER (WHERE event_type = 'view') AS view_count
    FROM public.product_analytics
    WHERE created_at > now() - interval '90 days'
    GROUP BY product_id
  ),
  product_ratings AS (
    SELECT 
      product_id,
      AVG(rating)::numeric(3,2) AS avg_rating,
      COUNT(*) AS review_count
    FROM public.product_reviews
    WHERE status = 'approved'
    GROUP BY product_id
  )
  SELECT 
    p.id,
    p.name,
    p.category,
    p.price,
    p.image,
    p.is_published,
    p.stock_quantity,
    p.is_kids_product,
    p.is_adults_only,
    (
      COALESCE(pas.purchase_count, 0) * 10 +
      COALESCE(pas.add_to_cart_count, 0) * 3 +
      COALESCE(pas.view_count, 0) * 0.1 +
      COALESCE(pr.avg_rating, 0) * 5
    )::numeric(10,2) AS best_seller_score
  FROM public.products p
  LEFT JOIN product_analytics_summary pas ON pas.product_id = p.id
  LEFT JOIN product_ratings pr ON pr.product_id = p.id
  WHERE p.is_published = true
  ORDER BY best_seller_score DESC
  LIMIT 8;
$$;