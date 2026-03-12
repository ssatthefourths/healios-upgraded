import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import BlogPostList from "@/components/admin/BlogPostList";
import BlogPostEditor from "@/components/admin/BlogPostEditor";
import BlogCategoryManager from "@/components/admin/BlogCategoryManager";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowLeft } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type BlogPost = Tables<"blog_posts">;

const BlogAdmin = () => {
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingPost(null);
    setIsCreating(true);
  };

  const handleBack = () => {
    setEditingPost(null);
    setIsCreating(false);
  };

  const handleSave = () => {
    setEditingPost(null);
    setIsCreating(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <AdminLayout 
      title={editingPost ? "Edit Post" : isCreating ? "New Post" : "Blog"} 
      subtitle={editingPost || isCreating ? undefined : "Create, edit, and manage blog posts and categories"}
    >
      {editingPost || isCreating ? (
        <>
          <div className="mb-6">
            <Button variant="ghost" onClick={handleBack} className="gap-2">
              <ArrowLeft size={16} />
              Back to Posts
            </Button>
          </div>
          <BlogPostEditor
            post={editingPost}
            onSave={handleSave}
            onCancel={handleBack}
          />
        </>
      ) : (
        <>
          <div className="flex items-center justify-end mb-6">
            <Button onClick={handleCreate} className="gap-2">
              <Plus size={16} />
              New Post
            </Button>
          </div>
          
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts">
              <BlogPostList key={refreshKey} onEdit={handleEdit} />
            </TabsContent>
            
            <TabsContent value="categories">
              <BlogCategoryManager />
            </TabsContent>
          </Tabs>
        </>
      )}
    </AdminLayout>
  );
};

export default BlogAdmin;
