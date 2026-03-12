import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type BlogPost = Tables<"blog_posts">;

interface BlogPostCardProps {
  post: BlogPost;
  categoryName?: string | null;
}

const BlogPostCard = ({ post, categoryName }: BlogPostCardProps) => {
  const publishDate = post.published_at 
    ? format(new Date(post.published_at), "MMM d, yyyy")
    : format(new Date(post.created_at), "MMM d, yyyy");

  return (
    <Link 
      to={`/blog/${post.slug}`}
      className="group block bg-card rounded-lg overflow-hidden border border-border hover:border-primary/20 transition-all duration-300 hover:shadow-lg"
    >
      {/* Featured Image */}
      <div className="aspect-[16/10] overflow-hidden bg-muted">
        {post.featured_image ? (
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
            <span className="text-4xl font-light text-primary/20">H</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category Badge */}
        {categoryName && (
          <Badge variant="secondary" className="mb-3 text-xs font-normal">
            {categoryName}
          </Badge>
        )}

        {/* Title */}
        <h2 className="text-lg font-medium text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h2>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {post.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {publishDate}
          </span>
          {post.reading_time_minutes && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {post.reading_time_minutes} min read
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default BlogPostCard;
