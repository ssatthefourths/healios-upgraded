import { useState, useEffect } from "react";
import OptimizedImage from "@/components/ui/optimized-image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ExternalLink, Heart, User } from "lucide-react";
import wellnessHeroImage from "@/assets/womens-wellness-hero.jpg";

const submissionSchema = z.object({
  socialLink: z.string()
    .url("Please enter a valid URL")
    .refine((url) => {
      const patterns = [
        /instagram\.com/i,
        /tiktok\.com/i,
        /youtube\.com/i,
        /youtu\.be/i,
        /facebook\.com/i,
        /twitter\.com/i,
        /x\.com/i
      ];
      return patterns.some(pattern => pattern.test(url));
    }, "Please enter a valid social media link (Instagram, TikTok, YouTube, Facebook, or X)"),
  displayName: z.string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be less than 50 characters")
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

interface WellnessPost {
  id: string;
  social_link: string;
  thumbnail_url: string | null;
  display_name: string;
  submitted_at: string;
}

const WellnessDrive = () => {
  const { user } = useAuth();
  const [approvedPosts, setApprovedPosts] = useState<WellnessPost[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      socialLink: "",
      displayName: ""
    }
  });

  useEffect(() => {
    fetchApprovedPosts();
  }, []);

  const fetchApprovedPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("wellness_posts")
        .select("id, social_link, thumbnail_url, display_name, submitted_at")
        .eq("status", "approved")
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      setApprovedPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SubmissionFormData) => {
    if (!user) {
      toast.error("Please sign in to submit your wellness story");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("wellness_posts")
        .insert({
          user_id: user.id,
          social_link: data.socialLink,
          display_name: data.displayName
        });

      if (error) throw error;

      toast.success("Your wellness story has been submitted for review!");
      form.reset();
    } catch (error: any) {
      console.error("Error submitting post:", error);
      toast.error(error.message || "Failed to submit your story");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSocialPlatform = (url: string): string => {
    if (/instagram\.com/i.test(url)) return "Instagram";
    if (/tiktok\.com/i.test(url)) return "TikTok";
    if (/youtube\.com|youtu\.be/i.test(url)) return "YouTube";
    if (/facebook\.com/i.test(url)) return "Facebook";
    if (/twitter\.com|x\.com/i.test(url)) return "X";
    return "Social";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Image */}
        <section className="px-page">
          <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-lg">
            <OptimizedImage 
              src={wellnessHeroImage} 
              alt="Diverse women celebrating wellness together"
              priority={true}
              className="w-full h-auto"
            />
            </div>
          </div>
        </section>

        {/* Hero Text Section */}
        <section className="px-page py-[var(--space-xl)] text-center max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
            <h1 className="text-3xl md:text-4xl font-normal text-foreground">
              Women's Wellness Drive
            </h1>
            <a 
              href="#submit" 
              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full hover:bg-primary/90 transition-colors"
            >
              <Heart size={12} className="fill-current" />
              Share Your Story
            </a>
          </div>
          <p className="text-base font-light text-muted-foreground leading-relaxed">
            We're inviting women of all ages to share their daily wellness routines with Healios. 
            Post a video showing how you incorporate wellness into your day, tag us, and submit the link below. 
            Your story could inspire countless others on their wellness journey.
          </p>
        </section>

        {/* Submission Form */}
        <section id="submit" className="px-page py-[var(--space-md)] bg-muted/30">
          <div className="max-w-xl mx-auto">
            <h2 className="text-xl font-normal text-foreground mb-6 text-center">
              Submit Your Wellness Story
            </h2>
            
            {user ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="socialLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link to Your Tagged Post</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://instagram.com/p/..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Display Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="How you'd like to be credited" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit for Review"}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    All submissions are reviewed before being featured on our page.
                  </p>
                </form>
              </Form>
            ) : (
              <div className="text-center py-6 bg-background rounded-lg border border-border">
                <User size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Sign in to share your wellness journey
                </p>
                <Link to="/auth">
                  <Button variant="outline">Sign In</Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Approved Posts Grid */}
        <section className="px-page py-[var(--space-xl)]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-normal text-foreground mb-8 text-center">
              Community Wellness Stories
            </h2>
            
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : approvedPosts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {approvedPosts.map((post) => (
                  <a
                    key={post.id}
                    href={post.social_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square bg-muted rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
                  >
                    {post.thumbnail_url ? (
                      <OptimizedImage 
                        src={post.thumbnail_url} 
                        alt={`Wellness story by ${post.display_name}`}
                        className="w-full h-full object-cover"
                        aspectRatio="square"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <Heart size={32} className="text-primary/40" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm font-medium text-foreground truncate">
                          {post.display_name}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>{getSocialPlatform(post.social_link)}</span>
                          <ExternalLink size={12} />
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <Heart size={40} className="mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  Be the first to share your wellness journey!
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default WellnessDrive;
