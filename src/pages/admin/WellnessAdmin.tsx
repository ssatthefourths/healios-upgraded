import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, ExternalLink, Loader2 } from "lucide-react";
import { logger } from "@/lib/logger";
import { format } from "date-fns";

interface WellnessPost {
  id: string;
  social_link: string;
  thumbnail_url: string | null;
  display_name: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  reviewed_at: string | null;
}

const WellnessAdmin = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<WellnessPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllPosts();
  }, []);

  const fetchAllPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("wellness_posts")
        .select("id, social_link, thumbnail_url, display_name, status, submitted_at, reviewed_at")
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      setPosts((data as WellnessPost[]) || []);
    } catch (error) {
      logger.error("Error fetching posts", error);
      toast.error("Failed to load posts");
    } finally {
      setLoadingPosts(false);
    }
  };

  const updatePostStatus = async (postId: string, newStatus: "approved" | "rejected") => {
    if (!user) return;
    
    setProcessingId(postId);
    try {
      const { error } = await supabase
        .from("wellness_posts")
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id
        })
        .eq("id", postId);

      if (error) throw error;

      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, status: newStatus, reviewed_at: new Date().toISOString() }
          : post
      ));

      toast.success(`Post ${newStatus === "approved" ? "approved" : "rejected"}`);
    } catch (error: unknown) {
      logger.error("Error updating post", error);
      toast.error((error as Error).message || "Failed to update post");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const pendingPosts = posts.filter(p => p.status === "pending");
  const reviewedPosts = posts.filter(p => p.status !== "pending");

  return (
    <AdminLayout title="Wellness Posts" subtitle="Review community wellness submissions">
      {/* Pending Posts */}
      <section className="mb-12">
        <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          Pending Review
          {pendingPosts.length > 0 && (
            <Badge variant="secondary">{pendingPosts.length}</Badge>
          )}
        </h2>
        
        {loadingPosts ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : pendingPosts.length > 0 ? (
          <div className="space-y-3">
            {pendingPosts.map((post) => (
              <div 
                key={post.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{post.display_name}</span>
                    {getStatusBadge(post.status)}
                  </div>
                  <a 
                    href={post.social_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
                  >
                    {post.social_link}
                    <ExternalLink size={12} />
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">
                    Submitted {format(new Date(post.submitted_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updatePostStatus(post.id, "approved")}
                    disabled={processingId === post.id}
                    className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                  >
                    {processingId === post.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updatePostStatus(post.id, "rejected")}
                    disabled={processingId === post.id}
                    className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    {processingId === post.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <X size={16} />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">No pending posts to review</p>
          </div>
        )}
      </section>

      {/* Reviewed Posts */}
      <section>
        <h2 className="text-lg font-medium text-foreground mb-4">
          Reviewed Posts
        </h2>
        
        {loadingPosts ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : reviewedPosts.length > 0 ? (
          <div className="space-y-3">
            {reviewedPosts.map((post) => (
              <div 
                key={post.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{post.display_name}</span>
                    {getStatusBadge(post.status)}
                  </div>
                  <a 
                    href={post.social_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
                  >
                    {post.social_link}
                    <ExternalLink size={12} />
                  </a>
                  {post.reviewed_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Reviewed {format(new Date(post.reviewed_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {post.status === "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updatePostStatus(post.id, "approved")}
                      disabled={processingId === post.id}
                    >
                      Approve
                    </Button>
                  )}
                  {post.status === "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updatePostStatus(post.id, "rejected")}
                      disabled={processingId === post.id}
                    >
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">No reviewed posts yet</p>
          </div>
        )}
      </section>
    </AdminLayout>
  );
};

export default WellnessAdmin;
