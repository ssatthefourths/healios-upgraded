import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

interface NutritionalValue {
  name: string;
  amount: string;
  nrv?: string;
}

interface IngredientsData {
  servingSize?: string;
  servingsPerContainer?: number;
  nutritionalValues?: NutritionalValue[];
}

interface IngredientsEditorProps {
  ingredients: IngredientsData | NutritionalValue[];
  onChange: (ingredients: IngredientsData) => void;
}

const IngredientsEditor = ({ ingredients, onChange }: IngredientsEditorProps) => {
  // Normalize ingredients to object format
  const normalizedIngredients: IngredientsData = Array.isArray(ingredients)
    ? { nutritionalValues: ingredients }
    : ingredients || { nutritionalValues: [] };

  const updateField = <K extends keyof IngredientsData>(field: K, value: IngredientsData[K]) => {
    onChange({ ...normalizedIngredients, [field]: value });
  };

  const addNutritionalValue = () => {
    const current = normalizedIngredients.nutritionalValues || [];
    updateField("nutritionalValues", [...current, { name: "", amount: "", nrv: "" }]);
  };

  const updateNutritionalValue = (
    index: number,
    field: keyof NutritionalValue,
    value: string
  ) => {
    const current = [...(normalizedIngredients.nutritionalValues || [])];
    current[index] = { ...current[index], [field]: value };
    updateField("nutritionalValues", current);
  };

  const removeNutritionalValue = (index: number) => {
    const current = normalizedIngredients.nutritionalValues || [];
    updateField(
      "nutritionalValues",
      current.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="servingSize">Serving Size</Label>
          <Input
            id="servingSize"
            value={normalizedIngredients.servingSize || ""}
            onChange={(e) => updateField("servingSize", e.target.value)}
            placeholder="e.g., 2 gummies"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="servingsPerContainer">Servings Per Container</Label>
          <Input
            id="servingsPerContainer"
            type="number"
            value={normalizedIngredients.servingsPerContainer || ""}
            onChange={(e) =>
              updateField("servingsPerContainer", parseInt(e.target.value) || undefined)
            }
            placeholder="e.g., 30"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Nutritional Values</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addNutritionalValue}
          >
            <Plus size={14} className="mr-1" />
            Add Ingredient
          </Button>
        </div>

        {(normalizedIngredients.nutritionalValues || []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded">
            No ingredients added yet. Click "Add Ingredient" to start.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_120px_80px_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
              <span>Ingredient</span>
              <span>Amount</span>
              <span>% NRV</span>
              <span></span>
            </div>
            {(normalizedIngredients.nutritionalValues || []).map((item, index) => (
              <Card key={index} className="p-2">
                <div className="grid grid-cols-[1fr_120px_80px_40px] gap-2 items-center">
                  <Input
                    value={item.name}
                    onChange={(e) => updateNutritionalValue(index, "name", e.target.value)}
                    placeholder="e.g., Vitamin D3"
                  />
                  <Input
                    value={item.amount}
                    onChange={(e) => updateNutritionalValue(index, "amount", e.target.value)}
                    placeholder="e.g., 100mcg"
                  />
                  <Input
                    value={item.nrv || ""}
                    onChange={(e) => updateNutritionalValue(index, "nrv", e.target.value)}
                    placeholder="e.g., 500%"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeNutritionalValue(index)}
                    className="text-destructive hover:text-destructive h-8 w-8"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IngredientsEditor;
