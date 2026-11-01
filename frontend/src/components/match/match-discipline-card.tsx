'use client';

import { Check, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MatchMode } from '@/types/contracts/club';

export default function MatchDisciplineCard({
    mode,
    currentMode,
    title,
    onSelect,
}: {
    mode: MatchMode;
    currentMode: MatchMode;
    title: string;
    onSelect: () => void;
}) {
    const isSelected = currentMode === mode;
    const isSolo = mode === MatchMode.SINGLES;

    return (
        <div
            onClick={onSelect}
            className={cn(
                "cursor-pointer rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between relative overflow-hidden shadow-sm",
                isSelected
                    ? "bg-brand-orange text-white border-brand-orange shadow-md scale-[1.01]"
                    : "bg-card text-foreground border-border/80 hover:border-brand-orange/50 hover:bg-muted/30"
            )}
        >
            <div className="flex items-center justify-between">
                <h3 className="text-2xl sm:text-3xl font-black italic tracking-tight">
                    {title}
                </h3>
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-2xs",
                    isSelected ? "bg-white/25 text-white" : "bg-muted/60 text-muted-foreground"
                )}>
                    {isSolo ? <User className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                </div>
            </div>

            <div className="mt-8 flex items-center justify-start text-xs font-bold tracking-wide uppercase">
                <span className={cn(
                    "transition-opacity",
                    isSelected ? "opacity-100 text-white" : "opacity-60 text-muted-foreground"
                )}>
                </span>

                <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    isSelected ? "border-white bg-white text-brand-orange" : "border-muted-foreground/40 bg-transparent"
                )}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
            </div>
        </div>
    );
}