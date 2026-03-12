import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BadgeCheck } from "lucide-react";

const REVIEWS_PER_PAGE = 5;

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review_text: string;
  created_at: string;
  image_urls: string[] | null;
  isVerifiedPurchase?: boolean;
}

const StarDisplay = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className={`w-4 h-4 ${star <= rating ? 'text-foreground' : 'text-muted-foreground/30'}`}
      >
        <path
          fillRule="evenodd"
          d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
          clipRule="evenodd"
        />
      </svg>
    ))}
  </div>
);

interface ProductReviewsProps {
  productId: string;
  refreshTrigger?: number;
}

const ProductReviews = ({ productId, refreshTrigger }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Fetch review summary (count + avg rating)
  const fetchSummary = async () => {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('rating')
      .eq('product_id', productId);

    if (!error && data && data.length > 0) {
      const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
      setAverageRating(Math.round(avg * 10) / 10);
      setTotalCount(data.length);
    } else {
      setAverageRating(null);
      setTotalCount(0);
    }
  };

  // Fetch paginated reviews
  const fetchReviews = async (page: number, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    const offset = (page - 1) * REVIEWS_PER_PAGE;
    
    const { data, error } = await supabase
      .from('product_reviews')
      .select('id, user_id, rating, review_text, created_at, image_urls')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .range(offset, offset + REVIEWS_PER_PAGE - 1);

    if (!error && data) {
      // Check verified purchases for each reviewer
      const userIds = [...new Set(data.map(r => r.user_id))];
      
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_id, product_id')
        .eq('product_id', productId);

      const orderIds = orderItems?.map(oi => oi.order_id) || [];
      
      let verifiedUserIds: string[] = [];
      if (orderIds.length > 0) {
        const { data: orders } = await supabase
          .from('orders')
          .select('user_id')
          .in('id', orderIds)
          .in('user_id', userIds);
        
        verifiedUserIds = orders?.map(o => o.user_id).filter(Boolean) as string[] || [];
      }

      const reviewsWithVerification = data.map(r => ({
        ...r,
        isVerifiedPurchase: verifiedUserIds.includes(r.user_id)
      }));

      if (append) {
        setReviews(prev => [...prev, ...reviewsWithVerification]);
      } else {
        setReviews(reviewsWithVerification);
      }
    }

    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchSummary();
    fetchReviews(1);
  }, [productId, refreshTrigger]);

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchReviews(nextPage, true);
  };

  const hasMore = reviews.length < totalCount;

  if (loading) {
    return (
      <div className="py-8">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="py-8">
        <p className="text-sm text-muted-foreground font-light">No reviews yet. Be the first to review this product.</p>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-3">
        <StarDisplay rating={Math.round(averageRating || 0)} />
        <span className="text-sm font-light text-foreground">
          {averageRating} out of 5 ({totalCount} {totalCount === 1 ? 'review' : 'reviews'})
        </span>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-t border-border pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <StarDisplay rating={review.rating} />
                {review.isVerifiedPurchase && (
                  <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified Purchase
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground font-light">
                {format(new Date(review.created_at), 'dd MMM yyyy')}
              </span>
            </div>
            <p className="text-sm font-light text-foreground leading-relaxed">
              {review.review_text}
            </p>
            {/* Review Images */}
            {review.image_urls && review.image_urls.length > 0 && (
              <div className="flex gap-2 mt-3">
                {review.image_urls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(url)}
                    className="w-16 h-16 overflow-hidden rounded hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={url}
                      alt={`Review image ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-none"
          >
            {loadingMore ? "Loading..." : `Load More Reviews (${totalCount - reviews.length} remaining)`}
          </Button>
        </div>
      )}

      {/* Image Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden !rounded-none">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Review image"
              loading="lazy"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductReviews;
