"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { banUser, unBanUser } from "@/lib/adminActions/user-actions";

interface UserLockButtonProps {
  userId: string;
  isBanned: boolean;
  userEmail: string;
}

export function UserBanButton({
  userId,
  isBanned,
  userEmail,
}: UserLockButtonProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleToggleLock = async () => {
    try {
      const action = isBanned ? unBanUser : banUser;
      const res = await action(userId);

      if (res.success) {
        toast.success(
          `User ${userEmail} has been ${isBanned ? "unbanned" : "banned"} successfully`,
        );
        router.refresh();
      } else {
        toast.error(
          res.error || `Failed to ${isBanned ? "unban" : "ban"} user`,
        );
      }
    } catch {
      toast.error(`Failed to execute operation`);
    }
  };

  return (
    <>
      <Button
        variant={isBanned ? "default" : "destructive"}
        className={`w-full text-xs font-semibold h-9 ${
          isBanned
            ? "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800"
            : ""
        }`}
        onClick={() => setDialogOpen(true)}
      >
        {isBanned ? (
          <>
            <ShieldCheck className="h-4 w-4 mr-1.5" />
            Unban Account
          </>
        ) : (
          <>
            <ShieldAlert className="h-4 w-4 mr-1.5" />
            Ban Account
          </>
        )}
      </Button>

      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={isBanned ? "Unban User Account" : "Ban User Account"}
        description={
          isBanned
            ? `Are you sure you want to unban "${userEmail}"? They will regain full access to sign in and place orders.`
            : `Are you sure you want to ban "${userEmail}"? This will suspend their Clerk account, preventing them from signing in or checking out.`
        }
        confirmText={isBanned ? "Unban" : "Ban"}
        onConfirm={handleToggleLock}
        variant={isBanned ? "default" : "destructive"}
      />
    </>
  );
}
