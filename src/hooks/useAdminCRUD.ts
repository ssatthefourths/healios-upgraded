import { useState, useCallback } from "react";

/**
 * useAdminCRUD
 * A reusable hook to manage the state machine for Admin list/edit/create views.
 * Ensures a consistent pattern across all admin modules.
 */
export function useAdminCRUD<T>() {
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = useCallback((item: T) => {
    setEditingItem(item);
    setIsCreating(false);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingItem(null);
    setIsCreating(true);
  }, []);

  const handleBack = useCallback(() => {
    setEditingItem(null);
    setIsCreating(false);
  }, []);

  const handleSave = useCallback(() => {
    setEditingItem(null);
    setIsCreating(false);
    setRefreshKey((prev) => prev + 1);
  }, []);

  return {
    editingItem,
    isCreating,
    refreshKey,
    handleEdit,
    handleCreate,
    handleBack,
    handleSave,
    // Derived states for convenience
    isViewingList: !editingItem && !isCreating,
    isEditing: !!editingItem,
  };
}
