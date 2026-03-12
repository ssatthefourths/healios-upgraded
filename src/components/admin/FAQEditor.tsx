import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQEditorProps {
  faqs: FAQ[];
  onChange: (faqs: FAQ[]) => void;
}

const FAQEditor = ({ faqs, onChange }: FAQEditorProps) => {
  const normalizedFaqs: FAQ[] = (faqs || []).map((faq) => ({
    question: faq.question || "",
    answer: faq.answer || "",
  }));

  const addFAQ = () => {
    onChange([...normalizedFaqs, { question: "", answer: "" }]);
  };

  const updateFAQ = (index: number, field: keyof FAQ, value: string) => {
    const updated = [...normalizedFaqs];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeFAQ = (index: number) => {
    onChange(normalizedFaqs.filter((_, i) => i !== index));
  };

  const moveFAQ = (from: number, to: number) => {
    if (to < 0 || to >= normalizedFaqs.length) return;
    const updated = [...normalizedFaqs];
    const [removed] = updated.splice(from, 1);
    updated.splice(to, 0, removed);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={addFAQ}>
          <Plus size={14} className="mr-1" />
          Add FAQ
        </Button>
      </div>

      {normalizedFaqs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded">
          No FAQs added yet. Click "Add FAQ" to start.
        </p>
      ) : (
        <div className="space-y-3">
          {normalizedFaqs.map((faq, index) => (
            <Card key={index} className="p-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    Q{index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveFAQ(index, index - 1)}
                    disabled={index === 0}
                  >
                    <GripVertical size={14} className="text-muted-foreground" />
                  </Button>
                </div>
                <div className="flex-1 space-y-3">
                  <Input
                    value={faq.question}
                    onChange={(e) => updateFAQ(index, "question", e.target.value)}
                    placeholder="Question (e.g., How many gummies should I take?)"
                  />
                  <Textarea
                    value={faq.answer}
                    onChange={(e) => updateFAQ(index, "answer", e.target.value)}
                    placeholder="Answer..."
                    rows={3}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFAQ(index)}
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

export default FAQEditor;
