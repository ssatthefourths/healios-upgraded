-- Create a view for best seller products with ranking logic
-- Score = (purchase_count * 10) + (add_to_cart_count * 3) + (view_count * 0.1) + (avg_rating * 5)
CREATE OR REPLACE VIEW public.best_seller_products AS
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
  p.slug,
  p.is_published,
  p.stock_quantity,
  p.is_kids_product,
  p.is_adults_only,
  COALESCE(pas.purchase_count, 0) AS purchase_count,
  COALESCE(pas.add_to_cart_count, 0) AS add_to_cart_count,
  COALESCE(pas.view_count, 0) AS view_count,
  COALESCE(pr.avg_rating, 0) AS avg_rating,
  COALESCE(pr.review_count, 0) AS review_count,
  -- Best seller score formula
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
ORDER BY best_seller_score DESC;