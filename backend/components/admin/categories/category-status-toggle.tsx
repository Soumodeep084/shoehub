"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/admin/status-badge";
import { toggleCategoryActive } from "@/lib/adminActions/category-actions";

interface CategoryStatusToggleProps {
  id: string;
  name: string;
  isActive: boolean;
}

export function CategoryStatusToggle({ id, name, isActive }: CategoryStatusToggleProps) {
  const router = useRouter();
  const [isPending] = useTransition();

  const handleToggle = async () => {
    try {
      const res = await toggleCategoryActive(id, !isActive);
      if (res.success) {
        toast.success(`Category "${name}" is now ${!isActive ? "enabled" : "disabled"}`);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update category status");
      }
    } catch {
      toast.error("Failed to update category status");
    }
  };

  return (
    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
      <Switch
        id={`category-switch-${id}`}
        checked={isActive}
        onCheckedChange={handleToggle}
        disabled={isPending}
      />
      <StatusBadge type="active" value={isActive} />
    </div>
  );
}
