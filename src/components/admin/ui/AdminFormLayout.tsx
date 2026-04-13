import React from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2, ArrowLeft } from "lucide-react";

interface AdminFormLayoutProps {
  title: string;
  subtitle?: string;
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
  isEditing?: boolean;
  extraActions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * AdminFormLayout
 * Standardizes the header and action buttons for all admin editor forms.
 * Provides a consistent UX for saving, cancelling, and navigation.
 */
export const AdminFormLayout: React.FC<AdminFormLayoutProps> = ({
  title,
  subtitle,
  onSave,
  onCancel,
  isSaving = false,
  isEditing = false,
  extraActions,
  children,
}) => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={onCancel} className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
          Back
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light tracking-tight text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {extraActions}
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isEditing ? "Save Changes" : "Create Item"}
          </Button>
        </div>
      </div>

      <div className="pt-2">
        {children}
      </div>
    </div>
  );
};
