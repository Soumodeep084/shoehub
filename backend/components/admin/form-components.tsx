"use client";

import React, { forwardRef, useId } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Input Field
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, description, error, required, className, id, ...props }, ref) => {
    const defaultId = useId();
    const inputId = id || defaultId;
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <div className="flex items-center justify-between">
            <Label
              htmlFor={inputId}
              className="text-xs font-semibold text-foreground flex items-center"
            >
              {label}
              {required ? (
                <span className="text-destructive ml-0.5 text-xs font-bold leading-none select-none">
                  *
                </span>
              ) : (
                <span className="text-[10px] font-medium text-muted-foreground ml-1.5 select-none">
                  (Optional)
                </span>
              )}
            </Label>
          </div>
        )}
        <Input
          id={inputId}
          ref={ref}
          className={cn(
            "h-10 text-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 transition-all",
            error && "border-destructive focus-visible:ring-destructive",
            className,
          )}
          {...props}
        />
        {description && !error && (
          <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
            {description}
          </p>
        )}
        {error && (
          <p className="text-[11px] font-medium text-destructive mt-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
            {error}
          </p>
        )}
      </div>
    );
  },
);
FormInput.displayName = "FormInput";

// Textarea Field
interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, description, error, required, className, id, ...props }, ref) => {
    const defaultId = useId();
    const textareaId = id || defaultId;
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <div className="flex items-center justify-between">
            <Label
              htmlFor={textareaId}
              className="text-xs font-semibold text-foreground flex items-center"
            >
              {label}
              {required ? (
                <span className="text-destructive ml-0.5 text-xs font-bold leading-none select-none">
                  *
                </span>
              ) : (
                <span className="text-[10px] font-medium text-muted-foreground ml-1.5 select-none">
                  (Optional)
                </span>
              )}
            </Label>
          </div>
        )}
        <Textarea
          id={textareaId}
          ref={ref}
          className={cn(
            "text-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 transition-all min-h-20",
            error && "border-destructive focus-visible:ring-destructive",
            className,
          )}
          {...props}
        />
        {description && !error && (
          <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
            {description}
          </p>
        )}
        {error && (
          <p className="text-[11px] font-medium text-destructive mt-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
            {error}
          </p>
        )}
      </div>
    );
  },
);
FormTextarea.displayName = "FormTextarea";

// Select Field
interface FormSelectProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  value: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
}

export function FormSelect({
  label,
  description,
  error,
  required,
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  id,
  className,
}: FormSelectProps) {
  const defaultId = useId();
  const triggerId = id || defaultId;

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <Label
          htmlFor={triggerId}
          className="text-xs font-semibold text-foreground flex items-center"
        >
          {label}
          {required ? (
            <span className="text-destructive ml-0.5 text-xs font-bold leading-none select-none">
              *
            </span>
          ) : (
            <span className="text-[10px] font-medium text-muted-foreground ml-1.5 select-none">
              (Optional)
            </span>
          )}
        </Label>
      )}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          id={triggerId}
          className={cn(
            "h-10 text-sm focus:ring-1 focus:ring-ring focus:ring-offset-0 transition-all",
            error && "border-destructive focus:ring-destructive",
            className,
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-sm">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && !error && (
        <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
          {description}
        </p>
      )}
      {error && (
        <p className="text-[11px] font-medium text-destructive mt-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
          {error}
        </p>
      )}
    </div>
  );
}

// Switch Field
interface FormSwitchProps {
  label: string;
  description?: string;
  error?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
}

export function FormSwitch({
  label,
  description,
  error,
  checked,
  onCheckedChange,
  disabled = false,
  id,
  className,
}: FormSwitchProps) {
  const defaultId = useId();
  const switchId = id || defaultId;

  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-card shadow-sm hover:bg-muted/10 transition-colors">
        <div className="space-y-0.5 pr-4 select-none">
          <Label
            htmlFor={switchId}
            className="text-xs font-semibold text-foreground cursor-pointer"
          >
            {label}
          </Label>
          {description && (
            <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
              {description}
            </p>
          )}
        </div>
        <Switch
          id={switchId}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className="shrink-0"
        />
      </div>
      {error && (
        <p className="text-[11px] font-medium text-destructive mt-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
          {error}
        </p>
      )}
    </div>
  );
}
