"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Truck, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { promoteToDeliveryAgent, demoteFromDeliveryAgent } from "@/lib/adminActions/user-actions";

interface UserRoleActionsProps {
  userId: string;
  role: string;
  userEmail: string;
}

export function UserRoleActions({
  userId,
  role,
  userEmail,
}: UserRoleActionsProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const isDeliveryAgent = role === "DELIVERY_AGENT";

  // We don't change roles of Admins or Staff from this simple view
  if (role === "ADMIN" || role === "STAFF") {
    return null;
  }

  const handleRoleToggle = async () => {
    try {
      const action = isDeliveryAgent ? demoteFromDeliveryAgent : promoteToDeliveryAgent;
      const res = await action(userId);

      if (res.success) {
        toast.success(
          `User ${userEmail} has been ${isDeliveryAgent ? "demoted to User" : "promoted to Delivery Agent"} successfully.`
        );
        router.refresh();
      } else {
        toast.error(
          res.error || `Failed to change role.`
        );
      }
    } catch {
      toast.error(`Failed to execute operation`);
    } finally {
      setDialogOpen(false);
    }
  };

  return (
    <>
      <Button
        variant={isDeliveryAgent ? "outline" : "default"}
        className={`w-full text-xs font-semibold h-9 mt-2 ${
          !isDeliveryAgent
            ? "bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-700 dark:hover:bg-amber-800"
            : "border-amber-200 text-amber-700 hover:bg-amber-50"
        }`}
        onClick={() => setDialogOpen(true)}
      >
        {isDeliveryAgent ? (
          <>
            <UserMinus className="h-4 w-4 mr-1.5" />
            Demote from Delivery Agent
          </>
        ) : (
          <>
            <Truck className="h-4 w-4 mr-1.5" />
            Promote to Delivery Agent
          </>
        )}
      </Button>

      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={isDeliveryAgent ? "Demote to Standard User" : "Promote to Delivery Agent"}
        description={
          isDeliveryAgent
            ? `Are you sure you want to demote "${userEmail}"? They will lose access to the Deliveries tab in the mobile application immediately.`
            : `Are you sure you want to promote "${userEmail}"? They will gain access to the Deliveries tab and can be assigned to orders.`
        }
        confirmText={isDeliveryAgent ? "Demote" : "Promote"}
        onConfirm={handleRoleToggle}
        variant={isDeliveryAgent ? "destructive" : "default"}
      />
    </>
  );
}
