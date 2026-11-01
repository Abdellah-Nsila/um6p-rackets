import { cn } from '@/lib/utils';
import { getAchievementMeta, CATEGORY_STYLES } from "./achievement-meta";

export function AchievementBadge({ 
  code, 
  count = 1, 
  className 
}: { 
  code: string; 
  count?: number; 
  className?: string; 
}) {
  const meta = getAchievementMeta(code);

  return (
    <div 
      title={`${meta.title}: ${meta.description}${count > 1 ? ` (Earned ${count}x)` : ''}`}
      className={cn(
        "inline-flex items-center gap-1.5 py-1 rounded-full border text-[11px] sm:text-xs font-black italic tracking-wide cursor-default shadow-2xs transition-transform hover:-translate-y-0.5 select-none",
        count > 1 ? "pl-2.5 pr-1.5" : "px-2.5",
        CATEGORY_STYLES[meta.category],
        className
      )}
    >
      <meta.Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{meta.title}</span>

      {/* Integrated Inline Count Tag */}
      {count > 1 && (
        <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/20 text-[10px] font-black not-italic leading-none tracking-normal">
          ×{count}
        </span>
      )}
    </div>
  );
}