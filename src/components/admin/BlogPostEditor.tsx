import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Eye, Loader2, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AdminFormLayout } from "./ui/AdminFormLayout";
import { BlogPost, BlogCategory } from "@/types/admin";

interface BlogPostEditorProps {
  post: BlogPost | null;
  onSave: () => void;
  onCancel: () => void;
}

const BlogPostEditor = ({ post, onSave, onCancel }: BlogPostEditorProps) => {
  const { user } = useAuth();
  const isEditing = !!post;
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Form state
  const [title, setTitle] = useState(post?.title || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [content, setContent] = useState(post?.content || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [featuredImage, setFeaturedImage] = useState(post?.featured_image || "");
  const [categoryId, setCategoryId] = useState(post?.category_id || "__none__");
  const [status, setStatus] = useState<"draft" | "published" | "archived">(post?.status || "draft");
  const [publishedAt, setPublishedAt] = useState<Date | undefined>(
    post?.published_at ? new Date(post.published_at) : undefined
  );
  const [seoTitle, setSeoTitle] = useState(post?.seo_title || "");
  const [metaDescription, setMetaDescription] = useState(post?.meta_description || "");
  const [readingTime, setReadingTime] = useState(post?.reading_time_minutes || 5);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Auto-generate slug from title
    if (!post && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(generatedSlug);
    }
  }, [title, post]);

  useEffect(() => {
    // Calculate reading time based on content
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(wordCount / 200));
    setReadingTime(minutes);
  }, [content]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("blog_categories")
      .select("*")
      .order("sort_order");

    if (!error && data) {
      setCategories(data as any[]);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `blog/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Failed to upload image");
      console.error(uploadError);
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);
      setFeaturedImage(publicUrl);
      toast.success("Image uploaded");
    }
    setUploadingImage(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

    setSaving(true);

    const postData = {
      title: title.trim(),
      slug: slug.trim(),
      content: content.trim(),
      excerpt: excerpt.trim() || null,
      featured_image: featuredImage || null,
      category_id: (categoryId && categoryId !== "__none__") ? categoryId : null,
      status,
      published_at: status === "published" ? (publishedAt?.toISOString() || new Date().toISOString()) : null,
      seo_title: seoTitle.trim() || null,
      meta_description: metaDescription.trim() || null,
      reading_time_minutes: readingTime,
      author_id: user?.id || "",
    };

    try {
      if (post) {
        const { error } = await supabase
          .from("blog_posts")
          .update(postData)
          .eq("id", post.id);

        if (error) throw error;
        toast.success("Post updated successfully");
      } else {
        const { error } = await supabase
          .from("blog_posts")
          .insert(postData);

        if (error) throw error;
        toast.success("Post created successfully");
      }
      onSave();
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("A post with this slug already exists");
      } else {
        toast.error(error.message || "Failed to save post");
        console.error(error);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminFormLayout
      title={isEditing ? `Edit: ${title}` : "Create New Post"}
      subtitle={isEditing ? "Update your blog post content and visibility" : "Draft a new article for your wellness blog"}
      onSave={handleSave}
      onCancel={onCancel}
      isSaving={saving}
      isEditing={isEditing}
      extraActions={
        <Button
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2"
        >
          <Eye size={16} />
          {showPreview ? "Hide Preview" : "Preview"}
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter post title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="post-url-slug"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief summary of the post"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content (Markdown supported)</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your post content here..."
                  rows={15}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Estimated reading time: {readingTime} min
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {showPreview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <article className="prose prose-sm max-w-none">
                  <h1>{title || "Untitled"}</h1>
                  {excerpt && <p className="lead text-muted-foreground">{excerpt}</p>}
                  <div className="whitespace-pre-wrap">{content}</div>
                </article>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v: "draft" | "published" | "archived") => setStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {status === "published" && (
                <div className="space-y-2">
                  <Label>Publish Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !publishedAt && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {publishedAt ? format(publishedAt, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={publishedAt}
                        onSelect={setPublishedAt}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Uncategorized</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Featured Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {featuredImage ? (
                <div className="relative">
                  <img
                    src={featuredImage}
                    alt="Featured"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => setFeaturedImage("")}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploadingImage ? (
                      <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input
                  id="seoTitle"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={title || "SEO title"}
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">
                  {seoTitle.length}/60 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Brief description for search engines"
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">
                  {metaDescription.length}/160 characters
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminFormLayout>
  );
};

export default BlogPostEditor;
