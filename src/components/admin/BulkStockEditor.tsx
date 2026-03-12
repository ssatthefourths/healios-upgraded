import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, Save, Loader2, RotateCcw, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  category: string;
  image: string;
  stock_quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
}

interface EditedProduct {
  stock_quantity: number;
  low_stock_threshold: number;
}

const BulkStockEditor = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, EditedProduct>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category, image, stock_quantity, low_stock_threshold, track_inventory")
        .eq("is_published", true)
        .order("name", { ascending: true });

      if (error) throw error;
      setProducts(data || []);
      setEditedValues({});
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (productId: string, field: keyof EditedProduct, value: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const currentEdits = editedValues[productId] || {
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold,
    };

    setEditedValues({
      ...editedValues,
      [productId]: {
        ...currentEdits,
        [field]: value,
      },
    });
  };

  const getValue = (product: Product, field: keyof EditedProduct): number => {
    if (editedValues[product.id]) {
      return editedValues[product.id][field];
    }
    return product[field];
  };

  const hasChanges = (productId: string): boolean => {
    const product = products.find(p => p.id === productId);
    const edits = editedValues[productId];
    if (!product || !edits) return false;

    return (
      edits.stock_quantity !== product.stock_quantity ||
      edits.low_stock_threshold !== product.low_stock_threshold
    );
  };

  const changedProductIds = Object.keys(editedValues).filter(id => hasChanges(id));

  const saveAllChanges = async () => {
    if (changedProductIds.length === 0) {
      toast.info("No changes to save");
      return;
    }

    setSaving(true);
    try {
      const updates = changedProductIds.map(async (productId) => {
        const edits = editedValues[productId];
        const { error } = await supabase
          .from("products")
          .update({
            stock_quantity: edits.stock_quantity,
            low_stock_threshold: edits.low_stock_threshold,
          })
          .eq("id", productId);

        if (error) throw error;
      });

      await Promise.all(updates);

      setProducts(products.map(p => {
        if (editedValues[p.id]) {
          return {
            ...p,
            stock_quantity: editedValues[p.id].stock_quantity,
            low_stock_threshold: editedValues[p.id].low_stock_threshold,
          };
        }
        return p;
      }));

      setEditedValues({});
      toast.success(`Updated ${changedProductIds.length} product${changedProductIds.length > 1 ? "s" : ""}`);
    } catch (error: any) {
      console.error("Error saving changes:", error);
      toast.error(error.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setEditedValues({});
  };

  const getStockStatus = (product: Product) => {
    const stock = getValue(product, "stock_quantity");
    const threshold = getValue(product, "low_stock_threshold");

    if (stock === 0) return { label: "Out of Stock", className: "bg-red-100 text-red-800" };
    if (stock <= threshold) return { label: "Low Stock", className: "bg-amber-100 text-amber-800" };
    return { label: "In Stock", className: "bg-green-100 text-green-800" };
  };

  const exportToCSV = () => {
    const headers = ["product_id", "product_name", "category", "stock_quantity", "low_stock_threshold"];
    const rows = products.map(p => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category.replace(/"/g, '""')}"`,
      getValue(p, "stock_quantity"),
      getValue(p, "low_stock_threshold"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stock-levels-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Stock levels exported to CSV");
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      parseAndImportCSV(content);
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const parseAndImportCSV = (content: string) => {
    setImporting(true);

    try {
      const lines = content.split("\n").filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error("CSV file must have a header row and at least one data row");
      }

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const idIndex = headers.indexOf("product_id");
      const stockIndex = headers.indexOf("stock_quantity");
      const thresholdIndex = headers.indexOf("low_stock_threshold");

      if (idIndex === -1) {
        throw new Error("CSV must have a 'product_id' column");
      }
      if (stockIndex === -1 && thresholdIndex === -1) {
        throw new Error("CSV must have 'stock_quantity' and/or 'low_stock_threshold' columns");
      }

      const newEdits: Record<string, EditedProduct> = { ...editedValues };
      let importedCount = 0;
      let skippedCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const productId = values[idIndex]?.trim();
        
        if (!productId) continue;

        const product = products.find(p => p.id === productId);
        if (!product) {
          skippedCount++;
          continue;
        }

        const stockValue = stockIndex !== -1 ? parseInt(values[stockIndex]) : undefined;
        const thresholdValue = thresholdIndex !== -1 ? parseInt(values[thresholdIndex]) : undefined;

        if ((stockIndex !== -1 && isNaN(stockValue!)) || (thresholdIndex !== -1 && isNaN(thresholdValue!))) {
          skippedCount++;
          continue;
        }

        newEdits[productId] = {
          stock_quantity: stockValue !== undefined && !isNaN(stockValue) ? stockValue : product.stock_quantity,
          low_stock_threshold: thresholdValue !== undefined && !isNaN(thresholdValue) ? thresholdValue : product.low_stock_threshold,
        };
        importedCount++;
      }

      setEditedValues(newEdits);

      if (importedCount > 0) {
        toast.success(`Imported ${importedCount} product${importedCount > 1 ? "s" : ""}. Review changes and click Save.`);
      }
      if (skippedCount > 0) {
        toast.warning(`Skipped ${skippedCount} row${skippedCount > 1 ? "s" : ""} (invalid data or unknown product ID)`);
      }
    } catch (error: any) {
      console.error("Error parsing CSV:", error);
      toast.error(error.message || "Failed to parse CSV file");
    } finally {
      setImporting(false);
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    return values;
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium text-foreground">Bulk Stock Editor</h3>
          {changedProductIds.length > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {changedProductIds.length} unsaved change{changedProductIds.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={products.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1" />
            )}
            Import CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          {changedProductIds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetChanges}
              disabled={saving}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
          <Button
            size="sm"
            onClick={saveAllChanges}
            disabled={saving || changedProductIds.length === 0}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save All Changes
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-[120px]">Stock Qty</TableHead>
              <TableHead className="w-[120px]">Low Threshold</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const status = getStockStatus(product);
              const isChanged = hasChanges(product.id);

              return (
                <TableRow 
                  key={product.id}
                  className={isChanged ? "bg-primary/5" : ""}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="font-medium text-sm truncate max-w-[200px]">
                        {product.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {product.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={getValue(product, "stock_quantity")}
                      onChange={(e) => handleValueChange(product.id, "stock_quantity", parseInt(e.target.value) || 0)}
                      className="w-20 h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={getValue(product, "low_stock_threshold")}
                      onChange={(e) => handleValueChange(product.id, "low_stock_threshold", parseInt(e.target.value) || 0)}
                      className="w-20 h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Badge className={status.className}>
                      {status.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {products.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No products found
        </div>
      )}

      <div className="p-4 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground">
          <strong>CSV Format:</strong> Export to see the required format. The CSV must include product_id, stock_quantity, and/or low_stock_threshold columns.
        </p>
      </div>
    </div>
  );
};

export default BulkStockEditor;