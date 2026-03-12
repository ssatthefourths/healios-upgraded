import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface Benefit {
  title?: string;
  description?: string;
}

interface BenefitsEditorProps {
  benefits: (string | Benefit)[];
  onChange: (benefits: Benefit[]) => void;
}

const BenefitsEditor = ({ benefits, onChange }: BenefitsEditorProps) => {
  // Normalize benefits to object format
  const normalizedBenefits: Benefit[] = (benefits || []).map((b) =>
    typeof b === "string" ? { title: b, description: "" } : b
  );

  const addBenefit = () => {
    onChange([...normalizedBenefits, { title: "", description: "" }]);
  };

  const updateBenefit = (index: number, field: keyof Benefit, value: string) => {
    const updated = [...normalizedBenefits];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeBenefit = (index: number) => {
    onChange(normalizedBenefits.filter((_, i) => i !== index));
  };

  const moveBenefit = (from: number, to: number) => {
    if (to < 0 || to >= normalizedBenefits.length) return;
    const updated = [...normalizedBenefits];
    const [removed] = updated.splice(from, 1);
    updated.splice(to, 0, removed);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Key Benefits</Label>
        <Button type="button" variant="outline" size="sm" onClick={addBenefit}>
          <Plus size={14} className="mr-1" />
          Add Benefit
        </Button>
      </div>

      {normalizedBenefits.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded">
          No benefits added yet. Click "Add Benefit" to start.
        </p>
      ) : (
        <div className="space-y-2">
          {normalizedBenefits.map((benefit, index) => (
            <Card key={index} className="p-3">
              <div className="flex gap-3">
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveBenefit(index, index - 1)}
                    disabled={index === 0}
                  >
                    <GripVertical size={14} className="text-muted-foreground" />
                  </Button>
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    value={benefit.title || ""}
                    onChange={(e) => updateBenefit(index, "title", e.target.value)}
                    placeholder="Benefit title (e.g., Supports Energy)"
                  />
                  <Textarea
                    value={benefit.description || ""}
                    onChange={(e) => updateBenefit(index, "description", e.target.value)}
                    placeholder="Optional description..."
                    rows={2}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeBenefit(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BenefitsEditor;
