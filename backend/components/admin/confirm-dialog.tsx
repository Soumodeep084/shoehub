"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  requiresVerification?: boolean;
  dependencies?: string[];
  variant?: "default" | "destructive" | "warning";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  requiresVerification = false,
  dependencies = [],
  variant = "default",
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && requiresVerification) {
      const timer = setTimeout(() => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setVerificationCode(code);
        setEnteredCode("");
        setError("");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, requiresVerification]);

  const handleConfirm = async () => {
    if (requiresVerification && enteredCode !== verificationCode) {
      setError("Incorrect verification code");
      return;
    }

    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Errors should be handled by toast in calling code
    } finally {
      setLoading(false);
    }
  };

  const isConfirmDisabled =
    loading || (requiresVerification && enteredCode !== verificationCode);

  const buttonVariant =
    variant === "destructive"
      ? "destructive"
      : "default";

  return (
    <Dialog open={open} onOpenChange={(val) => !loading && onOpenChange(val)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-50 text-lg font-bold">
            {variant === "destructive" || variant === "warning" ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : null}
            {title}
          </DialogTitle>
          <DialogDescription className="pt-2 text-sm text-muted-foreground leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        {dependencies.length > 0 && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3.5 my-2">
            <h4 className="text-xs font-semibold text-destructive uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Dependencies / Warnings
            </h4>
            <ul className="list-disc pl-4 text-xs text-destructive/90 space-y-1">
              {dependencies.map((dep, index) => (
                <li key={index}>{dep}</li>
              ))}
            </ul>
          </div>
        )}

        {requiresVerification && (
          <div className="space-y-4 py-3.5 border-t border-b border-border my-3 flex flex-col items-center">
            <div className="w-full space-y-2">
              <Label htmlFor="verificationCodeInput" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                To verify this deletion, type the 6-digit code: <span className="text-sm font-bold text-destructive uppercase">
                  {verificationCode}
                </span>
              </Label>
            </div>
            <Input
              id="verificationCodeInput"
              placeholder={`Enter "${verificationCode}" `}
              maxLength={6}
              value={enteredCode}
              onChange={(e) => {
                setEnteredCode(e.target.value.toUpperCase());
                setError("");
              }}
              className="text-black font-bold h-8 uppercase bg-background border-slate-200 dark:border-slate-800 focus-visible:ring-destructive focus-visible:border-destructive w-full"
              autoComplete="off"
              disabled={loading}
            />
            {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter className="mt-4 sm:space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            variant={buttonVariant}
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="w-full sm:w-auto min-w-22.5"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
