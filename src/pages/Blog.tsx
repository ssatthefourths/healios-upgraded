import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import BlogPostCard from "@/components/blog/BlogPostCard";
import SEOHead from "@/components/seo/SEOHead";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type BlogPost = Tables<"blog_posts">;
type BlogCategory = Tables<"blog_categories">;

const POSTS_PER_PAGE = 12;

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const selectedCategory = searchParams.get("category") || "";

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [currentPage, selectedCategory]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("blog_categories")
      .select("*")
      .order("sort_order");

    if (data) {
      setCategories(data);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);

    // Get count first
    let countQuery = supabase
      .from("blog_posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "published");

    if (selectedCategory) {
      const category = categories.find(c => c.slug === selectedCategory);
      if (category) {
        countQuery = countQuery.eq("category_id", category.id);
      }
    }

    const { count } = await countQuery;
    setTotalCount(count || 0);

    // Then get paginated posts
    const from = (currentPage - 1) * POSTS_PER_PAGE;
    const to = from + POSTS_PER_PAGE - 1;

    let query = supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(from, to);

    if (selectedCategory) {
      const category = categories.find(c => c.slug === selectedCategory);
      if (category) {
        query = query.eq("category_id", category.id);
      }
    }

    const { data, error } = await query;

    if (!error && data) {
      setPosts(data);
    }
    setLoading(false);
  };

  const handleCategoryChange = (categorySlug: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (categorySlug) {
      newParams.set("category", categorySlug);
    } else {
      newParams.delete("category");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", page.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    return categories.find(c => c.id === categoryId)?.name;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Wellness Blog | Healios"
        description="Explore expert wellness tips, supplement guides, and health insights from Healios. Stay informed on your journey to better health."
        canonicalUrl="https://www.thehealios.com/blog"
        keywords={["wellness blog", "health tips", "supplement guide", "vitamin information", "gummy vitamins"]}
      />
      
      <Header />
      <main>
        <PageContainer>
          <PageHeader 
            title="Wellness Blog"
            subtitle="Expert insights, tips, and guides to support your wellness journey"
            centered
          />

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-xs mb-lg">
              <Button
                variant={selectedCategory === "" ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange("")}
                className="rounded-full px-md"
              >
                All Posts
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.slug ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryChange(category.slug)}
                  className="rounded-full px-md"
                >
                  {category.name}
                </Button>
              ))}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : posts.length === 0 ? (
            /* Empty State */
            <div className="text-center py-xl">
              <p className="text-muted-foreground text-lg font-light">
                {selectedCategory 
                  ? "No posts found in this category yet."
                  : "No blog posts published yet. Check back soon!"}
              </p>
            </div>
          ) : (
            <>
              {/* Posts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md md:gap-lg mb-xl">
                {posts.map((post) => (
                  <BlogPostCard
                    key={post.id}
                    post={post}
                    categoryName={getCategoryName(post.category_id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first, last, current, and adjacent pages
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="w-10"
                          >
                            {page}
                          </Button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="px-2 text-muted-foreground">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              )}

              {/* Results Count */}
              <p className="text-center text-sm text-muted-foreground mt-4">
                Showing {(currentPage - 1) * POSTS_PER_PAGE + 1} - {Math.min(currentPage * POSTS_PER_PAGE, totalCount)} of {totalCount} posts
              </p>
            </>
          )}
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;