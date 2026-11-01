"use client";

import { Plus, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function MatchPlayerCard({
  type = "filled",
  name,
  avatarUrl,
  onClick,
}: {
  type?: "filled" | "empty";
  name: string;
  avatarUrl?: string | null;
  onClick?: () => void;
}) {
  const isPlaceholder =
    name === "Choose Teammate" || name === "Choose Opponent" || name === "Choose Opponent 2";

  // If it's an empty slot card, BUT a user has already been selected (name is no longer a placeholder)
  if (type === "empty" && !isPlaceholder) {
    return (
      <div
        onClick={onClick}
        className="p-4 rounded-xl border border-border/70 hover:border-brand-orange bg-background flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
      >
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <div className="w-10 h-10 rounded-full relative overflow-hidden shrink-0">
              <Image src={avatarUrl} alt={name} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent shrink-0 text-sm">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-bold text-sm text-foreground">{name}</div>
          </div>
        </div>
        <span className="text-xs font-semibold text-brand-orange flex items-center gap-1 shrink-0">
          change <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    );
  }

  // Default empty placeholder state (when no one is selected yet)
  if (type === "empty") {
    return (
      <div
        onClick={onClick}
        className="p-4 rounded-xl border border-dashed border-border/85 hover:border-brand-orange bg-muted/25 flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
      >
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <div className="w-10 h-10 rounded-full relative overflow-hidden shrink-0">
              <Image src={avatarUrl} alt={name} sizes="40px" fill className="object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent shrink-0 text-sm">
              <Plus className="w-5 h-5 text-brand-orange" />
            </div>
          )}
          <div>
            <div className="font-bold text-sm text-foreground">{name}</div>
          </div>
        </div>
      </div>
    );
  }

  // Standard filled card (for your own profile card)
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border border-border/70 bg-background flex items-center justify-between shadow-2xs",
        onClick && "cursor-pointer hover:border-brand-orange transition-colors",
      )}
    >
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <div className="w-10 h-10 rounded-full relative overflow-hidden shrink-0">
            <Image src={avatarUrl} alt={name} sizes="40px" fill className="object-cover" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent shrink-0 text-sm">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <div className="font-bold text-sm text-foreground">{name}</div>
        </div>
      </div>
    </div>
  );
}
