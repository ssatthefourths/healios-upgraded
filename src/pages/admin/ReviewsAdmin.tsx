import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check, X, Search, Image, BadgeCheck } from "lucide-react";

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  review_text: string;
  status: string;
  created_at: string;
  image_urls: string[] | null;
  product_name?: string;
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

const ReviewsAdmin = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    setLoading(true);
    
    let query = supabase
      .from('product_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Failed to load reviews");
      setLoading(false);
      return;
    }

    // Fetch product names and check verified purchases
    if (data && data.length > 0) {
      const productIds = [...new Set(data.map(r => r.product_id))];
      const userIds = [...new Set(data.map(r => r.user_id))];
      
      const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

      // Get all order items for these products
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_id, product_id')
        .in('product_id', productIds);

      const orderIds = orderItems?.map(oi => oi.order_id) || [];
      
      // Get orders with user_ids
      let verifiedPurchases: { user_id: string; product_id: string }[] = [];
      if (orderIds.length > 0) {
        const { data: orders } = await supabase
          .from('orders')
          .select('id, user_id')
          .in('id', orderIds)
          .in('user_id', userIds);
        
        if (orders && orderItems) {
          verifiedPurchases = orders.flatMap(order => {
            const orderProductIds = orderItems
              .filter(oi => oi.order_id === order.id)
              .map(oi => oi.product_id);
            return orderProductIds.map(pid => ({ 
              user_id: order.user_id as string, 
              product_id: pid 
            }));
          });
        }
      }

      const productMap = new Map(products?.map(p => [p.id, p.name]) || []);
      const reviewsWithProducts = data.map(r => ({
        ...r,
        product_name: productMap.get(r.product_id) || 'Unknown Product',
        isVerifiedPurchase: verifiedPurchases.some(
          vp => vp.user_id === r.user_id && vp.product_id === r.product_id
        )
      }));
      setReviews(reviewsWithProducts);
    } else {
      setReviews([]);
    }

    setLoading(false);
  };

  const updateReviewStatus = async (reviewId: string, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('product_reviews')
      .update({ status: newStatus })
      .eq('id', reviewId);

    if (error) {
      toast.error("Failed to update review");
      return;
    }

    toast.success(`Review ${newStatus}`);
    fetchReviews();
  };

  const filteredReviews = reviews.filter(review => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      review.product_name?.toLowerCase().includes(query) ||
      review.review_text.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status as keyof typeof styles] || ''}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <AdminLayout title="Reviews" subtitle="Moderate product reviews and ratings">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
              className="font-light capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : filteredReviews.length === 0 ? (
        <p className="text-muted-foreground font-light text-center py-12">
          No {filter === 'all' ? '' : filter} reviews found.
        </p>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div key={review.id} className="border border-border p-6 space-y-4 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{review.product_name}</p>
                    {review.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <StarDisplay rating={review.rating} />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(review.created_at), 'dd MMM yyyy')}
                    </span>
                    {getStatusBadge(review.status)}
                  </div>
                </div>
                
                {review.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateReviewStatus(review.id, 'approved')}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateReviewStatus(review.id, 'rejected')}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
              
              <p className="text-sm font-light text-muted-foreground leading-relaxed">
                {review.review_text}
              </p>
              
              {/* Review Images */}
              {review.image_urls && review.image_urls.length > 0 && (
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Image className="h-3 w-3" />
                    <span>{review.image_urls.length} image{review.image_urls.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex gap-2">
                    {review.image_urls.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(url)}
                        className="w-12 h-12 overflow-hidden rounded border border-border hover:border-foreground transition-colors"
                      >
                        <img
                          src={url}
                          alt={`Review image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Review image"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ReviewsAdmin;
