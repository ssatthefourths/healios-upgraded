import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { History, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Json } from "@/integrations/supabase/types";

interface ProductVersion {
  id: string;
  product_id: string;
  changed_by: string | null;
  changed_at: string;
  action: string;
  changes: Json;
  previous_values: Json;
}

interface ProductVersionHistoryProps {
  productId: string;
  productName: string;
}

const fieldLabels: Record<string, string> = {
  name: "Name",
  slug: "URL Slug",
  price: "Price",
  category: "Category",
  image: "Image",
  description: "Description",
  hero_paragraph: "Hero Paragraph",
  benefits: "Benefits",
  what_is_it: "What Is It?",
  why_gummy: "Why Gummy?",
  who_is_it_for: "Who Is It For?",
  how_it_works: "How It Works",
  how_to_take: "How To Take",
  routine_30_day: "30-Day Routine",
  what_makes_different: "What Makes Different",
  subscription_info: "Subscription Info",
  ingredients: "Ingredients",
  safety_info: "Safety Info",
  product_cautions: "Cautions",
  faqs: "FAQs",
  seo_title: "SEO Title",
  meta_description: "Meta Description",
  primary_keyword: "Primary Keyword",
  secondary_keywords: "Secondary Keywords",
  is_published: "Published",
  is_adults_only: "Adults Only",
  is_kids_product: "Kids Product",
  track_inventory: "Track Inventory",
  stock_quantity: "Stock Quantity",
  low_stock_threshold: "Low Stock Threshold",
  sort_order: "Sort Order",
  pairs_well_with: "Pairs Well With",
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

const ProductVersionHistory = ({ productId, productName }: ProductVersionHistoryProps) => {
  const [versions, setVersions] = useState<ProductVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      fetchVersions();
    }
  }, [open, productId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("product_versions")
        .select("*")
        .eq("product_id", productId)
        .order("changed_at", { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error("Error fetching versions:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVersion = (versionId: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(versionId)) {
        next.delete(versionId);
      } else {
        next.add(versionId);
      }
      return next;
    });
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "create":
        return <Badge className="bg-green-500/10 text-green-600 border-green-200">Created</Badge>;
      case "update":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Updated</Badge>;
      case "delete":
        return <Badge className="bg-red-500/10 text-red-600 border-red-200">Deleted</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History size={16} />
          Version History
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[500px] sm:w-[600px]">
        <SheetHeader>
          <SheetTitle>Version History: {productName}</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-100px)] mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No version history available
            </div>
          ) : (
            <div className="space-y-3 pr-4">
              {versions.map((version) => {
                const changes = version.changes as Record<string, any> || {};
                const previousValues = version.previous_values as Record<string, any> || {};
                const changedFields = Object.keys(changes);
                const isExpanded = expandedVersions.has(version.id);

                return (
                  <Collapsible
                    key={version.id}
                    open={isExpanded}
                    onOpenChange={() => toggleVersion(version.id)}
                  >
                    <div className="border rounded-lg p-3 bg-card">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown size={16} className="text-muted-foreground" />
                            ) : (
                              <ChevronRight size={16} className="text-muted-foreground" />
                            )}
                            {getActionBadge(version.action)}
                            <span className="text-sm text-muted-foreground">
                              {changedFields.length} field{changedFields.length !== 1 ? "s" : ""} changed
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(version.changed_at), "MMM d, yyyy h:mm a")}
                          </span>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="mt-3 pt-3 border-t space-y-3">
                          {changedFields.map((field) => (
                            <div key={field} className="text-sm">
                              <div className="font-medium text-foreground mb-1">
                                {fieldLabels[field] || field}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-red-50 dark:bg-red-950/20 p-2 rounded text-xs">
                                  <span className="text-red-600 dark:text-red-400 font-medium">Before:</span>
                                  <pre className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
                                    {formatValue(previousValues[field])}
                                  </pre>
                                </div>
                                <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded text-xs">
                                  <span className="text-green-600 dark:text-green-400 font-medium">After:</span>
                                  <pre className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
                                    {formatValue(changes[field])}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default ProductVersionHistory;
