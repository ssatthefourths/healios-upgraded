import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import BlogPostCard from "@/components/blog/BlogPostCard";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import SEOHead from "@/components/seo/SEOHead";
import PageContainer from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, ChevronLeft, Twitter, Facebook, Linkedin, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
type BlogPost = Tables<"blog_posts">;
type BlogCategory = Tables<"blog_categories">;

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [category, setCategory] = useState<BlogCategory | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    setNotFound(false);

    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error || !data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setPost(data);

    // Fetch category if exists
    if (data.category_id) {
      const { data: catData } = await supabase
        .from("blog_categories")
        .select("*")
        .eq("id", data.category_id)
        .maybeSingle();

      if (catData) {
        setCategory(catData);
        
        // Fetch related posts from same category
        const { data: related } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("status", "published")
          .eq("category_id", data.category_id)
          .neq("id", data.id)
          .order("published_at", { ascending: false })
          .limit(3);

        if (related) {
          setRelatedPosts(related);
        }
      }
    }

    setLoading(false);
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || "";
    
    let shareUrl = "";
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  const publishDate = post?.published_at 
    ? format(new Date(post.published_at), "MMMM d, yyyy")
    : post?.created_at 
      ? format(new Date(post.created_at), "MMMM d, yyyy")
      : "";

  const canonicalUrl = `https://www.thehealios.com/blog/${slug}`;

  // JSON-LD structured data
  const jsonLd = post ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.meta_description || post.excerpt || "",
    "image": post.featured_image || "https://www.thehealios.com/images/og/healios-og.png",
    "datePublished": post.published_at || post.created_at,
    "dateModified": post.updated_at,
    "author": {
      "@type": "Organization",
      "name": "The Healios Health Co."
    },
    "publisher": {
      "@type": "Organization",
      "name": "The Healios Health Co.",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.thehealios.com/healios-logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    }
  } : null;

  // Breadcrumb items for schema
  const breadcrumbItems = post ? [
    { name: "Home", url: "https://www.thehealios.com/" },
    { name: "Blog", url: "https://www.thehealios.com/blog" },
    ...(category ? [{ name: category.name, url: `https://www.thehealios.com/blog?category=${category.slug}` }] : []),
    { name: post.title, url: canonicalUrl }
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <PageContainer className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </PageContainer>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <PageContainer maxWidth="content" className="text-center">
            <h1 className="text-3xl font-light text-foreground mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-8">The article you're looking for doesn't exist or has been removed.</p>
            <Link to="/blog">
              <Button variant="outline" className="gap-2">
                <ChevronLeft size={16} />
                Back to Blog
              </Button>
            </Link>
          </PageContainer>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Head */}
      <SEOHead
        title={post.seo_title || post.title}
        description={post.meta_description || post.excerpt || ""}
        canonicalUrl={canonicalUrl}
        ogType="article"
        ogImage={post.featured_image || "https://www.thehealios.com/images/og/healios-og.png"}
      />
      
      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      
      {/* Breadcrumb Schema */}
      {breadcrumbItems.length > 0 && <BreadcrumbSchema items={breadcrumbItems} />}

      <Header />
      
      <main>
        {/* Hero Section */}
        {post.featured_image && (
          <div className="w-full h-[40vh] md:h-[50vh] relative overflow-hidden">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        )}

        <PageContainer maxWidth="content">
          <article>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link to="/blog" className="hover:text-foreground transition-colors">
                Blog
              </Link>
              {category && (
                <>
                  <span>/</span>
                  <Link 
                    to={`/blog?category=${category.slug}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {category.name}
                  </Link>
                </>
              )}
            </nav>

            {/* Category Badge */}
            {category && (
              <Badge variant="secondary" className="mb-4">
                {category.name}
              </Badge>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {publishDate}
              </span>
              {post.reading_time_minutes && (
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {post.reading_time_minutes} min read
                </span>
              )}
              <span>By The Healios Health Co.</span>
            </div>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-lg text-muted-foreground mb-8 font-light leading-relaxed">
                {post.excerpt}
              </p>
            )}

            <Separator className="mb-8" />

            {/* Content */}
            <div className="prose prose-lg max-w-none prose-headings:font-light prose-headings:text-foreground prose-p:text-foreground/80 prose-p:leading-relaxed prose-a:text-primary prose-strong:text-foreground">
              {/* Render content - supports basic markdown-like formatting */}
              <div className="whitespace-pre-wrap text-foreground/80 leading-relaxed">
                {post.content.split('\n\n').map((paragraph, index) => {
                  // Handle headings
                  if (paragraph.startsWith('## ')) {
                    return <h2 key={index} className="text-2xl font-light text-foreground mt-8 mb-4">{paragraph.slice(3)}</h2>;
                  }
                  if (paragraph.startsWith('### ')) {
                    return <h3 key={index} className="text-xl font-light text-foreground mt-6 mb-3">{paragraph.slice(4)}</h3>;
                  }
                  // Handle lists
                  if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                    const items = paragraph.split('\n').filter(line => line.startsWith('- ') || line.startsWith('* '));
                    return (
                      <ul key={index} className="list-disc list-inside my-4 space-y-2">
                        {items.map((item, i) => (
                          <li key={i}>{item.slice(2)}</li>
                        ))}
                      </ul>
                    );
                  }
                  // Regular paragraph
                  return <p key={index} className="mb-4">{paragraph}</p>;
                })}
              </div>
            </div>

            <Separator className="my-8" />

            {/* Share Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-sm font-medium text-foreground">Share this article</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare("twitter")}
                  title="Share on Twitter"
                >
                  <Twitter size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare("facebook")}
                  title="Share on Facebook"
                >
                  <Facebook size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare("linkedin")}
                  title="Share on LinkedIn"
                >
                  <Linkedin size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare("copy")}
                  title="Copy link"
                >
                  <LinkIcon size={16} />
                </Button>
              </div>
            </div>
          </article>
        </PageContainer>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="bg-muted/30 py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-light text-foreground mb-8 text-center">
                Related Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {relatedPosts.map((relatedPost) => (
                  <BlogPostCard
                    key={relatedPost.id}
                    post={relatedPost}
                    categoryName={category?.name}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Back to Blog */}
        <PageContainer maxWidth="content" className="text-center pt-0">
          <Link to="/blog">
            <Button variant="outline" className="gap-2">
              <ChevronLeft size={16} />
              Back to Wellness Journal
            </Button>
          </Link>
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPostPage;
