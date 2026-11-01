import type { LucideIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Field, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export const authLabelClass = (hasError: boolean) =>
  cn(
    "text-xs font-bold uppercase tracking-wider flex items-center gap-1.5",
    hasError ? "text-destructive" : "text-muted-foreground",
  );

export const authInputClass = (hasError: boolean) =>
  cn(
    "h-11 w-full rounded-xl bg-background/60 focus-visible:ring-2 font-medium text-sm transition-all",
    hasError
      ? "border-destructive focus-visible:ring-destructive/30"
      : "border-border/80 focus-visible:ring-brand-orange/40",
  );

export const authSelectClass = (hasError: boolean) =>
  cn(
    "h-11 w-full rounded-xl bg-background/60",
    hasError && "border-destructive focus:ring-destructive/30",
  );

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p className="text-[11px] font-semibold text-destructive mt-1 flex items-center gap-1">
      <AlertCircle className="size-3 shrink-0" /> {message}
    </p>
  );
}

// Label with icon + the input (children) + the error message
export function AuthField({
  id,
  label,
  icon: Icon,
  error,
  children,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <Field className="space-y-1.5">
      <FieldLabel htmlFor={id} className={authLabelClass(!!error)}>
        <Icon className="size-3.5 text-brand-orange" /> {label}
      </FieldLabel>
      {children}
      <FieldError message={error} />
    </Field>
  );
}
