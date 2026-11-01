import { Loader2 } from "lucide-react";

// Centered spinner for a page or a section that is waiting for data
export function PageLoader({ text }: { text?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Loader2 className="size-8 animate-spin text-brand-orange" />
      {text && <p className="text-sm font-medium text-muted-foreground">{text}</p>}
    </div>
  );
}