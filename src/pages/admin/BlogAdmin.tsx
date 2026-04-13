import AdminLayout from "@/components/admin/AdminLayout";
import BlogPostList from "@/components/admin/BlogPostList";
import BlogPostEditor from "@/components/admin/BlogPostEditor";
import BlogCategoryManager from "@/components/admin/BlogCategoryManager";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { BlogPost } from "@/types/admin";
import { useAdminCRUD } from "@/hooks/useAdminCRUD";

const BlogAdmin = () => {
  const {
    editingItem: editingPost,
    isCreating,
    refreshKey,
    handleEdit,
    handleCreate,
    handleBack,
    handleSave,
    isViewingList,
  } = useAdminCRUD<BlogPost>();

  return (
    <AdminLayout 
      title={editingPost ? "Edit Post" : isCreating ? "New Post" : "Blog"} 
      subtitle={isViewingList ? "Create, edit, and manage blog posts and categories" : undefined}
    >
      {isViewingList ? (
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
      ) : (
        <BlogPostEditor
          post={editingPost}
          onSave={handleSave}
          onCancel={handleBack}
        />
      )}
    </AdminLayout>
  );
};

export default BlogAdmin;
